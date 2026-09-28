import type { ComputedValue } from "../domain/common.js";

/** +3 / -1 / +0 — usado para modificadores e bônus (perícias, salvaguardas, ataque). */
export function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Valor puro, sem sinal — usado para pontuações de atributo, CA, PV etc. */
export function formatPlain(n: number): string {
  return String(n);
}

/** Atalho para o `.total` de um ComputedValue, já formatado com sinal. */
export function formatComputedSigned(computed: ComputedValue): string {
  return formatSigned(computed.total);
}

/** Atalho para o `.total` de um ComputedValue, sem sinal. */
export function formatComputedPlain(computed: ComputedValue): string {
  return formatPlain(computed.total);
}

/**
 * O AcroForm original não impõe limite de caracteres nos campos de
 * texto — mas um texto muito longo estoura visualmente a caixa no PDF
 * achatado (sem campo para rolar/redimensionar como no formulário
 * interativo). Trunca de forma previsível, sempre com reticências,
 * nunca cortando no meio de uma palavra quando dá pra evitar.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut}…`;
}
