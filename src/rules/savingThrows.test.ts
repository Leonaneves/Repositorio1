import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSavingThrow } from "./savingThrows.js";

describe("getSavingThrow", () => {
  it("sem proficiência, é apenas o modificador do atributo", () => {
    const character = createBlankCharacter("save-test");
    character.abilities.CON.score = 16; // +3
    const save = getSavingThrow(character, "CON");
    expect(save).toEqual({ auto: 3, manual: 0, total: 3 });
  });

  it("com proficiência, soma o bônus de proficiência do nível", () => {
    const character = createBlankCharacter("save-test");
    character.level = 9; // proficiência +4
    character.abilities.FOR.score = 14; // +2
    character.savingThrows.FOR.proficient = true;
    const save = getSavingThrow(character, "FOR");
    expect(save.auto).toBe(6); // 2 + 4
  });

  it("preserva o ajuste manual separado do valor automático", () => {
    const character = createBlankCharacter("save-test");
    character.abilities.SAB.score = 10; // +0
    character.savingThrows.SAB.manualAdjustment = -2;
    const save = getSavingThrow(character, "SAB");
    expect(save).toEqual({ auto: 0, manual: -2, total: -2 });
  });
});
