import type { ContextTier, RecommendationPool, TalentChoiceFact, TalentChoiceCountQuery, TalentRecommendationResult } from "./types.js";
import type { TalentChoiceScoreRow } from "./scoring.js";

/**
 * Regras do recomendador de talentos (fonte "IMPLEMENTAR RECOMENDAÇÕES
 * DE TALENTOS", plano aprovado com ajustes §1–§7). Tudo aqui é função
 * pura sobre contagens já agregadas — nenhum acesso a banco, nenhuma
 * regra de jogo (a elegibilidade do personagem atual chega pronta, como
 * a lista de opções habilitadas do seletor).
 */

/**
 * Dados REAIS entram no recomendador — liberados depois da verificação
 * em produção (fonte §7): (1) confirmação gravando `status = 'confirmed'`
 * como versão imutável, (2) estatísticas contando só a versão confirmada
 * mais recente de cada personagem e (3) isolamento entre sessões. Mesmo
 * ligado, uma faixa de contexto real só é usada com 5+ personagens
 * distintos (`MIN_REAL_CHARACTERS`, também imposto pela função SQL), e o
 * próprio personagem nunca conta para si mesmo. Com `false`, a consulta
 * nem pede as contagens reais (`p_include_user = false`).
 */
export const REAL_RECORDS_ENABLED = true;

/**
 * Amostra mínima de dados reais: 5 personagens DISTINTOS confirmados na
 * base da recomendação (pedido do usuário: "apenas 5 necessárias para a
 * recomendação ser ativada"). Independente do limiar dos insights da
 * Ficha (`analytics/types.ts#MIN_SAMPLE_SIZE`, que continua 20). Mesmo
 * valor imposto pelas funções SQL de pontuação (migration 0009).
 */
export const MIN_REAL_CHARACTERS = 5;

/**
 * Limiar das funções ANTIGAS de contagem (`get_talent_choice_counts`,
 * migration 0006 — mantidas no banco, sem uso pelo app atual):
 * `countTalentChoices` com `applyMinimum` continua espelhando-as.
 */
export const LEGACY_COUNTS_MIN_REAL_CHARACTERS = 10;
/** Amostra mínima de referências: 3 personagens distintos... */
export const MIN_REFERENCE_CHARACTERS = 3;
/** ...vindos de pelo menos 2 fontes independentes (cópias/republicações compartilham o mesmo grupo e contam como 1). */
export const MIN_REFERENCE_INDEPENDENT_SOURCES = 2;
/** No máximo 3 opções marcadas "(Recomendado)" por seletor, no total. */
export const MAX_RECOMMENDATIONS_PER_SELECTOR = 3;

/** Ordem de preferência entre conjuntos — o primeiro que tiver amostra suficiente decide sozinho (os rankings nunca são mesclados). */
export const POOL_ORDER: readonly RecommendationPool[] = ["user", "reference_extracted", "reference_synthetic"];

export interface ContextTierDefinition {
  tier: ContextTier;
  /** Exige subclasse conhecida dos DOIS lados e igual. */
  needsSubclass: boolean;
  /** Exige maior atributo conhecido dos DOIS lados e igual. */
  needsAbility: boolean;
  /** `true` = mesmo nível de aquisição; `false` = mesma faixa de nível (`levelBand`). */
  exactLevel: boolean;
}

/**
 * Faixas de semelhança, da mais específica para a mais ampla — sempre
 * com o mesmo tipo de oportunidade e a mesma classe. A mais ampla ainda
 * exige a mesma faixa de nível (1–4, 5–10, 11–16, 17–20), para nunca
 * misturar níveis muito diferentes (fonte §4). Um registro com
 * subclasse/atributos desconhecidos só participa das faixas que não
 * dependem deles (fonte §5: "registros parciais só contribuem para as
 * comparações em que tiverem informação suficiente").
 */
export const CONTEXT_TIERS: readonly ContextTierDefinition[] = [
  { tier: "level_subclass_ability", needsSubclass: true, needsAbility: true, exactLevel: true },
  { tier: "level_subclass", needsSubclass: true, needsAbility: false, exactLevel: true },
  { tier: "level_ability", needsSubclass: false, needsAbility: true, exactLevel: true },
  { tier: "level", needsSubclass: false, needsAbility: false, exactLevel: true },
  { tier: "level_band", needsSubclass: false, needsAbility: false, exactLevel: false },
];

