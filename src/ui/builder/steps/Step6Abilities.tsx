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
import { getUnlockedAsiLevels } from "../../../rules/asi.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "../../../rules/abilities.js";
import { AbilityPointAllocator } from "../../components/AbilityPointAllocator.js";
import { useAbilityRecommendations } from "../../../services/useBuildChoiceRecommendations.js";
import { AbilityRecommendationsHint } from "../RecommendationReasonsHint.js";

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
 * Etapa 6 — Atributos (fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA
 * OCORRER APÓS OS ATRIBUTOS" §4): define só os valores DE PARTIDA, nesta
 * ordem fixa: (1) valores base e método de geração (conteúdo original
 * desta etapa, inalterado); (2) distribuição do bônus de Antecedente
 * (`AbilityPointAllocator`, concedido já na criação — nunca uma
 * oportunidade de progressão); (3) valores finais e modificadores —
 * display apenas, com um atalho para a etapa Talentos quando houver
 * algum aumento de ASI/Talento somado (nunca um segundo lugar para
 * editar o MESMO bônus). A distribuição de cada ASI no modo "Aumentar
 * Atributos" (e a escolha de talentos que aumentam atributo) saiu para
 * a etapa Talentos (§2/§5) — por isso não aparece mais aqui.
 */
export function Step6Abilities() {
  const mode = useBuilderStore((s) => s.abilityGenerationMode);
  const draftScores = useBuilderStore((s) => s.draftScores);
  const setAbilityGenerationMode = useBuilderStore((s) => s.setAbilityGenerationMode);
  const setDraftScore = useBuilderStore((s) => s.setDraftScore);
  const isDraftValid = useBuilderStore((s) => s.isDraftValid);
  const commitDraftScores = useBuilderStore((s) => s.commitDraftScores);
  const goToStep = useBuilderStore((s) => s.goToStep);

  const character = useCharacterStore((s) => s.character);
  const increaseBackgroundAbilityBonus = useCharacterStore((s) => s.increaseBackgroundAbilityBonus);
  const decreaseBackgroundAbilityBonus = useCharacterStore((s) => s.decreaseBackgroundAbilityBonus);

  const valid = isDraftValid();
  const backgroundConfig = character.backgroundId ? getBackgroundAbilityAllocationConfig(character.backgroundId) : null;
  const hasAsiOpportunities = getUnlockedAsiLevels(character).length > 0;
  // Recomendação (dados reais confirmados — classe, refinada pela subclasse): 1 atributo para ser o MAIOR,
  // 1 para o 2º MAIOR e 1 para o MENOR ("dump stat") — só rótulos, nunca preenche nem distribui nada.
  // Os mesmos rótulos aparecem nos aumentos do Antecedente (distribuição GERAL, nunca a do Antecedente).
  const abilityRecommendations = useAbilityRecommendations();
  const abilityLabel = (ability: AbilityKey) => {
    const tag = abilityRecommendations.tagOf(ability);
    return tag ? `${ABILITY_NAMES[ability]} (${tag.replace("★ ", "★ Recomendado: ")})` : ABILITY_NAMES[ability];
  };

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
              <span>{abilityLabel(ability)}</span>
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
        {/* Maior, 2º maior e menor usam os mesmos fatores (classe → subclasse): uma linha de explicação só. */}
        <AbilityRecommendationsHint recommendations={abilityRecommendations} />

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
            tagOf={abilityRecommendations.tagOf}
          />
          <AbilityRecommendationsHint recommendations={abilityRecommendations} />
        </section>
      )}

      <section className="feature-card" aria-label="Valores finais">
        <h3>Valores finais</h3>
        {hasAsiOpportunities && (
          <p className="builder-step__hint">
            Já inclui aumentos de Aumento no Valor de Atributo/Talento calculados na etapa Talentos —{" "}
            <button type="button" className="review-edit-button" onClick={() => goToStep("featuresAndTalents")}>
              Ver/editar em Talentos
            </button>
          </p>
        )}
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
