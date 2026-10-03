import type { Character, KnownWildShapeForm } from "../domain/character.js";

/**
 * Configuração de Formas Conhecidas de Forma Selvagem por nível (fonte
 * "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" §8) — tabela transcrita
 * literalmente, nunca deduzida: nível 2 (4 formas, ND máx 1/4, sem
 * Desl. de Voo), nível 4 (6 formas, ND máx 1/2, sem Voo), nível 8 (8
 * formas, ND máx 1, Voo permitido). Sem catálogo de Feras no projeto
 * (mesma decisão "nunca inventar catálogo" já aplicada a magias): o
 * Builder valida quantidade/ND/Voo a partir dos campos estruturados que
 * o próprio jogador preenche (`KnownWildShapeForm`), nunca verifica se
 * o nome corresponde de fato a uma Fera real.
 */
export interface WildShapeFormsConfig {
  count: number;
  maxChallengeRating: number;
  flyAllowed: boolean;
}

export function getWildShapeFormsConfig(level: number): WildShapeFormsConfig {
  if (level >= 8) return { count: 8, maxChallengeRating: 1, flyAllowed: true };
  if (level >= 4) return { count: 6, maxChallengeRating: 0.5, flyAllowed: false };
  if (level >= 2) return { count: 4, maxChallengeRating: 0.25, flyAllowed: false };
  return { count: 0, maxChallengeRating: 0, flyAllowed: false };
}

/** "1/4" -> 0.25, "1/2" -> 0.5, "1" -> 1, "2" -> 2 — `null` se o texto não for um ND reconhecível (nunca inventa um valor). */
export function parseChallengeRating(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [numerator, denominator] = trimmed.split("/").map((part) => Number(part.trim()));
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return numerator / denominator;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export interface KnownWildShapeFormValidation {
  /** `null` = ND não reconhecível (texto vazio/inválido) — não bloqueia, mas não pode confirmar que está dentro do limite. */
  challengeRatingOk: boolean | null;
  flySpeedOk: boolean;
}

/** Valida UMA forma conhecida contra a configuração do nível atual — nunca valida se o nome é de fato uma Fera (sem catálogo). */
export function validateKnownWildShapeForm(form: KnownWildShapeForm, config: WildShapeFormsConfig): KnownWildShapeFormValidation {
  const parsedCr = parseChallengeRating(form.challengeRating);
  return {
    challengeRatingOk: parsedCr === null ? null : parsedCr <= config.maxChallengeRating,
    flySpeedOk: !form.hasFlySpeed || config.flyAllowed,
  };
}

/**
 * Se a quantidade de Formas Conhecidas preenchidas (nome não vazio)
 * corresponde exatamente ao exigido pelo nível atual — usado para
 * travar o avanço do Builder na etapa própria (`canAdvance`,
 * `state/builderStore.ts`). Classes diferentes de Druida, ou Druida
 * abaixo do nível 2 (Forma Selvagem ainda não concedida), nunca
 * bloqueiam por aqui.
 */
export function isWildShapeFormSelectionComplete(character: Character): boolean {
  if (character.classId !== "druida") return true;
  const config = getWildShapeFormsConfig(character.level);
  if (config.count === 0) return true;
  const filled = character.knownWildShapeForms.filter((form) => form.name.trim().length > 0);
  return filled.length === config.count;
}
