import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBarbarianRitualSpells } from "./barbarianRitualSpells.js";

function barbarianAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("barb-ritual-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBarbarianRitualSpells", () => {
  it("classe diferente de Bárbaro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "druida";
    character.level = 10;
    character.subclassId = "Caminho do Coração Selvagem";
    expect(getBarbarianRitualSpells(character)).toEqual([]);
  });

  it("subclasse diferente de Coração Selvagem — []", () => {
    expect(getBarbarianRitualSpells(barbarianAt(10, "Caminho do Berserker"))).toEqual([]);
  });

  it("Coração Selvagem nível 3: Falar com Animais + Sentido Feral, ambos Ritual/SAB, círculo em branco", () => {
    const entries = getBarbarianRitualSpells(barbarianAt(3, "Caminho do Coração Selvagem"));
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.name)).toEqual(["Falar com Animais", "Sentido Feral"]);
    for (const entry of entries) {
      expect(entry.circle).toBe("");
      expect(entry.ritual).toBe(true);
      expect(entry.concentration).toBe(false);
      expect(entry.material).toBe(false);
      expect(entry.notes).toContain("Ritual (SAB)");
      expect(entry.notes).toContain("Caminho do Coração Selvagem");
    }
  });

  it("Coração Selvagem nível 2 (abaixo de 3): ainda nenhuma magia", () => {
    expect(getBarbarianRitualSpells(barbarianAt(2, "Caminho do Coração Selvagem"))).toEqual([]);
  });

  it("Coração Selvagem nível 10: soma Comunhão com a Natureza às 2 anteriores (3 no total)", () => {
    const entries = getBarbarianRitualSpells(barbarianAt(10, "Caminho do Coração Selvagem"));
    expect(entries.map((e) => e.name)).toEqual(["Falar com Animais", "Sentido Feral", "Comunhão com a Natureza"]);
  });

  it("Coração Selvagem nível 9 (abaixo de 10): ainda só as 2 de nível 3", () => {
    const entries = getBarbarianRitualSpells(barbarianAt(9, "Caminho do Coração Selvagem"));
    expect(entries.map((e) => e.name)).toEqual(["Falar com Animais", "Sentido Feral"]);
  });
});
