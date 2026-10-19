import type { SupabaseClient } from "@supabase/supabase-js";
import type { TalentChoiceStatsRepository } from "../TalentChoiceStatsRepository.js";
import type { ContextTier, RecommendationPool, TalentChoiceCountQuery, TalentChoiceCountRow } from "../../recommendations/types.js";
import type { TalentChoiceScoreRow } from "../../recommendations/scoring.js";
import { getSupabaseClient } from "./client.js";

interface TalentChoiceCountRpcRow {
  pool: RecommendationPool;
  tier: ContextTier;
  talent_id: string;
  characters: number | string;
  independent_groups: number | string;
  sample_characters: number | string;
  sample_groups: number | string;
}

/**
 * Implementação real: chama a função `SECURITY DEFINER`
 * `get_talent_choice_counts` (migration 0004), que lê
 * `character_builds` (só quando `p_include_user`) e as tabelas
 * `reference_*` — nenhuma delas tem política de leitura para
 * `anon`/`authenticated`, então nada além das contagens sai do banco.
 * Contagens chegam como `bigint` (string no JSON) e são convertidas
 * aqui.
 */
export class SupabaseTalentChoiceStatsRepository implements TalentChoiceStatsRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async getTalentChoiceCounts(query: TalentChoiceCountQuery): Promise<TalentChoiceCountRow[]> {
    const { data, error } = await this.client.rpc("get_talent_choice_counts", {
      p_opportunity_kind: query.opportunityKind,
      p_class_id: query.classId,
      p_level: query.level,
      p_subclass_id: query.subclassId,
      p_highest_ability: query.highestAbility,
      p_exclude_character_id: query.excludeCharacterId,
      p_include_user: query.includeUserRecords,
    });
    if (error) throw new Error(`Falha ao consultar get_talent_choice_counts: ${error.message}`);
    return ((data ?? []) as TalentChoiceCountRpcRow[]).map((row) => ({
      pool: row.pool,
      tier: row.tier,
      talentId: row.talent_id,
      characters: Number(row.characters),
      independentGroups: Number(row.independent_groups),
      sampleCharacters: Number(row.sample_characters),
      sampleGroups: Number(row.sample_groups),
    }));
  }

  async getTalentChoiceScores(query: TalentChoiceCountQuery): Promise<TalentChoiceScoreRow[]> {
    const { data, error } = await this.client.rpc("get_talent_choice_scores", {
      p_opportunity_kind: query.opportunityKind,
      p_class_id: query.classId,
      p_level: query.level,
      p_subclass_id: query.subclassId,
      p_highest_ability: query.highestAbility,
      p_exclude_character_id: query.excludeCharacterId,
      p_include_user: query.includeUserRecords,
    });
    if (error) throw new Error(`Falha ao consultar get_talent_choice_scores: ${error.message}`);
    return (
      (data ?? []) as { pool: RecommendationPool; talent_id: string; score: number | string; base_characters: number | string; base_groups: number | string; base_sample: number | string }[]
    ).map((row) => ({
      pool: row.pool,
      talentId: row.talent_id,
      score: Number(row.score),
      baseCharacters: Number(row.base_characters),
      baseGroups: Number(row.base_groups),
      baseSample: Number(row.base_sample),
    }));
  }
}
