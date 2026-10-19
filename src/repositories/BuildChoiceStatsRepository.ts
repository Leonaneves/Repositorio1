import type { BuildChoiceCountQuery, BuildChoiceCountRow } from "../recommendations/buildChoiceRecommendations.js";

/** Contagens agregadas para as recomendações de Espécie/Antecedente/Perícias/Especialização/atributos — ver `recommendations/buildChoiceRecommendations.ts`. Implementações: Supabase (`get_build_choice_counts`, migration 0006) e em memória. */
export interface BuildChoiceStatsRepository {
  getBuildChoiceCounts(query: BuildChoiceCountQuery): Promise<BuildChoiceCountRow[]>;
}
