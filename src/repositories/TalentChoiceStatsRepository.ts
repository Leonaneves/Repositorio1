import type { TalentChoiceCountQuery, TalentChoiceCountRow } from "../recommendations/types.js";
import type { TalentChoiceScoreRow } from "../recommendations/scoring.js";

/**
 * Porta de consulta das contagens usadas pelo recomendador de talentos
 * (`recommendations/`). Devolve só CONTAGENS agregadas por (conjunto,
 * faixa de contexto, talento) — nunca registros individuais, nunca
 * percentuais, nunca a decisão do que recomendar (isso é de
 * `recommendations/policy.ts`). Implementações: Supabase (função SQL
 * `get_talent_choice_counts`, migration 0004) e em memória
 * (`recommendations/countTalentChoices.ts`).
 */
export interface TalentChoiceStatsRepository {
  getTalentChoiceCounts(query: TalentChoiceCountQuery): Promise<TalentChoiceCountRow[]>;
  /** Pontuação por hierarquia de influência (classe → subclasse e atributo; o nível nunca influencia) — `get_talent_choice_scores` (migration 0010) / `scoring.ts`. */
  getTalentChoiceScores(query: TalentChoiceCountQuery): Promise<TalentChoiceScoreRow[]>;
}
