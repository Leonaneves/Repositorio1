import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { BackgroundId, SkillKey } from "../domain/ids.js";
import { backgrounds } from "../data/backgrounds.js";
import { skills } from "../data/skills.js";
import type { BuildChoiceScoreRow } from "./scoring.js";

/**
 * INFLUÊNCIAS POR REGRA (não estatísticas) que ajustam o ranking
 * estatístico — nunca criam uma recomendação sozinhas: só reordenam
 * opções que jogadores reais da classe já escolheram. Base: os guias de
 * otimização do RPGBOT (rpgbot.net) para D&D 2024 — o Antecedente define
 * quais atributos recebem o aumento de criação (então deve coincidir com
 * os atributos-chave da classe/subclasse), e uma perícia rende mais
 * quando usa um atributo alto do personagem.
 */

/** Peso das influências por regra: 0.5 = no máximo ±50% na pontuação estatística. */
export const RULE_INFLUENCE_WEIGHT = 0.5;

/** Pontuações de UM tipo de atributo (maior ou menor) → fração de cada atributo, somando 1. */
export function abilityShares(rows: readonly BuildChoiceScoreRow[]): Partial<Record<AbilityKey, number>> {
  const total = rows.reduce((sum, row) => sum + row.score, 0);
  if (total <= 0) return {};
  return Object.fromEntries(rows.filter((row) => (ABILITY_KEYS as readonly string[]).includes(row.value)).map((row) => [row.value, row.score / total]));
}

/**
 * Afinidade do Antecedente com o foco de atributos da classe/subclasse
 * (atributos que os jogadores costumam deixar como o MAIOR, menos os que
 * costumam deixar como o MENOR — o "dump stat"): soma sobre os 3
 * atributos que o Antecedente pode aumentar, entre -1 e 1.
 */
export function backgroundAbilityAffinity(
  backgroundId: BackgroundId,
  highestShares: Partial<Record<AbilityKey, number>>,
  dumpShares: Partial<Record<AbilityKey, number>>,
): number {
  const affinity = backgrounds[backgroundId].abilityScoreOptions.reduce(
    (total, ability) => total + (highestShares[ability] ?? 0) - (dumpShares[ability] ?? 0),
    0,
  );
  return Math.max(-1, Math.min(1, affinity));
}

/** Afinidade de uma perícia com os atributos do personagem: 1 = usa o maior atributo, 0 = o menor (0 se todos forem iguais). */
export function skillAbilityAffinity(skillId: SkillKey, scores: Record<AbilityKey, number>): number {
  const values = ABILITY_KEYS.map((ability) => scores[ability]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0;
  return (scores[skills[skillId].ability] - min) / (max - min);
}

/** Multiplicador aplicado à pontuação estatística. */
export function ruleMultiplier(affinity: number): number {
  return 1 + RULE_INFLUENCE_WEIGHT * affinity;
}
