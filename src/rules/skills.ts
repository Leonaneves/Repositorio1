import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { SkillKey } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { getAbilityModifier, getProficiencyBonus } from "./abilities.js";

/**
 * Bônus de perícia = modificador do atributo + bônus de proficiência
 * (dobrado se houver especialização) + ajuste manual.
 *
 * Especialização (expertise) só é aplicada se `proficient` também for
 * `true` — não é possível ter especialização sem proficiência.
 */
export function getSkillBonus(character: Character, skill: SkillKey): ComputedValue {
  const definition = skills[skill];
  const state = character.skills[skill];

  const abilityMod = getAbilityModifier(character.abilities[definition.ability].score);
  const proficiencyBonus = character.level ? getProficiencyBonus(character.level) : 0;

  const multiplier = state.proficient ? (state.expertise ? 2 : 1) : 0;
  const auto = abilityMod + proficiencyBonus * multiplier;

  return computedValue(auto, state.manualAdjustment);
}
