import { classes } from "../data/classes.js";
import { species } from "../data/species.js";
import { backgrounds } from "../data/backgrounds.js";
import { armors } from "../data/armors.js";
import { getProficiencyBonus } from "../rules/abilities.js";
import type { AnalyticsRepository, BuildFilter, DistributionRow } from "../repositories/AnalyticsRepository.js";
import type { ChoiceInsight, ChoiceInsightItem, InsightContext, InsightMetric } from "./types.js";
import { MIN_SAMPLE_SIZE } from "./types.js";

const ABILITY_NAMES: Record<string, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/**
 * Faixa de níveis "semelhantes" ao nível informado — reaproveita as
 * faixas de bônus de proficiência já existentes em `rules/abilities.ts`
 * (`getProficiencyBonus`) em vez de duplicar os limites 1–4/5–8/... aqui.
 * É só uma heurística de agrupamento estatístico; não é uma regra de
 * jogo.
 */
function levelBracket(level: number): { minLevel: number; maxLevel: number } {
  const bonus = getProficiencyBonus(level);
  let minLevel = level;
  let maxLevel = level;
  while (minLevel > 1 && getProficiencyBonus(minLevel - 1) === bonus) minLevel--;
  while (maxLevel < 20 && getProficiencyBonus(maxLevel + 1) === bonus) maxLevel++;
  return { minLevel, maxLevel };
}

function className(classId: InsightContext["classId"]): string | null {
  return classId ? classes[classId].name : null;
}

function scopeLabel(filter: BuildFilter, context: InsightContext): string {
  const parts: string[] = [];
  parts.push(context.classId ? `${className(context.classId)}s` : "Personagens");
  if (filter.speciesId) parts.push(species[filter.speciesId].name.toLowerCase() + "s");
  if (filter.minLevel !== undefined || filter.maxLevel !== undefined) {
    if (filter.minLevel === filter.maxLevel) parts.push(`de nível ${filter.minLevel}`);
    else parts.push(`de nível ${filter.minLevel ?? 1} a ${filter.maxLevel ?? 20}`);
  }
  return `${parts.join(" ")} registrados`;
}

function toItems(rows: DistributionRow[], total: number, labelFor: (value: string) => string): ChoiceInsightItem[] {
  return rows.map((row) => ({
    label: labelFor(row.value),
    percentage: Math.round((row.count / total) * 100),
  }));
}

/**
 * Tenta os filtros do mais específico para o mais amplo (nunca o
 * contrário), na ordem passada em `candidates`; usa o primeiro que
 * atingir `minSampleSize`. Se nenhum atingir, devolve `null` — é assim
 * que o cold start (§12) e a regra de amostra mínima (§11) se
 * expressam: nenhum percentual inventado, o insight simplesmente não
 * aparece.
 */
async function resolveWithFallback(
  repository: AnalyticsRepository,
  candidates: BuildFilter[],
  fetch: (filter: BuildFilter) => Promise<DistributionRow[]>,
  minSampleSize: number,
): Promise<{ filter: BuildFilter; rows: DistributionRow[]; total: number } | null> {
  for (const filter of candidates) {
    const total = await repository.countBuilds(filter);
    if (total >= minSampleSize) {
      const rows = await fetch(filter);
      return { filter, rows, total };
    }
  }
  return null;
}

/** Remove candidatos repetidos (ex.: quando level/species não estão presentes, vários colapsam no mesmo filtro "classId apenas"). */
function dedupeFilters(filters: BuildFilter[]): BuildFilter[] {
  const seen = new Set<string>();
  const result: BuildFilter[] = [];
  for (const filter of filters) {
    const key = JSON.stringify(filter, Object.keys(filter).sort());
    if (!seen.has(key)) {
      seen.add(key);
      result.push(filter);
    }
  }
  return result;
}

interface MetricDefinition {
  metric: InsightMetric;
  /** `null` = a métrica não se aplica a este contexto (ex.: subclassPopularity sem classId escolhida). */
  candidates: (context: InsightContext) => BuildFilter[] | null;
  fetch: (repository: AnalyticsRepository, filter: BuildFilter) => Promise<DistributionRow[]>;
  labelFor: (value: string) => string;
}

