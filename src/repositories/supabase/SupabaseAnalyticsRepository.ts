import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsRepository, BuildFilter, DistributionRow } from "../AnalyticsRepository.js";
import { getSupabaseClient } from "./client.js";

/** Converte o filtro em parâmetros nomeados das funções SQL (ver `supabase/migrations/0001_character_builds.sql`). */
function toParams(filter: BuildFilter) {
  return {
    p_class_id: filter.classId ?? null,
    p_subclass_id: filter.subclassId ?? null,
    p_species_id: filter.speciesId ?? null,
    p_background_id: filter.backgroundId ?? null,
    p_min_level: filter.minLevel ?? null,
    p_max_level: filter.maxLevel ?? null,
    p_highest_ability: filter.highestAbility ?? null,
  };
}

/**
 * Implementação real (Postgres via Supabase). Cada método chama uma
 * função SQL (`SECURITY DEFINER`) que devolve só contagens agregadas —
 * nunca expõe as linhas cruas de `character_builds` (que não têm
 * política de leitura pública; ver a migração). Isso é o que garante,
 * em nível de banco, que ninguém consegue ler o build individual de
 * outro jogador pela API pública, mesmo sendo tudo anônimo.
 */
export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async countBuilds(filter: BuildFilter): Promise<number> {
    const { data, error } = await this.client.rpc("count_builds", toParams(filter));
    if (error) throw new Error(`Falha ao contar builds: ${error.message}`);
    return Number(data ?? 0);
  }

  private async distribution(fn: string, filter: BuildFilter): Promise<DistributionRow[]> {
    const { data, error } = await this.client.rpc(fn, toParams(filter));
    if (error) throw new Error(`Falha ao consultar ${fn}: ${error.message}`);
    return ((data ?? []) as { value: string; count: number }[]).map((row) => ({
      value: row.value,
      count: Number(row.count),
    }));
  }

  getSubclassDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    return this.distribution("get_subclass_distribution", filter);
  }

  getSpeciesDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    return this.distribution("get_species_distribution", filter);
  }

  getBackgroundDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    return this.distribution("get_background_distribution", filter);
  }

  getArmorDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    return this.distribution("get_armor_distribution", filter);
  }

  getHighestAbilityDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    return this.distribution("get_highest_ability_distribution", filter);
  }
}
