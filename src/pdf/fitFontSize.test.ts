import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";
import { pdfOverlayFields } from "./fieldMap.js";
import { fittingFontSize, textFits } from "./fitFontSize.js";

/**
 * Pedido do usuário: em TODAS as caixas de texto do PDF, se o texto não
 * couber, diminui a fonte só o suficiente para caber; se couber, mantém o
 * tamanho do molde. Nunca corta conteúdo.
 */

const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");
const TF_SIZE = /\/[^\s]+\s+(\d*\.\d+|\d+)\s+Tf/;

async function filled(character: Character) {
  const pdfDoc = await PDFDocument.load(new Uint8Array(readFileSync(TEMPLATE_PATH)));
  const form = pdfDoc.getForm();
  fillPdfForm(pdfDoc, form, character);
  return { form, font: form.getDefaultFont() };
}

function fontSizeOf(form: Awaited<ReturnType<typeof filled>>["form"], name: string): number {
  const field = form.getTextField(name);
  const widget = field.acroField.getWidgets()[0];
  const da = widget.getDefaultAppearance() ?? field.acroField.getDefaultAppearance() ?? "";
  return Number(TF_SIZE.exec(da)![1]);
}

function crowdedBattleMaster(): Character {
  const character = createBlankCharacter("fit-font-test");
  character.classId = "guerreiro";
  character.subclassId = "Mestre da Batalha";
  character.level = 12;
  character.chosenManeuvers = ["aparar", "ataque-preciso", "contra-ataque", "ataque-ameacador", "ataque-de-varredura"];
  character.asiSelections = {
    4: { kind: "feat", featId: "agressor" },
    6: { kind: "feat", featId: "chef" },
    8: { kind: "feat", featId: "combatente-montado" },
    12: { kind: "feat", featId: "esmagador" },
  };
  character.talentsNotes = "Nota manual preservada no fim da caixa";
  return character;
}

describe("fonte das caixas de texto — só diminui quando não cabe", () => {
  it("caixa Talentos lotada: fonte menor que 10 e o texto inteiro cabe (nada cortado)", async () => {
    const character = crowdedBattleMaster();
    const { form, font } = await filled(character);
    const field = form.getTextField("Talentos");
    const size = fontSizeOf(form, "Talentos");
    expect(size).toBeLessThan(10);
    const rect = field.acroField.getWidgets()[0].getRectangle();
    const bounds = { x: 1, y: 1, width: rect.width - 2, height: rect.height - 2 };
    expect(textFits(field.getText()!, font, size, bounds, true)).toBe(true);
    expect(textFits(field.getText()!, font, size + 0.5, bounds, true)).toBe(false); // o maior tamanho que cabe
    expect(field.getText()).toContain("Nota manual preservada no fim da caixa");
  });

  it("texto que cabe mantém o tamanho do molde (10)", async () => {
    const character = createBlankCharacter("fit-font-test");
    character.backgroundId = "guarda"; // Alerta, uma linha só
    const { form } = await filled(character);
    expect(fontSizeOf(form, "Talentos")).toBe(10);
  });

  it("caixa de ferramentas (fonte fixa 10) com texto longo também diminui, sem cortar", async () => {
    const character = createBlankCharacter("fit-font-test");
    character.toolProficienciesNotes = Array.from({ length: 12 }, (_, i) => `Ferramenta de exemplo número ${i + 1} com nome comprido`).join("\n");
    const { form, font } = await filled(character);
    const field = form.getTextField("PROF.ferramentas");
    expect(field.getText()).toContain("número 12 com nome comprido");
    const size = fontSizeOf(form, "PROF.ferramentas");
    expect(size).toBeLessThan(10);
    const rect = field.acroField.getWidgets()[0].getRectangle();
    expect(textFits(field.getText()!, font, size, { x: 1, y: 1, width: rect.width - 2, height: rect.height - 2 }, true)).toBe(true);
  });

  it("linha única: diminui só o suficiente para a largura", () => {
    return PDFDocument.create().then(async (doc) => {
      const font = await doc.embedFont("Helvetica");
      const bounds = { x: 0, y: 0, width: 100, height: 14 };
      expect(fittingFontSize("Curto", font, 10, bounds, false)).toBe(10);
      const size = fittingFontSize("Um texto bem mais comprido que a caixa", font, 10, bounds, false);
      expect(size).toBeLessThan(10);
      expect(font.widthOfTextAtSize("Um texto bem mais comprido que a caixa", size)).toBeLessThanOrEqual(100);
    });
  });

  it("Subclasse (desenhada por coordenada) nunca é mais cortada em 30 letras", () => {
    const character = createBlankCharacter("fit-font-test");
    character.classId = "paladino";
    character.subclassId = "Juramento dos Anciões";
    const subclass = pdfOverlayFields.find((overlay) => overlay.pdfField === "SUBCLASSE")!;
    expect(subclass.getValue(character).length).toBeGreaterThan(0);
    expect(subclass.getValue(character)).not.toMatch(/…|\.\.\.$/);
  });

  it("exporta um PDF válido com caixas lotadas", async () => {
    const outBytes = await buildExportedPdf(crowdedBattleMaster(), new Uint8Array(readFileSync(TEMPLATE_PATH)));
    const reopened = await PDFDocument.load(outBytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getForm().getFields()).toHaveLength(0);
  });
});
