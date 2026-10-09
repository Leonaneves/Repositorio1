import { useCharacterStore } from "../../../state/characterStore.js";
import { getKnownMetamagicOptions, getMetamagicOptionsKnownCount, getSelectableMetamagicOptions } from "../../../rules/metamagic.js";

/**
 * Etapa PRÓPRIA do Builder — "Metamagia" (fonte "INTEGRAÇÃO COMPLETA —
 * FEITICEIRO, METAMAGIA E SUBCLASSES" §10) — só visível para
 * Feiticeiro a partir do nível 2 (rules/builderSteps.ts). Modelo
 * PRÓPRIO, fora do `FeatureChoiceControl` genérico, mesmo raciocínio
 * de `StepInvocations`: a quantidade exigida varia por nível e nunca
 * pode haver duplicata.
 */
export function StepMetamagic() {
  const character = useCharacterStore((s) => s.character);
  const addMetamagicOption = useCharacterStore((s) => s.addMetamagicOption);
  const removeMetamagicOption = useCharacterStore((s) => s.removeMetamagicOption);

  const required = getMetamagicOptionsKnownCount(character.level);
  const known = getKnownMetamagicOptions(character);
  const canAddMore = known.length < required;
  const selectable = getSelectableMetamagicOptions().filter((option) => !character.knownMetamagicOptions.includes(option.id));

  return (
    <div className="builder-step" aria-label="Metamagia">
      <p className="builder-step__hint">
        Opções conhecidas: {known.length}/{required}. Ao subir de nível, pode substituir 1 opção conhecida por outra que ainda não conheça (remova
        e adicione a nova abaixo).
      </p>

      {known.length > 0 && (
        <ul className="trait-list">
          {known.map((option) => (
            <li key={option.id} className="feature-card">
              <h3>{option.name}</h3>
              <p>{option.summary}</p>
              <button type="button" onClick={() => removeMetamagicOption(option.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="feature-choice">
        <legend>Adicionar opção de Metamagia {canAddMore ? "" : "(limite do nível já atingido)"}</legend>
        {selectable.length === 0 && <p className="empty-note">Nenhuma opção de Metamagia disponível agora.</p>}
        {selectable.map((option) => (
          <label key={option.id} className="checkbox-field checkbox-field--compact">
            <button type="button" disabled={!canAddMore} onClick={() => addMetamagicOption(option.id)}>
              + {option.name}
            </button>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
