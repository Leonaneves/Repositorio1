import { getAnalyticsRepository } from "../repositories/index.js";
import type { AnalyticsRepository } from "../repositories/AnalyticsRepository.js";
import { computeInsight, insightMetricDefinitions, type InsightRuleOptions } from "./insightRules.js";
import type { ChoiceInsight, InsightContext } from "./types.js";

/**
 * Ponto único de entrada do sistema de insights. Os componentes React
 * só conhecem esta função (e o tipo `ChoiceInsight`) — nenhuma lógica
 * estatística, nenhum acesso a repositório, nenhuma query mora na UI
 * (ver §9/§18).
 */

export interface GetChoiceInsightsOptions extends InsightRuleOptions {
  repository?: AnalyticsRepository;
}

interface CacheEntry {
  expiresAt: number;
  promise: Promise<ChoiceInsight[]>;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function cacheKey(context: InsightContext, options: GetChoiceInsightsOptions): string {
  return JSON.stringify({ context, minSampleSize: options.minSampleSize ?? null });
}

/**
 * Devolve todos os insights que já têm amostra suficiente para o
 * contexto informado (pode ser um array vazio — ver cold start, §12).
 * Resultados recentes ficam em cache por `CACHE_TTL_MS` (ver §18:
 * "considere cache para insights consultados recentemente"), para que
 * trocar de aba entre campos que já geraram o mesmo contexto não
 * dispare uma nova consulta.
 */
export function getChoiceInsights(context: InsightContext, options: GetChoiceInsightsOptions = {}): Promise<ChoiceInsight[]> {
  const key = cacheKey(context, options);
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const repository = options.repository ?? getAnalyticsRepository();

  const promise = Promise.all(
    insightMetricDefinitions.map((definition) => computeInsight(definition, repository, context, options)),
  ).then((results) => results.filter((insight): insight is ChoiceInsight => insight !== null));

  cache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });

  // Se a consulta falhar, não deixamos uma promise rejeitada presa no
  // cache (a próxima chamada tentaria de novo, em vez de repetir o erro).
  promise.catch(() => cache.delete(key));

  return promise;
}

/** Exposto para testes (evita que resultados de um teste vazem para o próximo) e para uso interno avançado (ex.: forçar atualização após ações administrativas). */
export function clearInsightCache(): void {
  cache.clear();
}
