import { useCharacterStore } from "../../../state/characterStore.js";
import { getInvocationsKnown } from "../../../rules/classResources.js";
import { getInvalidChosenInvocations, getSelectableInvocations } from "../../../rules/invocations.js";
import { warlockInvocationsById } from "../../../data/invocations.js";

/**
 * Etapa própria do Builder — "Invocações Místicas" (fonte "INTEGRAÇÃO
 * COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES" §4) — só visível
 * para Bruxo (rules/builderSteps.ts). Modelo PRÓPRIO, fora do
 * `FeatureChoiceControl` genérico: a elegibilidade cruzada entre
 * invocações/Pactos/nível não cabe em "uma escolha, N opções fixas".
 */
export function StepInvocations() {
  const character = useCharacterStore((s) => s.character);
  const addInvocation = useCharacterStore((s) => s.addInvocation);
  const removeInvocation = useCharacterStore((s) => s.removeInvocation);
  const setInvocationSubChoice = useCharacterStore((s) => s.setInvocationSubChoice);

  const known = getInvocationsKnown(character) ?? 0;
  const chosenCount = character.chosenInvocations.length;
  const invalid = getInvalidChosenInvocations(character);
  const invalidIndexes = new Set(invalid.map((i) => i.index));
  const selectable = getSelectableInvocations(character);
  const canAddMore = chosenCount < known;

  return (
    <div className="builder-step" aria-label="Invocações Místicas">
      <p className="builder-step__hint">
        Invocações escolhidas: {chosenCount}/{known}
      </p>

      {character.chosenInvocations.length > 0 && (
        <ul className="trait-list">
          {character.chosenInvocations.map((chosen, index) => {
            const definition = warlockInvocationsById[chosen.invocationId];
            const isInvalid = invalidIndexes.has(index);
            return (
              <li key={`${chosen.invocationId}-${index}`} className="feature-card">
                <h3>
                  {definition?.name ?? chosen.invocationId}
                  {isInvalid && <span style={{ color: "crimson" }}> — pendente</span>}
                </h3>
                {definition && <p>{definition.summary}</p>}
                {isInvalid && <p className="builder-step__hint">{invalid.find((i) => i.index === index)?.reason}</p>}
                {definition?.subChoice && (
                  <label className="field">
                    <span>{definition.subChoice.label}</span>
                    <input
                      type="text"
                      value={chosen.subChoice}
                      onChange={(e) => setInvocationSubChoice(index, e.target.value)}
                      placeholder={definition.subChoice.required ? "Obrigatório" : "Opcional — editável a qualquer momento"}
                    />
                  </label>
                )}
                <button type="button" onClick={() => removeInvocation(index)}>
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <fieldset className="feature-choice">
        <legend>Adicionar invocação {canAddMore ? "" : "(limite do nível já atingido)"}</legend>
        {selectable.length === 0 && <p className="empty-note">Nenhuma invocação elegível disponível agora.</p>}
        {selectable.map((invocation) => (
          <label key={invocation.id} className="checkbox-field checkbox-field--compact">
            <button type="button" disabled={!canAddMore} onClick={() => addInvocation(invocation.id)}>
              + {invocation.name}
            </button>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
