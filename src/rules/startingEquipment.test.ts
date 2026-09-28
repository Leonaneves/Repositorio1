import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { formatStartingEquipmentItems, getStartingEquipmentOptions, isStartingEquipmentResolved } from "./startingEquipment.js";

describe("getStartingEquipmentOptions", () => {
  it("vazio sem classe", () => {
    const character = createBlankCharacter("equip-test");
    expect(getStartingEquipmentOptions(character)).toEqual([]);
  });

  it("vazio para Artífice (sem dados confirmados)", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "artifice";
    expect(getStartingEquipmentOptions(character)).toEqual([]);
  });

  it("Guerreiro tem as 3 opções A/B/C", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "guerreiro";
    expect(getStartingEquipmentOptions(character).map((o) => o.id)).toEqual(["A", "B", "C"]);
  });
});

describe("isStartingEquipmentResolved", () => {
  it("true quando a classe não tem opções confirmadas (nunca trava o Builder por causa disso)", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "artifice";
    expect(isStartingEquipmentResolved(character)).toBe(true);
  });

  it("false quando a classe tem opções e nenhuma foi escolhida ainda", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "guerreiro";
    expect(isStartingEquipmentResolved(character)).toBe(false);
  });

  it("true depois de escolher uma opção válida", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "guerreiro";
    character.startingEquipmentOptionId = "B";
    expect(isStartingEquipmentResolved(character)).toBe(true);
  });

  it("false se o id escolhido não existir mais nas opções da classe atual", () => {
    const character = createBlankCharacter("equip-test");
    character.classId = "guerreiro";
    character.startingEquipmentOptionId = "Z";
    expect(isStartingEquipmentResolved(character)).toBe(false);
  });
});

describe("formatStartingEquipmentItems", () => {
  it("junta os itens em linhas", () => {
    expect(formatStartingEquipmentItems({ id: "A", items: ["Espada", "Escudo"], gold: 5 })).toBe("Espada\nEscudo");
  });

  it("texto vazio para uma opção só de ouro", () => {
    expect(formatStartingEquipmentItems({ id: "B", items: [], gold: 100 })).toBe("");
  });
});
