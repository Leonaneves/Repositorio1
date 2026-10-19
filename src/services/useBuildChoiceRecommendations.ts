import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { MAX_BUILD_CHOICE_RECOMMENDATIONS, type BuildChoiceCountQuery, type BuildChoiceKind } from "../recommendations/buildChoiceRecommendations.js";
import { getBuildChoiceRecommendations } from "../recommendations/buildChoiceRecommendationEngine.js";

const NONE: ReadonlySet<string> = new Set();

export interface BuildChoiceRequest {
  kind: BuildChoiceKind;
  /** Só para `skillChoice`. */
  choiceId?: string;
}

/**
 * Valores recomendados para UM seletor de Espécie/Antecedente/Perícias/
 * Especialização ou para a distribuição de atributos — sempre um
 * subconjunto de `eligibleValues` (as opções habilitadas, na ordem
 * exibida), no máximo `MAX_BUILD_CHOICE_RECOMMENDATIONS[kind]`. Contexto:
 * classe (obrigatória) e subclasse atual. Mesmo comportamento de
 * `useTalentRecommendations`: refaz a consulta só quando o contexto ou a
 * lista elegível muda, nunca mostra rótulo antigo, nunca seleciona nada.
 */
export function useBuildChoiceRecommendations(request: BuildChoiceRequest | null, eligibleValues: readonly string[]): ReadonlySet<string> {
  const classId = useCharacterStore((s) => s.character.classId);
  const subclassId = useCharacterStore((s) => s.character.subclassId);
  const characterId = useCharacterStore((s) => s.character.id);

  const query: BuildChoiceCountQuery | null =
    request && classId
      ? { kind: request.kind, classId, subclassId, choiceId: request.choiceId ?? null, excludeCharacterId: characterId }
      : null;
  const eligibleKey = eligibleValues.join("|");
  const requestKey = query && eligibleValues.length > 0 ? `${JSON.stringify(query)}#${eligibleKey}` : null;
  const [resolved, setResolved] = useState<{ key: string; values: string[] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getBuildChoiceRecommendations(query, eligibleKey.split("|"), MAX_BUILD_CHOICE_RECOMMENDATIONS[query.kind]).then((result) => {
      if (!cancelled) setResolved({ key: requestKey, values: result?.values ?? [] });
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` já codifica `query` e a lista elegível por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return useMemo(
    () => (resolved && resolved.key === requestKey && resolved.values.length > 0 ? new Set(resolved.values) : NONE),
    [resolved, requestKey],
  );
}
