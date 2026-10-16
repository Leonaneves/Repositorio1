import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getAbjurerArcaneWardMaxHp,
  getActionSurgeUsesCount,
  getArcaneRecoveryLimit,
  getBardicInspirationDie,
  getBardicInspirationUses,
  getBattleMasterManeuversKnownCount,
  getBodyResilienceHealingText,
  getCantripsKnown,
  getChannelDivinityUses,
  getDeflectAttacksReductionText,
  getDeflectAttacksRedirectDamageText,
  getDivinationProdigyDiceCount,
  getElementalBurstDamageText,
  getEvocationPotentIntBonus,
  getExtraAttacksCount,
  getFavoredEnemyCount,
  getFighterIndomitableRerollUsesCount,
  getFocusPoints,
  getHandOfUltimateMercyHealingText,
  getImprovedPatientDefenseTempHpText,
  getInfusedItemsMax,
  getInfusionsKnown,
  getIntegridadeCorporalUsesCount,
  getInvocationsKnown,
  getMercyHandDiceText,
  getMonkFocusCd,
  getPactMagicSlotCount,
  getMartialArtsDie,
  getPsiWarriorDie,
  getPsiWarriorDiceCount,
  getCunningStrikeMaxEffects,
  getRageCount,
  getRageDamageBonus,
  getRogueCunningStrikeCd,
  getSecondWindHealingText,
  getSecondWindUses,
  getSlowFallReduction,
  getSneakAttackDice,
  getSoulknifePsionicDiceCount,
  getSoulknifePsionicDie,
  getSorceryPoints,
  getSpellsPreparedMax,
  getSuperiorityDie,
  getSuperiorityDiceCount,
  getTorrenteDeCuraEDoloUsesCount,
  getUnusualMetabolismHealingText,
  getWeaponMasteryCount,
  getWildShapeUses,
  getWizardSpellbookClassGrantCount,
  getWizardVersadoGrantCount,
} from "./classResources.js";
import type { ClassId } from "../domain/ids.js";

function characterOf(classId: ClassId, level: number) {
  const character = createBlankCharacter("resources-test");
  character.classId = classId;
  character.level = level;
  return character;
}

function fighterSubclassOf(subclassId: string, level: number) {
  const character = characterOf("guerreiro", level);
  character.subclassId = subclassId;
  return character;
}

function wizardSubclassOf(subclassId: string, level: number) {
  const character = characterOf("mago", level);
  character.subclassId = subclassId;
  return character;
}

function rogueSubclassOf(subclassId: string, level: number) {
  const character = characterOf("ladino", level);
  character.subclassId = subclassId;
  return character;
}

function monkSubclassOf(subclassId: string, level: number) {
  const character = characterOf("monge", level);
  character.subclassId = subclassId;
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

  it("null para quem não é Bardo", () => {
    expect(getBardicInspirationDie(characterOf("mago", 10))).toBeNull();
  });
});

