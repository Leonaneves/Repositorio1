import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { buildTalentChoiceCountQuery, type TalentOpportunityDescriptor } from "../recommendations/currentOpportunityContext.js";
import { REAL_RECORDS_ENABLED } from "../recommendations/policy.js";
import { getTalentRecommendations } from "../recommendations/talentRecommendationEngine.js";
import { NO_RECOMMENDATIONS, type RecommendationReason, type RecommendationReasons } from "../recommendations/recommendationReason.js";

/**
 * Ids recomendados para UM seletor de talento — sempre um subconjunto de
 * `eligibleTalentIds` (as opções habilitadas do próprio seletor, na
 * ordem exibida), com no máximo 3 itens, cada um com o seu motivo
 * (`RecommendationReason`, exibido por `RecommendationReasonsHint`). Refaz a consulta só quando o
 * contexto da oportunidade (classe, nível, subclasse, maior atributo
 * antes da aquisição) ou a lista elegível muda; enquanto a nova resposta
 * não chega, nenhum rótulo antigo continua visível (o resultado só vale
 * para a chave que o produziu). Conjunto vazio = seleção normal, sem
 * rótulo (sem dados, amostra insuficiente ou falha de conexão). Nunca
 * seleciona nada sozinho.
 */
export function useTalentRecommendations(descriptor: TalentOpportunityDescriptor | null, eligibleTalentIds: readonly string[]): RecommendationReasons {
  const character = useCharacterStore((s) => s.character);
  const query = descriptor ? buildTalentChoiceCountQuery(character, descriptor, { includeUserRecords: REAL_RECORDS_ENABLED }) : null;
  const eligibleKey = eligibleTalentIds.join("|");
  const requestKey = query && eligibleTalentIds.length > 0 ? `${JSON.stringify(query)}#${eligibleKey}` : null;

  const [resolved, setResolved] = useState<{ key: string; reasons: [string, RecommendationReason][] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getTalentRecommendations(query, eligibleKey.split("|")).then((result) => {
      if (cancelled) return;
      const source = result?.pool === "user" ? "user" : "reference";
      const reasons = (result?.talentIds ?? []).map(
        (talentId) => [talentId, { characters: result!.characters[talentId], sampleCharacters: result!.sampleCharacters, source }] as [string, RecommendationReason],
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

/** Texto exibido no `<option>` — só "(Recomendado)" ao lado do nome; o motivo (contagens) fica abaixo do seletor, em `RecommendationReasonsHint`. */
export function withRecommendedLabel(name: string, recommended: boolean): string {
  return recommended ? `${name} (Recomendado)` : name;
}
