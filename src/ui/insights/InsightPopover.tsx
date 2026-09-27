import type { ChoiceInsight } from "../../analytics/types.js";
import { useAutoInsightVisibility } from "./insightSessionStore.js";

export interface InsightPopoverProps {
  insight: ChoiceInsight;
}

/**
 * Painel que aparece SOZINHO logo depois de uma escolha relevante (ex.:
 * escolher a classe), respeitando as regras de frequência de §9/§15:
 * no máximo um automático por vez, nunca repete a mesma dica na mesma
 * sessão. Ao contrário de `InsightCard`, este é controlado pela camada
 * de sessão (`insightSessionStore`) — se `visible` for `false`, o
 * componente não renderiza nada (nem um placeholder), então nunca
 * interrompe o preenchimento da ficha. Fechar não altera nenhuma
 * escolha do personagem — só marca a dica como vista.
 */
export function InsightPopover({ insight }: InsightPopoverProps) {
  const { visible, dismiss } = useAutoInsightVisibility(insight.id);
  if (!visible) return null;

  return (
    <div className="insight insight--community insight-popover" role="status">
      <header className="insight__header">
        <span className="insight__badge">Escolhas da comunidade</span>
        <button type="button" className="insight__close" aria-label="Dispensar" onClick={dismiss}>
          ×
        </button>
      </header>
      <p className="insight__lede">
        Entre {insight.sampleSize} {insight.scopeLabel.toLowerCase()}:
      </p>
      <ul className="insight__items">
        {insight.items.slice(0, 3).map((item) => (
          <li key={item.label}>
            {item.percentage}% escolheram {item.label}
          </li>
        ))}
      </ul>
      <p className="insight__footnote">{insight.sampleSize} builds analisados</p>
    </div>
  );
}
