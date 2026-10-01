import type { Character } from "../domain/character.js";
import type { AbilityKey } from "../domain/common.js";

/**
 * `= floor((valor - 10) / 2)` — extraído literalmente dos scripts
 * `<ATR>.MOD` do PDF original.
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Valor final do atributo, somando bônus permanentes de classe que
 * alteram o próprio valor (não um bônus condicional de teste/CA) — por
 * ora só o Bárbaro/Campeão Primitivo (nível 20: FOR+4, CON+4, máximo
 * 25 — fonte "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" §18). O
 * valor bruto que o jogador digitou (`character.abilities[ability].score`)
 * nunca é sobrescrito — o bônus é somado por cima, igual ao padrão
 * auto+manual já usado em PV/CA/Deslocamento. Todo consumidor que
 * precisa do atributo "final" (modificador de ataque/perícia/
 * salvaguarda/CA/PV, e a exibição de revisão/PDF) deve usar esta
 * função em vez de ler `character.abilities[ability].score` direto —
 * só o EDITOR do valor bruto (`Step6Abilities`/`AbilitiesSection`,
 * onde o jogador digita a pontuação-base) continua lendo/escrevendo o
 * valor cru.
 */
export function getEffectiveAbilityScore(character: Character, ability: AbilityKey): number {
  const base = character.abilities[ability].score;
  if (character.classId === "barbaro" && character.level >= 20 && (ability === "FOR" || ability === "CON")) {
    return Math.min(25, base + 4);
  }
  return base;
}

/**
 * Bônus de proficiência por nível (1–20). Extraído literalmente do
 * script `PROFICIENCIA` do PDF original.
 *
 * Por decisão do projeto, este valor NÃO aceita ajuste manual (não há
 * forma de alterá-lo pelas regras do D&D) — por isso retorna `number`
 * puro, e não `ComputedValue` como os demais valores derivados.
 */
export function getProficiencyBonus(level: number): number {
  if (level >= 1 && level <= 4) return 2;
  if (level >= 5 && level <= 8) return 3;
  if (level >= 9 && level <= 12) return 4;
  if (level >= 13 && level <= 16) return 5;
  if (level >= 17 && level <= 20) return 6;
  throw new RangeError(`Nível inválido: ${level}. Esperado um inteiro entre 1 e 20.`);
}
