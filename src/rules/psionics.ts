import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getSpeed } from "./speed.js";
import { getPsiWarriorDie } from "./classResources.js";

/** Guerreiro Psiônico só a partir do nível em que a característica indicada já foi concedida. */
function isPsiWarrior(character: Character, minLevel: number): boolean {
  return character.classId === "guerreiro" && character.subclassId === "Guerreiro Psiônico" && character.level >= minLevel;
}

/**
 * CD de Estocada Telecinética = `8 + BP + mod INT` — fórmula PRÓPRIA
 * (§1/§5), nunca confundida com a CD de magia do personagem, calculada
 * mesmo sem conjuração. Concedida a partir do nível 7 (atualiza Golpe
 * Psiônico do nível 3).
 */
export function getKineticThrustCd(character: Character): number | null {
  if (!isPsiWarrior(character, 7)) return null;
  const modifier = getAbilityModifier(getEffectiveAbilityScore(character, "INT"));
  return 8 + getProficiencyBonus(character.level) + modifier;
}

/**
 * `{dadoPsiônicoComINT}` — texto de dano/redução resolvido, ex.:
 * `"1d10+3"` ou `"1d10-1"` (nunca uma fórmula literal). Usado por Golpe
 * Psiônico (nível 3) e Vínculo Protetivo (nível 3).
 */
export function getPsionicDieWithIntText(character: Character): string | null {
  const die = getPsiWarriorDie(character);
  if (die === null) return null;
  const modifier = getAbilityModifier(getEffectiveAbilityScore(character, "INT"));
  const sign = modifier >= 0 ? "+" : "";
  return `1d${die}${sign}${modifier}`;
}

/**
 * `{vooCalculado}` — Salto com Impulsão Psíquica (nível 7): o dobro do
 * deslocamento EFETIVO (auto + ajuste manual, `rules/speed.ts#getSpeed`),
 * nunca um bônus temporário dobrado permanentemente.
 */
export function getPsionicLeapFlySpeed(character: Character): number | null {
  if (!isPsiWarrior(character, 7)) return null;
  return getSpeed(character).total * 2;
}

/**
 * `{quantidadeAlvos}` — Baluarte de Energia (nível 15): `max(1, mod INT)`.
 */
export function getEnergyBastionTargetCount(character: Character): number | null {
  if (!isPsiWarrior(character, 15)) return null;
  const modifier = getAbilityModifier(getEffectiveAbilityScore(character, "INT"));
  return Math.max(1, modifier);
}
