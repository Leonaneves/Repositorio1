import type { AbilityKey } from "../domain/common.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import type { ClassId, SpeciesId } from "../domain/ids.js";
import { highestAbility, lowestAbility, secondHighestAbility } from "../repositories/AnalyticsRepository.js";
import { countTalentChoices } from "./countTalentChoices.js";
import { meetsMinimumSample, MIN_REAL_CHARACTERS } from "./policy.js";
import type { ContextTier, RecommendationPool, TalentChoiceCountQuery, TalentChoiceFact } from "./types.js";

/**
 * Pontuação das recomendações por HIERARQUIA DE INFLUÊNCIA (pedido do
 * usuário: "quanto mais diretamente uma escolha define o funcionamento
 * mecânico do personagem, maior deve ser sua influência"). Implementação
 * em memória — mesma regra das funções SQL `get_build_choice_scores` e
 * `get_talent_choice_scores` (migration 0008), comparadas nos testes.
 *
 * A CLASSE define a base: a fração de personagens da mesma classe que
 * fizeram cada escolha — só com `MIN_REAL_CHARACTERS` personagens
 * distintos (abaixo disso, nada). Exceções de base: Linhagem usa a mesma
 * ESPÉCIE (qualquer classe); Perícias de espécie/antecedente/talento usam
 * quem tem a mesma escolha (qualquer classe — `classId: null`). Cada fator mais específico REFINA a
 * base por suavização, em vez de exigir 10 personagens por fator:
 *
 *     refinado(v) = (escolheram_no_contexto(v) + K × base(v)) / (amostra_do_contexto + K)
 *
 * Com 2 Campeões, a subclasse mexe pouco no ranking da classe; com 50,
 * passa a decidir. `K` maior = a classe pesa mais (Espécie: pedido "a
 * classe define a recomendação").
 */

export const SMOOTHING_K = 10;
/** Espécie: a classe tem prioridade sobre a subclasse. */
export const SPECIES_SMOOTHING_K = 20;

export type BuildChoiceKind =
  | "species"
  | "lineage"
  | "background"
  | "highestAbility"
  | "secondAbility"
  | "dumpAbility"
  | "abilityScore"
  | "skillChoice"
  | "subclass"
  | "metamagic"
  | "invocation"
  | "maneuver";

/** Tipos com várias escolhas por personagem, em que as já feitas influenciam as próximas (coocorrência). */
export const COOCCURRENCE_KINDS: readonly BuildChoiceKind[] = ["metamagic", "invocation", "maneuver"];
/** Tipos refinados pela subclasse (a Subclasse em si e as Perícias não). */
export const SUBCLASS_REFINED_KINDS: readonly BuildChoiceKind[] = ["species", "background", "highestAbility", "secondAbility", "dumpAbility", "abilityScore", "invocation", "maneuver"];

export interface BuildChoiceScoreQuery {
  kind: BuildChoiceKind;
  /** Base: mesma classe. `null` = qualquer classe (Linhagem; Perícias de espécie/antecedente/talento). */
  classId: ClassId | null;
  /** Base: mesma espécie (Linhagem). `null` = qualquer espécie. */
  speciesId: SpeciesId | null;
  /** Subclasse atual (refina os tipos de `SUBCLASS_REFINED_KINDS`). */
  subclassId: string | null;
  /** `skillChoice`: id da `FeatureChoice`; `abilityScore`: o atributo (ex.: "CON"). */
  choiceId: string | null;
  /** Só para `skillChoice`: maior atributo base do personagem atual. */
  highestAbility: AbilityKey | null;
  /** Só para os tipos de `COOCCURRENCE_KINDS`: opções que o personagem já escolheu. */
  withValues: string[];
  /** O próprio personagem (todas as versões) nunca conta. */
  excludeCharacterId: string | null;
}

export interface BuildChoiceScoreRow {
  value: string;
  score: number;
  /** Personagens da classe que fizeram esta escolha — base do motivo "escolhido por X de 10" (Subclasse). */
  classCharacters: number;
  classSample: number;
}

/** Valores de UM personagem para o tipo (`vals` = todos, para coocorrência). */
function buildValues(build: CharacterBuild, query: BuildChoiceScoreQuery): string[] {
  switch (query.kind) {
    case "species":
      return build.speciesId ? [build.speciesId] : [];
    case "lineage":
      return build.speciesLineageId ? [build.speciesLineageId] : [];
    case "background":
      return build.backgroundId ? [build.backgroundId] : [];
    case "highestAbility":
      return [highestAbility(build.abilityScores)];
    case "secondAbility":
      return [secondHighestAbility(build.abilityScores)];
    case "dumpAbility":
      return [lowestAbility(build.abilityScores)];
    case "abilityScore": {
      // Valor BASE escolhido para um atributo (ex.: CON = "14") — recomendação do Array Padrão.
      const score = query.choiceId ? build.abilityScores[query.choiceId as AbilityKey] : undefined;
      return typeof score === "number" ? [String(score)] : [];
    }
    case "skillChoice":
      return query.choiceId ? [...(build.skillChoices?.[query.choiceId] ?? [])] : [];
    case "subclass":
      return build.subclassId ? [build.subclassId] : [];
    case "metamagic":
      return [...(build.metamagicOptions ?? [])];
    case "invocation":
      return [...(build.invocationIds ?? [])];
    case "maneuver":
      return [...(build.maneuverIds ?? [])];
  }
}

