import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { canCreateSpellSlotWithSorceryPoints, convertSpellSlotToSorceryPoints, getSorceryPointRecovery, SPELL_SLOT_CREATION_COSTS } from "./sorceryPoints.js";

function sorcererAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("sorcery-points-test");
  character.classId = "feiticeiro";
  character.level = level;
  return character;
}

describe("SPELL_SLOT_CREATION_COSTS — tabela confirmada, nunca deduzida", () => {
  it("custos e níveis mínimos por círculo", () => {
    expect(SPELL_SLOT_CREATION_COSTS[1]).toEqual({ cost: 2, minLevel: 2 });
    expect(SPELL_SLOT_CREATION_COSTS[2]).toEqual({ cost: 3, minLevel: 3 });
    expect(SPELL_SLOT_CREATION_COSTS[3]).toEqual({ cost: 5, minLevel: 5 });
    expect(SPELL_SLOT_CREATION_COSTS[4]).toEqual({ cost: 6, minLevel: 7 });
    expect(SPELL_SLOT_CREATION_COSTS[5]).toEqual({ cost: 7, minLevel: 9 });
  });

  it("nunca permite criar espaço de 6º círculo ou superior", () => {
    expect(SPELL_SLOT_CREATION_COSTS[6]).toBeUndefined();
    expect(SPELL_SLOT_CREATION_COSTS[9]).toBeUndefined();
  });
});

describe("canCreateSpellSlotWithSorceryPoints", () => {
  it("outra classe nunca pode", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(canCreateSpellSlotWithSorceryPoints(character, 1, 10)).toBe(false);
  });

  it("nunca permite 6º círculo ou superior", () => {
    expect(canCreateSpellSlotWithSorceryPoints(sorcererAt(20), 6, 100)).toBe(false);
  });

  it("respeita o nível mínimo por círculo", () => {
    expect(canCreateSpellSlotWithSorceryPoints(sorcererAt(4), 2, 10)).toBe(true); // Nv3+ ok
    expect(canCreateSpellSlotWithSorceryPoints(sorcererAt(4), 3, 10)).toBe(false); // exige Nv5+
  });

  it("respeita o custo em PF disponível", () => {
    expect(canCreateSpellSlotWithSorceryPoints(sorcererAt(5), 3, 5)).toBe(true); // custo 5
    expect(canCreateSpellSlotWithSorceryPoints(sorcererAt(5), 3, 4)).toBe(false);
  });
});

describe("convertSpellSlotToSorceryPoints — PF ganhos = círculo do espaço, nunca excede o máximo", () => {
  it("espaço de 3º círculo com folga no máximo -> +3 PF", () => {
    expect(convertSpellSlotToSorceryPoints(3, 2, 10)).toBe(3);
  });

  it("nunca ultrapassa o máximo de PF", () => {
    expect(convertSpellSlotToSorceryPoints(3, 9, 10)).toBe(1); // só cabe +1
  });

  it("já no máximo -> 0 PF ganhos", () => {
    expect(convertSpellSlotToSorceryPoints(5, 10, 10)).toBe(0);
  });
});

describe("getSorceryPointRecovery — Restauração Feiticeira (nível 5+): metade do nível, arredondado para baixo", () => {
  it("outra classe -> null", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 10;
    expect(getSorceryPointRecovery(character)).toBeNull();
  });

  it("abaixo do nível 5 -> null (ainda não concedida)", () => {
    expect(getSorceryPointRecovery(sorcererAt(4))).toBeNull();
  });

  it.each([
    [5, 2],
    [10, 5],
    [20, 10],
  ])("nível %i -> %i PF", (level, expected) => {
    expect(getSorceryPointRecovery(sorcererAt(level))).toBe(expected);
  });
});
