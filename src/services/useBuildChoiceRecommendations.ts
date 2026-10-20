import { useEffect, useMemo, useState } from "react";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { useCharacterStore } from "../state/characterStore.js";
import { highestAbility } from "../repositories/AnalyticsRepository.js";
import { getEffectiveAbilityScore, hasGeneratedBaseAbilityScores } from "../rules/abilities.js";
import { getSpellcastingAbility } from "../rules/spellcasting.js";
import { MAX_BUILD_CHOICE_RECOMMENDATIONS, type BuildChoiceKind } from "../recommendations/buildChoiceRecommendations.js";
import { getBuildChoiceRecommendations } from "../recommendations/buildChoiceRecommendationEngine.js";
import { COOCCURRENCE_KINDS, SUBCLASS_REFINED_KINDS, type BuildChoiceScoreQuery } from "../recommendations/scoring.js";
import { CLASS_PLURAL, NO_RECOMMENDATIONS, Recommendations, SPECIES_PLURAL, type RecommendationReason } from "../recommendations/recommendationReason.js";

export interface BuildChoiceRequest {
  kind: BuildChoiceKind;
  /** Só para `skillChoice`. */
  choiceId?: string;
  /** Só para Metamagia/Invocações/Manobras: o que o personagem já escolheu (influencia as próximas). */
  withValues?: readonly string[];
  /**
   * Só para `skillChoice`: escolha de perícia que NÃO vem da classe/subclasse
   * (espécie, antecedente, talento) — a base passa a ser quem tem a mesma
   * escolha, de qualquer classe (ex.: Perícias de Elfo → outros elfos).
   * `label` = nome da origem, para a linha de explicação.
   */
  source?: { label: string };
}

/** O que já foi escolhido, descrito por tipo — usado na linha "★ Recomendações com base em …". */
const ALREADY_CHOSEN_LABEL: Partial<Record<BuildChoiceKind, string>> = {
  metamagic: "as Metamagias que você já escolheu",
  invocation: "as Invocações que você já escolheu",
  maneuver: "as Manobras que você já escolheu",
};

/** Fatores que influenciam cada tipo, na ordem de importância (para a linha de explicação). */
function basisFor(request: BuildChoiceRequest, character: Character, query: BuildChoiceScoreQuery): string[] {
  const subclass = query.subclassId ? ["sua subclasse"] : [];
  const chosen = query.withValues.length > 0 && ALREADY_CHOSEN_LABEL[request.kind] ? [ALREADY_CHOSEN_LABEL[request.kind]!] : [];
  const attributes = hasGeneratedBaseAbilityScores(character) ? ["seus atributos"] : [];
  switch (request.kind) {
    case "background":
      return ["sua classe", ...subclass, "os atributos que ela mais usa"];
    case "skillChoice":
      return request.source ? [`outros personagens com ${request.source.label}`, ...attributes] : [...attributes, "sua classe"];
    case "maneuver":
      return ["sua subclasse", ...chosen];
    default:
      return ["sua classe", ...subclass, ...chosen];
  }
}

function effectiveScores(character: Character): Record<AbilityKey, number> {
  return Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, getEffectiveAbilityScore(character, ability)])) as Record<AbilityKey, number>;
}

function buildQuery(request: BuildChoiceRequest, character: Character): BuildChoiceScoreQuery | null {
  const anyClass = request.kind === "lineage" || (request.kind === "skillChoice" && request.source !== undefined);
  if (!anyClass && !character.classId) return null;
  if (request.kind === "lineage" && !character.speciesId) return null;
  return {
    kind: request.kind,
    classId: anyClass ? null : character.classId,
    speciesId: request.kind === "lineage" ? character.speciesId : null,
    subclassId: SUBCLASS_REFINED_KINDS.includes(request.kind) ? character.subclassId : null,
    choiceId: request.choiceId ?? null,
    highestAbility:
      request.kind === "skillChoice" && hasGeneratedBaseAbilityScores(character)
        ? highestAbility(Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, character.abilities[ability].score])) as Record<AbilityKey, number>)
        : null,
    withValues: COOCCURRENCE_KINDS.includes(request.kind) ? [...new Set(request.withValues ?? [])] : [],
    excludeCharacterId: character.id,
  };
}

/** Grupo comparado nas recomendações de um fator só: Subclasse → a classe; Linhagem → a espécie. */
function proportionGroup(kind: BuildChoiceKind, character: Character): string | null {
  if (kind === "subclass" && character.classId) return CLASS_PLURAL[character.classId];
  if (kind === "lineage" && character.speciesId) return SPECIES_PLURAL[character.speciesId];
  return null;
}

/**
 * Recomendações de UM seletor de Espécie, Linhagem, Antecedente, Perícias,
 * Especialização, Subclasse, Metamagia, Invocações, Manobras ou da
 * distribuição de atributos — sempre um subconjunto de `eligibleValues`
 * (as opções habilitadas, na ordem exibida), no máximo
 * `MAX_BUILD_CHOICE_RECOMMENDATIONS[kind]`. Fatores de influência por
 * tipo em `recommendations/scoring.ts` e `ruleInfluence.ts`. Refaz a
 * consulta só quando o contexto ou a lista elegível muda, nunca mostra
 * rótulo antigo, nunca seleciona nada.
 */
