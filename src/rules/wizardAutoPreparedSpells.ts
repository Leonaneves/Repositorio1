import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias FIXAS sempre preparadas por subclasse de Mago, fora do limite
 * normal (fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO
 * PDF" §8/§11) — nunca uma escolha do jogador, por isso ficam fora do
 * Livro de Magias (`rules/wizardSpellbook.ts`), igual ao padrão já
 * usado para Magias de Domínio do Clérigo/Magias de Círculo do Druida.
 */
export function getWizardAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "mago") return [];

  if (character.subclassId === "Abjurador" && character.level >= 10) {
    return [
      {
        circle: "", name: "Contramagia", castingTime: "", range: "", concentration: false, ritual: false, material: false,
        notes: "Rompe-Magia — sempre preparada, fora do limite normal",
      },
      {
        circle: "", name: "Dissipar Magia", castingTime: "AB", range: "", concentration: false, ritual: false, material: false,
        notes: "Rompe-Magia — sempre preparada, fora do limite normal; +BP no teste",
      },
    ];
  }

  if (character.subclassId === "Ilusionista" && character.level >= 6) {
    return [
      {
        circle: "", name: "Convocar Feérico", castingTime: "", range: "", concentration: false, ritual: false, material: false,
        notes: "Criaturas Espectrais — sempre preparada, fora do limite normal; pode conjurar como Ilusão",
      },
      {
        circle: "", name: "Invocar Fera", castingTime: "", range: "", concentration: false, ritual: false, material: false,
        notes: "Criaturas Espectrais — sempre preparada, fora do limite normal; pode conjurar como Ilusão",
      },
    ];
  }

  return [];
}
