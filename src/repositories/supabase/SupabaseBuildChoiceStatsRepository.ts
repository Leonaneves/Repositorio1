import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildChoiceStatsRepository } from "../BuildChoiceStatsRepository.js";
import type { BuildChoiceScoreQuery, BuildChoiceScoreRow } from "../../recommendations/scoring.js";
import { getSupabaseClient } from "./client.js";

interface BuildChoiceScoreRpcRow {
  value: string;
  score: number | string;
  class_characters: number | string;
  class_sample: number | string;
}

/** Chama a função `SECURITY DEFINER` `get_build_choice_scores` (migration 0008) — só pontuações e a contagem da classe. */
export class SupabaseBuildChoiceStatsRepository implements BuildChoiceStatsRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async getBuildChoiceScores(query: BuildChoiceScoreQuery): Promise<BuildChoiceScoreRow[]> {
    const { data, error } = await this.client.rpc("get_build_choice_scores", {
      p_kind: query.kind,
      p_class_id: query.classId,
      p_subclass_id: query.subclassId,
      p_choice_id: query.choiceId,
      p_highest_ability: query.highestAbility,
      p_with_values: query.withValues,
      p_exclude_character_id: query.excludeCharacterId,
    });
    if (error) throw new Error(`Falha ao consultar get_build_choice_scores: ${error.message}`);
    return ((data ?? []) as BuildChoiceScoreRpcRow[]).map((row) => ({
      value: row.value,
      score: Number(row.score),
      classCharacters: Number(row.class_characters),
      classSample: Number(row.class_sample),
    }));
  }
}
