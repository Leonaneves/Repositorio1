import { useCharacterStore } from "../../../state/characterStore.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, EARTH_CIRCLE_TERRAIN_OPTIONS } from "../../../data/features/subclasses.js";

/**
 * Etapa PRÓPRIA do Builder — "Terreno do Círculo da Terra" (fonte
 * "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" §27) — só visível para
 * Druida/Círculo da Terra a partir do nível 3 (rules/builderSteps.ts).
 * Primeira aplicação da regra arquitetural do §21: uma escolha de
 * subclasse duradoura que altera várias partes da ficha (Magias do
 * Círculo da Terra, Resistência de Proteção Natural, Santuário Natural)
 * ganha etapa condicional própria — mesmo guardando a resposta no
 * mesmo `featureChoiceSelections` genérico usado pelas demais escolhas,
 * para reaproveitar 100% da recomputação automática já existente.
 * Pode ser trocada livremente aqui (representa "trocar após Descanso
 * Longo" — a ficção da regra não é imposta pelo código, igual a outras
 * escolhas "alteráveis após DL" já aprovadas, ex.: Aspecto dos
 * Selvagens do Bárbaro).
 */
export function StepEarthCircleTerrain() {
  const character = useCharacterStore((s) => s.character);
  const setFeatureChoiceSelection = useCharacterStore((s) => s.setFeatureChoiceSelection);

  const selection = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
  const current = typeof selection === "string" ? selection : "";

  return (
    <div className="builder-step" aria-label="Terreno do Círculo da Terra">
      <p className="builder-step__hint">
        Escolha o terreno atual — altera automaticamente as Magias do Círculo da Terra, a Resistência de Proteção Natural (nível 10+) e Santuário
        Natural (nível 14+). Pode ser trocado depois de um Descanso Longo.
      </p>
      <fieldset className="feature-choice">
        <legend>Terreno</legend>
        {EARTH_CIRCLE_TERRAIN_OPTIONS.map((terrain) => (
          <label key={terrain} className="checkbox-field checkbox-field--compact">
            <input
              type="radio"
              name="earth-circle-terrain"
              value={terrain}
              checked={current === terrain}
              onChange={() => setFeatureChoiceSelection(EARTH_CIRCLE_TERRAIN_CHOICE_ID, terrain)}
            />
            {terrain}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
