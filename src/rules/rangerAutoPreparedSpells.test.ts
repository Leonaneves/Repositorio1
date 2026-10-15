import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getRangerAutoPreparedSpells } from "./rangerAutoPreparedSpells.js";

function rangerAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("ranger-auto-spells-test");
  character.classId = "patrulheiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getRangerAutoPreparedSpells", () => {
  it("classe diferente de Patrulheiro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getRangerAutoPreparedSpells(character)).toEqual([]);
  });

  it("sem subclasse escolhida — []", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(20, null))).toEqual([]);
  });

  it("Caçador e Senhor das Feras nunca têm magias sempre preparadas nesta fonte", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(20, "Caçador"))).toEqual([]);
    expect(getRangerAutoPreparedSpells(rangerAt(20, "Senhor das Feras"))).toEqual([]);
  });

  it("Andarilho Feérico nível 3: só Enfeitiçar Pessoa, círculo em branco (não fornecido pela fonte)", () => {
    const entries = getRangerAutoPreparedSpells(rangerAt(3, "Andarilho Feérico"));
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Enfeitiçar Pessoa");
    expect(entries[0].circle).toBe("");
    expect(entries[0].castingTime).toBe("");
    expect(entries[0].range).toBe("");
    expect(entries[0].notes).toContain("Andarilho Feérico");
    expect(entries[0].notes).toContain("nível 3");
  });

  it("Andarilho Feérico: soma uma magia por faixa de nível alcançada, nunca uma à frente", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(4, "Andarilho Feérico")).map((e) => e.name)).toEqual(["Enfeitiçar Pessoa"]);
    expect(getRangerAutoPreparedSpells(rangerAt(5, "Andarilho Feérico")).map((e) => e.name)).toEqual(["Enfeitiçar Pessoa", "Passo Nebuloso"]);
    expect(getRangerAutoPreparedSpells(rangerAt(9, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
    ]);
    expect(getRangerAutoPreparedSpells(rangerAt(13, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
      "Porta Dimensional",
    ]);
    expect(getRangerAutoPreparedSpells(rangerAt(17, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
      "Porta Dimensional",
      "Despistar",
    ]);
  });

  it("nível abaixo de 3: nenhuma magia ainda", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(2, "Andarilho Feérico"))).toEqual([]);
  });

  it("Vigilante das Sombras: soma uma magia por faixa de nível, nos nomes exatos da fonte", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(3, "Vigilante das Sombras")).map((e) => e.name)).toEqual(["Disfarçar-se"]);
    expect(getRangerAutoPreparedSpells(rangerAt(17, "Vigilante das Sombras")).map((e) => e.name)).toEqual([
      "Disfarçar-se",
      "Corda Extradimensional",
      "Medo",
      "Invisibilidade Maior",
      "Similaridade",
    ]);
  });

  it("nunca mistura as listas das duas subclasses", () => {
    const feerico = getRangerAutoPreparedSpells(rangerAt(17, "Andarilho Feérico")).map((e) => e.name);
    const sombras = getRangerAutoPreparedSpells(rangerAt(17, "Vigilante das Sombras")).map((e) => e.name);
    expect(feerico).not.toContain("Disfarçar-se");
    expect(sombras).not.toContain("Enfeitiçar Pessoa");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = rangerAt(17, "Andarilho Feérico");
    getRangerAutoPreparedSpells(character);
    expect(character.spellsPrepared).toEqual([]);
  });

  it("nunca duplica uma magia gratuita — um único contador/entrada por nível, nunca repetida ao consultar de novo", () => {
    const character = rangerAt(17, "Andarilho Feérico");
    const first = getRangerAutoPreparedSpells(character);
    const second = getRangerAutoPreparedSpells(character);
    expect(first).toEqual(second);
    expect(new Set(first.map((e) => e.name)).size).toBe(first.length);
  });
});