describe("Bardo — Usos de Inspiração (modificador de CAR, mínimo 1)", () => {
  it("CAR +3 → 3 usos", () => {
    const character = characterOf("bardo", 5);
    character.abilities.CAR.score = 16; // +3
    expect(getBardicInspirationUses(character)).toBe(3);
  });

  it("CAR +0 ou negativo → mínimo 1 uso, nunca 0", () => {
    const zero = characterOf("bardo", 5);
    zero.abilities.CAR.score = 10; // +0
    expect(getBardicInspirationUses(zero)).toBe(1);

    const negative = characterOf("bardo", 5);
    negative.abilities.CAR.score = 8; // -1
    expect(getBardicInspirationUses(negative)).toBe(1);
  });

  it("null para quem não é Bardo", () => {
    expect(getBardicInspirationUses(characterOf("mago", 10))).toBeNull();
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

describe("Bruxo — Invocações Místicas (tabela completa 1-20 da fonte)", () => {
  it.each([
    [1, 1],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 5],
    [6, 5],
    [7, 6],
    [8, 6],
    [9, 7],
    [10, 7],
    [11, 7],
    [12, 8],
    [13, 8],
    [14, 8],
    [15, 9],
    [16, 9],
    [17, 9],
    [18, 10],
    [19, 10],
    [20, 10],
  ])("nível %i → %i invocações", (level, count) => {
    expect(getInvocationsKnown(characterOf("bruxo", level))).toBe(count);
  });

  it("null para quem não é Bruxo", () => {
    expect(getInvocationsKnown(characterOf("mago", 10))).toBeNull();
  });
});

describe("Bruxo — Magia de Pacto NÃO usa progressão comum de espaços (getPactMagicSlotCount)", () => {
  it("nível 1: 1 espaço; nível 5: 2 espaços; nível 17: 4 espaços", () => {
    expect(getPactMagicSlotCount(characterOf("bruxo", 1))).toBe(1);
    expect(getPactMagicSlotCount(characterOf("bruxo", 5))).toBe(2);
    expect(getPactMagicSlotCount(characterOf("bruxo", 17))).toBe(4);
  });

  it("null para quem não é Bruxo", () => {
    expect(getPactMagicSlotCount(characterOf("mago", 10))).toBeNull();
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

  it("getSecondWindHealingText: 1d10 + nível de Guerreiro, nunca BP nem nível total (fonte \"COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF\" §9)", () => {
    expect(getSecondWindHealingText(characterOf("guerreiro", 1))).toBe("1d10+1");
    expect(getSecondWindHealingText(characterOf("guerreiro", 5))).toBe("1d10+5");
    expect(getSecondWindHealingText(characterOf("guerreiro", 12))).toBe("1d10+12");
    expect(getSecondWindHealingText(characterOf("mago", 12))).toBeNull();
  });
});

describe("Guerreiro — Surto de Ação (usos)", () => {
  it("null antes do nível 2; 1 uso dos níveis 2–16; 2 usos dos níveis 17–20", () => {
    expect(getActionSurgeUsesCount(characterOf("guerreiro", 1))).toBeNull();
    expect(getActionSurgeUsesCount(characterOf("guerreiro", 2))).toBe(1);
    expect(getActionSurgeUsesCount(characterOf("guerreiro", 16))).toBe(1);
    expect(getActionSurgeUsesCount(characterOf("guerreiro", 17))).toBe(2);
    expect(getActionSurgeUsesCount(characterOf("guerreiro", 20))).toBe(2);
    expect(getActionSurgeUsesCount(characterOf("mago", 20))).toBeNull();
  });
});

describe("Guerreiro — Indomável (refazer Salvaguarda, DIFERENTE do Incansável do Patrulheiro)", () => {
  it("null antes do nível 9; 1 uso dos níveis 9–12; 2 dos 13–16; 3 dos 17–20", () => {
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 8))).toBeNull();
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 9))).toBe(1);
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 12))).toBe(1);
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 13))).toBe(2);
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 16))).toBe(2);
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 17))).toBe(3);
    expect(getFighterIndomitableRerollUsesCount(characterOf("guerreiro", 20))).toBe(3);
    expect(getFighterIndomitableRerollUsesCount(characterOf("patrulheiro", 20))).toBeNull();
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

describe("Ladino — getRogueCunningStrikeCd (8 + BP + mod DEX, independente da CD de magia)", () => {
  it("abaixo do nível 5 — null (Golpe Astuto ainda não concedido)", () => {
    expect(getRogueCunningStrikeCd(characterOf("ladino", 4))).toBeNull();
  });

  it("nível 5 (BP 3) com DEX 16 (+3) → CD 14; nível 17 (BP 6) → CD 17", () => {
    const level5 = characterOf("ladino", 5);
    level5.abilities.DEX.score = 16;
    expect(getRogueCunningStrikeCd(level5)).toBe(14);

    const level17 = characterOf("ladino", 17);
    level17.abilities.DEX.score = 16;
    expect(getRogueCunningStrikeCd(level17)).toBe(17);
  });

  it("outra classe — null", () => {
    expect(getRogueCunningStrikeCd(characterOf("guerreiro", 20))).toBeNull();
  });
});

