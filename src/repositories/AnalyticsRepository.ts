import type { AbilityKey } from "../domain/common.js";
import type { ArmorId, BackgroundId, ClassId, SpeciesId } from "../domain/ids.js";

/** Filtro de contexto para consultas agregadas — todos os campos são opcionais e combináveis. */
export interface BuildFilter {
  classId?: ClassId;
  subclassId?: string;
  speciesId?: SpeciesId;
  backgroundId?: BackgroundId;
  minLevel?: number;
  maxLevel?: number;
}

/** Uma linha de distribuição: um valor observado e quantos builds o têm. */
export interface DistributionRow {
  value: string;
  count: number;
}

/**
 * Única porta de consulta às estatísticas agregadas. Retorna sempre
 * CONTAGENS BRUTAS (nunca builds individuais) — cabe à camada
 * `analytics/` (não aos componentes, e não a este repositório) decidir
 * o que é ou não uma amostra suficiente, calcular percentuais e
 * formatar texto.
 */
export interface AnalyticsRepository {
  countBuilds(filter: BuildFilter): Promise<number>;

  getSubclassDistribution(filter: BuildFilter): Promise<DistributionRow[]>;
  getSpeciesDistribution(filter: BuildFilter): Promise<DistributionRow[]>;
  getBackgroundDistribution(filter: BuildFilter): Promise<DistributionRow[]>;
  getArmorDistribution(filter: BuildFilter): Promise<DistributionRow[]>;
  /** Distribuição de qual atributo (FOR/DEX/.../CAR) é o maior em cada build do contexto. */
  getHighestAbilityDistribution(filter: BuildFilter): Promise<DistributionRow[]>;
}

export const ABILITY_PRIORITY_ORDER: readonly AbilityKey[] = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"];

/** Em empate, o primeiro da lista acima "vence" — simplificação documentada, ver relatório da etapa. */
export function highestAbility(scores: Record<AbilityKey, number>): AbilityKey {
  return ABILITY_PRIORITY_ORDER.reduce((best, current) => (scores[current] > scores[best] ? current : best));
}

export function armorIdToFilterValue(armorId: ArmorId | null): string {
  return armorId ?? "unarmed";
}
