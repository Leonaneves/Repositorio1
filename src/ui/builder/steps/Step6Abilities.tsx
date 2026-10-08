import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { useCharacterStore } from "../../../state/characterStore.js";
import type { AbilityGenerationMode } from "../../../rules/abilityGeneration.js";
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_MIN_SCORE,
  getPointBuyRemaining,
  getStandardArrayRemainingValues,
  isPointBuyScoreValid,
} from "../../../rules/abilityGeneration.js";
import { getBackgroundAbilityAllocationConfig } from "../../../data/backgrounds.js";
import { ASI_ALLOCATION_CONFIG, getUnlockedAsiLevels } from "../../../rules/asi.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "../../../rules/abilities.js";
import { AbilityPointAllocator } from "../../components/AbilityPointAllocator.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

const MODE_LABELS: Record<AbilityGenerationMode, string> = {
  standardArray: "Array Padrão",
  pointBuy: "Point Buy",
  manual: "Manual / Rolado",
};

/**
 * Etapa 6 — Atributos (fonte "REORGANIZAR O BUILDER E CORRIGIR
 * VALIDAÇÕES EXISTENTES" §3): único lugar do Builder onde se distribui
 * QUALQUER aumento de atributo, nesta ordem fixa: (1) valores base e
 * método de geração (conteúdo original desta etapa, inalterado); (2)
 * distribuição do bônus de Antecedente (`AbilityPointAllocator` movido
 * de `Step5Background`); (3) distribuição de cada ASI já no modo
 * "Aumentar Atributos", identificada pelo nível de origem (movido de
 * `AsiControl`); (4) outros aumentos com escolha já implementados — hoje
 * nenhum: `data/features/feats.ts#generalFeats` está vazio e não existe
 * nenhum `FeatureChoiceEffect` de aumento de atributo no domínio, então
 * não há nada para renderizar aqui ainda (quando um talento cadastrado
 * conceder essa escolha, basta somar sua própria seção aqui, no mesmo
 * padrão do Antecedente/ASI); (5) valores finais e modificadores. Cada
 * alocador soma seu próprio `baseScores` subtraindo SÓ o bônus da sua
 * própria origem — nunca mistura os pools de Antecedente e ASI (cada um
 * é validado e pode ser diminuído de forma independente).
 */