describe("Ladino — getCunningStrikeMaxEffects (1 efeito nos níveis 5-10, 2 a partir do 11)", () => {
  it.each([
    [4, null],
    [5, 1],
    [10, 1],
    [11, 2],
    [20, 2],
  ])("nível %i → %s", (level, expected) => {
    expect(getCunningStrikeMaxEffects(characterOf("ladino", level))).toBe(expected);
  });
});

describe("Ladino/Lâmina Psíquica (Adaga Espiritual) — getSoulknifePsionicDie/DiceCount", () => {
  it.each([
    [3, 6, 4],
    [5, 8, 6],
    [9, 8, 8],
    [11, 10, 8],
    [13, 10, 10],
    [17, 12, 12],
  ])("nível %i: d%i, %i dados", (level, die, count) => {
    const character = rogueSubclassOf("Lâmina Psíquica", level);
    expect(getSoulknifePsionicDie(character)).toBe(die);
    expect(getSoulknifePsionicDiceCount(character)).toBe(count);
  });

  it("abaixo do nível 3 (teoricamente nunca ocorre, subclasse só a partir do 3) — null", () => {
    expect(getSoulknifePsionicDie(rogueSubclassOf("Lâmina Psíquica", 1))).toBeNull();
  });

  it("outra subclasse de Ladino — null (nunca confundido com o Guerreiro Psiônico)", () => {
    expect(getSoulknifePsionicDie(rogueSubclassOf("Assassino", 10))).toBeNull();
    expect(getSoulknifePsionicDie(characterOf("guerreiro", 10))).toBeNull();
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

  it("Ladino sem Trapaceiro Arcano — null; com Trapaceiro Arcano: 2 truques escolhidos + Mãos Mágicas = 3 total (nível 3-9), 3 escolhidos + Mãos Mágicas = 4 total (10-20) — Mãos Mágicas SEMPRE soma ao total de truques conhecidos", () => {
    expect(getCantripsKnown(characterOf("ladino", 10))).toBeNull();
    expect(getCantripsKnown(rogueSubclassOf("Trapaceiro Arcano", 3))).toBe(3);
    expect(getCantripsKnown(rogueSubclassOf("Trapaceiro Arcano", 9))).toBe(3);
    expect(getCantripsKnown(rogueSubclassOf("Trapaceiro Arcano", 10))).toBe(4);
    expect(getCantripsKnown(rogueSubclassOf("Trapaceiro Arcano", 20))).toBe(4);
  });

  it("outra subclasse de Ladino — null (Assassino/Ladrão/Adaga Espiritual não conjuram)", () => {
    expect(getCantripsKnown(rogueSubclassOf("Assassino", 10))).toBeNull();
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

  it("Ladino/Trapaceiro Arcano: nível 3 → 3; nível 13 → 9; nível 20 → 13 (mesma progressão numérica do Cavaleiro Místico, fonte própria)", () => {
    expect(getSpellsPreparedMax(rogueSubclassOf("Trapaceiro Arcano", 3))).toBe(3);
    expect(getSpellsPreparedMax(rogueSubclassOf("Trapaceiro Arcano", 13))).toBe(9);
    expect(getSpellsPreparedMax(rogueSubclassOf("Trapaceiro Arcano", 20))).toBe(13);
  });

  it("Ladino sem Trapaceiro Arcano — null", () => {
    expect(getSpellsPreparedMax(characterOf("ladino", 10))).toBeNull();
    expect(getSpellsPreparedMax(rogueSubclassOf("Ladrão", 10))).toBeNull();
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

describe("Guerreiro/Cavaleiro Místico — Truques e Magias Preparadas (fonte própria, não classId-keyed)", () => {
  it("getCantripsKnown: 2 nos níveis 3-9, 3 a partir do 10", () => {
    expect(getCantripsKnown(fighterSubclassOf("Cavaleiro Místico", 3))).toBe(2);
    expect(getCantripsKnown(fighterSubclassOf("Cavaleiro Místico", 9))).toBe(2);
    expect(getCantripsKnown(fighterSubclassOf("Cavaleiro Místico", 10))).toBe(3);
    expect(getCantripsKnown(fighterSubclassOf("Cavaleiro Místico", 20))).toBe(3);
  });

  it("getSpellsPreparedMax: 3 no nível 3, 13 no nível 20", () => {
    expect(getSpellsPreparedMax(fighterSubclassOf("Cavaleiro Místico", 3))).toBe(3);
    expect(getSpellsPreparedMax(fighterSubclassOf("Cavaleiro Místico", 7))).toBe(5);
    expect(getSpellsPreparedMax(fighterSubclassOf("Cavaleiro Místico", 20))).toBe(13);
  });

  it("outra subclasse de Guerreiro — null (nunca confundido com a tabela de outra classe)", () => {
    expect(getCantripsKnown(fighterSubclassOf("Campeão", 10))).toBeNull();
    expect(getSpellsPreparedMax(fighterSubclassOf("Campeão", 10))).toBeNull();
  });
});

describe("Guerreiro/Guerreiro Psiônico — Dados de Energia Psiônica", () => {
  it("d6 x4 no nível 3; d8 x6 no 5; d8 x8 no 9; d10 x8 no 11; d10 x10 no 13; d12 x12 no 17", () => {
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 3))).toBe(6);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 3))).toBe(4);
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 5))).toBe(8);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 5))).toBe(6);
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 9))).toBe(8);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 9))).toBe(8);
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 11))).toBe(10);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 11))).toBe(8);
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 13))).toBe(10);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 13))).toBe(10);
    expect(getPsiWarriorDie(fighterSubclassOf("Guerreiro Psiônico", 17))).toBe(12);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 17))).toBe(12);
    expect(getPsiWarriorDiceCount(fighterSubclassOf("Guerreiro Psiônico", 20))).toBe(12);
  });

  it("outra classe/subclasse — null", () => {
    expect(getPsiWarriorDie(characterOf("mago", 10))).toBeNull();
    expect(getPsiWarriorDie(fighterSubclassOf("Campeão", 10))).toBeNull();
  });
});

