import { getBuildChoiceStatsRepository } from "../repositories/index.js";
import type { BuildChoiceStatsRepository } from "../repositories/BuildChoiceStatsRepository.js";
import { selectBuildChoiceRecommendations, type BuildChoiceCountQuery, type BuildChoiceCountRow, type BuildChoiceRecommendationResult } from "./buildChoiceRecommendations.js";

/**
 * Ponto de entrada das recomendações de Espécie/Antecedente/Perícias/
 * Especialização/atributos para a UI — mesmo padrão de
 * `talentRecommendationEngine.ts`: cache de 60s por consulta, falha nunca
 * presa no cache, e qualquer erro vira "sem recomendação" (o seletor
 * continua funcionando normalmente).
 */

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; promise: Promise<BuildChoiceCountRow[]> }>();

function getCounts(query: BuildChoiceCountQuery, repository: BuildChoiceStatsRepository, cacheable: boolean): Promise<BuildChoiceCountRow[]> {
  if (!cacheable) return repository.getBuildChoiceCounts(query);
  const key = JSON.stringify(query);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;
  const promise = repository.getBuildChoiceCounts(query);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });
  promise.catch(() => cache.delete(key));
  return promise;
}

export async function getBuildChoiceRecommendations(
  query: BuildChoiceCountQuery,
  eligibleValues: readonly string[],
  max: number,
  options: { repository?: BuildChoiceStatsRepository } = {},
): Promise<BuildChoiceRecommendationResult | null> {
  if (eligibleValues.length === 0 || max <= 0) return null;
  const repository = options.repository ?? getBuildChoiceStatsRepository();
  try {
    const rows = await getCounts(query, repository, options.repository === undefined);
    return selectBuildChoiceRecommendations(rows, eligibleValues, max);
  } catch {
    return null;
  }
}

/** Exposto para testes (isolamento entre casos). */
export function clearBuildChoiceRecommendationCache(): void {
  cache.clear();
}
