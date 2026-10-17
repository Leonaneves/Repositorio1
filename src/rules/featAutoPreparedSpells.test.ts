import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID,
  MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
  TELECINETICO_FEAT_ID,
  TELEPATICO_FEAT_ID,
  TOCADO_PELAS_SOMBRAS_FEAT_ID,
  TOCADO_POR_FADAS_FEAT_ID,
} from "../data/features/feats.js";
import { getFeatAbilityIncreaseChoiceId, getFeatChoiceId } from "./feats.js";
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

function withAsiTalent(featId: string, level = 4): Character {
  const character = createBlankCharacter("general-feat-auto-prepared-test");
  character.classId = "guerreiro";
  character.level = level;
  character.asiSelections = { [level]: { kind: "feat", featId } };
  return character;
}

describe("getFeatAutoPreparedSpells — Telecinético/Telepático/Tocado Pelas Sombras/Tocado Por Fadas (fonte \"COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF\" §23-§26)", () => {
  it("Telecinético: Mãos Mágicas só aparece depois de a escolha de atributo estar resolvida", () => {
    expect(getFeatAutoPreparedSpells(withAsiTalent(TELECINETICO_FEAT_ID))).toEqual([]);
    const character = withAsiTalent(TELECINETICO_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TELECINETICO_FEAT_ID) + "-asi-4"] = { value: "INT" };
    expect(getFeatAutoPreparedSpells(character)).toEqual([
      { circle: "", name: "Mãos Mágicas", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "Sempre preparada — Telecinético" },
    ]);
  });

  it("Telepático: Detectar Pensamentos sempre preparada, sem marcador na nota (marcador fica só no texto de Talentos)", () => {
    const character = withAsiTalent(TELEPATICO_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TELEPATICO_FEAT_ID) + "-asi-4"] = { value: "SAB" };
    expect(getFeatAutoPreparedSpells(character)).toEqual([
      { circle: "", name: "Detectar Pensamentos", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "Sempre preparada — Telepático" },
    ]);
  });

  it("Tocado Pelas Sombras: Invisibilidade aparece sozinha enquanto a magia escolhida não foi preenchida", () => {
    const character = withAsiTalent(TOCADO_PELAS_SOMBRAS_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TOCADO_PELAS_SOMBRAS_FEAT_ID) + "-asi-4"] = { value: "INT" };
    expect(getFeatAutoPreparedSpells(character)).toEqual([
      { circle: "", name: "Invisibilidade", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "Sempre preparada — Tocado Pelas Sombras" },
    ]);
  });

  it("Tocado Pelas Sombras: as duas entradas (Invisibilidade + magia escolhida) depois de preenchida", () => {
    const character = withAsiTalent(TOCADO_PELAS_SOMBRAS_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TOCADO_PELAS_SOMBRAS_FEAT_ID) + "-asi-4"] = { value: "INT" };
    character.featureChoiceSelections["tocado-pelas-sombras-magia-asi-4"] = { value: "Toque Chocante" };
    const entries = getFeatAutoPreparedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Invisibilidade", "Toque Chocante"]);
    expect(entries.every((e) => e.notes === "Sempre preparada — Tocado Pelas Sombras")).toBe(true);
  });

  it("Tocado Por Fadas: as duas entradas (Passo Nebuloso + magia escolhida)", () => {
    const character = withAsiTalent(TOCADO_POR_FADAS_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TOCADO_POR_FADAS_FEAT_ID) + "-asi-4"] = { value: "CAR" };
    character.featureChoiceSelections["tocado-por-fadas-magia-asi-4"] = { value: "Enfeitiçar Pessoa" };
    const entries = getFeatAutoPreparedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Passo Nebuloso", "Enfeitiçar Pessoa"]);
    expect(entries.every((e) => e.notes === "Sempre preparada — Tocado Por Fadas")).toBe(true);
  });
});
