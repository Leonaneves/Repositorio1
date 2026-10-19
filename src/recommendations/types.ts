import type { AbilityKey } from "../domain/common.js";
import type { TalentOpportunityKind } from "../domain/characterBuild.js";
import type { ClassId } from "../domain/ids.js";

/**
 * De onde vem cada contagem usada pelo recomendador (fonte "IMPLEMENTAR
 * RECOMENDAÇÕES DE TALENTOS" §1/§2) — as três NUNCA são somadas nem
 * mescladas num mesmo ranking:
 *
 * - `user`: personagens reais confirmados (`character_builds`,
 *   `origin = 'user' and status = 'confirmed'`);
 * - `reference_extracted`: personagens extraídos de fontes externas
 *   reais (guias, artigos etc. — `reference_*` com `content_type = 'extracted'`);
 * - `reference_synthetic`: personagens gerados por uma regra de geração
 *   PREVIAMENTE APROVADA (`content_type = 'synthetic'`) — nenhuma regra
 *   está aprovada nesta etapa, então este conjunto fica sempre vazio.
 */
export type RecommendationPool = "user" | "reference_extracted" | "reference_synthetic";

/**
 * Faixas de semelhança de contexto, da mais específica para a mais
 * ampla — sempre dentro do MESMO tipo de oportunidade e da MESMA
 * classe (ver `policy.ts#CONTEXT_TIERS`).
 */
export type ContextTier = "level_subclass_ability" | "level_subclass" | "level_ability" | "level" | "level_band";

/**
 * Contexto da oportunidade que o jogador está decidindo agora — sempre o
 * estado IMEDIATAMENTE ANTES da aquisição (nunca o benefício do próprio
 * talento nem de aquisições posteriores). `null` = desconhecido, e um
 * campo desconhecido nunca é preenchido com zero, valor final ou
 * subclasse posterior: só desabilita as faixas que dependem dele.
 */
export interface TalentChoiceCountQuery {
  opportunityKind: TalentOpportunityKind;
  classId: ClassId;
  /** Nível da aquisição — `null` só para o Talento de Origem do Humano (concedido na criação, sem nível numérico). */
  level: number | null;
  /** Subclasse NO MOMENTO da aquisição — `null` antes do nível 3 ou ainda não escolhida. */
  subclassId: string | null;
  /** Maior atributo NO MOMENTO da aquisição (desempate FOR > DEX > CON > INT > SAB > CAR) — `null` quando os atributos ainda não estão definidos. */
  highestAbility: AbilityKey | null;
  /** O próprio personagem (todas as suas versões confirmadas) nunca conta para a sua recomendação — `Character.id`. */
  excludeCharacterId: string | null;
  /** Segue `policy.ts#REAL_RECORDS_ENABLED` — com `false`, dados reais nem chegam a ser consultados. */
  includeUserRecords: boolean;
}

/**
 * Uma linha de contagem devolvida pelo repositório: para um par
 * (conjunto, faixa), quantos personagens DISTINTOS escolheram
 * `talentId`, e o tamanho da amostra daquele par. Mesma forma para a
 * função SQL (`get_talent_choice_counts`) e para a implementação em
 * memória (`countTalentChoices.ts`).
 */
export interface TalentChoiceCountRow {
  pool: RecommendationPool;
  tier: ContextTier;
  talentId: string;
  /** Personagens distintos que escolheram este talento nesta faixa (várias aquisições do mesmo personagem contam 1). */
  characters: number;
  /** Grupos de fontes independentes distintos entre esses personagens (para `user`, igual a `characters`). */
  independentGroups: number;
  /** Personagens distintos com QUALQUER escolha deste tipo de oportunidade nesta faixa — a amostra. */
  sampleCharacters: number;
  /** Grupos de fontes independentes distintos na amostra (para `user`, igual a `sampleCharacters`). */
  sampleGroups: number;
}

/**
 * Uma aquisição "achatada", formato comum aos registros reais e às
 * referências — o que a contagem em memória consome
 * (`countTalentChoices.ts`), espelhando as colunas que a função SQL
 * monta na CTE `facts`.
 */
export interface TalentChoiceFact {
  pool: RecommendationPool;
  /** Identidade do personagem — `buildId` (real) ou `"{sourceId}/{characterKey}"` (referência). */
  characterKey: string;
  /** Grupo de independência — o próprio `buildId` (real) ou `independenceGroup` da fonte (referência). */
  groupKey: string;
  opportunityKind: TalentOpportunityKind;
  classId: string;
  level: number | null;
  subclassId: string | null;
  highestAbility: AbilityKey | null;
  talentId: string;
}

/**
 * Resultado de uma recomendação — a UI usa `talentIds` (rótulo
 * "(Recomendado)") e `characters`/`sampleCharacters`/`pool` para o
 * motivo ("escolhido por X de 10 guerreiros"); referências aparecem
 * como "personagens de referência", nunca como escolhas de jogadores
 * reais. `tier`/`sampleGroups` ficam guardados para auditoria (fonte §1).
 */
export interface TalentRecommendationResult {
  /** No máximo `MAX_RECOMMENDATIONS_PER_SELECTOR`, já na ordem do ranking. */
  talentIds: string[];
  /** Personagens distintos que escolheram cada talento recomendado (base do motivo "escolhido por X de 10"). */
  characters: Record<string, number>;
  pool: RecommendationPool;
  tier: ContextTier;
  sampleCharacters: number;
  sampleGroups: number;
}
