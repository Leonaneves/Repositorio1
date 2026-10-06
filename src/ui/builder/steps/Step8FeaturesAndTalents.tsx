import { useCharacterStore } from "../../../state/characterStore.js";
import { getOtherFeaturesWithChoices, getFeatureView } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/**
 * Etapa 8 (condicional) — só as features de Espécie/Antecedente/Talento
 * com escolha pendente (fonte "REORGANIZAÇÃO DO BUILDER" §1/§2: as de
 * Classe/Subclasse moraram para as etapas Classe/Subclasse). Hoje
 * nenhum catálogo confirmado usa `choices` nessas 3 origens, então a
 * etapa fica sempre vazia e some automaticamente (ver `rules/builderSteps.ts`).
 */
export function Step8FeaturesAndTalents() {
  const character = useCharacterStore((s) => s.character);
  const features = getOtherFeaturesWithChoices(character);

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
