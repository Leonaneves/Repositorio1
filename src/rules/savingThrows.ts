import { computedValue, type AbilityKey, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { getAbilityModifier, getProficiencyBonus } from "./abilities.js";

/**
 * Bônus de salvaguarda = modificador do atributo + bônus de
 * proficiência (se proficiente) + ajuste manual. Mesma fórmula das
 * perícias (extraída literalmente do PDF, onde `<ATR>.res` usa o
 * script idêntico ao de `<ATR>.<pericia>`), mas sem especialização —
 * o D&D não permite expertise em salvaguardas.
 */
export function getSavingThrow(character: Character, ability: AbilityKey): ComputedValue {
  const state = character.savingThrows[ability];

  const abilityMod = getAbilityModifier(character.abilities[ability].score);
  const proficiencyBonus = character.level ? getProficiencyBonus(character.level) : 0;

  const auto = abilityMod + (state.proficient ? proficiencyBonus : 0);

  return computedValue(auto, state.manualAdjustment);
}
