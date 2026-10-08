import { useCharacterStore } from "../../state/characterStore.js";

export interface AsiControlProps {
  level: number;
}

/**
 * Controle de "Aumento no Valor de Atributo" de UM nível — a DECISÃO
 * entre Aumentar Atributos ou Talento (fonte "REORGANIZAR O BUILDER E
 * CORRIGIR VALIDAÇÕES EXISTENTES" §3: "a escolha de quais atributos
 * aumentar deve acontecer somente na etapa Atributos" — por isso este
 * controle NUNCA mostra o `AbilityPointAllocator`; quando o jogador
 * escolhe "Aumentar Atributos", a distribuição aparece só na etapa
 * Atributos, identificada por este mesmo nível). Trocar de modo sempre
 * reinicia a distribuição anterior (`characterStore.ts#setAsiMode`) —
 * nunca deixa bônus ocultos.
 */
export function AsiControl({ level }: AsiControlProps) {
  const character = useCharacterStore((s) => s.character);
  const setAsiMode = useCharacterStore((s) => s.setAsiMode);

  const selection = character.asiSelections[level];

  return (
    <article className="feature-card" aria-label={`Aumento no Valor de Atributo — nível ${level}`}>
      <h3>Aumento no Valor de Atributo (nível {level})</h3>
      <fieldset className="feature-choice">
        <legend>Escolha</legend>
        <label className="radio-field">
          <input
            type="radio"
            name={`asi-mode-${level}`}
            checked={selection?.kind === "abilityIncrease"}
            onChange={() => setAsiMode(level, "abilityIncrease")}
          />
          <span>Aumentar Atributos</span>
        </label>
        <label className="radio-field">
          <input type="radio" name={`asi-mode-${level}`} checked={selection?.kind === "feat"} onChange={() => setAsiMode(level, "feat")} />
          <span>Escolher Talento</span>
        </label>
      </fieldset>

      {selection?.kind === "abilityIncrease" && <p className="builder-step__hint">Distribua os pontos na etapa Atributos.</p>}

      {selection?.kind === "feat" && <p className="empty-note">Catálogo de Talentos ainda pendente — nenhum talento disponível para escolher agora.</p>}
    </article>
  );
}
