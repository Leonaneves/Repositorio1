import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { buildTalentChoiceCountQuery, type TalentOpportunityDescriptor } from "../recommendations/currentOpportunityContext.js";
import { REAL_RECORDS_ENABLED } from "../recommendations/policy.js";
import { getTalentRecommendations } from "../recommendations/talentRecommendationEngine.js";

const NO_RECOMMENDATIONS: ReadonlySet<string> = new Set();

/**
 * Ids recomendados para UM seletor de talento — sempre um subconjunto de
 * `eligibleTalentIds` (as opções habilitadas do próprio seletor, na
 * ordem exibida), com no máximo 3 itens. Refaz a consulta só quando o
 * contexto da oportunidade (classe, nível, subclasse, maior atributo
 * antes da aquisição) ou a lista elegível muda; enquanto a nova resposta
 * não chega, nenhum rótulo antigo continua visível (o resultado só vale
 * para a chave que o produziu). Conjunto vazio = seleção normal, sem
 * rótulo (sem dados, amostra insuficiente ou falha de conexão). Nunca
 * seleciona nada sozinho.
 */
export function useTalentRecommendations(descriptor: TalentOpportunityDescriptor | null, eligibleTalentIds: readonly string[]): ReadonlySet<string> {
  const character = useCharacterStore((s) => s.character);
  const query = descriptor ? buildTalentChoiceCountQuery(character, descriptor, { includeUserRecords: REAL_RECORDS_ENABLED }) : null;
  const eligibleKey = eligibleTalentIds.join("|");
  const requestKey = query && eligibleTalentIds.length > 0 ? `${JSON.stringify(query)}#${eligibleKey}` : null;

  const [resolved, setResolved] = useState<{ key: string; talentIds: string[] } | null>(null);

  useEffect(() => {
    if (!requestKey || !query) return;
    let cancelled = false;
    getTalentRecommendations(query, eligibleKey.split("|")).then((result) => {
      if (!cancelled) setResolved({ key: requestKey, talentIds: result?.talentIds ?? [] });
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` já codifica `query` e a lista elegível por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return useMemo(
    () => (resolved && resolved.key === requestKey && resolved.talentIds.length > 0 ? new Set(resolved.talentIds) : NO_RECOMMENDATIONS),
    [resolved, requestKey],
  );
}

/** Texto exibido no `<option>` — só "(Recomendado)" ao lado do nome, sem travessão e sem contagens (fonte §1). */
export function withRecommendedLabel(name: string, recommended: boolean): string {
  return recommended ? `${name} (Recomendado)` : name;
}
