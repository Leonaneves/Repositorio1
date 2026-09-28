import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";

/**
 * Os 3 métodos de geração de atributos oferecidos pelo Builder
 * (decisão aprovada §9). O modo escolhido vive só no estado do Builder
 * (`state/builderStore.ts`) — o `Character` final só guarda os 6
 * valores definitivos, nunca o método usado para chegar neles.
 */
export type AbilityGenerationMode = "standardArray" | "pointBuy" | "manual";

export type DraftAbilityScores = Partial<Record<AbilityKey, number>>;

/** Array Padrão (PHB 2024): 6 valores fixos, um por atributo, sem repetir. */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN_SCORE = 8;
export const POINT_BUY_MAX_SCORE = 15;

/** Custo em pontos de cada valor de Point Buy (PHB 2024) — 8 é "de graça", acima disso cresce, ficando mais caro a partir do 14. */
const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

function safePointBuyCost(score: number): number | null {
  return POINT_BUY_COST_TABLE[score] ?? null;
}

/** Custo de um valor de Point Buy. Lança erro se o valor estiver fora de 8–15 (uso direto/confirmado, não para validação de rascunho). */
export function getPointBuyCost(score: number): number {
  const cost = safePointBuyCost(score);
  if (cost === null) {
    throw new RangeError(`Point Buy só aceita valores entre ${POINT_BUY_MIN_SCORE} e ${POINT_BUY_MAX_SCORE} (recebido ${score}).`);
  }
  return cost;
}

export function isPointBuyScoreValid(score: number): boolean {
  return safePointBuyCost(score) !== null;
}

/** Pontos já gastos nos atributos preenchidos até agora (ignora os ainda não preenchidos; valores fora de 8–15 não somam custo). */
export function getPointBuySpent(scores: DraftAbilityScores): number {
  return ABILITY_KEYS.reduce((total, key) => {
    const score = scores[key];
    if (score === undefined) return total;
    return total + (safePointBuyCost(score) ?? 0);
  }, 0);
}

/** Pontos restantes do orçamento de 27 — pode ficar negativo (estado inválido, nunca escondido da UI). */
export function getPointBuyRemaining(scores: DraftAbilityScores): number {
  return POINT_BUY_BUDGET - getPointBuySpent(scores);
}

/** Point Buy só é válido com os 6 atributos preenchidos, todos entre 8–15, e sem exceder o orçamento. */
export function isPointBuyValid(scores: DraftAbilityScores): boolean {
  const allFilledAndInRange = ABILITY_KEYS.every((key) => {
    const score = scores[key];
    return score !== undefined && isPointBuyScoreValid(score);
  });
  return allFilledAndInRange && getPointBuyRemaining(scores) >= 0;
}

/** Valores do Array Padrão ainda não usados em nenhum atributo — para a UI oferecer só o que resta. */
export function getStandardArrayRemainingValues(scores: DraftAbilityScores): number[] {
  const remaining = [...STANDARD_ARRAY] as number[];
  for (const key of ABILITY_KEYS) {
    const score = scores[key];
    if (score === undefined) continue;
    const index = remaining.indexOf(score);
    if (index !== -1) remaining.splice(index, 1);
  }
  return remaining;
}

/** Array Padrão só é válido quando os 6 atributos usam, cada um, exatamente os 6 valores fixos (nenhum repetido, nenhum sobrando). */
export function isStandardArrayValid(scores: DraftAbilityScores): boolean {
  const values = ABILITY_KEYS.map((key) => scores[key]);
  if (values.some((value) => value === undefined)) return false;
  const sortedValues = [...(values as number[])].sort((a, b) => a - b);
  const sortedExpected = [...STANDARD_ARRAY].sort((a, b) => a - b);
  return sortedValues.every((value, index) => value === sortedExpected[index]);
}

/** Manual/Rolado: sem tabela para validar contra, só exige que os 6 valores tenham sido preenchidos (o jogador digita, sem rolagem automática). */
export function isManualScoresValid(scores: DraftAbilityScores): boolean {
  return ABILITY_KEYS.every((key) => scores[key] !== undefined);
}

/** Validade do rascunho, de acordo com o método de geração ativo no Builder. */
export function isAbilityGenerationValid(mode: AbilityGenerationMode, scores: DraftAbilityScores): boolean {
  if (mode === "standardArray") return isStandardArrayValid(scores);
  if (mode === "pointBuy") return isPointBuyValid(scores);
  return isManualScoresValid(scores);
}
