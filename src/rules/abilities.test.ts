import { describe, expect, it } from "vitest";
import { getAbilityModifier, getProficiencyBonus } from "./abilities.js";

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