export function Step6Abilities() {
  const mode = useBuilderStore((s) => s.abilityGenerationMode);
  const draftScores = useBuilderStore((s) => s.draftScores);
  const setAbilityGenerationMode = useBuilderStore((s) => s.setAbilityGenerationMode);
  const setDraftScore = useBuilderStore((s) => s.setDraftScore);
  const isDraftValid = useBuilderStore((s) => s.isDraftValid);
  const commitDraftScores = useBuilderStore((s) => s.commitDraftScores);

  const character = useCharacterStore((s) => s.character);
  const increaseBackgroundAbilityBonus = useCharacterStore((s) => s.increaseBackgroundAbilityBonus);
  const decreaseBackgroundAbilityBonus = useCharacterStore((s) => s.decreaseBackgroundAbilityBonus);
  const increaseAsiAbility = useCharacterStore((s) => s.increaseAsiAbility);
  const decreaseAsiAbility = useCharacterStore((s) => s.decreaseAsiAbility);

  const valid = isDraftValid();
  const backgroundConfig = character.backgroundId ? getBackgroundAbilityAllocationConfig(character.backgroundId) : null;
  const unlockedAsiLevels = getUnlockedAsiLevels(character);

  return (
    <div className="builder-step" aria-label="Atributos">
      <section className="feature-card" aria-label="Valores base">
        <h3>Valores base</h3>
        <fieldset className="ability-generation-mode">
          <legend>Método de geração</legend>
          {(["standardArray", "pointBuy", "manual"] as const).map((m) => (
            <label key={m} className="radio-field">
              <input type="radio" name="ability-generation-mode" checked={mode === m} onChange={() => setAbilityGenerationMode(m)} />
              <span>{MODE_LABELS[m]}</span>
            </label>
          ))}
        </fieldset>

        {mode === "pointBuy" && (
          <p className="builder-step__hint" aria-live="polite">
            Pontos restantes: {getPointBuyRemaining(draftScores)} de {POINT_BUY_BUDGET}
          </p>
        )}
        {mode === "standardArray" && (
          <p className="builder-step__hint">Valores disponíveis: {getStandardArrayRemainingValues(draftScores).join(", ") || "nenhum"}</p>
        )}

        <div className="ability-draft-grid">
          {ABILITY_KEYS.map((ability) => (
            <label className="field" key={ability}>
              <span>{ABILITY_NAMES[ability]}</span>
              {mode === "standardArray" ? (
                <select
                  value={draftScores[ability] ?? ""}
                  onChange={(e) => setDraftScore(ability, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">- Selecione -</option>
                  {[...getStandardArrayRemainingValues(draftScores), draftScores[ability]]
                    .filter((v): v is number => v !== undefined)
                    .sort((a, b) => b - a)
                    .map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={mode === "pointBuy" ? POINT_BUY_MIN_SCORE : undefined}
                  max={mode === "pointBuy" ? POINT_BUY_MAX_SCORE : undefined}
                  value={draftScores[ability] ?? ""}
                  onChange={(e) => setDraftScore(ability, e.target.value ? Number(e.target.value) : null)}
                  aria-invalid={mode === "pointBuy" && draftScores[ability] !== undefined && !isPointBuyScoreValid(draftScores[ability]!)}
                />
              )}
            </label>
          ))}
        </div>

        <button type="button" disabled={!valid} onClick={commitDraftScores}>
          Confirmar atributos
        </button>
        {!valid && <p className="empty-note">Preencha os 6 atributos corretamente para confirmar.</p>}
      </section>

      {backgroundConfig && (
        <section className="feature-card" aria-label="Aumentos de Antecedente">
          <h3>Aumentos de Antecedente</h3>
          <AbilityPointAllocator
            config={backgroundConfig}
            allocations={character.backgroundAbilityBonuses}
            baseScores={Object.fromEntries(
              backgroundConfig.eligibleAbilities.map((ability) => [
                ability,
                getEffectiveAbilityScore(character, ability) - (character.backgroundAbilityBonuses[ability] ?? 0),
              ]),
            ) as Record<AbilityKey, number>}
            onIncrease={increaseBackgroundAbilityBonus}
            onDecrease={decreaseBackgroundAbilityBonus}
          />
        </section>
      )}

      {unlockedAsiLevels.map((level) => {
        const selection = character.asiSelections[level];
        if (selection?.kind !== "abilityIncrease") return null;
        const allocations = selection.allocations;
        return (
          <section className="feature-card" aria-label={`Aumento de Atributo — nível ${level}`} key={level}>
            <h3>Aumento de Atributo (nível {level})</h3>
            <AbilityPointAllocator
              config={ASI_ALLOCATION_CONFIG}
              allocations={allocations}
              baseScores={Object.fromEntries(
                ASI_ALLOCATION_CONFIG.eligibleAbilities.map((ability) => [
                  ability,
                  getEffectiveAbilityScore(character, ability) - (allocations[ability] ?? 0),
                ]),
              ) as Record<AbilityKey, number>}
              onIncrease={(ability) => increaseAsiAbility(level, ability)}
              onDecrease={(ability) => decreaseAsiAbility(level, ability)}
            />
          </section>
        );
      })}

      <section className="feature-card" aria-label="Valores finais">
        <h3>Valores finais</h3>
        <div className="ability-draft-grid">
          {ABILITY_KEYS.map((ability) => {
            const score = getEffectiveAbilityScore(character, ability);
            const modifier = getAbilityModifier(score);
            return (
              <div className="field" key={ability}>
                <span>{ABILITY_NAMES[ability]}</span>
                <span aria-label={`${ABILITY_NAMES[ability]}: ${score} (modificador ${modifier >= 0 ? "+" : ""}${modifier})`}>
                  {score} ({modifier >= 0 ? "+" : ""}
                  {modifier})
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
