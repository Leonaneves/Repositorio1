import type { TalentChoiceCountQuery, TalentChoiceCountRow } from "../recommendations/types.js";

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
}
