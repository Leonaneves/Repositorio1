import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { getAbilityModifier } from "./abilities.js";
import { getSkillBonus } from "./skills.js";

/** Iniciativa = modificador de Destreza + ajuste manual. */
export function getInitiative(character: Character): ComputedValue {
  const auto = getAbilityModifier(character.abilities.DEX.score);
  return computedValue(auto, character.initiative.manualAdjustment);
}

/**
 * Percepção Passiva = 10 + bônus de Percepção (já com proficiência e
 * ajuste manual da própria perícia) + ajuste manual da Percepção
 * Passiva. Reaproveita `getSkillBonus`, como no PDF original (que lê o
 * valor já calculado do campo `SAB.perc`).
 */
export function getPassivePerception(character: Character): ComputedValue {
  const perceptionBonus = getSkillBonus(character, "percepcao").total;
  const auto = 10 + perceptionBonus;
  return computedValue(auto, character.passivePerception.manualAdjustment);
}