describe("Guerreiro/Mestre da Batalha — Manobras Conhecidas e Dado de Superioridade (DS)", () => {
  it("3-6: 3 manobras, 4 DS d8; 7-9: 5 manobras, 5 DS d8; 10-14: 7 manobras, 5 DS d10; 15-17: 9 manobras, 6 DS d10; 18-20: 9 manobras, 6 DS d12", () => {
    expect(getBattleMasterManeuversKnownCount(fighterSubclassOf("Mestre da Batalha", 3))).toBe(3);
    expect(getSuperiorityDie(fighterSubclassOf("Mestre da Batalha", 3))).toBe(8);
    expect(getSuperiorityDiceCount(fighterSubclassOf("Mestre da Batalha", 3))).toBe(4);

    expect(getBattleMasterManeuversKnownCount(fighterSubclassOf("Mestre da Batalha", 7))).toBe(5);
    expect(getSuperiorityDiceCount(fighterSubclassOf("Mestre da Batalha", 7))).toBe(5);

    expect(getBattleMasterManeuversKnownCount(fighterSubclassOf("Mestre da Batalha", 10))).toBe(7);
    expect(getSuperiorityDie(fighterSubclassOf("Mestre da Batalha", 10))).toBe(10);

    expect(getBattleMasterManeuversKnownCount(fighterSubclassOf("Mestre da Batalha", 15))).toBe(9);
    expect(getSuperiorityDiceCount(fighterSubclassOf("Mestre da Batalha", 15))).toBe(6);

    expect(getBattleMasterManeuversKnownCount(fighterSubclassOf("Mestre da Batalha", 18))).toBe(9);
    expect(getSuperiorityDie(fighterSubclassOf("Mestre da Batalha", 18))).toBe(12);
    expect(getSuperiorityDiceCount(fighterSubclassOf("Mestre da Batalha", 18))).toBe(6);
  });

  it("outra classe/subclasse — null", () => {
    expect(getBattleMasterManeuversKnownCount(characterOf("ladino", 10))).toBeNull();
    expect(getSuperiorityDie(fighterSubclassOf("Cavaleiro Místico", 10))).toBeNull();
  });
});

