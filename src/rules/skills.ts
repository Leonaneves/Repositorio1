import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { SkillKey } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { backgrounds } from "../data/backgrounds.js";
import { classes, getClassSkillChoiceId } from "../data/classes.js";
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
 * `true` se o jogador escolheu esta perícia na feature "Perícias de
 * Classe" (`data/features/classes.ts`) da classe ATUAL — lê a seleção
 * de `character.featureChoiceSelections` pelo mesmo id que a feature
 * usa (`getClassSkillChoiceId`). Classes sem `skillChoice` confirmado
 * (ver `data/classes.ts`) nunca concedem nada por aqui.
 */
export function isSkillGrantedByClassChoice(character: Character, skill: SkillKey): boolean {
  if (!character.classId) return false;
  const skillChoice = classes[character.classId].skillChoice;
  if (!skillChoice) return false;

  const choiceId = getClassSkillChoiceId(character.classId);
  const selection = character.featureChoiceSelections[choiceId]?.value;
  const selected = Array.isArray(selection) ? selection : [];
  return selected.includes(skill);
}

/**
 * Proficiência final da perícia = override manual do jogador, se
 * houver; senão, concedida pelo antecedente atual OU pela escolha de
 * perícias de classe atual (qualquer uma das duas basta).
 *
 * É isto que resolve a troca de antecedente/classe sem diff de string e
 * sem apagar escolhas manuais (ver `state/characterStore.ts#setBackground`/
 * `setClass`, que só gravam o id — nenhuma perícia precisa ser
 * "desmarcada" na troca, porque as duas funções acima já mudam
 * sozinhas, e qualquer `manualOverride` explícito do jogador continua
 * intocado, tenha ele sido definido por qualquer motivo).
 */
export function getSkillProficiency(character: Character, skill: SkillKey): boolean {
  const state = character.skills[skill];
  return state.manualOverride ?? (isSkillGrantedByBackground(character, skill) || isSkillGrantedByClassChoice(character, skill));
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
