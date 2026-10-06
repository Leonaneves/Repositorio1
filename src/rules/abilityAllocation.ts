import type { AbilityKey } from "../domain/common.js";

/**
 * Componente genérico de distribuição de pontos de atributo (fonte
 * "REORGANIZAÇÃO DO BUILDER" §12/§44) — usado tanto pelo Antecedente
 * (`eligibleAbilities` = as 3 habilidades do Antecedente) quanto pelo
 * ASI (`eligibleAbilities` = as 6, `totalPoints: 2`, `maxPerAbility: 2`).
 * `allocations` é SEMPRE o bônus desta fonte especificamente — nunca o
 * valor final do atributo (que soma base + todas as fontes, ver
 * `rules/abilities.ts#getEffectiveAbilityScore`). Funções puras, sem
 * nenhuma leitura de texto/UI — a distribuição é sempre uma estrutura
 * real (§44).
 */
export interface AbilityAllocationConfig {
  eligibleAbilities: AbilityKey[];
  totalPoints: number;
  maxPerAbility: number;
}

export type AbilityAllocations = Partial<Record<AbilityKey, number>>;

/** Soma de todos os pontos já alocados nesta fonte. */
export function getAllocatedPoints(allocations: AbilityAllocations): number {
  return Object.values(allocations).reduce((sum, value) => sum + (value ?? 0), 0);
}

/** Pontos ainda não distribuídos — nunca negativo. */
export function getRemainingPoints(config: AbilityAllocationConfig, allocations: AbilityAllocations): number {
  return Math.max(0, config.totalPoints - getAllocatedPoints(allocations));
}

/** Se ainda é possível aumentar esta habilidade: elegível, ainda não no máximo, e ainda há pontos no pool. */
export function canIncreaseAbility(config: AbilityAllocationConfig, allocations: AbilityAllocations, ability: AbilityKey): boolean {
  if (!config.eligibleAbilities.includes(ability)) return false;
  if ((allocations[ability] ?? 0) >= config.maxPerAbility) return false;
  return getRemainingPoints(config, allocations) > 0;
}

/** Se é possível diminuir: só se ESTA fonte já tiver concedido ao menos 1 ponto a essa habilidade — nunca reduz abaixo de 0 desta origem. */
export function canDecreaseAbility(allocations: AbilityAllocations, ability: AbilityKey): boolean {
  return (allocations[ability] ?? 0) > 0;
}

/** Nova distribuição com +1 na habilidade informada — nunca muta o objeto recebido, nunca excede as regras (o chamador deve checar `canIncreaseAbility` antes, mas aqui também não deixa passar). */
export function increaseAbility(config: AbilityAllocationConfig, allocations: AbilityAllocations, ability: AbilityKey): AbilityAllocations {
  if (!canIncreaseAbility(config, allocations, ability)) return allocations;
  return { ...allocations, [ability]: (allocations[ability] ?? 0) + 1 };
}

/** Nova distribuição com -1 na habilidade informada — nunca muta o objeto recebido. */
export function decreaseAbility(allocations: AbilityAllocations, ability: AbilityKey): AbilityAllocations {
  if (!canDecreaseAbility(allocations, ability)) return allocations;
  const next = { ...allocations, [ability]: (allocations[ability] ?? 0) - 1 };
  if (next[ability] === 0) delete next[ability];
  return next;
}

/** Se a distribuição está completa (todos os pontos usados) — usado pelo `canAdvance` (§21/§41). */
export function isAllocationComplete(config: AbilityAllocationConfig, allocations: AbilityAllocations): boolean {
  return getRemainingPoints(config, allocations) === 0;
}
