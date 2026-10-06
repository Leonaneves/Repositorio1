import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { AsiSelection, Character } from "../domain/character.js";
import { ASI_LEVELS_BY_CLASS } from "../data/features/classes.js";
import { getAllocatedPoints, isAllocationComplete, type AbilityAllocationConfig } from "./abilityAllocation.js";

/**
 * Regra universal de "Aumento no Valor de Atributo" (fonte
 * "REORGANIZAÇÃO DO BUILDER" §23/§26): 2 pontos totais, máximo +2 por
 * atributo, qualquer um dos 6 — igual para toda classe/nível. Isso
 * naturalmente permite tanto +2 num atributo quanto +1/+1 em dois,
 * sem precisar perguntar isso separadamente (§23) — a própria
 * distribuição resolve a escolha.
 */
export const ASI_ALLOCATION_CONFIG: AbilityAllocationConfig = {
  eligibleAbilities: [...ABILITY_KEYS],
  totalPoints: 2,
  maxPerAbility: 2,
};

/** Níveis de ASI já desbloqueados pelo nível ATUAL do personagem — [] sem classe ou sem progressão de ASI confirmada. */
export function getUnlockedAsiLevels(character: Character): number[] {
  if (!character.classId) return [];
  const levels = ASI_LEVELS_BY_CLASS[character.classId] ?? [];
  return levels.filter((level) => level <= character.level);
}

/** Soma de todo bônus de ASI (todos os níveis) nesta habilidade — usado por `rules/abilities.ts#getEffectiveAbilityScore`. */
export function getAsiAbilityBonus(character: Character, ability: AbilityKey): number {
  let total = 0;
  for (const selection of Object.values(character.asiSelections)) {
    if (selection.kind === "abilityIncrease") total += selection.allocations[ability] ?? 0;
  }
  return total;
}

/**
 * Se a escolha de ASI de um nível específico está completa: "feat" já
 * é completo por definição (catálogo de Talentos ainda pendente — §27,
 * nunca inventado; nada mais a validar até ele existir); "abilityIncrease"
 * só está completo quando os 2 pontos foram todos distribuídos (§41).
 * `undefined` (nenhum modo escolhido ainda) nunca é completo.
 */
export function isAsiLevelComplete(selection: AsiSelection | undefined): boolean {
  if (!selection) return false;
  if (selection.kind === "feat") return true;
  return isAllocationComplete(ASI_ALLOCATION_CONFIG, selection.allocations);
}

/** Se TODOS os níveis de ASI já desbloqueados estão resolvidos — usado pelo `canAdvance` da etapa Classe. */
export function isAsiSelectionResolved(character: Character): boolean {
  return getUnlockedAsiLevels(character).every((level) => isAsiLevelComplete(character.asiSelections[level]));
}

/** Pontos já distribuídos no ASI de um nível (0 se ainda não for do tipo "abilityIncrease"). */
export function getAsiLevelAllocatedPoints(selection: AsiSelection | undefined): number {
  if (!selection || selection.kind !== "abilityIncrease") return 0;
  return getAllocatedPoints(selection.allocations);
}
