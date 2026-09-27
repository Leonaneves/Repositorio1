import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getInitiative, getPassivePerception } from "./derived.js";

describe("getInitiative", () => {
  it("= modificador de Destreza", () => {
    const character = createBlankCharacter("init-test");
    character.abilities.DEX.score = 16; // +3
    expect(getInitiative(character)).toEqual({ auto: 3, manual: 0, total: 3 });
  });

  it("preserva ajuste manual (ex.: talento Alerta) somado ao automático", () => {
    const character = createBlankCharacter("init-test");
    character.abilities.DEX.score = 14; // +2
    character.initiative.manualAdjustment = 5; // ex.: bônus de proficiência do talento Alerta
    const result = getInitiative(character);
    expect(result).toEqual({ auto: 2, manual: 5, total: 7 });
  });
});

describe("getPassivePerception", () => {
  it("= 10 + bônus de Percepção (reaproveitando getSkillBonus)", () => {
    const character = createBlankCharacter("perc-test");
    character.level = 5; // proficiência +3
    character.abilities.SAB.score = 14; // +2
    character.skills.percepcao.manualOverride = true;
    const result = getPassivePerception(character);
    expect(result.auto).toBe(15); // 10 + (2 + 3)
  });

  it("soma o ajuste manual próprio da Percepção Passiva", () => {
    const character = createBlankCharacter("perc-test");
    character.abilities.SAB.score = 10; // +0
    character.passivePerception.manualAdjustment = 5; // ex.: vantagem de um traço
    const result = getPassivePerception(character);
    expect(result).toEqual({ auto: 10, manual: 5, total: 15 });
  });
});
