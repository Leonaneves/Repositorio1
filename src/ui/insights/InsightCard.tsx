import { useState } from "react";
import type { ChoiceInsight } from "../../analytics/types.js";

export interface InsightCardProps {
  insight: ChoiceInsight;
}

/**
 * Bloco informativo "ambiente" (ex.: ao lado dos atributos, mostrando a
 * distribuição de qual atributo costuma ser o maior). Ao contrário de
 * `InsightPopover`, não é controlado pela camada de sessão — fica
 * visível sempre que o insight existir e o card não tiver sido
 * fechado NESTE render (fechar e trocar de contexto pode trazer de
 * volta um card equivalente, de propósito: é referência contínua, não
 * um aviso único).
 *
 * Selo "ESCOLHAS DA COMUNIDADE" sempre visível — nunca confundível com
 * uma dica de regra (`.insight--rule-tip`, reservado para quando esse
 * sistema separado existir; ver §1.3/§12). Texto sempre descritivo,
 * nunca prescritivo (§5/§17): "escolheram", nunca "a melhor escolha".
 */
export function InsightCard({ insight }: InsightCardProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="insight insight--community insight-card" role="note">
      <header className="insight__header">
        <span className="insight__badge">Escolhas da comunidade</span>
        <button type="button" className="insight__close" aria-label="Dispensar" onClick={() => setDismissed(true)}>
          ×
        </button>
      </header>
      <p className="insight__lede">
        Entre {insight.sampleSize} {insight.scopeLabel.toLowerCase()}:
      </p>
      <ul className="insight__items">
        {insight.items.map((item) => (
          <li key={item.label}>
            <span className="insight__percentage">{item.percentage}%</span> escolheram {item.label}
          </li>
        ))}
      </ul>
      <p className="insight__footnote">{insight.sampleSize} builds analisados</p>
    </aside>
  );
}
