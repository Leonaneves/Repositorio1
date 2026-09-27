import { useState } from "react";
import type { ChoiceInsight } from "../../analytics/types.js";
import { findInsightItem } from "../../services/useInsights.js";

export interface InsightTooltipProps {
  insight: ChoiceInsight | undefined;
  /** Rótulo de exibição do valor já escolhido (ex.: "Evocador", "Artista"). */
  chosenLabel: string;
  /** Frase que antecede o percentual, ex.: "dos Magos registrados" ou "dos Bardos registrados escolheram Artista". */
  scopePhrase?: string;
}

/**
 * Nota pequena e contextual sobre UMA escolha já feita (ex.: a
 * subclasse ou o antecedente que o jogador acabou de selecionar) —
 * acionada voluntariamente ao olhar para o campo, então NÃO passa pela
 * sessão/mutex de popups automáticos (§9: "tooltip acionado
 * voluntariamente não conta como popup automático"). Sempre visível
 * enquanto houver dado suficiente para aquele valor específico — some
 * sozinha se a amostra cair abaixo do mínimo.
 */
export function InsightTooltip({ insight, chosenLabel, scopePhrase }: InsightTooltipProps) {
  const [dismissed, setDismissed] = useState(false);
  const item = findInsightItem(insight, chosenLabel);

  if (dismissed || !insight || !item) return null;

  return (
    <p className="insight insight--community insight-tooltip">
      <span className="insight-tooltip__body">
        <strong>{chosenLabel}</strong>
        <span className="insight-tooltip__detail">
          {item.percentage}% {scopePhrase ?? `dos ${insight.scopeLabel.toLowerCase()}`}
        </span>
      </span>
      <button type="button" className="insight__close" aria-label="Dispensar" onClick={() => setDismissed(true)}>
        ×
      </button>
    </p>
  );
}
