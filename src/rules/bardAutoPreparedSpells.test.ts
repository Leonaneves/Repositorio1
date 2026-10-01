import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBardAutoPreparedSpells } from "./bardAutoPreparedSpells.js";

function bardAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("bard-auto-spells-test");
  character.classId = "bardo";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBardAutoPreparedSpells", () => {
  it("classe diferente de Bardo — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    character.subclassId = "Colégio do Glamour";
    expect(getBardAutoPreparedSpells(character)).toEqual([]);
  });

  it("Bardo sem subclasse Glamour e abaixo do nível 20 — []", () => {
    expect(getBardAutoPreparedSpells(bardAt(14, "Colégio da Bravura"))).toEqual([]);
  });

  it("Glamour nível 3: Enfeitiçar Pessoa + Reflexos, sempre preparadas, círculo em branco", () => {
    const entries = getBardAutoPreparedSpells(bardAt(3, "Colégio do Glamour"));
    expect(entries.map((e) => e.name)).toEqual(["Enfeitiçar Pessoa", "Reflexos"]);
    for (const entry of entries) {
      expect(entry.circle).toBe("");
      expect(entry.ritual).toBe(false);
      expect(entry.notes).toContain("Magia Fascinante");
    }
  });

  it("Glamour nível 2 (abaixo de 3): ainda nenhuma magia", () => {
    expect(getBardAutoPreparedSpells(bardAt(2, "Colégio do Glamour"))).toEqual([]);
  });

  it("Glamour nível 6: soma Comando às 2 anteriores (3 no total)", () => {
    const entries = getBardAutoPreparedSpells(bardAt(6, "Colégio do Glamour"));
    expect(entries.map((e) => e.name)).toEqual(["Enfeitiçar Pessoa", "Reflexos", "Comando"]);
  });

  it("Bardo nível 20 (qualquer subclasse): Palavra de Poder Matar/Salvar", () => {
    const entries = getBardAutoPreparedSpells(bardAt(20, "Colégio da Bravura"));
    expect(entries.map((e) => e.name)).toEqual(["Palavra de Poder: Matar", "Palavra de Poder: Salvar"]);
  });

  it("Glamour nível 20: todas as 5 magias combinadas, sem duplicar", () => {
    const entries = getBardAutoPreparedSpells(bardAt(20, "Colégio do Glamour"));
    expect(entries.map((e) => e.name)).toEqual([
      "Enfeitiçar Pessoa",
      "Reflexos",
      "Comando",
      "Palavra de Poder: Matar",
      "Palavra de Poder: Salvar",
    ]);
  });
});
