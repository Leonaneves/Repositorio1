import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfCheckboxFields, pdfTextFields } from "./fieldMap.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";

/**
 * Lote "IMPLEMENTAR TALENTOS GERAIS RESTANTES NO BUILDER E NO PDF" §20:
 * exportação real com vários talentos e Manobras na MESMA caixa Talentos,
 * ferramentas no campo próprio e treinamento de armadura nos checkboxes.
 */

const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");

function fieldValue(pdfField: string, character: Character): string {
  return pdfTextFields.find((field) => field.pdfField === pdfField)!.getValue(character) as string;
}

function checkbox(pdfField: string, character: Character): boolean {
  return pdfCheckboxFields.find((field) => field.pdfField === pdfField)!.getValue(character) as boolean;
}

function battleMaster(): Character {
  const character = createBlankCharacter("fieldmap-lote-talentos");
  character.name = "Exemplo Talentos Restantes";
  character.classId = "guerreiro";
  character.subclassId = "Mestre da Batalha";
  character.level = 12;
  character.abilities.FOR.score = 16;
  character.abilities.DEX.score = 14;
  character.chosenManeuvers = ["aparar", "ataque-preciso", "contra-ataque"];
  character.asiSelections = {
    4: { kind: "feat", featId: "agressor" },
    6: { kind: "feat", featId: "envenenador" },
    8: { kind: "feat", featId: "especialista-armaduras-leves" },
    12: { kind: "abilityIncrease", allocations: { FOR: 2 } },
  };
  character.featureChoiceSelections["agressor-atributo-asi-4"] = { value: "FOR" };
  character.featureChoiceSelections["envenenador-atributo-asi-6"] = { value: "DEX" };
  character.featureChoiceSelections["especialista-armaduras-leves-atributo-asi-8"] = { value: "DEX" };
  character.talentsNotes = "Nota manual preservada";
  return character;
}

describe("PDF — talentos do lote junto das Manobras", () => {
  it("caixa Talentos: talentos, Aumento no Valor de Atributo, Manobras e nota manual, sem variáveis literais", () => {
    const text = fieldValue("Talentos", battleMaster());
    expect(text).toContain("Agressor: Correr +3m;");
    expect(text).toContain("Envenenador: ignora Res Venenoso; 1h+50 PO: 4 doses");
    expect(text).toContain("Salv CON CD 15"); // 8 + DEX 16 (14 + 1 do Envenenador + 1 de Armaduras Leves, +3) + BP 4
    expect(text).toContain("Especialista em Armaduras Leves");
    expect(text).toContain("Aumento no Valor de Atributo");
    expect(text).toContain("Manobras:");
    expect(text).toContain("Aparar:");
    expect(text).toContain("Nota manual preservada");
    expect(text).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
    expect(text).not.toMatch(/\n\s*\n/); // sem linhas em branco entre talentos
  });

  it("ferramentas e treinamento de armadura vão aos campos próprios, nunca repetidos em Talentos", () => {
    const character = battleMaster();
    expect(fieldValue("PROF.ferramentas", character)).toContain("Envenenador: Kit de Veneno");
    expect(checkbox("PROF.leve", character)).toBe(true);
    expect(checkbox("PROF.Escudo", character)).toBe(true);
    expect(fieldValue("Talentos", character)).not.toContain("Kit de Veneno");
  });

  it("exporta um PDF válido e o texto preenchido na caixa Talentos é o mesmo calculado (nada cortado)", async () => {
    const character = battleMaster();
    const templateBytes = new Uint8Array(readFileSync(TEMPLATE_PATH));
    const outBytes = await buildExportedPdf(character, templateBytes);
    const reopened = await PDFDocument.load(outBytes);
    expect(reopened.getPageCount()).toBe(2);
    if (process.env.WRITE_SAMPLE_PDF) writeFileSync(process.env.WRITE_SAMPLE_PDF, outBytes);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    fillPdfForm(pdfDoc, form, character);
    expect(form.getTextField("Talentos").getText()).toBe(fieldValue("Talentos", character));
  });
});