interface ContextCounts {
  sample: number;
  counts: Map<string, number>;
}

function countContext(entries: readonly { build: CharacterBuild; values: string[] }[], exclude?: string): ContextCounts {
  const counts = new Map<string, number>();
  for (const { values } of entries) {
    for (const value of new Set(values)) {
      if (value === exclude) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return { sample: entries.length, counts };
}

function smooth(context: ContextCounts, value: string, prior: number, k: number): number {
  return ((context.counts.get(value) ?? 0) + k * prior) / (context.sample + k);
}

/** Pontuação de cada opção já escolhida por alguém da base — `[]` com menos de `MIN_REAL_CHARACTERS` personagens. */
export function scoreBuildChoices(latestBuilds: readonly CharacterBuild[], query: BuildChoiceScoreQuery): BuildChoiceScoreRow[] {
  const entries = latestBuilds
    .filter(
      (build) =>
        (query.classId === null || build.classId === query.classId) &&
        (query.speciesId === null || build.speciesId === query.speciesId) &&
        build.characterId !== query.excludeCharacterId,
    )
    .map((build) => ({ build, values: buildValues(build, query) }))
    .filter((entry) => entry.values.length > 0);

  const classContext = countContext(entries);
  if (classContext.sample < MIN_REAL_CHARACTERS) return [];

  const useSubclass = SUBCLASS_REFINED_KINDS.includes(query.kind) && query.subclassId !== null;
  const useAbility = query.kind === "skillChoice" && query.highestAbility !== null;
  const withValues = [...new Set(COOCCURRENCE_KINDS.includes(query.kind) ? query.withValues : [])];
  const subclassK = query.kind === "species" ? SPECIES_SMOOTHING_K : SMOOTHING_K;

  const subclassContext = countContext(entries.filter((entry) => entry.build.subclassId === query.subclassId));
  const abilityContext = countContext(entries.filter((entry) => highestAbility(entry.build.abilityScores) === query.highestAbility));
  const withContexts = withValues.map((x) => countContext(entries.filter((entry) => entry.values.includes(x)), x));

  const rows: BuildChoiceScoreRow[] = [];
  for (const [value, classCharacters] of classContext.counts) {
    if (query.withValues.includes(value) && COOCCURRENCE_KINDS.includes(query.kind)) continue;
    let score = classCharacters / classContext.sample;
    if (useSubclass) score = smooth(subclassContext, value, score, subclassK);
    if (useAbility) score = smooth(abilityContext, value, score, SMOOTHING_K);
    if (withContexts.length > 0) {
      const prior = score;
      score = withContexts.reduce((total, context) => total + smooth(context, value, prior, SMOOTHING_K), 0) / withContexts.length;
    }
    rows.push({ value, score, classCharacters, classSample: classContext.sample });
  }
  return rows;
}

export interface TalentChoiceScoreRow {
  pool: RecommendationPool;
  talentId: string;
  score: number;
  /** Personagens/grupos que escolheram o talento na base (mesma classe). */
  baseCharacters: number;
  baseGroups: number;
  baseSample: number;
}

/**
 * Talentos: por conjunto (reais / referências — nunca misturados), base =
 * mesma classe e mesmo tipo de oportunidade (o nível nunca influencia),
 * refinada pela subclasse e pelo maior atributo no momento da escolha, e
 * depois pelos dois juntos.
 */
export function scoreTalentChoices(facts: readonly TalentChoiceFact[], query: TalentChoiceCountQuery): TalentChoiceScoreRow[] {
  const rows = countTalentChoices(facts, query, { applyMinimum: false });
  const sampleOf = (pool: RecommendationPool, tier: ContextTier) => {
    const row = rows.find((candidate) => candidate.pool === pool && candidate.tier === tier);
    return row ? { n: row.sampleCharacters, groups: row.sampleGroups } : { n: 0, groups: 0 };
  };
  const countOf = (pool: RecommendationPool, tier: ContextTier, talentId: string) =>
    rows.find((candidate) => candidate.pool === pool && candidate.tier === tier && candidate.talentId === talentId)?.characters ?? 0;

  const result: TalentChoiceScoreRow[] = [];
  for (const pool of new Set(rows.map((row) => row.pool))) {
    const baseTier: ContextTier = "class";
    const base = sampleOf(pool, baseTier);
    if (base.n === 0 || !meetsMinimumSample(pool, base.n, base.groups)) continue;
    for (const row of rows.filter((candidate) => candidate.pool === pool && candidate.tier === baseTier)) {
      const prior = row.characters / base.n;
      const refine = (tier: ContextTier, p: number) => (countOf(pool, tier, row.talentId) + SMOOTHING_K * p) / (sampleOf(pool, tier).n + SMOOTHING_K);
      const pSubclass = refine("class_subclass", prior);
      const pAbility = refine("class_ability", prior);
      let score: number;
      if (query.subclassId !== null && query.highestAbility !== null) score = refine("class_subclass_ability", (pSubclass + pAbility) / 2);
      else if (query.subclassId !== null) score = pSubclass;
      else if (query.highestAbility !== null) score = pAbility;
      else score = prior;
      result.push({ pool, talentId: row.talentId, score, baseCharacters: row.characters, baseGroups: row.independentGroups, baseSample: base.n });
    }
  }
  return result;
}
