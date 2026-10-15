import { computedValue, type AbilityKey, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { RANGER_MENTE_DE_FERRO_CHOICE_ID } from "../data/features/subclasses.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

/**
 * "Mente de Ferro" (Vigilante das Sombras, nível 7 — fonte "IMPLEMENTAR
 * SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF" §5): concede
 * proficiência em Salvaguarda de Sabedoria; se SAB já for proficiente
 * por outra origem, concede em Carisma ou Inteligência (escolha do
 * jogador) no lugar. Nunca grava nada em `character.savingThrows` — é
 * só derivada, somada em `getSavingThrow` abaixo, por isso
 * `character.savingThrows.SAB.proficient` aqui é SEMPRE a proficiência
 * "de outra origem" (classe/manual), nunca a desta própria
 * característica (ela não existe como escrita de estado).
 */
export function getMenteDeFerroGrantedAbility(character: Character): AbilityKey | null {
  if (character.subclassId !== "Vigilante das Sombras" || character.level < 7) return null;
  if (!character.savingThrows.SAB.proficient) return "SAB";

  const selection = character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID]?.value;
  if (selection === "Carisma") return "CAR";
  if (selection === "Inteligência") return "INT";
  return null;
}

/**
 * Bônus de salvaguarda = modificador do atributo + bônus de
 * proficiência (se proficiente) + ajuste manual. Mesma fórmula das
 * perícias (extraída literalmente do PDF, onde `<ATR>.res` usa o
 * script idêntico ao de `<ATR>.<pericia>`), mas sem especialização —
 * o D&D não permite expertise em salvaguardas. Proficiência final = a
 * armazenada OU a concedida por Mente de Ferro (`getMenteDeFerroGrantedAbility`),
 * mesmo padrão de "fontes automáticas somadas por OR" já usado em
 * `rules/skills.ts#getSkillProficiency`.
 */
export function getSavingThrow(character: Character, ability: AbilityKey): ComputedValue {
  const state = character.savingThrows[ability];

  const abilityMod = getAbilityModifier(getEffectiveAbilityScore(character, ability));
  const proficiencyBonus = character.level ? getProficiencyBonus(character.level) : 0;
  const proficient = state.proficient || getMenteDeFerroGrantedAbility(character) === ability;

  const auto = abilityMod + (proficient ? proficiencyBonus : 0);

  return computedValue(auto, state.manualAdjustment);
}
