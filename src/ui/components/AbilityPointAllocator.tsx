import type { AbilityKey } from "../../domain/common.js";
import {
  canDecreaseAbility,
  canIncreaseAbility,
  getRemainingPoints,
  type AbilityAllocationConfig,
  type AbilityAllocations,
} from "../../rules/abilityAllocation.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

export interface AbilityPointAllocatorProps {
  config: AbilityAllocationConfig;
  allocations: AbilityAllocations;
  /** Valor do atributo SEM o bônus desta fonte (ex.: pontuação-base, ou base + outras fontes) — o componente soma o bônus por cima para mostrar o resultado real (§14). */
  baseScores: Record<AbilityKey, number>;
  onIncrease: (ability: AbilityKey) => void;
  onDecrease: (ability: AbilityKey) => void;
}

/**
 * Componente genérico de distribuição de pontos de atributo (fonte
 * "REORGANIZAÇÃO DO BUILDER" §12-§18/§42-§44) — usado pelo Antecedente
 * e pelo ASI. Nunca usa textarea/campo de texto/dropdown por bônus:
 * sempre o valor real resultante + setas, com feedback explícito de
 * pontos disponíveis/restantes e máximo por habilidade (§42). Os
 * botões desabilitados nunca ficam mudos — cada um some/aparece
 * conforme a regra, sem precisar o jogador descobrir clicando (§43).
 */
export function AbilityPointAllocator({ config, allocations, baseScores, onIncrease, onDecrease }: AbilityPointAllocatorProps) {
  const remaining = getRemainingPoints(config, allocations);

  return (
    <div className="ability-allocator">
      <p className="ability-allocator__hint">
        Distribua {config.totalPoints} {config.totalPoints === 1 ? "ponto" : "pontos"} nessas habilidades. Máximo por habilidade: +
        {config.maxPerAbility}.
      </p>
      <div className="ability-allocator__grid">
        {config.eligibleAbilities.map((ability) => {
          const bonus = allocations[ability] ?? 0;
          const resultingScore = baseScores[ability] + bonus;
          return (
            <div className="ability-allocator__item" key={ability}>
              <span className="ability-allocator__score" aria-label={`${ABILITY_NAMES[ability]}: ${resultingScore}`}>
                {resultingScore} {ABILITY_NAMES[ability]}
              </span>
              {bonus !== 0 && <span className="ability-allocator__bonus">+{bonus}</span>}
              <span className="ability-allocator__arrows">
                <button
                  type="button"
                  aria-label={`Aumentar ${ABILITY_NAMES[ability]}`}
                  disabled={!canIncreaseAbility(config, allocations, ability)}
                  onClick={() => onIncrease(ability)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Diminuir ${ABILITY_NAMES[ability]}`}
                  disabled={!canDecreaseAbility(allocations, ability)}
                  onClick={() => onDecrease(ability)}
                >
                  ▼
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <p className="ability-allocator__remaining" aria-live="polite">
        Pontos restantes: {remaining}
      </p>
    </div>
  );
}
