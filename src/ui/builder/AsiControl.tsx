import { useCharacterStore } from "../../state/characterStore.js";
import { getAvailableFeatsForAsiLevel } from "../../rules/feats.js";

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
 *
 * Quando o modo é "Talento" (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO
 * BUILDER E NO PDF"), este controle também escolhe QUAL talento do
 * catálogo preenche este nível — as escolhas INTERNAS de cada talento
 * (perícias de Habilidoso, lista/truques de Iniciado em Magia etc.)
 * aparecem à parte, na etapa "Características e Talentos"/"Perícias"
 * (pipeline genérico de `rules/features.ts`, nunca duplicadas aqui).
 * `getAvailableFeatsForAsiLevel` já exclui um talento NÃO-repetível
 * ativo em outra aquisição, mas nunca o próprio talento já escolhido
 * para ESTE nível.
 */
export function AsiControl({ level }: AsiControlProps) {
  const character = useCharacterStore((s) => s.character);
  const setAsiMode = useCharacterStore((s) => s.setAsiMode);
  const setAsiFeat = useCharacterStore((s) => s.setAsiFeat);

  const selection = character.asiSelections[level];
  const availableFeats = selection?.kind === "feat" ? getAvailableFeatsForAsiLevel(character, level) : [];

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

      {selection?.kind === "feat" && (
        <label className="field feature-choice">
          <span>Talento</span>
          <select value={selection.featId ?? ""} onChange={(e) => setAsiFeat(level, e.target.value || null)}>
            <option value="">- Selecione -</option>
            {availableFeats.map((feat) => (
              <option key={feat.id} value={feat.id}>
                {feat.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </article>
  );
}
