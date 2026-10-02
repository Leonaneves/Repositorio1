/**
 * Normaliza texto destinado ao PDF para equivalentes ASCII simples —
 * fonte "PADRONIZAÇÃO DE CARACTERES PARA O PDF": o PDF-molde não
 * renderiza corretamente alguns símbolos Unicode (dependem de glyphs
 * específicos da fonte embutida) nos campos de texto/overlays.
 *
 * Aplicada em `pdf/exporter.ts`, exatamente no ponto em que cada valor
 * é escrito no PDF — nunca em `FeatureDefinition.summary` (Builder/
 * Ficha Web) nem em qualquer outro texto que não vá para o PDF. Letras
 * acentuadas do português (á, ã, ç, é, í, ó, ú, …) não são tocadas.
 */
const PDF_CHARACTER_REPLACEMENTS: readonly [RegExp, string][] = [
  [/→/g, "->"],
  [/½/g, "1/2"],
  [/×/g, "x"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/±/g, "+/-"],
];

export function sanitizeForPdf(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PDF_CHARACTER_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
