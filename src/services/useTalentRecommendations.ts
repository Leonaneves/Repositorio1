import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { buildTalentChoiceCountQuery, type TalentOpportunityDescriptor } from "../recommendations/currentOpportunityContext.js";
import { REAL_RECORDS_ENABLED } from "../recommendations/policy.js";
import { getTalentRecommendations } from "../recommendations/talentRecommendationEngine.js";
import { NO_RECOMMENDATIONS, Recommendations, type RecommendationReason } from "../recommendations/recommendationReason.js";

export { withRecommendedLabel } from "../recommendations/recommendationReason.js";

/**
 * Talentos recomendados para UM seletor — sempre um subconjunto de
 * `eligibleTalentIds` (as opções habilitadas do próprio seletor, na
 * ordem exibida), no máximo 3. Influências (pedido do usuário):
 * classe → subclasse → atributos no momento da escolha
 * (`recommendations/scoring.ts#scoreTalentChoices`), por isso o motivo é
 * "★ Recomendado" + os fatores usados. Refaz a consulta só quando o
 * contexto da oportunidade ou a lista elegível muda; enquanto a nova
 * resposta não chega, nenhum rótulo antigo continua visível. Vazio =
 * seleção normal, sem rótulo. Nunca seleciona nada sozinho.
 */
export function useTalentRecommendations(descriptor: TalentOpportunityDescriptor | null, eligibleTalentIds: readonly string[]): Recommendations {
  const character = useCharacterStore((s) => s.character);
  const query = descriptor ? buildTalentChoiceCountQuery(character, descriptor, { includeUserRecords: REAL_RECORDS_ENABLED }) : null;
  const eligibleKey = eligibleTalentIds.join("|");
  const requestKey = query && eligibleTalentIds.length > 0 ? `${JSON.stringify(query)}#${eligibleKey}` : null;
  const basis = query ? ["sua classe", ...(query.subclassId ? ["sua subclasse"] : []), ...(query.highestAbility ? ["seus atributos"] : [])] : [];

  const [resolved, setResolved] = useState<{ key: string; reasons: [string, RecommendationReason][] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getTalentRecommendations(query, eligibleKey.split("|")).then((result) => {
      if (cancelled) return;
      const source = result?.pool === "user" ? "user" : "reference";
      setResolved({ key: requestKey, reasons: (result?.talentIds ?? []).map((talentId): [string, RecommendationReason] => [talentId, { mode: "blend", source }]) });
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` já codifica `query` e a lista elegível por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const basisKey = basis.join("|");
  return useMemo(
    () => (resolved && resolved.key === requestKey && resolved.reasons.length > 0 ? new Recommendations(new Map(resolved.reasons), basisKey.split("|")) : NO_RECOMMENDATIONS),
    [resolved, requestKey, basisKey],
  );
}