const METRICS: MetricDefinition[] = [
  {
    metric: "subclassPopularity",
    candidates: (context) => {
      if (!context.classId) return null;
      const base: BuildFilter = { classId: context.classId };
      const candidates: BuildFilter[] = [];
      if (context.speciesId) candidates.push({ ...base, speciesId: context.speciesId });
      if (context.level !== undefined) candidates.push({ ...base, ...levelBracket(context.level) });
      candidates.push(base);
      return dedupeFilters(candidates);
    },
    fetch: (repository, filter) => repository.getSubclassDistribution(filter),
    labelFor: (value) => value, // subclassId já é o nome de exibição completo (ex.: "Evocador")
  },
  {
    metric: "speciesPopularity",
    candidates: (context) => {
      const base: BuildFilter = context.classId ? { classId: context.classId } : {};
      const candidates: BuildFilter[] = [];
      if (context.level !== undefined) candidates.push({ ...base, ...levelBracket(context.level) });
      candidates.push(base);
      return dedupeFilters(candidates);
    },
    fetch: (repository, filter) => repository.getSpeciesDistribution(filter),
    labelFor: (value) => species[value as keyof typeof species]?.name ?? value,
  },
  {
    metric: "backgroundPopularity",
    candidates: (context) => {
      const base: BuildFilter = context.classId ? { classId: context.classId } : {};
      return [base];
    },
    fetch: (repository, filter) => repository.getBackgroundDistribution(filter),
    labelFor: (value) => backgrounds[value as keyof typeof backgrounds]?.name ?? value,
  },
  {
    metric: "armorPopularity",
    candidates: (context) => {
      const base: BuildFilter = context.classId ? { classId: context.classId } : {};
      const candidates: BuildFilter[] = [];
      if (context.level !== undefined) candidates.push({ ...base, ...levelBracket(context.level) });
      candidates.push(base);
      return dedupeFilters(candidates);
    },
    fetch: (repository, filter) => repository.getArmorDistribution(filter),
    labelFor: (value) => (value === "unarmed" ? "Sem Armadura" : (armors[value as keyof typeof armors]?.name ?? value)),
  },
  {
    metric: "abilityHighest",
    candidates: (context) => {
      const base: BuildFilter = context.classId ? { classId: context.classId } : {};
      const candidates: BuildFilter[] = [];
      if (context.level !== undefined) candidates.push({ ...base, ...levelBracket(context.level) });
      candidates.push(base);
      return dedupeFilters(candidates);
    },
    fetch: (repository, filter) => repository.getHighestAbilityDistribution(filter),
    labelFor: (value) => ABILITY_NAMES[value] ?? value,
  },
];

export interface InsightRuleOptions {
  minSampleSize?: number;
}

/**
 * Calcula UM insight (ou `null`, se a amostra for insuficiente em
 * todos os níveis de especificidade tentados). Função pura: só fala
 * com o `AnalyticsRepository` recebido, nunca importa Supabase
 * diretamente.
 */
export async function computeInsight(
  definition: MetricDefinition,
  repository: AnalyticsRepository,
  context: InsightContext,
  options: InsightRuleOptions = {},
): Promise<ChoiceInsight | null> {
  const minSampleSize = options.minSampleSize ?? MIN_SAMPLE_SIZE;
  const candidates = definition.candidates(context);
  if (!candidates) return null;

  const resolved = await resolveWithFallback(repository, candidates, (filter) => definition.fetch(repository, filter), minSampleSize);
  if (!resolved || resolved.rows.length === 0) return null;

  const items = toItems(resolved.rows, resolved.total, definition.labelFor).slice(0, 5);

  return {
    id: `${definition.metric}:${JSON.stringify(resolved.filter)}`,
    kind: "communityInsight",
    metric: definition.metric,
    scopeLabel: scopeLabel(resolved.filter, context),
    sampleSize: resolved.total,
    items,
  };
}

export const insightMetricDefinitions = METRICS;
