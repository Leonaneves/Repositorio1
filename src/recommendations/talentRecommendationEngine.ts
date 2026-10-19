import { getTalentChoiceStatsRepository } from "../repositories/index.js";
import type { TalentChoiceStatsRepository } from "../repositories/TalentChoiceStatsRepository.js";
import { selectTalentRecommendations } from "./policy.js";
import type { TalentChoiceCountQuery, TalentRecommendationResult } from "./types.js";
import type { TalentChoiceScoreRow } from "./scoring.js";

/**
 * Ponto único de entrada do recomendador de talentos para a UI —
 * mesmo padrão de `analytics/insightEngine.ts`: os componentes só
 * conhecem esta função (via `services/useTalentRecommendations.ts`),
 * nunca o repositório nem a política.
 */

export interface GetTalentRecommendationsOptions {
  repository?: TalentChoiceStatsRepository;
}

interface CacheEntry {
  expiresAt: number;
  promise: Promise<TalentChoiceScoreRow[]>;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

/**
 * Contagens da consulta, com cache por `CACHE_TTL_MS` (vários seletores
 * com o mesmo contexto — ex.: reabrir a etapa Talentos — não repetem a
 * consulta). Uma falha nunca fica presa no cache: a próxima chamada
 * tenta de novo.
 */
function getCounts(query: TalentChoiceCountQuery, repository: TalentChoiceStatsRepository, cacheable: boolean): Promise<TalentChoiceScoreRow[]> {
  if (!cacheable) return repository.getTalentChoiceScores(query);
  const key = JSON.stringify(query);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = repository.getTalentChoiceScores(query);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });
  promise.catch(() => cache.delete(key));
  return promise;
}

/**
 * Até 3 talentos recomendados entre `eligibleTalentIds` (as opções
 * ELEGÍVEIS do seletor, na ordem em que aparecem) — ou `null` quando não
 * há amostra suficiente, quando nenhuma opção elegível aparece no
 * ranking, ou quando a consulta falha (falha de conexão, migration ainda
 * não aplicada etc.): o seletor continua funcionando normalmente, só sem
 * o rótulo — nunca uma recomendação inventada.
 */
export async function getTalentRecommendations(
  query: TalentChoiceCountQuery,
  eligibleTalentIds: readonly string[],
  options: GetTalentRecommendationsOptions = {},
): Promise<TalentRecommendationResult | null> {
  if (eligibleTalentIds.length === 0) return null;
  const repository = options.repository ?? getTalentChoiceStatsRepository();
  try {
    // Repositório injetado (testes) nunca compartilha o cache global.
    const rows = await getCounts(query, repository, options.repository === undefined);
    return selectTalentRecommendations(rows, eligibleTalentIds, { includeUserRecords: query.includeUserRecords });
  } catch {
    return null;
  }
}

/** Exposto para testes (isolamento entre casos) e para forçar nova consulta após uma importação de referências na mesma sessão. */
export function clearTalentRecommendationCache(): void {
  cache.clear();
}
