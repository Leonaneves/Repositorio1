import { useCharacterStore } from "../../state/characterStore.js";
import { formatBlendBasis, formatProportionReason, type Recommendations } from "../../recommendations/recommendationReason.js";

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
  const classId = useCharacterStore((s) => s.character.classId);
  if (!classId || reasons.size === 0) return null;
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
            <strong>{nameOf(value)}</strong>: {formatProportionReason(reason.characters, reason.sampleCharacters, reason.source, classId)}
          </li>
        ) : null,
      )}
    </ul>
  );
}
