import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { CLASS_IDS } from "../../../domain/ids.js";
import { classes } from "../../../data/classes.js";
import { getClassFeaturesWithChoices, getFeatureView, isSkillKindChoice } from "../../../rules/features.js";
import { getUnlockedAsiLevels } from "../../../rules/asi.js";
import { canChooseSubclass, isEarthCircleTerrainApplicable, isElementalAffinityApplicable } from "../../../rules/builderSteps.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";
import { AsiControl } from "../AsiControl.js";
import { Step3Subclass } from "./Step3Subclass.js";
import { StepEarthCircleTerrain } from "./StepEarthCircleTerrain.js";
import { StepElementalAffinity } from "./StepElementalAffinity.js";

/**
 * Etapa 2 — Classe E Subclasse num único item de navegação (fonte
 * "REORGANIZAR O BUILDER E CORRIGIR VALIDAÇÕES EXISTENTES" §2): além da
 * escolha de Classe e suas subseções dinâmicas (Ferramentas de Classe,
 * Características com escolha, decisão de ASI por nível — a
 * DISTRIBUIÇÃO em si mora na etapa Atributos, §3), renderiza a seção de
 * Subclasse quando `canChooseSubclass` permitir (nunca exige Subclasse
 * antes do nível 3), e as seções de Terreno do Círculo da Terra /
 * Afinidade Elemental quando a subclasse/nível aplicáveis as tornarem
 * relevantes — as 3 condições reaproveitadas de `rules/builderSteps.ts`,
 * nunca duplicadas aqui. Nunca aparecem aqui: Metamagia/Invocações
 * Místicas (etapas próprias — têm quantidade por nível e nunca
 * duplicam, não cabem no modelo genérico).
 *
 * As escolhas de PERÍCIA de uma feature (ex.: "Perícias de Classe",
 * "Proficiências Bônus") saíram para a etapa "Perícias" (fonte
 * "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §2/§5) —
 * filtradas por `isSkillKindChoice` INDIVIDUALMENTE (nunca a feature
 * inteira: uma feature com escolha mista, ex. futura, continuaria
 * mostrando aqui a parte não-perícia). Quando uma feature tem ao menos
 * uma escolha de perícia, aparece um link para a etapa "Perícias" no
 * lugar do controle, nunca duplicando-o aqui.
 */
export function Step2Class() {
  const character = useCharacterStore((s) => s.character);
  const classId = character.classId;
  const setClass = useCharacterStore((s) => s.setClass);
  const goToStep = useBuilderStore((s) => s.goToStep);

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

      {unlockedAsiLevels.map((level) => (
        <AsiControl key={level} level={level} />
      ))}

      {classId && !canChooseSubclass(character.level) && (
        <p className="builder-step__hint">Subclasse disponível a partir do nível 3.</p>
      )}
      {classId && canChooseSubclass(character.level) && <Step3Subclass />}
      {isEarthCircleTerrainApplicable(character) && <StepEarthCircleTerrain />}
      {isElementalAffinityApplicable(character) && <StepElementalAffinity />}
    </div>
  );
}
