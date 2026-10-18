import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { getFeaturesAndTalentsStepFeatures, getFeatureView, isSkillKindChoice } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

/**
 * Etapa 8 (condicional) — as features de Espécie/Antecedente/Talento com
 * escolha NÃO-perícia pendente (fonte "REORGANIZAÇÃO DO BUILDER" §1/§2:
 * as de Classe/Subclasse moraram para as etapas Classe/Subclasse; fonte
 * "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §2/§5: as
 * de perícia, incluindo Sentidos Aguçados do Elfo, saíram para a etapa
 * "Perícias" — filtradas por `isSkillKindChoice` INDIVIDUALMENTE, nunca
 * a feature inteira, para quando uma feature destas origens tiver
 * escolha mista), MAIS o Talento de Origem do Humano mesmo sem nenhuma
 * escolha interna (`getFeaturesAndTalentsStepFeatures`, fonte
 * "ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE"
 * §2) — identificado nesta lista com "Origem: Humano" em vez do rótulo
 * genérico "Talento", e um atalho para editar a ESCOLHA (qual talento)
 * de volta na etapa Espécie; nunca pede essa escolha de novo aqui, só
 * resolve as escolhas INTERNAS do talento já escolhido (quando houver).
 */
export function Step8FeaturesAndTalents() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const features = getFeaturesAndTalentsStepFeatures(character);

  return (
    <div className="builder-step" aria-label="Características e Talentos">
      {features.length === 0 && <p className="empty-note">Nenhuma escolha pendente neste momento.</p>}
      {features.map((feature) => {
        const view = getFeatureView(feature);
        const isHumanOriginFeat = feature.sourceType === "feat" && feature.speciesId === "humano";
        const nonSkillChoices = (feature.choices ?? []).filter((choice) => !isSkillKindChoice(choice));
        const hasSkillChoices = (feature.choices ?? []).some(isSkillKindChoice);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
            <p className="feature-card__origin">
              {isHumanOriginFeat ? "Origem: Humano" : view.originLabel}
              {isHumanOriginFeat && (
                <>
                  {" — "}
                  <button type="button" className="review-edit-button" onClick={() => goToStep("species")}>
                    Editar em Espécie
                  </button>
                </>
              )}
            </p>
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
