import type { Character } from "../domain/character.js";
import type { SpellCircle } from "../domain/ids.js";
import { getSorceryPoints } from "./classResources.js";

/**
 * Custo em Pontos de Feitiçaria e nível mínimo de Feiticeiro para criar
 * 1 espaço de magia com "Fonte de Magia" (fonte "INTEGRAÇÃO COMPLETA —
 * FEITICEIRO, METAMAGIA E SUBCLASSES" §7) — tabela transcrita
 * literalmente, nunca deduzida. Círculos acima do 5º nunca podem ser
 * criados dessa forma (chave inexistente = `undefined`).
 */
export const SPELL_SLOT_CREATION_COSTS: Partial<Record<SpellCircle, { cost: number; minLevel: number }>> = {
  1: { cost: 2, minLevel: 2 },
  2: { cost: 3, minLevel: 3 },
  3: { cost: 5, minLevel: 5 },
  4: { cost: 6, minLevel: 7 },
  5: { cost: 7, minLevel: 9 },
};

/**
 * Se o personagem PODE criar 1 espaço de magia daquele círculo agora,
 * dado quanto de Pontos de Feitiçaria tem disponível — valida custo,
 * nível mínimo e círculo máximo (nunca 6º ou superior). `availablePF`
 * é um parâmetro, não um campo de `Character`: PF não tem um "gasto
 * atual" rastreado pelo app (aparece como contador em branco
 * "PF: ___/{PFMax}" no PDF, preenchido à mão) — a validação é pura,
 * para ser reaproveitada onde quer que o valor atual exista (futura
 * Ficha Web).
 */
export function canCreateSpellSlotWithSorceryPoints(character: Character, circle: SpellCircle, availablePF: number): boolean {
  if (character.classId !== "feiticeiro") return false;
  const entry = SPELL_SLOT_CREATION_COSTS[circle];
  if (!entry) return false;
  if (character.level < entry.minLevel) return false;
  return availablePF >= entry.cost;
}

/**
 * PF ganhos ao converter 1 espaço de magia em Pontos de Feitiçaria
 * (§6): igual ao círculo do espaço gasto, nunca ultrapassando o máximo
 * de PF do personagem.
 */
export function convertSpellSlotToSorceryPoints(circle: SpellCircle, currentPF: number, maxPF: number): number {
  return Math.min(circle, Math.max(0, maxPF - currentPF));
}

/**
 * Restauração Feiticeira (nível 5 — §9): quantidade máxima de PF
 * recuperável após um Descanso Curto (1x/Descanso Longo) = metade do
 * nível de Feiticeiro, arredondado para baixo. `null` para qualquer
 * classe que não seja Feiticeiro, ou abaixo do nível 5 (ainda não
 * concedida).
 */
export function getSorceryPointRecovery(character: Character): number | null {
  if (character.classId !== "feiticeiro" || character.level < 5) return null;
  return Math.floor(character.level / 2);
}

export { getSorceryPoints };
