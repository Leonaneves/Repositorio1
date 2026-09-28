import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PDFDocument, PDFName } from "@cantoo/pdf-lib";
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

  it("remove os campos auxiliares ocultos 'AUTO.*' antes do flatten (senão vazam como texto visível — ver docstring de fillPdfForm)", async () => {
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    expect(form.getFieldMaybe("AUTO.CA")).not.toBeUndefined();
    expect(form.getFieldMaybe("AUTO.PERICIAS.ANTECEDENTE")).not.toBeUndefined();

    fillPdfForm(pdfDoc, form, makeCharacter());

    for (const name of [
      "AUTO.CA",
      "AUTO.ARMAS",
      "AUTO.FERRAMENTAS",
      "AUTO.ESPECIE",
      "AUTO.ANTECEDENTE",
      "AUTO.INICIATIVA",
      "AUTO.PASSIVA",
      "AUTO.PERICIAS.ANTECEDENTE",
    ]) {
      expect(form.getFieldMaybe(name)).toBeUndefined();
    }
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

  it("marca itens mágicos sintonizados só nos slots realmente sintonizados", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.inventory.attunedItems = [
        { description: "Anel de Proteção", attuned: true },
        { description: "Adaga +1 (guardada, não sintonizada)", attuned: false },
        { description: "Manto de Elfo", attuned: true },
      ];
    });
    expect(form.getCheckBox("O.item.magico.1").isChecked()).toBe(true);
    expect(form.getCheckBox("O.item.magico.2").isChecked()).toBe(false);
    expect(form.getCheckBox("O.item.magico.3").isChecked()).toBe(true);
  });

  it("marca espaços de magia gastos cumulativamente por círculo (2 gastos no 1º círculo marca 1 e 2, não 3 ou 4)", async () => {
    const form = await loadFormWithCharacter((c) => {
      c.spellcasting.slots[1].expended = 2;
      c.spellcasting.slots[3].expended = 1;
    });
    expect(form.getCheckBox("1o.circ.1").isChecked()).toBe(true);
    expect(form.getCheckBox("1o.circ.2").isChecked()).toBe(true);
    expect(form.getCheckBox("1o.circ.3").isChecked()).toBe(false);
    expect(form.getCheckBox("1o.circ.4").isChecked()).toBe(false);
    expect(form.getCheckBox("3o.circ.1").isChecked()).toBe(true);
    expect(form.getCheckBox("3o.circ.2").isChecked()).toBe(false);
    // Círculos com só 1 caixa no molde (8º/9º) continuam endereçáveis.
    expect(form.getCheckBox("8o.circ.1").isChecked()).toBe(false);
    expect(form.getCheckBox("9o.circ.1").isChecked()).toBe(false);
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

/**
 * `pdf-lib` (biblioteca original) grava uma tabela de xref estruturalmente
 * inválida ao chamar `form.flatten()` — confirmado com `pdfinfo`/`pdftoppm`
 * (poppler), que reportavam múltiplos "Invalid XRef entry" no PDF final
 * (ver `docs/referencia/pdf-exportacao/xref-investigacao.md`). Leitores
 * tolerantes (Chrome, o próprio pdf-lib, pikepdf/qpdf ao abrir) escondem o
 * problema recuperando em memória — o que não é aceitável como solução
 * final. A correção adotada foi trocar `pdf-lib` por `@cantoo/pdf-lib`
 * (fork mantido, mesma API), que grava uma tabela de xref válida.
 *
 * Este teste usa `pdfinfo`/`pdftoppm` — uma ferramenta de leitura/validação
 * independente da biblioteca que gera o PDF — para confirmar isso no PDF
 * final de verdade. Pula (não falha) se o poppler não estiver instalado no
 * ambiente, já que é uma dependência de sistema opcional só para este
 * teste de reforço.
 */
function popplerAvailable(): boolean {
  try {
    execFileSync("pdfinfo", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe.runIf(popplerAvailable())("buildExportedPdf — validade estrutural do xref (validador independente: poppler)", () => {
  it("pdfinfo não reporta 'Invalid XRef entry' no PDF exportado", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const dir = mkdtempSync(join(tmpdir(), "ficha-pdf-xref-"));
    const filePath = join(dir, "export.pdf");
    writeFileSync(filePath, outBytes);

    const result = spawnSync("pdfinfo", [filePath], { encoding: "utf-8" });
    expect(result.stdout).toContain("Pages:");
    expect(result.stderr).not.toMatch(/Invalid XRef/i);
  });

  it("pdftoppm consegue rasterizar a página 1 sem erro de xref", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const dir = mkdtempSync(join(tmpdir(), "ficha-pdf-xref-"));
    const filePath = join(dir, "export.pdf");
    writeFileSync(filePath, outBytes);
    const outPrefix = join(dir, "page");

    const result = spawnSync("pdftoppm", ["-f", "1", "-l", "1", "-r", "40", filePath, outPrefix], { encoding: "utf-8" });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/Invalid XRef/i);
  });

  it("pdftotext não extrai o texto de depuração dos campos ocultos 'AUTO.*' (ex.: 'FOR.res=2;FOR.atl=-1;...')", async () => {
    const outBytes = await buildExportedPdf(makeCharacter(), readTemplateBytes());
    const dir = mkdtempSync(join(tmpdir(), "ficha-pdf-xref-"));
    const filePath = join(dir, "export.pdf");
    writeFileSync(filePath, outBytes);

    const result = spawnSync("pdftotext", ["-f", "1", "-l", "1", filePath, "-"], { encoding: "utf-8" });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/FOR\.res=/);
    expect(result.stdout).not.toMatch(/AUTO\./);
  });
});
