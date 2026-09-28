import { useCharacterStore } from "../../../state/characterStore.js";
import { getCharacterFeatures, getFeatureView } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/** Etapa 8 (nova, condicional) — só as features com escolha pendente, com controle genérico por FeatureChoice.effect. */
export function Step8FeaturesAndTalents() {
  const character = useCharacterStore((s) => s.character);
  const features = getCharacterFeatures(character).filter((feature) => (feature.choices?.length ?? 0) > 0);

  return (
    <div className="builder-step" aria-label="Características e Talentos">
      {features.length === 0 && <p className="empty-note">Nenhuma escolha pendente neste momento.</p>}
      {features.map((feature) => {
        const view = getFeatureView(feature);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
            <p className="feature-card__origin">{view.originLabel}</p>
            <p>{view.summary}</p>
            {feature.choices?.map((choice) => (
              <FeatureChoiceControl key={choice.id} choice={choice} />
            ))}
          </article>
        );
      })}
    </div>
  );
}
