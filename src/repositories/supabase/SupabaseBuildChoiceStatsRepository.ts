import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildChoiceStatsRepository } from "../BuildChoiceStatsRepository.js";
import type { BuildChoiceCountQuery, BuildChoiceCountRow, BuildChoiceTier } from "../../recommendations/buildChoiceRecommendations.js";
import { getSupabaseClient } from "./client.js";

interface BuildChoiceCountRpcRow {
  tier: BuildChoiceTier;
  value: string;
  characters: number | string;
  sample_characters: number | string;
}

/** Chama a função `SECURITY DEFINER` `get_build_choice_counts` (migration 0006) — só contagens, nenhum registro individual. */
export class SupabaseBuildChoiceStatsRepository implements BuildChoiceStatsRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async getBuildChoiceCounts(query: BuildChoiceCountQuery): Promise<BuildChoiceCountRow[]> {
    const { data, error } = await this.client.rpc("get_build_choice_counts", {
      p_kind: query.kind,
      p_class_id: query.classId,
      p_subclass_id: query.subclassId,
      p_choice_id: query.choiceId,
      p_exclude_character_id: query.excludeCharacterId,
    });
    if (error) throw new Error(`Falha ao consultar get_build_choice_counts: ${error.message}`);
    return ((data ?? []) as BuildChoiceCountRpcRow[]).map((row) => ({
      tier: row.tier,
      value: row.value,
      characters: Number(row.characters),
      sampleCharacters: Number(row.sample_characters),
    }));
  }
}
