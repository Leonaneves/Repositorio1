import type { AbilityKey } from "../../domain/common.js";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../CharacterBuildRepository.js";
import type { TalentChoiceStatsRepository } from "../TalentChoiceStatsRepository.js";
import { buildToTalentChoiceFacts, countTalentChoices } from "../../recommendations/countTalentChoices.js";
import type { TalentChoiceCountQuery, TalentChoiceCountRow, TalentChoiceFact } from "../../recommendations/types.js";
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
  if (filter.highestAbility && highestAbility(build.abilityScores as Record<AbilityKey, number>) !== filter.highestAbility) {
    return false;
  }
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
export class InMemoryBuildStore implements CharacterBuildRepository, AnalyticsRepository, TalentChoiceStatsRepository {
  private builds = new Map<string, CharacterBuild>();
  /** Referências externas/sintéticas já normalizadas (`references/referenceFacts.ts`) — vazio por padrão: o app nunca embute referências no bundle. */
  private referenceFacts: TalentChoiceFact[] = [];

  async upsert(build: CharacterBuild): Promise<void> {
    this.builds.set(build.buildId, { ...build });
  }

  /** Utilitário só de teste: quantos registros distintos existem (nunca cresce por edição do mesmo build). */
  get size(): number {
    return this.builds.size;
  }

  clear(): void {
    this.builds.clear();
    this.referenceFacts = [];
  }

  /** Só para testes/uso local explícito: substitui as referências usadas pelo recomendador (o caminho de produção é o banco — migration 0004). */
  setReferenceFacts(facts: readonly TalentChoiceFact[]): void {
    this.referenceFacts = facts.filter((fact) => fact.pool !== "user");
  }

  /** Mesmas regras da função SQL `get_talent_choice_counts` (ver `recommendations/countTalentChoices.ts`). */
  async getTalentChoiceCounts(query: TalentChoiceCountQuery): Promise<TalentChoiceCountRow[]> {
    const userFacts = [...this.builds.values()].flatMap(buildToTalentChoiceFacts);
    return countTalentChoices([...userFacts, ...this.referenceFacts], query);
  }

  /**
   * Estatísticas de escolhas reais só consideram registros de usuários
   * CONFIRMADOS (fonte "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS
   * RECOMENDAÇÕES" §7) — rascunhos (`status === "draft"`) e registros
   * de referência (`origin === "reference"`) ficam de fora aqui, no
   * mesmo ponto usado por todo método de leitura agregada abaixo,
   * espelhando o filtro `origin = 'user' and status = 'confirmed'` das
   * funções SQL de `supabase/migrations/0002_build_ownership_and_talents.sql`
   * — combinar com referências é da etapa futura do recomendador, não
   * desta.
   */
  private filtered(filter: BuildFilter): CharacterBuild[] {
    return [...this.builds.values()].filter(
      (build) => build.origin === "user" && build.status === "confirmed" && matchesFilter(build, filter),
    );
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
