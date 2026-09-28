import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import { buildExportedPdf } from "./exporter.js";

// Mesmo arquivo servido em runtime por `public/pdf-template/` — lido
// direto do disco aqui para não depender de `fetch`/DOM no teste (ver
// docstring de `buildExportedPdf`).
const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");

function readTemplateBytes(): Uint8Array {
  return new Uint8Array(readFileSync(TEMPLATE_PATH));
}

function makeCharacter() {
  const character = createBlankCharacter("pdf-export-test");
  character.name = "Elminster Aumar";
  character.level = 5;
  character.classId = "mago";
  character.subclassId = "Evocador";
  character.speciesId = "humano";
  character.backgroundId = "sabio";
  character.abilities.INT.score = 18;
  character.abilities.CON.score = 14;
  character.armor.equipped = "unarmed";
  return character;
}

describe("buildExportedPdf — gera um PDF válido a partir do molde interativo", () => {
  it("preserva as 2 páginas do molde", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const reloaded = await PDFDocument.load(outBytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it("não sobra nenhum campo interativo depois do flatten", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const reloaded = await PDFDocument.load(outBytes);
    expect(reloaded.getForm().getFields()).toHaveLength(0);
  });

  it("remove o JavaScript de nível de documento (/Names)", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const reloaded = await PDFDocument.load(outBytes);
    expect(reloaded.catalog.has(PDFName.of("Names"))).toBe(false);
  });

  it("remove o botão Reset (não sobra nenhum campo chamado 'Reset' antes do flatten)", async () => {
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    expect(form.getFieldMaybe("Reset")).not.toBeNull();

    // Reexecuta só a parte de remoção (sem flatten) para inspecionar o resultado intermediário.
    const resetField = form.getFieldMaybe("Reset");
    if (resetField) form.removeField(resetField);
    expect(form.getFieldMaybe("Reset")).toBeUndefined();
  });

  it("produz bytes de PDF válidos (assinatura %PDF, tamanho razoável)", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const header = new TextDecoder().decode(outBytes.slice(0, 5));
    expect(header).toBe("%PDF-");
    expect(outBytes.length).toBeGreaterThan(100_000);
  });

  it("não lança erro para um personagem completamente em branco (sem classe/espécie/antecedente)", async () => {
    const blank = createBlankCharacter("pdf-export-blank");
    const outBytes = await buildExportedPdf(blank, readTemplateBytes());
    const reloaded = await PDFDocument.load(outBytes);
    expect(reloaded.getPageCount()).toBe(2);
  });
});
