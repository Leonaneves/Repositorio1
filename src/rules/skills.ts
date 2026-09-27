import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { SkillKey } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { backgrounds } from "../data/backgrounds.js";
import { getAbilityModifier, getProficiencyBonus } from "./abilities.js";

/**
 * `true` se o antecedente ATUAL concede proficiência nesta perícia.
 * Puramente derivado de `character.backgroundId` — nunca armazenado em
 * `Character` (mesma razão de sempre: um resultado derivado gravado
 * como input arrisca ficar dessincronizado; aqui ele nem existe como
 * estado, só como cálculo).
 */
export function isSkillGrantedByBackground(character: Character, skill: SkillKey): boolean {
  if (!character.backgroundId) return false;
  return backgrounds[character.backgroundId].grantedSkills.includes(skill);
}

/**
 * Proficiência final da perícia = override manual do jogador, se
 * houver; senão, segue o antecedente atual.
 *
 * É isto que resolve a troca de antecedente sem diff de string e sem
 * apagar escolhas manuais (ver `state/characterStore.ts#setBackground`,
 * que agora só grava `backgroundId` — nenhuma perícia precisa ser
 * "desmarcada" na troca, porque `isSkillGrantedByBackground` já muda
 * sozinha, e qualquer `manualOverride` explícito do jogador continua
 * intocado, tenha ele sido definido por qualquer motivo).
 */
export function getSkillProficiency(character: Character, skill: SkillKey): boolean {
  const state = character.skills[skill];
  return state.manualOverride ?? isSkillGrantedByBackground(character, skill);
}

/**
 * Bônus de perícia = modificador do atributo + bônus de proficiência
 * (dobrado se houver especialização) + ajuste manual.
 *
 * Especialização (expertise) só é aplicada se a proficiência final
 * também for `true` — não é possível ter especialização sem
 * proficiência.
 */
export function getSkillBonus(character: Character, skill: SkillKey): ComputedValue {
  const definition = skills[skill];
  const state = character.skills[skill];

  const abilityMod = getAbilityModifier(character.abilities[definition.ability].score);
  const proficiencyBonus = character.level ? getProficiencyBonus(character.level) : 0;

  const proficient = getSkillProficiency(character, skill);
  const multiplier = proficient ? (state.expertise ? 2 : 1) : 0;
  const auto = abilityMod + proficiencyBonus * multiplier;

  return computedValue(auto, state.manualAdjustment);
}
