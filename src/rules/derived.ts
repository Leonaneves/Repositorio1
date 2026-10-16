import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { getAlertInitiativeBonus } from "./feats.js";
import { getSkillBonus } from "./skills.js";

/**
 * Iniciativa = modificador de Destreza + ajuste manual. "Emboscador das
 * Sombras" (Vigilante das Sombras, nível 3 — fonte "IMPLEMENTAR
 * SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF" §5) troca a base para
 * Sabedoria, sem mínimo +1 — aplicado direto aqui, nunca repetido como
 * texto em Características de Classe. Alerta (fonte "IMPLEMENTAR
 * TALENTOS DE ORIGEM NO BUILDER E NO PDF" §4) soma o Bônus de
 * Proficiência por cima — `getAlertInitiativeBonus` já devolve `0` sem
 * o talento, nunca duplicado por outra fonte.
 */
export function getInitiative(character: Character): ComputedValue {
  const ability = character.subclassId === "Vigilante das Sombras" && character.level >= 3 ? "SAB" : "DEX";
  const auto = getAbilityModifier(getEffectiveAbilityScore(character, ability)) + getAlertInitiativeBonus(character);
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
