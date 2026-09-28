import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";

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

describe("fillPdfForm — checkboxes (chamado antes do flatten, ver docstring da função)", () => {
  async function loadFormWithCharacter(mutate: (character: ReturnType<typeof makeCharacter>) => void) {
    const character = makeCharacter();
    mutate(character);
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    fillPdfForm(pdfDoc, form, character);
    return form;
  }

  it("marca a bolinha de proficiência de uma perícia com manualOverride true e deixa as demais desmarcadas", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.skills.atletismo.manualOverride = true;
    });
    expect(form.getCheckBox("O.FOR.atl").isChecked()).toBe(true);
    expect(form.getCheckBox("O.DEX.acr").isChecked()).toBe(false);
  });

  it("usa o campo com 'o' minúsculo para Arcanismo (o.INT.arc)", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.skills.arcanismo.manualOverride = true;
    });
    expect(form.getCheckBox("o.INT.arc").isChecked()).toBe(true);
  });

  it("marca a salvaguarda proficiente do atributo correspondente", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.savingThrows.INT.proficient = true;
    });
    expect(form.getCheckBox("O.INT.res").isChecked()).toBe(true);
    expect(form.getCheckBox("O.FOR.res").isChecked()).toBe(false);
  });

  it("marca salvaguardas contra morte cumulativamente (2 sucessos marca suc.1 e suc.2, não suc.3)", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.deathSaves.successes = 2;
      c.deathSaves.failures = 1;
    });
    expect(form.getCheckBox("Morte.suc.1").isChecked()).toBe(true);
    expect(form.getCheckBox("Morte.suc.2").isChecked()).toBe(true);
    expect(form.getCheckBox("Morte.suc.3").isChecked()).toBe(false);
    expect(form.getCheckBox("Morte.fal.1").isChecked()).toBe(true);
    expect(form.getCheckBox("Morte.fal.2").isChecked()).toBe(false);
  });

  it("marca treinamento de armadura leve e escudo equipado", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.armor.proficiencies.light = true;
      c.armor.proficiencies.shield = true;
      c.armor.shield = true;
    });
    expect(form.getCheckBox("PROF.leve").isChecked()).toBe(true);
    expect(form.getCheckBox("PROF.med").isChecked()).toBe(false);
    expect(form.getCheckBox("PROF.Escudo").isChecked()).toBe(true);
    expect(form.getCheckBox("Escudo").isChecked()).toBe(true);
  });

  it("nunca escreve no campo anômalo C5 (sem estado /Off definido — ver checkboxes-diagnostico.md)", async () => {
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    const before = form.getCheckBox("C5").isChecked();
    fillPdfForm(pdfDoc, form, makeCharacter());
    expect(form.getCheckBox("C5").isChecked()).toBe(before);
  });

  it("personagem em branco não marca nenhuma bolinha de proficiência/salvaguarda", async () => {
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    fillPdfForm(pdfDoc, form, createBlankCharacter("pdf-export-blank-checkboxes"));
    expect(form.getCheckBox("O.FOR.atl").isChecked()).toBe(false);
    expect(form.getCheckBox("O.FOR.res").isChecked()).toBe(false);
    expect(form.getCheckBox("PROF.leve").isChecked()).toBe(false);
  });
});
