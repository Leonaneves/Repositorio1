import type { AbilityKey } from "../../domain/common.js";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../CharacterBuildRepository.js";
import {
  armorIdToFilterValue,
  highestAbility,
  type AnalyticsRepository,
  type BuildFilter,
  type DistributionRow,
} from "../AnalyticsRepository.js";

function matchesFilter(build: CharacterBuild, filter: BuildFilter): boolean {
  if (filter.classId && build.classId !== filter.classId) return false;
  if (filter.subclassId && build.subclassId !== filter.subclassId) return false;
  if (filter.speciesId && build.speciesId !== filter.speciesId) return false;
  if (filter.backgroundId && build.backgroundId !== filter.backgroundId) return false;
  if (filter.minLevel !== undefined && build.level < filter.minLevel) return false;
  if (filter.maxLevel !== undefined && build.level > filter.maxLevel) return false;
  return true;
}

function distribution(rows: string[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (const value of rows) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

/**
 * Implementação de referência usada em desenvolvimento e nos testes:
 * guarda os builds num `Map` em memória (perdido ao recarregar a
 * página/processo). Implementa as duas interfaces de repositório com o
 * MESMO conjunto de dados, para que os testes de `analytics/` não
 * precisem de um banco de verdade.
 *
 * `upsert` por `buildId` garante a mesma semântica exigida da
 * implementação de produção (Supabase): nunca duplica um registro para
 * o mesmo personagem em construção.
 */
export class InMemoryBuildStore implements CharacterBuildRepository, AnalyticsRepository {
  private builds = new Map<string, CharacterBuild>();

  async upsert(build: CharacterBuild): Promise<void> {
    this.builds.set(build.buildId, { ...build });
  }

  /** Utilitário só de teste: quantos registros distintos existem (nunca cresce por edição do mesmo build). */
  get size(): number {
    return this.builds.size;
  }

  clear(): void {
    this.builds.clear();
  }

  private filtered(filter: BuildFilter): CharacterBuild[] {
    return [...this.builds.values()].filter((build) => matchesFilter(build, filter));
  }

  async countBuilds(filter: BuildFilter): Promise<number> {
    return this.filtered(filter).length;
  }

  async getSubclassDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    const values = this.filtered(filter)
      .map((b) => b.subclassId)
      .filter((v): v is string => v !== null);
    return distribution(values);
  }

  async getSpeciesDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    const values = this.filtered(filter)
      .map((b) => b.speciesId)
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return distribution(values);
  }

  async getBackgroundDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    const values = this.filtered(filter)
      .map((b) => b.backgroundId)
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return distribution(values);
  }

  async getArmorDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    const values = this.filtered(filter).map((b) => armorIdToFilterValue(b.armorId));
    return distribution(values);
  }

  async getHighestAbilityDistribution(filter: BuildFilter): Promise<DistributionRow[]> {
    const values = this.filtered(filter).map((b) => highestAbility(b.abilityScores as Record<AbilityKey, number>));
    return distribution(values);
  }
}
