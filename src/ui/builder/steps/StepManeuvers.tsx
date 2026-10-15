import { useCharacterStore } from "../../../state/characterStore.js";
import { getBattleMasterManeuversKnownCount } from "../../../rules/classResources.js";
import { getKnownManeuvers, getSelectableManeuvers } from "../../../rules/maneuvers.js";

/**
 * Etapa própria do Builder — "Manobras" (Mestre de Batalha, fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §6) — só
 * visível a partir do nível 3 (rules/builderSteps.ts), seguindo o
 * mesmo modelo PRÓPRIO de `StepInvocations.tsx`: fora do
 * `FeatureChoiceControl` genérico porque a quantidade exigida varia
 * por nível e nunca pode haver duplicata. Sem sub-escolha de
 * alvo/gasto/ativação — cada manobra é só um id conhecido.
 */
export function StepManeuvers() {
  const character = useCharacterStore((s) => s.character);
  const addManeuver = useCharacterStore((s) => s.addManeuver);
  const removeManeuver = useCharacterStore((s) => s.removeManeuver);

  const required = getBattleMasterManeuversKnownCount(character) ?? 0;
  const known = getKnownManeuvers(character);
  const chosenCount = character.chosenManeuvers.length;
  const canAddMore = chosenCount < required;
  const chosenIds = new Set(character.chosenManeuvers);
  const selectable = getSelectableManeuvers().filter((maneuver) => !chosenIds.has(maneuver.id));

  return (
    <div className="builder-step" aria-label="Manobras">
      <p className="builder-step__hint">
        Manobras escolhidas: {chosenCount}/{required}
      </p>

      {known.length > 0 && (
        <ul className="trait-list">
          {known.map((maneuver) => (
            <li key={maneuver.id} className="feature-card">
              <h3>{maneuver.name}</h3>
              <p>{maneuver.summary}</p>
              <button type="button" onClick={() => removeManeuver(maneuver.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="feature-choice">
        <legend>Adicionar manobra {canAddMore ? "" : "(limite do nível já atingido)"}</legend>
        {selectable.length === 0 && <p className="empty-note">Nenhuma manobra disponível agora.</p>}
        {selectable.map((maneuver) => (
          <details key={maneuver.id} className="checkbox-field checkbox-field--compact">
            <summary>{maneuver.name}</summary>
            <p>{maneuver.summary}</p>
            <button type="button" disabled={!canAddMore} onClick={() => addManeuver(maneuver.id)}>
              + {maneuver.name}
            </button>
          </details>
        ))}
      </fieldset>
    </div>
  );
}