describe("Mago — getArcaneRecoveryLimit (fonte \"IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §5)", () => {
  it("nível 1 = 1; nível 5 = 3; nível 20 = 10 (exemplos da própria fonte)", () => {
    expect(getArcaneRecoveryLimit(characterOf("mago", 1))).toBe(1);
    expect(getArcaneRecoveryLimit(characterOf("mago", 5))).toBe(3);
    expect(getArcaneRecoveryLimit(characterOf("mago", 20))).toBe(10);
  });

  it("outra classe — null", () => {
    expect(getArcaneRecoveryLimit(characterOf("ladino", 10))).toBeNull();
  });
});

describe("Mago — getWizardSpellbookClassGrantCount (6 + 2*(nível-1))", () => {
  it("nível 1 = 6; nível 2 = 8; nível 20 = 44", () => {
    expect(getWizardSpellbookClassGrantCount(characterOf("mago", 1))).toBe(6);
    expect(getWizardSpellbookClassGrantCount(characterOf("mago", 2))).toBe(8);
    expect(getWizardSpellbookClassGrantCount(characterOf("mago", 20))).toBe(44);
  });

  it("outra classe — null", () => {
    expect(getWizardSpellbookClassGrantCount(characterOf("ladino", 10))).toBeNull();
  });
});

describe("Mago — getWizardVersadoGrantCount (2 no nível 3, +1 em 5/7/9/11/13/15/17)", () => {
  it("sem subclasse de escola ou abaixo do nível 3 — null", () => {
    expect(getWizardVersadoGrantCount(characterOf("mago", 2))).toBeNull();
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Trapaceiro Arcano", 10))).toBeNull(); // subclasse de outra classe, nunca confundida
  });

  it("nível 3: 2; nível 4 (ainda sem novo círculo): 2; nível 5: 3; nível 17+: 9 (teto)", () => {
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Abjurador", 3))).toBe(2);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Abjurador", 4))).toBe(2);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Abjurador", 5))).toBe(3);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Abjurador", 17))).toBe(9);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Abjurador", 20))).toBe(9);
  });

  it("funciona para as 4 subclasses de escola (Abjurador/Adivinho/Evocador/Ilusionista)", () => {
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Adivinho", 3))).toBe(2);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Evocador", 3))).toBe(2);
    expect(getWizardVersadoGrantCount(wizardSubclassOf("Ilusionista", 3))).toBe(2);
  });
});

describe("Mago/Abjurador — getAbjurerArcaneWardMaxHp (2x nível + mod INT)", () => {
  it("calcula com o mod INT efetivo; outra subclasse ou nível <3 — null", () => {
    const character = wizardSubclassOf("Abjurador", 5);
    character.abilities.INT.score = 16; // +3
    expect(getAbjurerArcaneWardMaxHp(character)).toBe(13); // 2*5 + 3

    expect(getAbjurerArcaneWardMaxHp(wizardSubclassOf("Evocador", 5))).toBeNull();
    expect(getAbjurerArcaneWardMaxHp(wizardSubclassOf("Abjurador", 2))).toBeNull();
  });
});

describe("Mago/Evocador — getEvocationPotentIntBonus (mod INT, pode ser negativo, nunca mínimo +1)", () => {
  it("nível 10+: devolve o mod INT efetivo, mesmo negativo", () => {
    const character = wizardSubclassOf("Evocador", 10);
    character.abilities.INT.score = 8; // -1
    expect(getEvocationPotentIntBonus(character)).toBe(-1);
  });

  it("outra subclasse ou nível <10 — null", () => {
    expect(getEvocationPotentIntBonus(wizardSubclassOf("Abjurador", 10))).toBeNull();
    expect(getEvocationPotentIntBonus(wizardSubclassOf("Evocador", 9))).toBeNull();
  });
});

describe("Mago/Adivinho — getDivinationProdigyDiceCount (2 dos níveis 3-13, 3 do 14+)", () => {
  it("progressão por nível, outra subclasse — null", () => {
    expect(getDivinationProdigyDiceCount(wizardSubclassOf("Adivinho", 3))).toBe(2);
    expect(getDivinationProdigyDiceCount(wizardSubclassOf("Adivinho", 13))).toBe(2);
    expect(getDivinationProdigyDiceCount(wizardSubclassOf("Adivinho", 14))).toBe(3);
    expect(getDivinationProdigyDiceCount(wizardSubclassOf("Adivinho", 20))).toBe(3);
    expect(getDivinationProdigyDiceCount(wizardSubclassOf("Evocador", 14))).toBeNull();
  });
});

