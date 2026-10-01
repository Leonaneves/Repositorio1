import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

describe("getAbilityModifier", () => {
  it.each([
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [16, 3],
    [20, 5],
    [1, -5],
    [30, 10],
  ])("atributo %i → modificador %i", (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected);
  });
});

describe("getProficiencyBonus", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])("nível %i → proficiência +%i", (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  it("rejeita níveis fora do intervalo 1–20", () => {
    expect(() => getProficiencyBonus(0)).toThrow(RangeError);
    expect(() => getProficiencyBonus(21)).toThrow(RangeError);
  });
});

describe("getEffectiveAbilityScore — Campeão Primitivo (Bárbaro nível 20: FOR+4/CON+4, teto 25)", () => {
  it("classe/nível sem Campeão Primitivo: devolve o valor bruto, sem alteração", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 19;
    character.abilities.FOR.score = 20;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(20);
  });

  it("Bárbaro nível 20: FOR e CON ganham +4", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    character.abilities.CON.score = 16;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(22);
    expect(getEffectiveAbilityScore(character, "CON")).toBe(20);
  });

  it("Bárbaro nível 20: o bônus respeita o teto de 25", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 23;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(25);
  });

  it("Bárbaro nível 20: outros atributos (ex. DEX) não são afetados", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.DEX.score = 14;
    expect(getEffectiveAbilityScore(character, "DEX")).toBe(14);
  });

  it("outra classe no nível 20 não ganha o bônus", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "guerreiro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(18);
  });

  it("nunca sobrescreve o valor bruto armazenado (character.abilities.FOR.score)", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    getEffectiveAbilityScore(character, "FOR");
    expect(character.abilities.FOR.score).toBe(18);
  });
});
