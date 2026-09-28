import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getMaxHitDice, getMaxHitPoints, getRemainingHitDice } from "./hp.js";

describe("getMaxHitPoints — PV máximo automático (sem rolagem, criação rápida)", () => {
  it("é 0 sem classe definida (só o ajuste manual conta)", () => {
    const character = createBlankCharacter("hp-test");
    expect(getMaxHitPoints(character)).toEqual({ auto: 0, manual: 0, total: 0 });
  });

  it("nível 1: máximo do Dado de Vida + mod. de CON (Bárbaro d12, CON 14 → +2)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "barbaro";
    character.level = 1;
    character.abilities.CON.score = 14;
    expect(getMaxHitPoints(character).auto).toBe(14); // 12 + 2
  });

  it("nível 1: Mago d6, CON 10 (mod. 0)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "mago";
    character.level = 1;
    character.abilities.CON.score = 10;
    expect(getMaxHitPoints(character).auto).toBe(6);
  });

  it("níveis seguintes somam o valor fixo médio do Dado de Vida + mod. de CON por nível (Guerreiro d10, CON 12 → +1, nível 4)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "guerreiro";
    character.level = 4;
    character.abilities.CON.score = 12;
    // nível 1: 10 + 1 = 11; níveis 2-4: 3 × (6 + 1) = 21; total 32
    expect(getMaxHitPoints(character).auto).toBe(32);
  });

  it("preserva o ajuste manual somado ao automático", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "clerigo";
    character.level = 1;
    character.abilities.CON.score = 14; // mod +2
    character.hp.maxManualAdjustment = 5;
    expect(getMaxHitPoints(character)).toEqual({ auto: 10, manual: 5, total: 15 });
  });

  it.each([
    [6, 4],
    [8, 5],
    [10, 6],
    [12, 7],
  ])("valor fixo médio do Dado de Vida d%i é %i", (hitDie, expected) => {
    const character = createBlankCharacter("hp-test");
    character.classId = hitDie === 6 ? "mago" : hitDie === 8 ? "clerigo" : hitDie === 10 ? "guerreiro" : "barbaro";
    character.level = 2;
    character.abilities.CON.score = 10; // mod 0, isola o valor fixo
    // nível 1 (máximo) + nível 2 (fixo) = hitDie + expected
    expect(getMaxHitPoints(character).auto).toBe(hitDie + expected);
  });
});

describe("getMaxHitDice / getRemainingHitDice — 1 Dado de Vida por nível", () => {
  it("máximo de Dados de Vida é igual ao nível", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 7;
    expect(getMaxHitDice(character)).toBe(7);
  });

  it("restantes = máximo - já gastos", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 5;
    character.hp.hitDiceSpent = 2;
    expect(getRemainingHitDice(character)).toBe(3);
  });

  it("nunca fica negativo mesmo se gastos > máximo", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 3;
    character.hp.hitDiceSpent = 10;
    expect(getRemainingHitDice(character)).toBe(0);
  });
});
