import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getBardicInspirationDie,
  getCantripsKnown,
  getChannelDivinityUses,
  getExtraAttacksCount,
  getFavoredEnemyCount,
  getFocusPoints,
  getInfusedItemsMax,
  getInfusionsKnown,
  getInvocationsKnown,
  getMartialArtsDie,
  getRageCount,
  getRageDamageBonus,
  getSecondWindUses,
  getSneakAttackDice,
  getSorceryPoints,
  getSpellsPreparedMax,
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

describe("getExtraAttacksCount — níveis confirmados diretamente pelas tabelas de características", () => {
  it("Guerreiro: 0 antes do 5, 1 no 5–10, 2 no 11–19, 3 no 20", () => {
    expect(getExtraAttacksCount(characterOf("guerreiro", 4))).toBe(0);
    expect(getExtraAttacksCount(characterOf("guerreiro", 5))).toBe(1);
    expect(getExtraAttacksCount(characterOf("guerreiro", 10))).toBe(1);
    expect(getExtraAttacksCount(characterOf("guerreiro", 11))).toBe(2);
    expect(getExtraAttacksCount(characterOf("guerreiro", 19))).toBe(2);
    expect(getExtraAttacksCount(characterOf("guerreiro", 20))).toBe(3);
  });

  it.each(["barbaro", "monge", "paladino", "patrulheiro"] as const)("%s: 0 antes do nível 5, 1 a partir do nível 5 (nunca mais que isso)", (classId) => {
    expect(getExtraAttacksCount(characterOf(classId, 4))).toBe(0);
    expect(getExtraAttacksCount(characterOf(classId, 5))).toBe(1);
    expect(getExtraAttacksCount(characterOf(classId, 20))).toBe(1);
  });

  it.each(["bardo", "bruxo", "clerigo", "druida", "feiticeiro", "ladino", "mago"] as const)(
    "%s nunca tem Ataque Extra (não aparece nas tabelas dessa classe)",
    (classId) => {
      expect(getExtraAttacksCount(characterOf(classId, 20))).toBe(0);
    },
  );

  it("sem classe definida, 0", () => {
    const character = createBlankCharacter("resources-test");
    expect(getExtraAttacksCount(character)).toBe(0);
  });
});

describe("getCantripsKnown — Truques por nível", () => {
  it("Bardo nível 1: 2 truques; nível 10: 4 truques", () => {
    expect(getCantripsKnown(characterOf("bardo", 1))).toBe(2);
    expect(getCantripsKnown(characterOf("bardo", 10))).toBe(4);
  });

  it("Feiticeiro nível 1: 4 truques (mais que as outras classes conjuradoras)", () => {
    expect(getCantripsKnown(characterOf("feiticeiro", 1))).toBe(4);
  });

  it("Paladino e Patrulheiro não têm coluna de Truques — devolve null, nunca 0", () => {
    expect(getCantripsKnown(characterOf("paladino", 5))).toBeNull();
    expect(getCantripsKnown(characterOf("patrulheiro", 5))).toBeNull();
  });

  it("classe não conjuradora (Bárbaro) — null", () => {
    expect(getCantripsKnown(characterOf("barbaro", 5))).toBeNull();
  });
});

describe("getSpellsPreparedMax — Magias Preparadas por nível", () => {
  it("Mago nível 1: 4; nível 20: 25 (a maior entre as classes conjuradoras)", () => {
    expect(getSpellsPreparedMax(characterOf("mago", 1))).toBe(4);
    expect(getSpellsPreparedMax(characterOf("mago", 20))).toBe(25);
  });

  it("Paladino nível 1: 2; nível 20: 15", () => {
    expect(getSpellsPreparedMax(characterOf("paladino", 1))).toBe(2);
    expect(getSpellsPreparedMax(characterOf("paladino", 20))).toBe(15);
  });

  it("Bruxo tem sua própria coluna de Magias Preparadas, distinta da Magia de Pacto", () => {
    expect(getSpellsPreparedMax(characterOf("bruxo", 1))).toBe(2);
  });

  it("classe não conjuradora (Guerreiro sem subclasse conjuradora) — null", () => {
    expect(getSpellsPreparedMax(characterOf("guerreiro", 5))).toBeNull();
  });

  it("Artífice não tem coluna de Magias Preparadas na fonte própria — null, nunca inventado", () => {
    expect(getSpellsPreparedMax(characterOf("artifice", 10))).toBeNull();
  });
});

describe("getCantripsKnown — Artífice (fonte própria)", () => {
  it("níveis 1-9: 2; níveis 10-13: 3; níveis 14-20: 4", () => {
    expect(getCantripsKnown(characterOf("artifice", 1))).toBe(2);
    expect(getCantripsKnown(characterOf("artifice", 9))).toBe(2);
    expect(getCantripsKnown(characterOf("artifice", 10))).toBe(3);
    expect(getCantripsKnown(characterOf("artifice", 13))).toBe(3);
    expect(getCantripsKnown(characterOf("artifice", 14))).toBe(4);
    expect(getCantripsKnown(characterOf("artifice", 20))).toBe(4);
  });
});

describe("getInfusionsKnown — Infusões Conhecidas do Artífice, por nível", () => {
  it("nível 1: 0 (indisponível na fonte, nunca null — é a classe certa)", () => {
    expect(getInfusionsKnown(characterOf("artifice", 1))).toBe(0);
  });

  it("níveis 2-5: 4; níveis 6-9: 6; níveis 10-13: 8; níveis 14-17: 10; níveis 18-20: 12", () => {
    expect(getInfusionsKnown(characterOf("artifice", 2))).toBe(4);
    expect(getInfusionsKnown(characterOf("artifice", 5))).toBe(4);
    expect(getInfusionsKnown(characterOf("artifice", 6))).toBe(6);
    expect(getInfusionsKnown(characterOf("artifice", 9))).toBe(6);
    expect(getInfusionsKnown(characterOf("artifice", 10))).toBe(8);
    expect(getInfusionsKnown(characterOf("artifice", 13))).toBe(8);
    expect(getInfusionsKnown(characterOf("artifice", 14))).toBe(10);
    expect(getInfusionsKnown(characterOf("artifice", 17))).toBe(10);
    expect(getInfusionsKnown(characterOf("artifice", 18))).toBe(12);
    expect(getInfusionsKnown(characterOf("artifice", 20))).toBe(12);
  });

  it("classe diferente de Artífice — null", () => {
    expect(getInfusionsKnown(characterOf("mago", 10))).toBeNull();
  });
});

describe("getInfusedItemsMax — Itens Infundidos do Artífice, por nível", () => {
  it("nível 1: 0 (indisponível na fonte); níveis 2-5: 2; níveis 6-9: 3; níveis 10-13: 4; níveis 14-17: 5; níveis 18-20: 6", () => {
    expect(getInfusedItemsMax(characterOf("artifice", 1))).toBe(0);
    expect(getInfusedItemsMax(characterOf("artifice", 2))).toBe(2);
    expect(getInfusedItemsMax(characterOf("artifice", 6))).toBe(3);
    expect(getInfusedItemsMax(characterOf("artifice", 10))).toBe(4);
    expect(getInfusedItemsMax(characterOf("artifice", 14))).toBe(5);
    expect(getInfusedItemsMax(characterOf("artifice", 18))).toBe(6);
  });

  it("classe diferente de Artífice — null", () => {
    expect(getInfusedItemsMax(characterOf("mago", 10))).toBeNull();
  });
});
