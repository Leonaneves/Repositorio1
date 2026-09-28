import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import type { AbilityGenerationMode } from "../../../rules/abilityGeneration.js";
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_MIN_SCORE,
  getPointBuyRemaining,
  getStandardArrayRemainingValues,
  isPointBuyScoreValid,
} from "../../../rules/abilityGeneration.js";

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

/** Etapa 6 — atributos: escolha do método de geração + os 6 valores, com validação por método. */
export function Step6Abilities() {
  const mode = useBuilderStore((s) => s.abilityGenerationMode);
  const draftScores = useBuilderStore((s) => s.draftScores);
  const setAbilityGenerationMode = useBuilderStore((s) => s.setAbilityGenerationMode);
  const setDraftScore = useBuilderStore((s) => s.setDraftScore);
  const isDraftValid = useBuilderStore((s) => s.isDraftValid);
  const commitDraftScores = useBuilderStore((s) => s.commitDraftScores);

  const valid = isDraftValid();

  return (
    <div className="builder-step" aria-label="Atributos">
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
    </div>
  );
}
