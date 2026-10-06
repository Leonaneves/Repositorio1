import { useCharacterStore } from "../../../state/characterStore.js";
import { CLASS_IDS } from "../../../domain/ids.js";
import { classes } from "../../../data/classes.js";
import { getClassFeaturesWithChoices, getFeatureView } from "../../../rules/features.js";
import { getUnlockedAsiLevels } from "../../../rules/asi.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";
import { AsiControl } from "../AsiControl.js";

/**
 * Etapa 2 — escolha de classe, COM subseções dinâmicas para tudo que
 * nasce da classe (fonte "REORGANIZAÇÃO DO BUILDER" §1-§3): Perícias de
 * Classe, Ferramentas de Classe, Características com escolha
 * (Conhecimento Primordial, Especialista, Ordem Divina/Primal, Golpes
 * Abençoados, Fúria Elemental, Dádiva Épica etc. — qualquer
 * `FeatureDefinition` de classe com `choices`, nunca uma lista fixa) e
 * Aumento no Valor de Atributo/Talento por nível desbloqueado. Nunca
 * aparecem aqui: Metamagia/Invocações Místicas (etapas próprias — ver
 * `rules/builderSteps.ts`) e escolhas de SUBCLASSE (ficam na etapa
 * Subclasse).
 */
export function Step2Class() {
  const character = useCharacterStore((s) => s.character);
  const classId = character.classId;
  const setClass = useCharacterStore((s) => s.setClass);

  const choiceFeatures = getClassFeaturesWithChoices(character);
  const unlockedAsiLevels = getUnlockedAsiLevels(character);

  return (
    <div className="builder-step" aria-label="Classe">
      <label className="field">
        <span>Classe</span>
        <select value={classId ?? ""} onChange={(e) => setClass(e.target.value ? (e.target.value as (typeof CLASS_IDS)[number]) : null)}>
          <option value="">- Selecione -</option>
          {CLASS_IDS.map((id) => (
            <option key={id} value={id}>
              {classes[id].name}
            </option>
          ))}
        </select>
      </label>
      {classId && (
        <p className="builder-step__hint">
          Dado de Vida: d{classes[classId].hitDie} · {classes[classId].weaponProficiencyText}
        </p>
      )}

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

      {unlockedAsiLevels.map((level) => (
        <AsiControl key={level} level={level} />
      ))}
    </div>
  );
}
