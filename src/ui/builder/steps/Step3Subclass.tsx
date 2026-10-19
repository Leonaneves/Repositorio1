import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { getAvailableSubclasses } from "../../../rules/subclasses.js";
import { getSubclassFeaturesWithChoices, getFeatureView, isSkillKindChoice } from "../../../rules/features.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";
import { RecommendationReasonsHint } from "../RecommendationReasonsHint.js";
import { useBuildChoiceRecommendations } from "../../../services/useBuildChoiceRecommendations.js";
import { withRecommendedLabel } from "../../../services/useTalentRecommendations.js";

/**
 * Seção de Subclasse — renderizada DENTRO da etapa Classe (fonte
 * "REORGANIZAR O BUILDER E CORRIGIR VALIDAÇÕES EXISTENTES" §2: "Classe
 * e Subclasse devem ocupar um único item na navegação lateral").
 * `Step2Class` só monta este componente quando já há `classId` e o
 * nível já permite escolher subclasse (`canChooseSubclass`) — por isso
 * aqui não há mais nenhuma verificação de pré-condição, nem etapa
 * própria no `BuilderWizard`/`rules/builderSteps.ts`.
 *
 * Mesmo tratamento de `Step2Class` para escolhas de perícia (fonte
 * "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §2/§5):
 * filtradas individualmente por `isSkillKindChoice` — "Estudioso da
 * Guerra" (Mestre de Batalha) tem uma escolha de Ferramenta de Artesão
 * (continua aqui) E uma de perícia (some daqui, com link para
 * "Perícias"); "Glamour Transcendental" (Andarilho Feérico) é só
 * perícia, então o card fica sem nenhum `FeatureChoiceControl`, só o
 * link.
 *
 * Recomendação (dados reais confirmados da mesma classe): a subclasse
 * mais escolhida ganha "(Recomendado)", com o motivo logo abaixo.
 */
export function Step3Subclass() {
  const character = useCharacterStore((s) => s.character);
  const setSubclass = useCharacterStore((s) => s.setSubclass);
  const goToStep = useBuilderStore((s) => s.goToStep);

  const available = character.classId ? getAvailableSubclasses(character.classId) : [];
  const choiceFeatures = getSubclassFeaturesWithChoices(character);
  const recommendedSubclasses = useBuildChoiceRecommendations({ kind: "subclass" }, available.map((s) => s.fullName));

  return (
    <section className="feature-card" aria-label="Subclasse">
      <h3>Subclasse</h3>
      <label className="field">
        <span>Subclasse</span>
        <select value={character.subclassId ?? ""} onChange={(e) => setSubclass(e.target.value ? e.target.value : null)}>
          <option value="">- Selecione -</option>
          {available.map((s) => (
            <option key={s.fullName} value={s.fullName}>
              {withRecommendedLabel(s.shortName, recommendedSubclasses.get(s.fullName))}
            </option>
          ))}
        </select>
      </label>
      <RecommendationReasonsHint reasons={recommendedSubclasses} nameOf={(fullName) => available.find((s) => s.fullName === fullName)?.shortName ?? fullName} />

      {choiceFeatures.map((feature) => {
        const view = getFeatureView(feature);
        const nonSkillChoices = (feature.choices ?? []).filter((choice) => !isSkillKindChoice(choice));
        const hasSkillChoices = (feature.choices ?? []).some(isSkillKindChoice);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
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
    </section>
  );
}
