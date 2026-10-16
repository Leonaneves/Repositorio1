import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Mãos Mágicas concedida automaticamente ao Trapaceiro Arcano (fonte
 * "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §11: "Mãos
 * Mágicas concedido automaticamente") — vai para a área de Magias do
 * PDF (`spellsPrepared`), nunca para "Características de Classe",
 * mesmo padrão já usado para as magias sempre preparadas das demais
 * classes (rules/effectiveSpellsPrepared.ts). Conta na quantidade
 * TOTAL de truques conhecidos, mas nunca no limite de magias
 * preparadas de 1º círculo ou superior — por isso nunca soma a
 * `getCantripsKnown`/`getSpellsPreparedMax` (rules/classResources.ts),
 * só aparece aqui, uma única vez.
 */
export function getRogueAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "ladino" || character.subclassId !== "Trapaceiro Arcano" || character.level < 3) return [];

  return [
    {
      circle: "",
      name: "Mãos Mágicas",
      castingTime: "",
      range: "",
      concentration: false,
      ritual: false,
      material: false,
      notes: "Sempre preparada — Trapaceiro Arcano; truque fixo, não entra nas trocas de truque nem no limite de magias preparadas",
    },
  ];
}