describe("Monge — getMonkFocusCd (8 + mod SAB + BP, a partir do nível 2)", () => {
  it("nível 1 — null (Foco ainda não existe)", () => {
    expect(getMonkFocusCd(characterOf("monge", 1))).toBeNull();
  });

  it("nível 2, mod SAB +3, BP +2: CD 13", () => {
    const character = characterOf("monge", 2);
    character.abilities.SAB.score = 16; // +3
    expect(getMonkFocusCd(character)).toBe(13);
  });

  it("nível 5, mod SAB +3, BP +3: CD 14", () => {
    const character = characterOf("monge", 5);
    character.abilities.SAB.score = 16; // +3
    expect(getMonkFocusCd(character)).toBe(14);
  });

  it("null para quem não é Monge", () => {
    expect(getMonkFocusCd(characterOf("mago", 10))).toBeNull();
  });
});

describe("Monge — getUnusualMetabolismHealingText (dado de Artes Marciais + nível, a partir do nível 2)", () => {
  it("nível 2: 1d6+2", () => {
    expect(getUnusualMetabolismHealingText(characterOf("monge", 2))).toBe("1d6+2");
  });

  it("nível 5 (dado sobe para d8): 1d8+5", () => {
    expect(getUnusualMetabolismHealingText(characterOf("monge", 5))).toBe("1d8+5");
  });

  it("nível 1 — null", () => {
    expect(getUnusualMetabolismHealingText(characterOf("monge", 1))).toBeNull();
  });
});

describe("Monge — getDeflectAttacksReductionText/getDeflectAttacksRedirectDamageText (nível 3+)", () => {
  it("nível 3, mod DEX +2: redução 1d10+5, redirecionamento 2d6+2", () => {
    const character = characterOf("monge", 3);
    character.abilities.DEX.score = 14; // +2
    expect(getDeflectAttacksReductionText(character)).toBe("1d10+5");
    expect(getDeflectAttacksRedirectDamageText(character)).toBe("2d6+2");
  });

  it("nível 13 (dado de Artes Marciais em d10): redução 1d10+15, redirecionamento 2d10+2", () => {
    const character = characterOf("monge", 13);
    character.abilities.DEX.score = 14; // +2
    expect(getDeflectAttacksReductionText(character)).toBe("1d10+15");
    expect(getDeflectAttacksRedirectDamageText(character)).toBe("2d10+2");
  });

  it("nível 2 — null (ainda sem Defletir Ataques)", () => {
    expect(getDeflectAttacksReductionText(characterOf("monge", 2))).toBeNull();
    expect(getDeflectAttacksRedirectDamageText(characterOf("monge", 2))).toBeNull();
  });
});

describe("Monge — getSlowFallReduction (5 × nível, a partir do nível 4)", () => {
  it("nível 4: 20; nível 10: 50", () => {
    expect(getSlowFallReduction(characterOf("monge", 4))).toBe(20);
    expect(getSlowFallReduction(characterOf("monge", 10))).toBe(50);
  });

  it("nível 3 — null", () => {
    expect(getSlowFallReduction(characterOf("monge", 3))).toBeNull();
  });
});

describe("Monge — getImprovedPatientDefenseTempHpText (2 dados de Artes Marciais, a partir do nível 10)", () => {
  it("nível 10: 2d8; nível 17 (dado em d12): 2d12", () => {
    expect(getImprovedPatientDefenseTempHpText(characterOf("monge", 10))).toBe("2d8");
    expect(getImprovedPatientDefenseTempHpText(characterOf("monge", 17))).toBe("2d12");
  });

  it("nível 9 — null", () => {
    expect(getImprovedPatientDefenseTempHpText(characterOf("monge", 9))).toBeNull();
  });
});