/**
 * Faixa de nível ("tier of play" do D&D 2024): 1–4 → 1, 5–10 → 2,
 * 11–16 → 3, 17–20 → 4. `null` (criação — Talento de Origem do Humano)
 * → 0, uma faixa própria que só casa com outra aquisição de criação.
 * Mesmos limites de `talent_level_band` em `supabase/migrations/0004_talent_recommendations.sql`.
 */
export function levelBand(level: number | null): number {
  if (level === null) return 0;
  if (level <= 4) return 1;
  if (level <= 10) return 2;
  if (level <= 16) return 3;
  return 4;
}

/** Se a faixa pode ser usada para este contexto — uma faixa que exige um dado desconhecido do personagem atual nunca é consultada. */
export function isTierApplicable(tier: ContextTierDefinition, query: Pick<TalentChoiceCountQuery, "subclassId" | "highestAbility">): boolean {
  if (tier.needsSubclass && query.subclassId === null) return false;
  if (tier.needsAbility && query.highestAbility === null) return false;
  return true;
}

/** Se um registro pertence à faixa para este contexto (mesma lógica do `join tiers` da função SQL). */
export function factMatchesTier(fact: TalentChoiceFact, tier: ContextTierDefinition, query: TalentChoiceCountQuery): boolean {
  if (!isTierApplicable(tier, query)) return false;
  if (tier.needsSubclass && fact.subclassId !== query.subclassId) return false;
  if (tier.needsAbility && fact.highestAbility !== query.highestAbility) return false;
  return tier.exactLevel ? fact.level === query.level : levelBand(fact.level) === levelBand(query.level);
}

/** Amostra mínima por conjunto (fonte §3). */
export function meetsMinimumSample(pool: RecommendationPool, sampleCharacters: number, sampleGroups: number): boolean {
  if (pool === "user") return sampleCharacters >= MIN_REAL_CHARACTERS;
  return sampleCharacters >= MIN_REFERENCE_CHARACTERS && sampleGroups >= MIN_REFERENCE_INDEPENDENT_SOURCES;
}

export interface SelectRecommendationsOptions {
  includeUserRecords: boolean;
}

/**
 * Escolhe as recomendações de UM seletor de talento a partir das
 * pontuações (`scoring.ts#scoreTalentChoices` / `get_talent_choice_scores`):
 *
 * 1. Percorre os conjuntos na ordem `POOL_ORDER` (reais → referências
 *    extraídas → referências sintéticas aprovadas); o primeiro conjunto
 *    com ao menos um talento ELEGÍVEL decide sozinho — os rankings de
 *    conjuntos diferentes nunca são misturados.
 * 2. Ranking: pontuação (classe/nível refinados por subclasse e
 *    atributo) → personagens na base → fontes independentes → ordem do
 *    seletor (`eligibleTalentIds`, ordem estável do catálogo).
 * 3. Corta em `MAX_RECOMMENDATIONS_PER_SELECTOR`.
 *
 * `eligibleTalentIds` é OBRIGATORIAMENTE a lista de opções elegíveis do
 * personagem atual — um talento fora dela nunca é recomendado. `null` =
 * nenhuma recomendação.
 */
export function selectTalentRecommendations(
  rows: readonly TalentChoiceScoreRow[],
  eligibleTalentIds: readonly string[],
  options: SelectRecommendationsOptions,
): TalentRecommendationResult | null {
  const order = new Map(eligibleTalentIds.map((id, index) => [id, index]));
  if (order.size === 0) return null;

  for (const pool of POOL_ORDER) {
    if (pool === "user" && !options.includeUserRecords) continue;
    const ranked = rows
      .filter((row) => row.pool === pool && row.baseCharacters > 0 && order.has(row.talentId))
      .sort(
        (a, b) =>
          b.score - a.score || b.baseCharacters - a.baseCharacters || b.baseGroups - a.baseGroups || order.get(a.talentId)! - order.get(b.talentId)!,
      );
    if (ranked.length === 0) continue;
    const chosen = ranked.slice(0, MAX_RECOMMENDATIONS_PER_SELECTOR);
    return {
      talentIds: chosen.map((row) => row.talentId),
      characters: Object.fromEntries(chosen.map((row) => [row.talentId, row.baseCharacters])),
      pool,
      sampleCharacters: chosen[0].baseSample,
    };
  }
  return null;
}
