import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { getOtherFeaturesWithNonSkillChoices, getFeatureView, isSkillKindChoice } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/**
 * Etapa 8 (condicional) — só as features de Espécie/Antecedente/Talento
 * com escolha NÃO-perícia pendente (fonte "REORGANIZAÇÃO DO BUILDER"
 * §1/§2: as de Classe/Subclasse moraram para as etapas Classe/
 * Subclasse; fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA
 * PRÓPRIA" §2/§5: as de perícia, incluindo Sentidos Aguçados do Elfo,
 * saíram para a etapa "Perícias" — filtradas por `isSkillKindChoice`
 * INDIVIDUALMENTE, nunca a feature inteira, para o dia em que uma
 * feature destas origens tiver escolha mista). Hoje nenhum catálogo
 * confirmado usa `choices` NÃO-perícia nessas 3 origens, então a etapa
 * fica sempre vazia e some automaticamente
 * (`getOtherFeaturesWithNonSkillChoices`, ver `rules/builderSteps.ts`).
 */
export function Step8FeaturesAndTalents() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const features = getOtherFeaturesWithNonSkillChoices(character);

  return (
    <div className="builder-step" aria-label="Características e Talentos">
      {features.length === 0 && <p className="empty-note">Nenhuma escolha pendente neste momento.</p>}
      {features.map((feature) => {
        const view = getFeatureView(feature);
        const nonSkillChoices = (feature.choices ?? []).filter((choice) => !isSkillKindChoice(choice));
        const hasSkillChoices = (feature.choices ?? []).some(isSkillKindChoice);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
            <p className="feature-card__origin">{view.originLabel}</p>
            <p>{view.summary}</p>
            {nonSkillChoices.map((choice) => (
              <FeatureChoiceControl key={choice.id} choice={choice} />
            ))}
            {hasSkillChoices && (
              <p className="builder-step__hint">
                Escolha(s) de perícia desta característica —{" "}
                <button type="button" className="review-edit-button" onClick={() => goToStep("skills")}>
                  Ver em Perícias
                </button>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
