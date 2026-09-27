import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { getChoiceInsights } from "../analytics/insightEngine.js";
import type { ChoiceInsight, InsightContext, InsightMetric } from "../analytics/types.js";

/**
 * Deriva o `InsightContext` só dos campos que devem disparar nova
 * consulta de insights (classe, subclasse, espécie, antecedente,
 * nível — ver §18). Atributos NÃO entram aqui: nenhuma métrica de
 * insight usa o valor do atributo do PRÓPRIO jogador como filtro (a
 * métrica `abilityHighest` descreve os personagens de outros usuários,
 * não pede o atributo do usuário atual como parâmetro) — então digitar
 * um atributo nunca dispara uma nova consulta de insights.
 */
export function useInsightContext(): InsightContext {
  const classId = useCharacterStore((s) => s.character.classId);
  const subclassId = useCharacterStore((s) => s.character.subclassId);
  const speciesId = useCharacterStore((s) => s.character.speciesId);
  const backgroundId = useCharacterStore((s) => s.character.backgroundId);
  const level = useCharacterStore((s) => s.character.level);

  return useMemo<InsightContext>(
    () => ({
      classId: classId ?? undefined,
      subclassId: subclassId ?? undefined,
      speciesId: speciesId ?? undefined,
      backgroundId: backgroundId ?? undefined,
      level,
    }),
    [classId, subclassId, speciesId, backgroundId, level],
  );
}

export interface UseInsightsResult {
  insights: ChoiceInsight[];
  loading: boolean;
}

/** Busca os insights disponíveis para o contexto atual do personagem, e refaz a consulta só quando esse contexto muda. */
export function useInsights(): UseInsightsResult {
  const context = useInsightContext();
  const [insights, setInsights] = useState<ChoiceInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getChoiceInsights(context)
      .then((result) => {
        if (!cancelled) setInsights(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.classId, context.subclassId, context.speciesId, context.backgroundId, context.level]);

  return { insights, loading };
}

/** Encontra, dentro de um insight já carregado, a linha correspondente a um valor específico já escolhido (ex.: tooltip "Evocador: 31%"). */
export function findInsightItem(insight: ChoiceInsight | undefined, label: string) {
  return insight?.items.find((item) => item.label === label);
}

/** Encontra, dentro do array devolvido por `getChoiceInsights`, o insight de uma métrica específica (se ela tiver amostra suficiente). */
export function findInsightByMetric(insights: ChoiceInsight[], metric: InsightMetric): ChoiceInsight | undefined {
  return insights.find((insight) => insight.metric === metric);
}
