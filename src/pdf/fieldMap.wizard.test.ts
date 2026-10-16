import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfOverlayFields, pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Mago nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `SUBCLASSE` e magias preparadas) — a fonte
 * "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" pede
 * explicitamente que essas áreas sejam atualizadas além do bloco de
 * Características de Classe. Não re-testa o CONTEÚDO detalhado de cada
 * texto (já coberto por `rules/wizardClassPrintedFeatures.test.ts`/
 * `wizardSubclassPrintedFeatures.test.ts`) — só que o fieldMap
 * realmente os invoca e entrega para o campo certo do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function overlayValue(pdfField: string, character: Character): string {
  const mapping = pdfOverlayFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado em pdfOverlayFields: ${pdfField}`);
  return mapping.getValue(character);
}

function wizard(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fieldmap-wizard-test");
  character.classId = "mago";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("Carac.Classe.1/.2 — Mago usa composição dinâmica (classe + subclasse)", () => {
  it("o conteúdo vem de getWizardPrintedBlocks, nunca de character.classFeatures", () => {
    const character = wizard(5);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("ADEPTO DE RITUAL");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("inclui os blocos da subclasse junto com os da classe base", () => {
    const character = wizard(14, "Abjurador");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).toContain("PROTEÇÃO ARCANA");
    expect(joined).toContain("ROMPE-MAGIA");
  });
});

describe("SUBCLASSE — exibe 'Adivinhador' preservando o valor interno salvo ('Adivinho')", () => {
  it("renderiza o nome de exibição, não o valor interno salvo em subclassId", () => {
    const character = wizard(3, "Adivinho");
    expect(overlayValue("SUBCLASSE", character)).toBe("Adivinhador");
    expect(character.subclassId).toBe("Adivinho");
  });

  it("demais subclasses de Mago continuam exibidas pelo próprio nome", () => {
    expect(overlayValue("SUBCLASSE", wizard(3, "Abjurador"))).toBe("Abjurador");
    expect(overlayValue("SUBCLASSE", wizard(3, "Evocador"))).toBe("Evocador");
    expect(overlayValue("SUBCLASSE", wizard(3, "Ilusionista"))).toBe("Ilusionista");
  });
});

describe("Magias preparadas — vêm do Livro de Magias do Mago, nunca da lista manual genérica", () => {
  it("entradas prepared:true do livro aparecem, na ordem em que estão no livro", () => {
    const character = wizard(5);
    character.wizardSpellbook = [
      { name: "Sono", circle: 1, origin: "classProgression", grantedUnderSubclass: null, prepared: true, isSpellMastery: false, isSignatureSpell: false },
      { name: "Detectar Magia", circle: 1, origin: "classProgression", grantedUnderSubclass: null, prepared: false, isSpellMastery: false, isSignatureSpell: false },
      { name: "Mísseis Mágicos", circle: 1, origin: "classProgression", grantedUnderSubclass: null, prepared: true, isSpellMastery: false, isSignatureSpell: false },
    ];
    // a lista manual genérica (character.spellsPrepared) é ignorada para o Mago.
    character.spellsPrepared = [
      { circle: "1", name: "Nunca deveria aparecer", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Sono");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Mísseis Mágicos");
    expect(fieldValue("circulo1.0", character)).toBe("1");

    const joined = [fieldValue("nome.magia.1.0", character), fieldValue("nome.magia.1.1", character), fieldValue("nome.magia.1.2", character)];
    expect(joined).not.toContain("Nunca deveria aparecer");
    expect(joined).not.toContain("Detectar Magia"); // no livro, mas não preparada
  });

  it("nunca grava nada de volta em character.wizardSpellbook/spellsPrepared", () => {
    const character = wizard(5);
    character.wizardSpellbook = [
      { name: "Sono", circle: 1, origin: "classProgression", grantedUnderSubclass: null, prepared: true, isSpellMastery: false, isSignatureSpell: false },
    ];
    fieldValue("nome.magia.1.0", character);
    expect(character.wizardSpellbook).toHaveLength(1);
    expect(character.spellsPrepared).toEqual([]);
  });

  it("outra classe continua usando a lista manual genérica normalmente", () => {
    const character = createBlankCharacter("fieldmap-sorcerer-test");
    character.classId = "feiticeiro";
    character.spellsPrepared = [
      { circle: "1", name: "Mísseis Mágicos", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Mísseis Mágicos");
  });
});
