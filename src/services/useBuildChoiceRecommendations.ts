import { useEffect, useMemo, useState } from "react";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { useCharacterStore } from "../state/characterStore.js";
import { highestAbility } from "../repositories/AnalyticsRepository.js";
import { getEffectiveAbilityScore, hasGeneratedBaseAbilityScores } from "../rules/abilities.js";
import { MAX_BUILD_CHOICE_RECOMMENDATIONS, type BuildChoiceKind } from "../recommendations/buildChoiceRecommendations.js";
import { getBuildChoiceRecommendations } from "../recommendations/buildChoiceRecommendationEngine.js";
import { COOCCURRENCE_KINDS, SUBCLASS_REFINED_KINDS, type BuildChoiceScoreQuery } from "../recommendations/scoring.js";
import { NO_RECOMMENDATIONS, Recommendations, type RecommendationReason } from "../recommendations/recommendationReason.js";

export interface BuildChoiceRequest {
  kind: BuildChoiceKind;
  /** Só para `skillChoice`. */
  choiceId?: string;
  /** Só para Metamagia/Invocações/Manobras: o que o personagem já escolheu (influencia as próximas). */
  withValues?: readonly string[];
}

/** O que já foi escolhido, descrito por tipo — usado na linha "★ Recomendações com base em …". */
const ALREADY_CHOSEN_LABEL: Partial<Record<BuildChoiceKind, string>> = {
  metamagic: "as Metamagias que você já escolheu",
  invocation: "as Invocações que você já escolheu",
  maneuver: "as Manobras que você já escolheu",
};

/** Fatores que influenciam cada tipo, na ordem de importância (para a linha de explicação). */
function basisFor(kind: BuildChoiceKind, character: Character, query: BuildChoiceScoreQuery): string[] {
  const subclass = query.subclassId ? ["sua subclasse"] : [];
  const chosen = query.withValues.length > 0 && ALREADY_CHOSEN_LABEL[kind] ? [ALREADY_CHOSEN_LABEL[kind]!] : [];
  switch (kind) {
    case "background":
      return ["sua classe", ...subclass, "os atributos que ela mais usa"];
    case "skillChoice":
      return hasGeneratedBaseAbilityScores(character) ? ["seus atributos", "sua classe"] : ["sua classe"];
    case "maneuver":
      return ["sua subclasse", ...chosen];
    default:
      return ["sua classe", ...subclass, ...chosen];
  }
}

function effectiveScores(character: Character): Record<AbilityKey, number> {
  return Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, getEffectiveAbilityScore(character, ability)])) as Record<AbilityKey, number>;
}

/**
 * Recomendações de UM seletor de Espécie, Antecedente, Perícias,
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
  const kind = request?.kind;

  const query: BuildChoiceScoreQuery | null =
    request && character.classId
      ? {
          kind: request.kind,
          classId: character.classId,
          subclassId: SUBCLASS_REFINED_KINDS.includes(request.kind) ? character.subclassId : null,
          choiceId: request.choiceId ?? null,
          highestAbility:
            request.kind === "skillChoice" && hasGeneratedBaseAbilityScores(character)
              ? highestAbility(Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, character.abilities[ability].score])) as Record<AbilityKey, number>)
              : null,
          withValues: COOCCURRENCE_KINDS.includes(request.kind) ? [...new Set(request.withValues ?? [])] : [],
          excludeCharacterId: character.id,
        }
      : null;
  const abilityScores = kind === "skillChoice" && hasGeneratedBaseAbilityScores(character) ? effectiveScores(character) : null;
  const basis = query && kind ? basisFor(kind, character, query) : [];

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
        query.kind === "subclass"
          ? { mode: "proportion", characters: result!.characters[value], sampleCharacters: result!.classSample, source: "user" }
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
