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
 * Nunca apresenta um percentual sem o tamanho da amostra por perto
 * (§16), e o texto é sempre descritivo — nunca uma recomendação
 * (§5/§17): "escolha frequente", nunca "a melhor escolha".
 */
export function InsightCard({ insight }: InsightCardProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="insight insight-card" role="note" aria-label="Escolhas da comunidade">
      <header className="insight__header">
        <span className="insight__badge">💡 Escolhas da comunidade</span>
        <button type="button" className="insight__close" aria-label="Dispensar" onClick={() => setDismissed(true)}>
          ×
        </button>
      </header>
      <p className="insight__scope">Entre {insight.sampleSize} {insight.scopeLabel.toLowerCase()}:</p>
      <ul className="insight__items">
        {insight.items.map((item) => (
          <li key={item.label}>
            <span className="insight__percentage">{item.percentage}%</span> escolheram {item.label}
          </li>
        ))}
      </ul>
      <p className="insight__footnote">
        Baseado em {insight.sampleSize} personagens registrados — informação descritiva, não uma recomendação.
      </p>
    </aside>
  );
}
