import { useState } from "react";
import type { ChoiceInsight } from "../../analytics/types.js";
import { findInsightItem } from "../../services/useInsights.js";

export interface InsightTooltipProps {
  insight: ChoiceInsight | undefined;
  /** Rótulo de exibição do valor já escolhido (ex.: "Evocador", "Artista"). */
  chosenLabel: string;
  /** Frase que antecede o percentual, ex.: "escolhido por" ou "combinado com Bardo em". */
  phrase?: string;
}

/**
 * Nota pequena e contextual sobre UMA escolha já feita (ex.: a
 * subclasse ou o antecedente que o jogador acabou de selecionar).
 * Sempre visível enquanto houver dado suficiente para aquele valor
 * específico — some sozinha se a amostra cair abaixo do mínimo (a
 * função de insight simplesmente não devolve aquele item, ver §11/§12).
 * Dispensável, mas reaparece se o campo mudar de novo para um valor
 * com dado disponível (não é um popup de "uma vez só").
 */
export function InsightTooltip({ insight, chosenLabel, phrase = "escolhido por" }: InsightTooltipProps) {
  const [dismissed, setDismissed] = useState(false);
  const item = findInsightItem(insight, chosenLabel);

  if (dismissed || !insight || !item) return null;

  return (
    <p className="insight insight-tooltip">
      <span>
        {chosenLabel}: {phrase} {item.percentage}% dos {insight.scopeLabel.toLowerCase()} ({insight.sampleSize} personagens)
      </span>
      <button type="button" className="insight__close" aria-label="Dispensar" onClick={() => setDismissed(true)}>
        ×
      </button>
    </p>
  );
}
