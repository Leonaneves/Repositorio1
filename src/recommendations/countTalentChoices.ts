import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { highestAbility } from "../repositories/AnalyticsRepository.js";
import { deriveOpportunityKind } from "./opportunityKind.js";
import { CONTEXT_TIERS, factMatchesTier, MIN_REAL_CHARACTERS } from "./policy.js";
import type { TalentChoiceCountQuery, TalentChoiceCountRow, TalentChoiceFact } from "./types.js";

/**
 * Implementação EM MEMÓRIA da contagem que a função SQL
 * `get_talent_choice_counts` (migration 0004) faz no banco — mesmas
 * regras, mesma forma de saída, para o app funcionar sem backend e para
 * os testes compararem as duas (`supabase/talentRecommendations.sql.test.ts`).
 */

/** Maior atributo de um objeto de atributos gravado — `null` se não for um objeto com os 6 valores numéricos (nunca completa com zero). */
export function highestAbilityOrNull(scores: unknown): AbilityKey | null {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;
  const record = scores as Record<string, unknown>;
  if (!ABILITY_KEYS.every((key) => typeof record[key] === "number" && Number.isFinite(record[key]))) return null;
  return highestAbility(record as Record<AbilityKey, number>);
}

/**
 * Aquisições VOLUNTÁRIAS de uma versão confirmada de personagem real, no
 * formato comum de contagem — `[]` para rascunhos, registros de
 * referência e qualquer build ainda sem classe. Quem chama passa só a
 * versão mais recente de cada personagem (`latestConfirmedUserBuilds`). O Talento de Origem do Antecedente
 * (`voluntary: false`) é só contexto e nunca vira um fato contável.
 */
export function buildToTalentChoiceFacts(build: CharacterBuild): TalentChoiceFact[] {
  if (build.origin !== "user" || build.status !== "confirmed" || !build.classId) return [];
  const classId = build.classId;
  return (build.talentAcquisitions ?? [])
    .filter((record) => record.voluntary)
    .map((record) => {
      const subclassId = record.context?.subclassId;
      return {
        pool: "user" as const,
        characterKey: build.characterId,
        groupKey: build.characterId,
        opportunityKind: deriveOpportunityKind(record),
        classId,
        level: record.acquisitionLevel ?? null,
        subclassId: typeof subclassId === "string" && subclassId !== "desconhecido" ? subclassId : null,
        highestAbility: highestAbilityOrNull(record.context?.abilityScores),
        talentId: record.talentId,
      };
    });
}

/**
 * Contagens por (conjunto, faixa, talento) para a consulta — personagens
 * DISTINTOS (nunca aquisições), amostra e grupos de fontes
 * independentes por (conjunto, faixa). Para dados reais, só devolve as
 * faixas que já atingem `MIN_REAL_CHARACTERS` (mesmo corte de
 * privacidade da função SQL: contagens reais pequenas nunca saem do
 * repositório).
 */
export function countTalentChoices(facts: readonly TalentChoiceFact[], query: TalentChoiceCountQuery): TalentChoiceCountRow[] {
  const relevant = facts.filter(
    (fact) =>
      fact.opportunityKind === query.opportunityKind &&
      fact.classId === query.classId &&
      (fact.pool !== "user" || (query.includeUserRecords && fact.characterKey !== query.excludeCharacterId)),
  );

  const rows: TalentChoiceCountRow[] = [];
  for (const tier of CONTEXT_TIERS) {
    const matched = relevant.filter((fact) => factMatchesTier(fact, tier, query));
    const pools = new Set(matched.map((fact) => fact.pool));
    for (const pool of pools) {
      const poolFacts = matched.filter((fact) => fact.pool === pool);
      const sampleCharacters = new Set(poolFacts.map((fact) => fact.characterKey)).size;
      const sampleGroups = new Set(poolFacts.map((fact) => fact.groupKey)).size;
      if (pool === "user" && sampleCharacters < MIN_REAL_CHARACTERS) continue;

      const byTalent = new Map<string, { characters: Set<string>; groups: Set<string> }>();
      for (const fact of poolFacts) {
        const entry = byTalent.get(fact.talentId) ?? { characters: new Set<string>(), groups: new Set<string>() };
        entry.characters.add(fact.characterKey);
        entry.groups.add(fact.groupKey);
        byTalent.set(fact.talentId, entry);
      }
      for (const [talentId, entry] of byTalent) {
        rows.push({
          pool,
          tier: tier.tier,
          talentId,
          characters: entry.characters.size,
          independentGroups: entry.groups.size,
          sampleCharacters,
          sampleGroups,
        });
      }
    }
  }
  return rows;
}