describe("Monge/Caminho dos Elementos — getElementalBurstDamageText (3 dados de Artes Marciais, nível 6+, sem somar SAB)", () => {
  it("nível 6: 3d8", () => {
    expect(getElementalBurstDamageText(monkSubclassOf("Guerreiro dos Elementos", 6))).toBe("3d8");
  });

  it("outra subclasse ou nível <6 — null", () => {
    expect(getElementalBurstDamageText(monkSubclassOf("Guerreiro da Mão Aberta", 6))).toBeNull();
    expect(getElementalBurstDamageText(monkSubclassOf("Guerreiro dos Elementos", 5))).toBeNull();
  });
});

describe("Monge/Caminho da Mão Aberta — getIntegridadeCorporalUsesCount e getBodyResilienceHealingText (nível 6+)", () => {
  it("mod SAB +3: 3 usos, cura 1d8+3", () => {
    const character = monkSubclassOf("Guerreiro da Mão Aberta", 6);
    character.abilities.SAB.score = 16; // +3
    expect(getIntegridadeCorporalUsesCount(character)).toBe(3);
    expect(getBodyResilienceHealingText(character)).toBe("1d8+3");
  });

  it("mod SAB +0 ou negativo: mínimo 1 uso, nunca 0", () => {
    const character = monkSubclassOf("Guerreiro da Mão Aberta", 6);
    character.abilities.SAB.score = 8; // -1
    expect(getIntegridadeCorporalUsesCount(character)).toBe(1);
  });

  it("outra subclasse ou nível <6 — null", () => {
    expect(getIntegridadeCorporalUsesCount(monkSubclassOf("Guerreiro da Misericórdia", 6))).toBeNull();
    expect(getBodyResilienceHealingText(monkSubclassOf("Guerreiro da Mão Aberta", 5))).toBeNull();
  });
});

describe("Monge/Caminho da Misericórdia — getMercyHandDiceText (dado de Artes Marciais + mod SAB, nível 3+, mesma fórmula para Mão de Cura/Mão de Dolo)", () => {
  it("nível 3, mod SAB +3: 1d6+3", () => {
    const character = monkSubclassOf("Guerreiro da Misericórdia", 3);
    character.abilities.SAB.score = 16; // +3
    expect(getMercyHandDiceText(character)).toBe("1d6+3");
  });

  it("nível 17 (dado em d12): 1d12+3", () => {
    const character = monkSubclassOf("Guerreiro da Misericórdia", 17);
    character.abilities.SAB.score = 16; // +3
    expect(getMercyHandDiceText(character)).toBe("1d12+3");
  });

  it("outra subclasse ou nível <3 — null", () => {
    expect(getMercyHandDiceText(monkSubclassOf("Guerreiro das Sombras", 3))).toBeNull();
  });
});

describe("Monge/Caminho da Misericórdia — getTorrenteDeCuraEDoloUsesCount (máximo(1, mod SAB), nível 11+, reserva PRÓPRIA)", () => {
  it("mod SAB +3: 3 usos", () => {
    const character = monkSubclassOf("Guerreiro da Misericórdia", 11);
    character.abilities.SAB.score = 16; // +3
    expect(getTorrenteDeCuraEDoloUsesCount(character)).toBe(3);
  });

  it("nível <11 — null", () => {
    expect(getTorrenteDeCuraEDoloUsesCount(monkSubclassOf("Guerreiro da Misericórdia", 10))).toBeNull();
  });
});

describe("Monge/Caminho da Misericórdia — getHandOfUltimateMercyHealingText (4d10 + mod SAB, nível 17)", () => {
  it("mod SAB +3: 4d10+3", () => {
    const character = monkSubclassOf("Guerreiro da Misericórdia", 17);
    character.abilities.SAB.score = 16; // +3
    expect(getHandOfUltimateMercyHealingText(character)).toBe("4d10+3");
  });

  it("outra subclasse ou nível <17 — null", () => {
    expect(getHandOfUltimateMercyHealingText(monkSubclassOf("Guerreiro da Misericórdia", 16))).toBeNull();
    expect(getHandOfUltimateMercyHealingText(monkSubclassOf("Guerreiro das Sombras", 17))).toBeNull();
  });
});
