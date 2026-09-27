import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSpeedBonus, getSpeed } from "./speed.js";

describe("getSpeed — deslocamento base por espécie", () => {
  it("espécie-base usa 9m", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "elfo";
    expect(getSpeed(character).auto).toBe(9);
  });

  it("Golias usa 10,5m (35 pés), a exceção confirmada entre as espécies-base", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "golias";
    expect(getSpeed(character).auto).toBe(10.5);
  });

  it("é 0 sem espécie definida", () => {
    const character = createBlankCharacter("speed-test");
    expect(getSpeed(character).auto).toBe(0);
  });

  it("preserva o ajuste manual somado ao automático", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "humano";
    character.speed.manualAdjustment = 3; // ex.: efeito de magia
    expect(getSpeed(character)).toEqual({ auto: 9, manual: 3, total: 12 });
  });
});

describe("getClassSpeedBonus — Movimento sem Armadura do Monge", () => {
  function monkAt(level: number) {
    const character = createBlankCharacter("monk-speed-test");
    character.classId = "monge";
    character.level = level;
    return character;
  }

  it.each([
    [1, 0],
    [2, 3],
    [5, 3],
    [6, 4.5],
    [9, 4.5],
    [10, 6],
    [13, 6],
    [14, 7.5],
    [17, 7.5],
    [18, 9],
    [20, 9],
  ])("nível %i → +%sm", (level, expected) => {
    expect(getClassSpeedBonus(monkAt(level))).toBe(expected);
  });

  it("não se aplica usando armadura", () => {
    const character = monkAt(18);
    character.armor.equipped = "couro";
    expect(getClassSpeedBonus(character)).toBe(0);
  });

  it("não se aplica usando escudo", () => {
    const character = monkAt(18);
    character.armor.shield = true;
    expect(getClassSpeedBonus(character)).toBe(0);
  });

  it("não se aplica a outras classes", () => {
    const character = createBlankCharacter("other-class-speed-test");
    character.classId = "guerreiro";
    character.level = 20;
    expect(getClassSpeedBonus(character)).toBe(0);
  });

  it("getSpeed soma espécie + bônus de classe + ajuste manual", () => {
    const character = monkAt(18);
    character.speciesId = "golias"; // 10,5m
    character.speed.manualAdjustment = 1;
    // 10,5 (espécie) + 9 (Monge nível 18) + 1 (manual) = 20,5
    expect(getSpeed(character)).toEqual({ auto: 19.5, manual: 1, total: 20.5 });
  });
});

describe("getClassSpeedBonus — Movimento Rápido do Bárbaro", () => {
  function barbarianAt(level: number) {
    const character = createBlankCharacter("barbarian-speed-test");
    character.classId = "barbaro";
    character.level = level;
    return character;
  }

  it("nada antes do nível 5", () => {
    expect(getClassSpeedBonus(barbarianAt(4))).toBe(0);
  });

  it("+3m a partir do nível 5, sem armadura", () => {
    expect(getClassSpeedBonus(barbarianAt(5))).toBe(3);
    expect(getClassSpeedBonus(barbarianAt(20))).toBe(3);
  });

  it("não se aplica usando armadura", () => {
    const character = barbarianAt(10);
    character.armor.equipped = "couro";
    expect(getClassSpeedBonus(character)).toBe(0);
  });

  it("continua se aplicando com escudo (escudo não é armadura)", () => {
    const character = barbarianAt(10);
    character.armor.shield = true;
    expect(getClassSpeedBonus(character)).toBe(3);
  });

  it("getSpeed soma espécie + bônus de Bárbaro", () => {
    const character = barbarianAt(5);
    character.speciesId = "humano"; // 9m
    expect(getSpeed(character).auto).toBe(12);
  });
});
