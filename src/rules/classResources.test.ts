import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getBardicInspirationDie,
  getChannelDivinityUses,
  getFavoredEnemyCount,
  getFocusPoints,
  getInvocationsKnown,
  getMartialArtsDie,
  getRageCount,
  getRageDamageBonus,
  getSecondWindUses,
  getSneakAttackDice,
  getSorceryPoints,
  getWeaponMasteryCount,
  getWildShapeUses,
} from "./classResources.js";
import type { ClassId } from "../domain/ids.js";

function characterOf(classId: ClassId, level: number) {
  const character = createBlankCharacter("resources-test");
  character.classId = classId;
  character.level = level;
  return character;
}

describe("getters de recurso — null para a classe errada", () => {
  it("todo getter devolve null para uma classe que não tem aquele recurso", () => {
    const mago = characterOf("mago", 10);
    expect(getRageCount(mago)).toBeNull();
    expect(getBardicInspirationDie(mago)).toBeNull();
    expect(getSneakAttackDice(mago)).toBeNull();
    expect(getMartialArtsDie(mago)).toBeNull();
    expect(getFavoredEnemyCount(mago)).toBeNull();
  });
});

describe("Bardo — Dados de Inspiração", () => {
  it.each([
    [1, 6],
    [5, 8],
    [10, 10],
    [15, 12],
    [20, 12],
  ])("nível %i → d%i", (level, die) => {
    expect(getBardicInspirationDie(characterOf("bardo", level))).toBe(die);
  });
});

describe("Bárbaro — Fúrias / Dano da Fúria / Maestrias", () => {
  it("nível 1: 2 fúrias, +2 dano, 2 maestrias", () => {
    const character = characterOf("barbaro", 1);
    expect(getRageCount(character)).toBe(2);
    expect(getRageDamageBonus(character)).toBe(2);
    expect(getWeaponMasteryCount(character)).toBe(2);
  });

  it("nível 20: 6 fúrias, +4 dano, 4 maestrias", () => {
    const character = characterOf("barbaro", 20);
    expect(getRageCount(character)).toBe(6);
    expect(getRageDamageBonus(character)).toBe(4);
    expect(getWeaponMasteryCount(character)).toBe(4);
  });

  it("nível 9: dano da fúria sobe para +3", () => {
    expect(getRageDamageBonus(characterOf("barbaro", 9))).toBe(3);
  });
});

describe("Bruxo — Invocações Místicas", () => {
  it.each([
    [1, 1],
    [2, 3],
    [11, 7],
    [20, 10],
  ])("nível %i → %i invocações", (level, count) => {
    expect(getInvocationsKnown(characterOf("bruxo", level))).toBe(count);
  });
});

describe("Canalizar Divindade — Clérigo (nível 2+) e Paladino (nível 3+)", () => {
  it("Clérigo nível 1 ainda não tem (0)", () => {
    expect(getChannelDivinityUses(characterOf("clerigo", 1))).toBe(0);
  });

  it("Clérigo nível 2: 2 usos; nível 18: 4 usos", () => {
    expect(getChannelDivinityUses(characterOf("clerigo", 2))).toBe(2);
    expect(getChannelDivinityUses(characterOf("clerigo", 18))).toBe(4);
  });

  it("Paladino nível 1–2: ainda não tem (0); nível 3: 2 usos; nível 11: 3 usos", () => {
    expect(getChannelDivinityUses(characterOf("paladino", 1))).toBe(0);
    expect(getChannelDivinityUses(characterOf("paladino", 2))).toBe(0);
    expect(getChannelDivinityUses(characterOf("paladino", 3))).toBe(2);
    expect(getChannelDivinityUses(characterOf("paladino", 11))).toBe(3);
  });

  it("null para uma classe sem Canalizar Divindade", () => {
    expect(getChannelDivinityUses(characterOf("mago", 10))).toBeNull();
  });
});

describe("Druida — Forma Selvagem", () => {
  it("nível 1: 0; nível 2: 2 usos; nível 17: 4 usos", () => {
    expect(getWildShapeUses(characterOf("druida", 1))).toBe(0);
    expect(getWildShapeUses(characterOf("druida", 2))).toBe(2);
    expect(getWildShapeUses(characterOf("druida", 17))).toBe(4);
  });
});

describe("Feiticeiro — Pontos de Feitiçaria", () => {
  it("nível 1: 0; nível 5: 5; nível 20: 20", () => {
    expect(getSorceryPoints(characterOf("feiticeiro", 1))).toBe(0);
    expect(getSorceryPoints(characterOf("feiticeiro", 5))).toBe(5);
    expect(getSorceryPoints(characterOf("feiticeiro", 20))).toBe(20);
  });
});

describe("Guerreiro — Recuperar Fôlego / Maestrias", () => {
  it("nível 1: 2 usos, 3 maestrias; nível 20: 4 usos, 6 maestrias", () => {
    const level1 = characterOf("guerreiro", 1);
    expect(getSecondWindUses(level1)).toBe(2);
    expect(getWeaponMasteryCount(level1)).toBe(3);

    const level20 = characterOf("guerreiro", 20);
    expect(getSecondWindUses(level20)).toBe(4);
    expect(getWeaponMasteryCount(level20)).toBe(6);
  });
});

describe("Ladino — Ataque Furtivo", () => {
  it.each([
    [1, "1d6"],
    [3, "2d6"],
    [11, "6d6"],
    [20, "10d6"],
  ])("nível %i → %s", (level, dice) => {
    expect(getSneakAttackDice(characterOf("ladino", level))).toBe(dice);
  });
});

describe("Monge — Artes Marciais / Pontos de Foco", () => {
  it("nível 1: d6, 0 pontos de foco; nível 5: d8, 5 pontos; nível 17: d12", () => {
    expect(getMartialArtsDie(characterOf("monge", 1))).toBe(6);
    expect(getFocusPoints(characterOf("monge", 1))).toBe(0);
    expect(getMartialArtsDie(characterOf("monge", 5))).toBe(8);
    expect(getFocusPoints(characterOf("monge", 5))).toBe(5);
    expect(getMartialArtsDie(characterOf("monge", 17))).toBe(12);
  });
});

describe("Patrulheiro — Inimigo Favorito", () => {
  it("nível 1: 2; nível 5: 3; nível 17: 6", () => {
    expect(getFavoredEnemyCount(characterOf("patrulheiro", 1))).toBe(2);
    expect(getFavoredEnemyCount(characterOf("patrulheiro", 5))).toBe(3);
    expect(getFavoredEnemyCount(characterOf("patrulheiro", 17))).toBe(6);
  });
});
