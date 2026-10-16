import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID,
  MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
} from "../data/features/feats.js";
import { getFeatChoiceId } from "./feats.js";
import { getFeatAutoPreparedSpells } from "./featAutoPreparedSpells.js";

function withBackground(backgroundId: Character["backgroundId"]): Character {
  const character = createBlankCharacter("feat-auto-prepared-test");
  character.backgroundId = backgroundId;
  return character;
}

describe("getFeatAutoPreparedSpells — Iniciado em Magia (fonte \"IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF\" §9)", () => {
  it("[] sem nenhuma aquisição de Iniciado em Magia", () => {
    expect(getFeatAutoPreparedSpells(createBlankCharacter("x"))).toEqual([]);
  });

  it("[] enquanto os campos de truques/magia ainda não foram preenchidos (mesmo com a lista já fixa pelo Antecedente)", () => {
    expect(getFeatAutoPreparedSpells(withBackground("acolito"))).toEqual([]);
  });

  it("aquisição do Antecedente, só parcialmente preenchida: só as entradas preenchidas aparecem", () => {
    const character = withBackground("acolito"); // Clérigo
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID, "background")] = { value: "Chama Sagrada" };
    const entries = getFeatAutoPreparedSpells(character);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      circle: "",
      name: "Chama Sagrada",
      castingTime: "",
      range: "",
      concentration: false,
      ritual: false,
      material: false,
      notes: "Sempre preparada — Iniciado em Magia (Clérigo)",
    });
  });

  it("aquisição completa (2 truques + 1 magia de 1º círculo): 3 entradas, todas sempre preparadas", () => {
    const character = withBackground("acolito");
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID, "background")] = { value: "Chama Sagrada" };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID, "background")] = { value: "Orientação" };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "background")] = { value: "Bênção" };
    const entries = getFeatAutoPreparedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Chama Sagrada", "Orientação", "Bênção"]);
    expect(entries.every((e) => e.notes === "Sempre preparada — Iniciado em Magia (Clérigo)")).toBe(true);
  });

  it("não depende de classe/conjuração — funciona mesmo num Guerreiro sem nenhuma magia de classe", () => {
    const character = withBackground("acolito");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "background")] = { value: "Bênção" };
    expect(getFeatAutoPreparedSpells(character)).toHaveLength(1);
  });

  it("duas aquisições (Antecedente + ASI, listas diferentes): entradas de cada uma, nunca fundidas", () => {
    const character = withBackground("guia"); // Druida
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "iniciado-em-magia" } };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "background")] = { value: "Enredar" };
    character.featureChoiceSelections["iniciado-em-magia-lista-asi-4"] = { value: "Mago" };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "asi-4")] = { value: "Mísseis Mágicos" };

    const entries = getFeatAutoPreparedSpells(character);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ name: "Enredar", notes: "Sempre preparada — Iniciado em Magia (Druida)" });
    expect(entries[1]).toMatchObject({ name: "Mísseis Mágicos", notes: "Sempre preparada — Iniciado em Magia (Mago)" });
  });
});
