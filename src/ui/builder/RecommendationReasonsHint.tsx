import { useCharacterStore } from "../../state/characterStore.js";
import { formatRecommendationReason, type RecommendationReasons } from "../../recommendations/recommendationReason.js";

export interface RecommendationReasonsHintProps {
  reasons: RecommendationReasons;
  /** Nome exibido de cada valor recomendado (o mesmo do seletor, sem o "(Recomendado)"). */
  nameOf: (value: string) => string;
  /** Início da frase — "escolhido por" por padrão; ex.: "o maior atributo de". */
  verb?: string;
}

/**
 * Motivo das opções recomendadas de UM seletor, logo abaixo dele — ex.:
 * "Anão: escolhido por 4 de 10 guerreiros". Visível também no celular
 * (um `title` no `<option>` não aparece em toque). Nada é exibido sem
 * recomendação.
 */
export function RecommendationReasonsHint({ reasons, nameOf, verb }: RecommendationReasonsHintProps) {
  const classId = useCharacterStore((s) => s.character.classId);
  if (!classId || reasons.size === 0) return null;
  return (
    <ul className="recommendation-reasons" aria-label="Por que recomendado">
      {[...reasons].map(([value, reason]) => (
        <li key={value}>
          <strong>{nameOf(value)}</strong>: {formatRecommendationReason(reason, classId, verb)}
        </li>
      ))}
    </ul>
  );
}
