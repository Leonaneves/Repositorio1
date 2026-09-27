import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getAttackBonus } from "./attack.js";

describe("getAttackBonus", () => {
  it("proficiente: modificador do atributo + bônus de proficiência", () => {
    const character = createBlankCharacter("t");
    character.level = 5; // proficiência +3
    character.abilities.FOR.score = 16; // +3
    const bonus = getAttackBonus(character, { ability: "FOR", proficient: true });
    expect(bonus).toEqual({ auto: 6, manual: 0, total: 6 });
  });

  it("não proficiente: só o modificador do atributo", () => {
    const character = createBlankCharacter("t");
    character.level = 5;
    character.abilities.DEX.score = 14; // +2
    const bonus = getAttackBonus(character, { ability: "DEX", proficient: false });
    expect(bonus.auto).toBe(2);
  });

  it("aceita ajuste manual (ex.: bônus mágico do item)", () => {
    const character = createBlankCharacter("t");
    character.level = 1;
    character.abilities.FOR.score = 10; // +0
    const bonus = getAttackBonus(character, { ability: "FOR", proficient: true, manualAdjustment: 1 });
    expect(bonus).toEqual({ auto: 2, manual: 1, total: 3 });
  });
});
