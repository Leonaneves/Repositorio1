import { useCharacterStore } from "../../../state/characterStore.js";
import { getAvailableSubclasses } from "../../../rules/subclasses.js";
import { getSubclassFeaturesWithChoices, getFeatureView } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/**
 * Seção de Subclasse — renderizada DENTRO da etapa Classe (fonte
 * "REORGANIZAR O BUILDER E CORRIGIR VALIDAÇÕES EXISTENTES" §2: "Classe
 * e Subclasse devem ocupar um único item na navegação lateral").
 * `Step2Class` só monta este componente quando já há `classId` e o
 * nível já permite escolher subclasse (`canChooseSubclass`) — por isso
 * aqui não há mais nenhuma verificação de pré-condição, nem etapa
 * própria no `BuilderWizard`/`rules/builderSteps.ts`.
 */
export function Step3Subclass() {
  const character = useCharacterStore((s) => s.character);
  const setSubclass = useCharacterStore((s) => s.setSubclass);

  const available = character.classId ? getAvailableSubclasses(character.classId) : [];
  const choiceFeatures = getSubclassFeaturesWithChoices(character);

  return (
    <section className="feature-card" aria-label="Subclasse">
      <h3>Subclasse</h3>
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
    </section>
  );
}
