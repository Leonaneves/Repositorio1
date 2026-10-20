import { formatBlendBasis, formatProportionReason, type Recommendations } from "../../recommendations/recommendationReason.js";
import type { AbilityRecommendations } from "../../services/useBuildChoiceRecommendations.js";

export interface RecommendationReasonsHintProps {
  reasons: Recommendations;
  /** Nome exibido de cada valor recomendado (o mesmo do seletor, sem o "(Recomendado)"). */
  nameOf: (value: string) => string;
}

/**
 * Motivo das opções recomendadas de UM seletor, logo abaixo dele —
 * visível também no celular (um `title` no `<option>` não aparece em
 * toque). Recomendação de um fator só (Subclasse): uma linha por opção,
 * "Dracônica: escolhido por 7 de 10 feiticeiros". Recomendação de vários
 * fatores: uma linha só, "★ Recomendações com base em sua classe e sua
 * subclasse." Nada é exibido sem recomendação.
 */
export function RecommendationReasonsHint({ reasons, nameOf }: RecommendationReasonsHintProps) {
  if (reasons.size === 0) return null;
  const entries = [...reasons.reasons];
  const [, first] = entries[0];

  if (first.mode === "blend") {
    return (
      <p className="recommendation-reasons" aria-label="Por que recomendado">
        {formatBlendBasis(reasons.basis, first.source)}
      </p>
    );
  }
  return (
    <ul className="recommendation-reasons" aria-label="Por que recomendado">
      {entries.map(([value, reason]) =>
        reason.mode === "proportion" ? (
          <li key={value}>
            <strong>{nameOf(value)}</strong>: {formatProportionReason(reason.characters, reason.sampleCharacters, reason.source, reason.group)}
          </li>
        ) : null,
      )}
    </ul>
  );
}

/** Uma linha só para as recomendações de atributo (maior, 2º maior e menor usam os mesmos fatores). */
export function AbilityRecommendationsHint({ recommendations }: { recommendations: AbilityRecommendations }) {
  const first = [recommendations.highest, recommendations.second, recommendations.dump].find((entry) => entry.size > 0);
  return first ? <RecommendationReasonsHint reasons={first} nameOf={(value) => value} /> : null;
}
