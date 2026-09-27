/**
 * Tipos e helpers compartilhados pelo modelo de dados.
 *
 * Princípio central do projeto: todo valor que o motor de regras deriva
 * automaticamente, mas que o jogador também pode ajustar, separa
 * `auto` (resultado puro da regra) de `manual` (ajuste do jogador).
 * `total` nunca é armazenado "à mão" — é sempre `auto + manual` (ou,
 * para valores de escolha/categoria, `manual ?? auto`), calculado pelas
 * funções de `computedValue`/`computedChoice` abaixo. Isso evita que um
 * ajuste manual apague silenciosamente o valor automático, e evita a
 * técnica frágil usada no PDF original (campos-sombra `AUTO.*` que
 * tentam inferir o ajuste comparando strings).
 */

export const ABILITY_KEYS = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

/** Valor numérico derivado que aceita ajuste manual aditivo. */
export interface ComputedValue {
  auto: number;
  manual: number;
  total: number;
}

/** Valor de escolha/categoria derivado, que aceita ser sobrescrito manualmente. */
export interface ComputedChoice<T> {
  auto: T;
  manual: T | null;
  total: T;
}

export function computedValue(auto: number, manual = 0): ComputedValue {
  return { auto, manual, total: auto + manual };
}

export function computedChoice<T>(auto: T, manual: T | null = null): ComputedChoice<T> {
  return { auto, manual, total: manual ?? auto };
}
