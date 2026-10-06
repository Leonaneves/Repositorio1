import { useCharacterStore } from "../../../state/characterStore.js";
import { getAvailableSubclasses } from "../../../rules/subclasses.js";
import { getSubclassFeaturesWithChoices, getFeatureView } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/**
 * Etapa 3 — subclasse (só é exibida a partir do nível 3, ver
 * BuilderWizard/isStepVisible), COM subseções para as escolhas que
 * nascem da própria subclasse (fonte "REORGANIZAÇÃO DO BUILDER" §2 —
 * qualquer `FeatureDefinition` de subclasse com `choices`, nunca uma
 * lista fixa). Terreno do Círculo da Terra e Afinidade Elemental
 * continuam em etapas próprias (escolhas duradouras com UI dedicada,
 * fora do `FeatureChoice` genérico — ver `rules/builderSteps.ts`).
 */
export function Step3Subclass() {
  const character = useCharacterStore((s) => s.character);
  const setSubclass = useCharacterStore((s) => s.setSubclass);

  if (!character.classId) {
    return (
      <div className="builder-step" aria-label="Subclasse">
        <p className="empty-note">Escolha uma classe na etapa anterior antes de escolher a subclasse.</p>
      </div>
    );
  }

  const available = getAvailableSubclasses(character.classId);
  const choiceFeatures = getSubclassFeaturesWithChoices(character);

  return (
    <div className="builder-step" aria-label="Subclasse">
      <label className="field">
        <span>Subclasse</span>
        <select value={character.subclassId ?? ""} onChange={(e) => setSubclass(e.target.value ? e.target.value : null)}>
          <option value="">- Selecione -</option>
          {available.map((s) => (
            <option key={s.fullName} value={s.fullName}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>

      {choiceFeatures.map((feature) => {
        const view = getFeatureView(feature);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
            <p>{view.summary}</p>
            {feature.choices?.map((choice) => <FeatureChoiceControl key={choice.id} choice={choice} />)}
          </article>
        );
      })}
    </div>
  );
}
