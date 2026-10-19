import type { BuildChoiceScoreQuery, BuildChoiceScoreRow } from "../recommendations/scoring.js";

/** Pontuações agregadas das recomendações de criação — ver `recommendations/scoring.ts`. Implementações: Supabase (`get_build_choice_scores`, migration 0008) e em memória. Nunca registros individuais. */
export interface BuildChoiceStatsRepository {
  getBuildChoiceScores(query: BuildChoiceScoreQuery): Promise<BuildChoiceScoreRow[]>;
}
