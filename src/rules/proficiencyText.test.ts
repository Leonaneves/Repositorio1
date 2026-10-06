import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getBackgroundFeatEntries,
  getClassToolProficiencyEntries,
  getClassWeaponProficiencyEntries,
  getSpeciesTraitEntries,
  renderAutoTextBlock,
} from "./proficiencyText.js";

describe("entradas automáticas de texto", () => {
  it("proficiência de armas reflete a classe atual", () => {
    const character = createBlankCharacter("t");
    character.classId = "ladino";
    const entries = getClassWeaponProficiencyEntries(character);
    expect(entries).toEqual([
      { text: "Armas Simples e Armas Marciais com propriedade Acuidade ou Leve", source: "class" },
    ]);
  });

  it("proficiência de ferramentas fica vazia quando a classe não concede nenhuma", () => {
    const character = createBlankCharacter("t");
    character.classId = "barbaro";
    expect(getClassToolProficiencyEntries(character)).toEqual([]);
  });

  it("traços de espécie mudam ao trocar de espécie, sem depender do texto anterior", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "anao";
    const first = getSpeciesTraitEntries(character);
    expect(first[0]?.text).toContain("RESILIÊNCIA ANÃNICA");

    character.speciesId = "tiefling";
    const second = getSpeciesTraitEntries(character);
    expect(second[0]?.text).toContain("TAUMATURGIA");
    expect(second[0]?.text).not.toContain("RESILIÊNCIA ANÃNICA");
  });

  it("talento de origem reflete o antecedente atual", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "soldado";
    expect(getBackgroundFeatEntries(character)).toEqual([
      { text: "Atacante Selvagem: Rerola 1 dado de dano p/ turno", source: "background" },
    ]);
  });
});

describe("renderAutoTextBlock", () => {
  it("combina entradas automáticas com notas manuais, preservando ambas", () => {
    const text = renderAutoTextBlock([{ text: "Armas Simples", source: "class" }], "Também tenho uma azagaia da família.");
    expect(text).toBe("Armas Simples\n\nTambém tenho uma azagaia da família.");
  });

  it("funciona só com notas manuais (sem entradas automáticas)", () => {
    expect(renderAutoTextBlock([], "Nota livre")).toBe("Nota livre");
  });

  it("funciona só com entradas automáticas (sem notas manuais)", () => {
    expect(renderAutoTextBlock([{ text: "Armas Simples", source: "class" }], "")).toBe("Armas Simples");
  });
});
