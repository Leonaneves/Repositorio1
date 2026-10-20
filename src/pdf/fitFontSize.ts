import { layoutMultilineText, TextAlignment, type PDFFont, type PDFTextField } from "@cantoo/pdf-lib";

/**
 * Fonte "só diminui quando não cabe" (pedido do usuário para TODAS as
 * caixas de texto do PDF): cada campo mantém o tamanho definido no molde
 * (`/DA … Tf`, ex.: 10) quando o texto cabe; quando não cabe, usa o maior
 * tamanho — em passos de 0,5 — em que o texto inteiro cabe, nunca menor
 * que `MIN_FONT_SIZE`. Nunca aumenta a fonte e nunca corta conteúdo.
 * A medição replica a do próprio `@cantoo/pdf-lib` ao gerar a aparência
 * no `flatten()` (mesmos limites internos, quebra de linha e altura de
 * linha `1,2 × altura da fonte`), com a fonte padrão do formulário.
 */

export const MIN_FONT_SIZE = 4;
const STEP = 0.5;
const TF_REGEX = /\/([^\0\t\n\f\r ]+)[\0\t\n\f\r ]+(\d*\.\d+|\d+)[\0\t\n\f\r ]+Tf/;

function fontSizeOf(da: string | undefined): number | undefined {
  const match = da ? TF_REGEX.exec(da) : null;
  const size = match ? Number(match[2]) : NaN;
  return Number.isFinite(size) && size > 0 ? size : undefined;
}

function withFontSize(da: string, size: number): string {
  return da.replace(TF_REGEX, (_all, name: string) => `/${name} ${size} Tf`);
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Se `text` cabe em `bounds` com `fontSize` (multilinha: altura total das linhas quebradas; linha única: largura). */
export function textFits(text: string, font: PDFFont, fontSize: number, bounds: Bounds, multiline: boolean): boolean {
  if (!text) return true;
  if (!multiline) return font.widthOfTextAtSize(text, fontSize) <= bounds.width;
  const { lines } = layoutMultilineText(text, { alignment: TextAlignment.Left, fontSize, font, bounds });
  const height = font.heightAtSize(fontSize);
  return lines.length * (height + height * 0.2) <= bounds.height;
}

/** Maior tamanho ≤ `maxSize` (passos de 0,5) em que o texto cabe — `maxSize` quando já cabe. */
export function fittingFontSize(text: string, font: PDFFont, maxSize: number, bounds: Bounds, multiline: boolean): number {
  for (let size = maxSize; size > MIN_FONT_SIZE; size -= STEP) {
    if (textFits(text, font, size, bounds, multiline)) return size;
  }
  return MIN_FONT_SIZE;
}

/**
 * Ajusta o tamanho da fonte de um campo de texto já preenchido. Devolve
 * o tamanho aplicado, ou `null` quando o campo usa tamanho automático no
 * molde (`0 Tf` — já se ajusta sozinho) ou o texto já cabe.
 */
export function fitTextFieldFontSize(field: PDFTextField, font: PDFFont): number | null {
  const text = field.getText() ?? "";
  if (!text) return null;
  const fieldDa = field.acroField.getDefaultAppearance();
  let changed: number | null = null;

  for (const widget of field.acroField.getWidgets()) {
    const widgetDa = widget.getDefaultAppearance();
    const baseSize = fontSizeOf(widgetDa) ?? fontSizeOf(fieldDa);
    if (baseSize === undefined) continue;

    const rectangle = widget.getRectangle();
    const borderWidth = widget.getBorderStyle()?.getWidth() ?? 0;
    const padding = field.isCombed() ? 0 : 1;
    const inset = borderWidth + padding;
    const bounds = { x: inset, y: inset, width: rectangle.width - inset * 2, height: rectangle.height - inset * 2 };

    const size = fittingFontSize(text, font, baseSize, bounds, field.isMultiline());
    if (size >= baseSize) continue;
    if (widgetDa && fontSizeOf(widgetDa) !== undefined) widget.setDefaultAppearance(withFontSize(widgetDa, size));
    else if (fieldDa) field.acroField.setDefaultAppearance(withFontSize(fieldDa, size));
    changed = size;
  }
  return changed;
}
