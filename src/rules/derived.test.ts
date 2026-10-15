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

  it("Vigilante das Sombras nível 3+ (Emboscador das Sombras): usa SAB em vez de DEX, sem mínimo +1 (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §5)", () => {
    const character = createBlankCharacter("init-test");
    character.classId = "patrulheiro";
    character.subclassId = "Vigilante das Sombras";
    character.level = 3;
    character.abilities.DEX.score = 18; // +4 — nunca usado por esta subclasse
    character.abilities.SAB.score = 8; // -1 — vale mesmo sendo negativo, sem piso em +1
    expect(getInitiative(character)).toEqual({ auto: -1, manual: 0, total: -1 });
  });

  it("antes do nível 3, Vigilante das Sombras ainda usa DEX normalmente", () => {
    const character = createBlankCharacter("init-test");
    character.classId = "patrulheiro";
    character.subclassId = "Vigilante das Sombras";
    character.level = 2;
    character.abilities.DEX.score = 14; // +2
    character.abilities.SAB.score = 18; // +4 — não se aplica ainda
    expect(getInitiative(character).auto).toBe(2);
  });

  it("outra subclasse de Patrulheiro continua usando DEX", () => {
    const character = createBlankCharacter("init-test");
    character.classId = "patrulheiro";
    character.subclassId = "Caçador";
    character.level = 10;
    character.abilities.DEX.score = 14; // +2
    character.abilities.SAB.score = 18; // +4 — não se aplica
    expect(getInitiative(character).auto).toBe(2);
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