export function useBuildChoiceRecommendations(request: BuildChoiceRequest | null, eligibleValues: readonly string[]): Recommendations {
  const character = useCharacterStore((s) => s.character);
  const query = request ? buildQuery(request, character) : null;
  const abilityScores = request?.kind === "skillChoice" && hasGeneratedBaseAbilityScores(character) ? effectiveScores(character) : null;
  const basis = query && request ? basisFor(request, character, query) : [];
  const group = request ? proportionGroup(request.kind, character) : null;

  const eligibleKey = eligibleValues.join("|");
  const requestKey = query && eligibleValues.length > 0 ? `${JSON.stringify(query)}#${JSON.stringify(abilityScores)}#${eligibleKey}` : null;
  const [resolved, setResolved] = useState<{ key: string; reasons: [string, RecommendationReason][] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getBuildChoiceRecommendations({ query, eligibleValues: eligibleKey.split("|"), max: MAX_BUILD_CHOICE_RECOMMENDATIONS[query.kind], abilityScores }).then((result) => {
      if (cancelled) return;
      const reasons = (result?.values ?? []).map((value): [string, RecommendationReason] => [
        value,
        group
          ? { mode: "proportion", characters: result!.characters[value], sampleCharacters: result!.classSample, source: "user", group }
          : { mode: "blend", source: "user" },
      ]);
      setResolved({ key: requestKey, reasons });
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` já codifica `query`, os atributos e a lista elegível por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const basisKey = basis.join("|");
  return useMemo(
    () => (resolved && resolved.key === requestKey && resolved.reasons.length > 0 ? new Recommendations(new Map(resolved.reasons), basisKey.split("|")) : NO_RECOMMENDATIONS),
    [resolved, requestKey, basisKey],
  );
}

export interface AbilityRecommendations {
  highest: Recommendations;
  second: Recommendations;
  dump: Recommendations;
  /** Rótulo curto para cada atributo recomendado ("★ maior", "★ 2º maior", "★ menor") — `null` se nenhum. */
  tagOf: (ability: AbilityKey) => string | null;
}

/**
 * Recomendações da distribuição de atributos (classe → subclasse), usadas
 * nos valores base, nos aumentos do Antecedente e de cada ASI — sempre a
 * distribuição GERAL dos jogadores (maior, 2º maior, menor), nunca a do
 * próprio Antecedente. Os três nunca recaem no mesmo atributo: o 2º maior
 * exclui o maior recomendado, e o menor exclui os dois.
 */
export function useAbilityRecommendations(enabled = true): AbilityRecommendations {
  const highest = useBuildChoiceRecommendations(enabled ? { kind: "highestAbility" } : null, ABILITY_KEYS);
  const second = useBuildChoiceRecommendations(
    enabled ? { kind: "secondAbility" } : null,
    ABILITY_KEYS.filter((ability) => !highest.has(ability)),
  );
  const dump = useBuildChoiceRecommendations(
    enabled ? { kind: "dumpAbility" } : null,
    ABILITY_KEYS.filter((ability) => !highest.has(ability) && !second.has(ability)),
  );
  return {
    highest,
    second,
    dump,
    tagOf: (ability) => (highest.has(ability) ? "★ maior" : second.has(ability) ? "★ 2º maior" : dump.has(ability) ? "★ menor" : null),
  };
}

/**
 * Talentos que aumentam um atributo à escolha (ex.: +1 de Resiliente,
 * Atleta): 1ª prioridade, o atributo de conjuração do personagem (regra,
 * não precisa de dados); 2ª, o maior atributo escolhido pelos outros
 * jogadores da classe/subclasse (a mesma estatística da distribuição de
 * atributos), depois o 2º maior — sempre só entre `options` (as opções
 * do próprio talento). No máximo 1 recomendação.
 */
export function useAbilityIncreaseRecommendation(options: readonly AbilityKey[] | null): Recommendations {
  const character = useCharacterStore((s) => s.character);
  const spellcasting = options ? getSpellcastingAbility(character) : null;
  const useSpellcasting = spellcasting !== null && options !== null && options.includes(spellcasting);
  const abilities = useAbilityRecommendations(options !== null && !useSpellcasting);
  const optionsKey = options?.join("|") ?? "";

  return useMemo(() => {
    if (!options) return NO_RECOMMENDATIONS;
    if (useSpellcasting) return new Recommendations(new Map([[spellcasting!, { mode: "blend", source: "user" }]]), ["seu atributo de conjuração"]);
    for (const candidate of [abilities.highest, abilities.second]) {
      const [ability] = [...candidate.reasons.keys()];
      if (ability && options.includes(ability as AbilityKey)) {
        return new Recommendations(new Map([[ability, { mode: "blend", source: "user" }]]), [...candidate.basis, "o maior atributo escolhido pelos outros jogadores"]);
      }
    }
    return NO_RECOMMENDATIONS;
    // `optionsKey` codifica `options` por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, useSpellcasting, spellcasting, abilities.highest, abilities.second]);
}
