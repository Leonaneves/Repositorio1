import { PDFDocument, PDFName, type PDFForm, type PDFTextField } from "pdf-lib";
import type { Character } from "../domain/character.js";
import { pdfCheckboxFields, pdfDropdownFields, pdfOverlayFields, pdfTextFields } from "./fieldMap.js";

export const PDF_TEMPLATE_URL = "/pdf-template/ficha-interativa.pdf";

/**
 * Preenche o formulário (texto, combos, checkboxes, overlays de
 * SUBCLASSE/ARMADURA.ATUAL) — sem achatar. Separado de
 * `buildExportedPdf` para que `exporter.test.ts` possa inspecionar o
 * estado de cada checkbox (`checkbox.isChecked()`) antes do flatten
 * remover os campos.
 */
export function fillPdfForm(pdfDoc: PDFDocument, form: PDFForm, character: Character): void {
  const resetField = form.getFieldMaybe("Reset");
  if (resetField) form.removeField(resetField);

  for (const overlay of pdfOverlayFields) {
    const field = form.getFieldMaybe(overlay.pdfField);
    if (field) form.removeField(field);

    const page = pdfDoc.getPages()[overlay.pageIndex];
    const value = overlay.getValue(character);
    if (value && page) {
      const [x0, y0] = overlay.rect;
      page.drawText(value, { x: x0 + 3, y: y0 + 4, size: 10 });
    }
  }

  for (const mapping of pdfTextFields) {
    const field = form.getFieldMaybe(mapping.pdfField);
    if (!field) continue;
    const value = mapping.getValue(character);
    (field as PDFTextField).setText(value || undefined);
  }

  for (const mapping of pdfDropdownFields) {
    const field = form.getFieldMaybe(mapping.pdfField);
    if (!field) continue;
    const value = mapping.getValue(character);
    if (value !== null) {
      try {
        form.getDropdown(mapping.pdfField).select(value);
      } catch {
        // Valor sem opção correspondente gravada no molde — mantém o campo como está em vez de falhar a exportação inteira.
      }
    }
  }

  for (const mapping of pdfCheckboxFields) {
    const field = form.getFieldMaybe(mapping.pdfField);
    if (!field) continue;
    // pdf-lib lê o valor "ligado" real do próprio dicionário de aparência do campo (confirmado: /Sim em todo o molde — ver checkboxes-diagnostico.md); nunca hardcodamos esse valor aqui.
    const checkbox = form.getCheckBox(mapping.pdfField);
    if (mapping.getValue(character)) checkbox.check();
    else checkbox.uncheck();
  }
}

/**
 * Preenche e achata o PDF-molde interativo a partir dos bytes do
 * template (já carregados) — separado de `exportCharacterToPdf` para
 * poder ser testado sem depender de `fetch`/DOM (ver `exporter.test.ts`,
 * que lê o mesmo arquivo de `public/pdf-template/` do disco).
 *
 * Ordem das operações (decisão aprovada — arquitetura §1):
 * 1. Remove o campo/anotação "Reset" (botão + marcação vermelha —
 *    diagnosticado em `docs/referencia/pdf-exportacao/reset-diagnostico.md`).
 * 2. Remove SUBCLASSE/ARMADURA.ATUAL do AcroForm (não têm lista de
 *    opções gravada) e desenha o valor por coordenada.
 * 3. Preenche os campos de texto, os 3 combos e os checkboxes (`fillPdfForm`).
 * 4. Achata o formulário (nenhum campo interativo sobra).
 * 5. Remove o JavaScript de nível de documento.
 */
export async function buildExportedPdf(character: Character, templateBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  fillPdfForm(pdfDoc, form, character);

  form.flatten();

  pdfDoc.catalog.delete(PDFName.of("Names"));
  pdfDoc.catalog.delete(PDFName.of("OpenAction"));

  return pdfDoc.save();
}

/** Ponto de entrada usado pela UI: busca o template estático e devolve o PDF pronto para download. */
export async function exportCharacterToPdf(character: Character): Promise<Uint8Array> {
  const response = await fetch(PDF_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar o molde do PDF (HTTP ${response.status}).`);
  }
  const templateBytes = new Uint8Array(await response.arrayBuffer());
  return buildExportedPdf(character, templateBytes);
}
