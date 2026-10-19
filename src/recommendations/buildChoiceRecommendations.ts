import type { CharacterBuild } from "../domain/characterBuild.js";
import type { ClassId } from "../domain/ids.js";
import { highestAbility, lowestAbility } from "../repositories/AnalyticsRepository.js";
import { MIN_REAL_CHARACTERS } from "./policy.js";

/**
 * Recomendações de escolhas de CRIAÇÃO além dos talentos (pedido do
 * usuário "ampliar o escopo"): Espécie, Antecedente, Perícias,
 * Especialização, Subclasse, Metamagia e, na distribuição de atributos,
 * 1 atributo maior e 1 "dump stat" (o menor). Só dados REAIS — a versão confirmada mais
 * recente de cada personagem —, porque o formato de referências não
 * traz essas escolhas. Mesmas regras gerais dos talentos: amostra mínima
 * de `MIN_REAL_CHARACTERS` personagens distintos no contexto, só opções
 * elegíveis no seletor, o próprio personagem nunca conta, desempate
 * estável pela ordem do seletor. Mesma contagem da função SQL
 * `get_build_choice_counts` (migration 0006).
 */

export type BuildChoiceKind = "species" | "background" | "highestAbility" | "dumpAbility" | "skillChoice" | "subclass" | "metamagic";

/**
 * Contexto: sempre a mesma classe; primeiro também a mesma subclasse
 * (quando o personagem atual já tem uma), depois só a classe. A própria
 * Subclasse só usa a faixa `class` (comparar com quem já tem a mesma
 * subclasse daria sempre 100%).
 */
export type BuildChoiceTier = "class_subclass" | "class";
export const BUILD_CHOICE_TIERS: readonly BuildChoiceTier[] = ["class_subclass", "class"];

/**
 * Quantas opções podem ser marcadas por seletor: atributos indicam UM
 * maior e UM menor; Subclasse indica só a mais escolhida (cada classe tem
 * só 4 — marcar 3 não ajudaria a decidir); os demais seguem o limite de 3.
 */
export const MAX_BUILD_CHOICE_RECOMMENDATIONS: Readonly<Record<BuildChoiceKind, number>> = {
  species: 3,
  background: 3,
  highestAbility: 1,
  dumpAbility: 1,
  skillChoice: 3,
  subclass: 1,
  metamagic: 3,
};

export interface BuildChoiceCountQuery {
  kind: BuildChoiceKind;
  classId: ClassId;
  /** `null` = personagem ainda sem subclasse (a faixa `class_subclass` nem é consultada). */
  subclassId: string | null;
  /** Só para `skillChoice`: id da `FeatureChoice` (ex.: as Perícias de Classe), comparada só com a MESMA escolha em outros personagens. */
  choiceId: string | null;
  excludeCharacterId: string | null;
}

export interface BuildChoiceCountRow {
  tier: BuildChoiceTier;
  value: string;
  /** Personagens distintos que fizeram esta escolha. */
  characters: number;
  /** Personagens distintos com alguma escolha deste tipo na faixa — a amostra. */
  sampleCharacters: number;
}

export interface BuildChoiceRecommendationResult {
  values: string[];
  /** Personagens distintos que escolheram cada valor recomendado (base do motivo "escolhido por X de 10"). */
  characters: Record<string, number>;
  tier: BuildChoiceTier;
  sampleCharacters: number;
}

/** Valores escolhidos por UM personagem para o tipo pedido (vários só em `skillChoice`). */
function valuesOf(build: CharacterBuild, query: BuildChoiceCountQuery): string[] {
  switch (query.kind) {
    case "species":
      return build.speciesId ? [build.speciesId] : [];
    case "background":
      return build.backgroundId ? [build.backgroundId] : [];
    case "highestAbility":
      return [highestAbility(build.abilityScores)];
    case "dumpAbility":
      return [lowestAbility(build.abilityScores)];
    case "skillChoice":
      return query.choiceId ? [...(build.skillChoices?.[query.choiceId] ?? [])] : [];
    case "subclass":
      return build.subclassId ? [build.subclassId] : [];
    case "metamagic":
      return [...(build.metamagicOptions ?? [])];
  }
}

/**
 * Contagens por (faixa, valor) a partir das versões confirmadas mais
 * recentes — só devolve faixas com amostra ≥ `MIN_REAL_CHARACTERS`
 * (mesmo corte de privacidade do SQL: contagens reais pequenas nunca
 * saem do repositório).
 */
export function countBuildChoices(latestBuilds: readonly CharacterBuild[], query: BuildChoiceCountQuery): BuildChoiceCountRow[] {
  const relevant = latestBuilds.filter((build) => build.classId === query.classId && build.characterId !== query.excludeCharacterId);
  const rows: BuildChoiceCountRow[] = [];
  for (const tier of BUILD_CHOICE_TIERS) {
    if (tier === "class_subclass" && (query.subclassId === null || query.kind === "subclass")) continue;
    const inTier = relevant.filter((build) => tier === "class" || build.subclassId === query.subclassId);
    const byValue = new Map<string, Set<string>>();
    const sample = new Set<string>();
    for (const build of inTier) {
      for (const value of valuesOf(build, query)) {
        sample.add(build.characterId);
        const characters = byValue.get(value) ?? new Set<string>();
        characters.add(build.characterId);
        byValue.set(value, characters);
      }
    }
    if (sample.size < MIN_REAL_CHARACTERS) continue;
    for (const [value, characters] of byValue) rows.push({ tier, value, characters: characters.size, sampleCharacters: sample.size });
  }
  return rows;
}

/**
 * A primeira faixa (`class_subclass`, depois `class`) com amostra
 * suficiente e ao menos uma opção ELEGÍVEL decide sozinha; ranking por
 * personagens distintos, empate pela ordem do seletor (`eligibleValues`);
 * corta em `max`. `null` = sem recomendação.
 */
export function selectBuildChoiceRecommendations(
  rows: readonly BuildChoiceCountRow[],
  eligibleValues: readonly string[],
  max: number,
): BuildChoiceRecommendationResult | null {
  const order = new Map(eligibleValues.map((value, index) => [value, index]));
  for (const tier of BUILD_CHOICE_TIERS) {
    const tierRows = rows.filter((row) => row.tier === tier);
    if (tierRows.length === 0 || tierRows[0].sampleCharacters < MIN_REAL_CHARACTERS) continue;
    const ranked = tierRows
      .filter((row) => row.characters > 0 && order.has(row.value))
      .sort((a, b) => b.characters - a.characters || order.get(a.value)! - order.get(b.value)!);
    if (ranked.length === 0) continue;
    const chosen = ranked.slice(0, max);
    return {
      values: chosen.map((row) => row.value),
      characters: Object.fromEntries(chosen.map((row) => [row.value, row.characters])),
      tier,
      sampleCharacters: tierRows[0].sampleCharacters,
    };
  }
  return null;
}
