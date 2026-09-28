import { useCharacterStore } from "../../state/characterStore.js";
import { useBuilderStore } from "../../state/builderStore.js";
import { BUILDER_STEP_LABELS, type BuilderStepId } from "../../rules/builderSteps.js";
import { Step1BasicInfo } from "./steps/Step1BasicInfo.js";
import { Step2Class } from "./steps/Step2Class.js";
import { Step3Subclass } from "./steps/Step3Subclass.js";
import { Step4Species } from "./steps/Step4Species.js";
import { Step5Background } from "./steps/Step5Background.js";
import { Step6Abilities } from "./steps/Step6Abilities.js";
import { Step7Skills } from "./steps/Step7Skills.js";
import { Step8FeaturesAndTalents } from "./steps/Step8FeaturesAndTalents.js";
import { Step9Equipment } from "./steps/Step9Equipment.js";
import { Step10Spellcasting } from "./steps/Step10Spellcasting.js";
import { Step11Review } from "./steps/Step11Review.js";

const STEP_COMPONENTS: Record<BuilderStepId, () => JSX.Element> = {
  basicInfo: Step1BasicInfo,
  class: Step2Class,
  subclass: Step3Subclass,
  species: Step4Species,
  background: Step5Background,
  abilities: Step6Abilities,
  skills: Step7Skills,
  featuresAndTalents: Step8FeaturesAndTalents,
  equipment: Step9Equipment,
  spellcasting: Step10Spellcasting,
  review: Step11Review,
};

/**
 * Orquestrador do Character Builder — indicador das etapas visíveis
 * (recalculadas a cada renderização a partir do Character atual, ver
 * `rules/builderSteps.ts`), o conteúdo da etapa atual, e navegação
 * Voltar/Avançar. Builder e Ficha Web leem/escrevem o mesmo
 * `useCharacterStore` (arquitetura §19) — nenhuma cópia própria de
 * personagem existe aqui.
 */
export function BuilderWizard() {
  const character = useCharacterStore((s) => s.character);
  const currentStepId = useBuilderStore((s) => s.currentStepId);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const goNext = useBuilderStore((s) => s.goNext);
  const goBack = useBuilderStore((s) => s.goBack);
  const isFirstStep = useBuilderStore((s) => s.isFirstStep);
  const isLastStep = useBuilderStore((s) => s.isLastStep);
  const canAdvance = useBuilderStore((s) => s.canAdvance);
  const visibleSteps = useBuilderStore((s) => s.visibleSteps)();

  const StepComponent = STEP_COMPONENTS[currentStepId];

  return (
    <div className="builder-wizard" aria-label="Criação de Personagem">
      <nav className="builder-wizard__steps" aria-label="Etapas">
        <ol>
          {visibleSteps.map((stepId, index) => (
            <li key={stepId} className={stepId === currentStepId ? "is-current" : undefined}>
              <button type="button" onClick={() => goToStep(stepId)} aria-current={stepId === currentStepId}>
                {index + 1}. {BUILDER_STEP_LABELS[stepId]}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="builder-wizard__content">
        <h2>{BUILDER_STEP_LABELS[currentStepId]}</h2>
        <StepComponent key={`${currentStepId}-${character.id}`} />
      </div>

      <div className="builder-wizard__nav">
        <button type="button" onClick={goBack} disabled={isFirstStep()}>
          Voltar
        </button>
        <div className="builder-wizard__nav-next">
          {!canAdvance() && <span className="builder-wizard__nav-hint">Resolva as escolhas obrigatórias desta etapa para continuar.</span>}
          <button type="button" onClick={goNext} disabled={isLastStep() || !canAdvance()}>
            Avançar
          </button>
        </div>
      </div>
    </div>
  );
}
