import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { classes, type HitDie } from "../data/classes.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";

/**
 * Valor fixo médio do Dado de Vida (regra padrão de "PV fixo" do D&D
 * 2024, usada aqui em vez de rolagem): d6→4, d8→5, d10→6, d12→7.
 */
export function getAverageHitDieRoll(hitDie: HitDie): number {
  return Math.floor(hitDie / 2) + 1;
}

/**
 * PV máximo automático (aprovado como comportamento padrão de criação
 * rápida, sem rolagem): nível 1 = máximo do Dado de Vida + mod. de CON;
 * cada nível seguinte soma o valor fixo médio do Dado de Vida + mod. de
 * CON. Sem classe escolhida, o automático é 0 (só o ajuste manual conta).
 */
export function getMaxHitPoints(character: Character): ComputedValue {
  const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
  const auto = character.classId === null
    ? 0
    : (() => {
        const hitDie = classes[character.classId as keyof typeof classes].hitDie;
        const perLevel = getAverageHitDieRoll(hitDie) + conMod;
        const firstLevel = hitDie + conMod;
        return firstLevel + Math.max(0, character.level - 1) * perLevel;
      })();

  return computedValue(auto, character.hp.maxManualAdjustment);
}

/** Dados de Vida totais disponíveis: 1 por nível, sempre derivado. */
export function getMaxHitDice(character: Character): number {
  return character.level;
}

/** Dados de Vida restantes = total - já gastos (nunca negativo). */
export function getRemainingHitDice(character: Character): number {
  return Math.max(0, getMaxHitDice(character) - character.hp.hitDiceSpent);
}
