import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Truques concedidos automaticamente pelas subclasses de Monge, usando
 * Sabedoria como atributo de conjuração (fonte "IMPLEMENTAR MONGE E
 * SUAS SUBCLASSES NO BUILDER E NO PDF" §11/§12): Ilusão Sombria
 * (Caminho das Sombras, dentro de Artes das Sombras) concede Ilusão
 * Menor; Manipular Elementos (Caminho dos Elementos) concede
 * Elementalismo. Vão para a área de Magias do PDF (`spellsPrepared`),
 * nunca para "Características de Classe", mesmo padrão já usado para
 * as magias sempre preparadas das demais classes
 * (rules/effectiveSpellsPrepared.ts). Nenhuma das duas concede espaços
 * de magia — são só truques.
 */
export function getMonkAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "monge" || character.level < 3) return [];

  if (character.subclassId === "Guerreiro das Sombras") {
    return [
      {
        circle: "",
        name: "Ilusão Menor",
        castingTime: "",
        range: "",
        concentration: false,
        ritual: false,
        material: false,
        notes: "Sempre preparada — Caminho das Sombras (Artes das Sombras); usa Sabedoria, truque fixo, não entra nas trocas de truque",
      },
    ];
  }

  if (character.subclassId === "Guerreiro dos Elementos") {
    return [
      {
        circle: "",
        name: "Elementalismo",
        castingTime: "",
        range: "",
        concentration: false,
        ritual: false,
        material: false,
        notes: "Sempre preparada — Caminho dos Elementos (Manipular Elementos); usa Sabedoria, truque fixo, não entra nas trocas de truque",
      },
    ];
  }

  return [];
}
