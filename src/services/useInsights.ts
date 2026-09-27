import { useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../state/characterStore.js";
import { getChoiceInsights } from "../analytics/insightEngine.js";
import { highestAbility } from "../repositories/AnalyticsRepository.js";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { ChoiceInsight, InsightContext, InsightMetric } from "../analytics/types.js";
import { useDebouncedValue } from "./useDebouncedValue.js";

const HIGHEST_ABILITY_DEBOUNCE_MS = 400;

/**
 * Deriva o `InsightContext` dos campos que devem disparar nova consulta
 * de insights: classe, subclasse, espécie, antecedente, nível (ver
 * §18) — e também `highestAbility` (§1.2), que é o único caso em que o
 * atributo do PRÓPRIO jogador entra no contexto (usado para comparar
 * com outros personagens de maior atributo igual, ex.: "entre DEX
 * alta, Couro Batido..."). Como digitar um atributo pode mudar
 * `highestAbility` a cada tecla, ele é debounced separadamente dos
 * demais campos — que continuam reagindo imediatamente.
 */
export function useInsightContext(): InsightContext {
  const classId = useCharacterStore((s) => s.character.classId);
  const subclassId = useCharacterStore((s) => s.character.subclassId);
  const speciesId = useCharacterStore((s) => s.character.speciesId);
  const backgroundId = useCharacterStore((s) => s.character.backgroundId);
  const level = useCharacterStore((s) => s.character.level);
  const abilities = useCharacterStore((s) => s.character.abilities);

  const rawHighestAbility = useMemo(() => {
    const scores = Object.fromEntries(ABILITY_KEYS.map((key) => [key, abilities[key].score])) as Record<AbilityKey, number>;
    return highestAbility(scores);
  }, [abilities]);
  const debouncedHighestAbility = useDebouncedValue(rawHighestAbility, HIGHEST_ABILITY_DEBOUNCE_MS);

  return useMemo<InsightContext>(
    () => ({
      classId: classId ?? undefined,
      subclassId: subclassId ?? undefined,
      speciesId: speciesId ?? undefined,
      backgroundId: backgroundId ?? undefined,
      level,
      highestAbility: debouncedHighestAbility,
    }),
    [classId, subclassId, speciesId, backgroundId, level, debouncedHighestAbility],
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
  }, [context.classId, context.subclassId, context.speciesId, context.backgroundId, context.level, context.highestAbility]);

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
