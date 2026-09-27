import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { species } from "../data/species.js";

/**
 * Bônus de deslocamento concedido pela classe. Hoje só o Monge altera o
 * deslocamento (traço "Movimento sem Armadura", PHB 2024), e apenas
 * enquanto ele não estiver usando armadura nem escudo:
 *
 * nível 1 → +0m · 2–5 → +3m · 6–9 → +4,5m · 10–13 → +6m · 14–17 → +7,5m · 18–20 → +9m
 */
export function getClassSpeedBonus(character: Character): number {
  if (character.classId !== "monge") return 0;
  if (character.armor.equipped !== "unarmed") return 0;
  if (character.armor.shield) return 0;

  const level = character.level;
  if (level >= 18) return 9;
  if (level >= 14) return 7.5;
  if (level >= 10) return 6;
  if (level >= 6) return 4.5;
  if (level >= 2) return 3;
  return 0;
}

/**
 * Deslocamento = deslocamento base da espécie + bônus de classe/nível
 * (ver `getClassSpeedBonus`) + ajuste manual. Decisão do projeto: ao
 * contrário do PDF original (onde era 100% manual), a versão web
 * calcula automaticamente, mas preserva o ajuste manual do jogador.
 */
export function getSpeed(character: Character): ComputedValue {
  const speciesSpeed = character.speciesId ? species[character.speciesId].baseSpeed : 0;
  const classBonus = getClassSpeedBonus(character);
  const auto = speciesSpeed + classBonus;
  return computedValue(auto, character.speed.manualAdjustment);
}
