import { ABILITY_KEYS, type AbilityKey } from "../../domain/common.js";
import { ASI_ALLOCATION_CONFIG } from "../../rules/asi.js";
import { getEffectiveAbilityScore } from "../../rules/abilities.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { AbilityPointAllocator } from "../components/AbilityPointAllocator.js";

export interface AsiControlProps {
  level: number;
}

/**
 * Controle de "Aumento no Valor de Atributo" de UM nível (fonte
 * "REORGANIZAÇÃO DO BUILDER" §22-§29) — Aumentar Atributos ou Talento,
 * nunca textarea. Escolher "Aumentar Atributos" usa o MESMO componente
 * genérico de distribuição do Antecedente (2 pontos, máximo +2 por
 * atributo — isso já permite tanto +2 num atributo quanto +1/+1 em
 * dois, sem perguntar isso separadamente, §23). Trocar de modo sempre
 * reinicia a distribuição anterior (§28) — nunca deixa bônus ocultos.
 */
export function AsiControl({ level }: AsiControlProps) {
  const character = useCharacterStore((s) => s.character);
  const setAsiMode = useCharacterStore((s) => s.setAsiMode);
  const increaseAsiAbility = useCharacterStore((s) => s.increaseAsiAbility);
  const decreaseAsiAbility = useCharacterStore((s) => s.decreaseAsiAbility);

  const selection = character.asiSelections[level];

  const allocations = selection?.kind === "abilityIncrease" ? selection.allocations : {};
  const baseScores = Object.fromEntries(
    ABILITY_KEYS.map((ability) => [ability, getEffectiveAbilityScore(character, ability) - (allocations[ability] ?? 0)]),
  ) as Record<AbilityKey, number>;

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

      {selection?.kind === "abilityIncrease" && (
        <AbilityPointAllocator
          config={ASI_ALLOCATION_CONFIG}
          allocations={allocations}
          baseScores={baseScores}
          onIncrease={(ability) => increaseAsiAbility(level, ability)}
          onDecrease={(ability) => decreaseAsiAbility(level, ability)}
        />
      )}

      {selection?.kind === "feat" && <p className="empty-note">Catálogo de Talentos ainda pendente — nenhum talento disponível para escolher agora.</p>}
    </article>
  );
}
