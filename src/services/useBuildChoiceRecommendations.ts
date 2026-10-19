import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { MAX_BUILD_CHOICE_RECOMMENDATIONS, type BuildChoiceCountQuery, type BuildChoiceKind } from "../recommendations/buildChoiceRecommendations.js";
import { getBuildChoiceRecommendations } from "../recommendations/buildChoiceRecommendationEngine.js";
import { NO_RECOMMENDATIONS, type RecommendationReason, type RecommendationReasons } from "../recommendations/recommendationReason.js";

export interface BuildChoiceRequest {
  kind: BuildChoiceKind;
  /** Só para `skillChoice`. */
  choiceId?: string;
}

/**
 * Valores recomendados para UM seletor de Espécie/Antecedente/Perícias/
 * Especialização/Subclasse/Metamagia ou para a distribuição de
 * atributos, cada um com o seu motivo (`RecommendationReason`) — sempre um
 * subconjunto de `eligibleValues` (as opções habilitadas, na ordem
 * exibida), no máximo `MAX_BUILD_CHOICE_RECOMMENDATIONS[kind]`. Contexto:
 * classe (obrigatória) e subclasse atual. Mesmo comportamento de
 * `useTalentRecommendations`: refaz a consulta só quando o contexto ou a
 * lista elegível muda, nunca mostra rótulo antigo, nunca seleciona nada.
 */
export function useBuildChoiceRecommendations(request: BuildChoiceRequest | null, eligibleValues: readonly string[]): RecommendationReasons {
  const classId = useCharacterStore((s) => s.character.classId);
  const subclassId = useCharacterStore((s) => s.character.subclassId);
  const characterId = useCharacterStore((s) => s.character.id);

  const query: BuildChoiceCountQuery | null =
    request && classId
      ? {
          kind: request.kind,
          classId,
          // A recomendação da própria Subclasse compara só com a classe — nunca com a subclasse já escolhida.
          subclassId: request.kind === "subclass" ? null : subclassId,
          choiceId: request.choiceId ?? null,
          excludeCharacterId: characterId,
        }
      : null;
  const eligibleKey = eligibleValues.join("|");
  const requestKey = query && eligibleValues.length > 0 ? `${JSON.stringify(query)}#${eligibleKey}` : null;
  const [resolved, setResolved] = useState<{ key: string; reasons: [string, RecommendationReason][] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getBuildChoiceRecommendations(query, eligibleKey.split("|"), MAX_BUILD_CHOICE_RECOMMENDATIONS[query.kind]).then((result) => {
      if (cancelled) return;
      const reasons = (result?.values ?? []).map(
        (value) => [value, { characters: result!.characters[value], sampleCharacters: result!.sampleCharacters, source: "user" }] as [string, RecommendationReason],
      );
      setResolved({ key: requestKey, reasons });
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` já codifica `query` e a lista elegível por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return useMemo(
    () => (resolved && resolved.key === requestKey && resolved.reasons.length > 0 ? new Map(resolved.reasons) : NO_RECOMMENDATIONS),
    [resolved, requestKey],
  );
}
