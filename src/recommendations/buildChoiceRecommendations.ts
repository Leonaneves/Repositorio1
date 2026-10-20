import type { BuildChoiceKind, BuildChoiceScoreRow } from "./scoring.js";

export type { BuildChoiceKind, BuildChoiceScoreQuery, BuildChoiceScoreRow } from "./scoring.js";

/**
 * Seleção das recomendações de CRIAÇÃO (Espécie, Antecedente, atributos,
 * Perícias/Especialização, Subclasse, Metamagia, Invocações, Manobras)
 * a partir das pontuações de `scoring.ts` / `get_build_choice_scores`.
 * Só dados REAIS (o formato de referências não traz essas escolhas).
 * Elegibilidade (nível, pré-requisitos, opções já escolhidas) sempre
 * antes: só valores de `eligibleValues` podem ser recomendados.
 */

/**
 * Quantas opções podem ser marcadas por seletor: atributos indicam UM
 * maior, UM 2º maior e UM menor; Subclasse e Linhagem indicam só a mais
 * escolhida (poucas opções — marcar 3 não ajudaria a decidir); os demais
 * seguem o limite de 3.
 */
export const MAX_BUILD_CHOICE_RECOMMENDATIONS: Readonly<Record<BuildChoiceKind, number>> = {
  species: 3,
  lineage: 1,
  background: 3,
  highestAbility: 1,
  secondAbility: 1,
  dumpAbility: 1,
  abilityScore: 1,
  skillChoice: 3,
  subclass: 1,
  metamagic: 3,
  invocation: 3,
  maneuver: 3,
};

export interface BuildChoiceRecommendationResult {
  values: string[];
  /** Personagens da classe que fizeram cada escolha recomendada (motivo "escolhido por X de 10" da Subclasse). */
  characters: Record<string, number>;
  /** Personagens da classe comparados. */
  classSample: number;
}

/**
 * Ranking: pontuação (já com os fatores de influência e, quando houver,
 * o ajuste por regra `adjust`) → mais personagens da classe → ordem do
 * seletor. Corta em `max`. `null` = sem recomendação.
 */
export function selectBuildChoiceRecommendations(
  rows: readonly BuildChoiceScoreRow[],
  eligibleValues: readonly string[],
  max: number,
  adjust: (value: string) => number = () => 1,
): BuildChoiceRecommendationResult | null {
  const order = new Map(eligibleValues.map((value, index) => [value, index]));
  const ranked = rows
    .filter((row) => row.classCharacters > 0 && order.has(row.value))
    .map((row) => ({ row, score: row.score * adjust(row.value) }))
    .sort((a, b) => b.score - a.score || b.row.classCharacters - a.row.classCharacters || order.get(a.row.value)! - order.get(b.row.value)!);
  if (ranked.length === 0 || max <= 0) return null;
  const chosen = ranked.slice(0, max).map((entry) => entry.row);
  return {
    values: chosen.map((row) => row.value),
    characters: Object.fromEntries(chosen.map((row) => [row.value, row.classCharacters])),
    classSample: chosen[0].classSample,
  };
}
