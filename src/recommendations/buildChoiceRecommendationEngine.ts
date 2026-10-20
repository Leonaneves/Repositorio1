import type { AbilityKey } from "../domain/common.js";
import type { BackgroundId, SkillKey } from "../domain/ids.js";
import { getBuildChoiceStatsRepository } from "../repositories/index.js";
import type { BuildChoiceStatsRepository } from "../repositories/BuildChoiceStatsRepository.js";
import { selectBuildChoiceRecommendations, type BuildChoiceRecommendationResult } from "./buildChoiceRecommendations.js";
import { abilityShares, backgroundAbilityAffinity, ruleMultiplier, skillAbilityAffinity } from "./ruleInfluence.js";
import type { BuildChoiceScoreQuery, BuildChoiceScoreRow } from "./scoring.js";

/**
 * Ponto de entrada das recomendações de criação para a UI — mesmo padrão
 * de `talentRecommendationEngine.ts`: cache de 60s por consulta, falha
 * nunca presa no cache, e qualquer erro vira "sem recomendação" (o
 * seletor continua funcionando normalmente).
 */

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; promise: Promise<BuildChoiceScoreRow[]> }>();

function getScores(query: BuildChoiceScoreQuery, repository: BuildChoiceStatsRepository, cacheable: boolean): Promise<BuildChoiceScoreRow[]> {
  if (!cacheable) return repository.getBuildChoiceScores(query);
  const key = JSON.stringify(query);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;
  const promise = repository.getBuildChoiceScores(query);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });
  promise.catch(() => cache.delete(key));
  return promise;
}

export interface BuildChoiceRecommendationRequest {
  query: BuildChoiceScoreQuery;
  /** Opções elegíveis do seletor, na ordem exibida. */
  eligibleValues: readonly string[];
  max: number;
  /** Atributos atuais do personagem — influência por regra nas Perícias. */
  abilityScores?: Record<AbilityKey, number> | null;
}

export async function getBuildChoiceRecommendations(
  request: BuildChoiceRecommendationRequest,
  options: { repository?: BuildChoiceStatsRepository } = {},
): Promise<BuildChoiceRecommendationResult | null> {
  const { query, eligibleValues, max } = request;
  if (eligibleValues.length === 0 || max <= 0) return null;
  const repository = options.repository ?? getBuildChoiceStatsRepository();
  const cacheable = options.repository === undefined;
  try {
    const rows = await getScores(query, repository, cacheable);
    let adjust: (value: string) => number = () => 1;

    if (query.kind === "background") {
      // Antecedente × foco de atributos da classe/subclasse (o que os jogadores deixam como maior e como menor).
      const focusQuery = { ...query, speciesId: null, choiceId: null, highestAbility: null, withValues: [] };
      const [highest, dump] = await Promise.all([
        getScores({ ...focusQuery, kind: "highestAbility" }, repository, cacheable),
        getScores({ ...focusQuery, kind: "dumpAbility" }, repository, cacheable),
      ]);
      const highestShares = abilityShares(highest);
      const dumpShares = abilityShares(dump);
      adjust = (value) => ruleMultiplier(backgroundAbilityAffinity(value as BackgroundId, highestShares, dumpShares));
    } else if (query.kind === "skillChoice" && request.abilityScores) {
      const scores = request.abilityScores;
      adjust = (value) => ruleMultiplier(skillAbilityAffinity(value as SkillKey, scores));
    }

    return selectBuildChoiceRecommendations(rows, eligibleValues, max, adjust);
  } catch {
    return null;
  }
}

/** Exposto para testes (isolamento entre casos). */
export function clearBuildChoiceRecommendationCache(): void {
  cache.clear();
}
