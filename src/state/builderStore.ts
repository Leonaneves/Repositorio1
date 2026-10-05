import { create } from "zustand";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import {
  isAbilityGenerationValid,
  type AbilityGenerationMode,
  type DraftAbilityScores,
} from "../rules/abilityGeneration.js";
import { BUILDER_STEP_ORDER, getVisibleSteps, type BuilderStepId } from "../rules/builderSteps.js";
import { getIncompleteRequiredChoices } from "../rules/features.js";
import { isInvocationSelectionComplete } from "../rules/invocations.js";
import { isStartingEquipmentResolved } from "../rules/startingEquipment.js";
import { isWildShapeFormSelectionComplete } from "../rules/wildShapeForms.js";
import { isMetamagicSelectionComplete } from "../rules/metamagic.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, EARTH_CIRCLE_TERRAIN_OPTIONS, ELEMENTAL_AFFINITY_CHOICE_ID, ELEMENTAL_AFFINITY_OPTIONS } from "../data/features/subclasses.js";
import { useCharacterStore } from "./characterStore.js";

export type { AbilityGenerationMode };
export { BUILDER_STEP_ORDER };
export type { BuilderStepId };

/**
 * Estado exclusivo do Character Builder — nunca é lido pelo motor de
 * regras nem persistido no `Character` (decisão aprovada §9: o método
 * de geração de atributos é só uma etapa do fluxo de criação, o
 * personagem final guarda apenas os 6 valores confirmados).
 *
 * A navegação (`currentStepId`/`goNext`/`goBack`) sempre calcula as
 * etapas visíveis na hora, a partir do Character ATUAL
 * (`rules/builderSteps.ts#getVisibleSteps`) — nunca guarda uma lista
 * congelada, porque trocar de classe/nível pode fazer uma etapa
 * condicional (Subclasse/Talentos/Conjuração) aparecer ou desaparecer
 * a qualquer momento.
 */
interface BuilderStore {
  abilityGenerationMode: AbilityGenerationMode;
  draftScores: DraftAbilityScores;

  setAbilityGenerationMode: (mode: AbilityGenerationMode) => void;
  setDraftScore: (ability: AbilityKey, score: number | null) => void;
  resetDraftScores: () => void;

  isDraftValid: () => boolean;
  /** Grava os 6 valores do rascunho no Character ativo (via characterStore) — só deve ser chamado quando `isDraftValid()` for true. */
  commitDraftScores: () => void;

  currentStepId: BuilderStepId;
  goToStep: (stepId: BuilderStepId) => void;
  goNext: () => void;
  goBack: () => void;
  visibleSteps: () => BuilderStepId[];
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  /**
   * Se a etapa ATUAL já resolveu toda decisão obrigatória dela (decisão
   * §5/§11: nunca só "classe já selecionada"). Etapas com essa checagem:
   * "featuresAndTalents" (escolhas de perícia/ferramenta de classe, via
   * `rules/features.ts#getIncompleteRequiredChoices`), "invocations"
   * (quantidade/validade das Invocações Místicas do Bruxo, via
   * `rules/invocations.ts#isInvocationSelectionComplete`) e "equipment"
   * (opção de equipamento inicial A/B/C, via
   * `rules/startingEquipment.ts#isStartingEquipmentResolved`) — as
   * demais etapas continuam sem trava adicional.
   */
  canAdvance: () => boolean;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  abilityGenerationMode: "standardArray",
  draftScores: {},
  currentStepId: "basicInfo",

  setAbilityGenerationMode: (mode) => set({ abilityGenerationMode: mode, draftScores: {} }),

  setDraftScore: (ability, score) =>
    set((state) => {
      const draftScores = { ...state.draftScores };
      if (score === null) {
        delete draftScores[ability];
      } else {
        draftScores[ability] = score;
      }
      return { draftScores };
    }),

  resetDraftScores: () => set({ draftScores: {} }),

  isDraftValid: () => {
    const { abilityGenerationMode, draftScores } = get();
    return isAbilityGenerationValid(abilityGenerationMode, draftScores);
  },

  commitDraftScores: () => {
    const { draftScores } = get();
    const setAbilityScore = useCharacterStore.getState().setAbilityScore;
    for (const ability of ABILITY_KEYS) {
      const score = draftScores[ability];
      if (score !== undefined) setAbilityScore(ability, score);
    }
  },

  goToStep: (stepId) => set({ currentStepId: stepId }),

  goNext: () =>
    set((state) => {
      if (!get().canAdvance()) return state;
      const steps = getVisibleSteps(useCharacterStore.getState().character);
      const index = steps.indexOf(state.currentStepId);
      const next = steps[index + 1];
      return next ? { currentStepId: next } : state;
    }),

  goBack: () =>
    set((state) => {
      const steps = getVisibleSteps(useCharacterStore.getState().character);
      const index = steps.indexOf(state.currentStepId);
      const previous = index > 0 ? steps[index - 1] : undefined;
      return previous ? { currentStepId: previous } : state;
    }),

  visibleSteps: () => getVisibleSteps(useCharacterStore.getState().character),

  isFirstStep: () => {
    const steps = getVisibleSteps(useCharacterStore.getState().character);
    return steps.indexOf(get().currentStepId) <= 0;
  },

  isLastStep: () => {
    const steps = getVisibleSteps(useCharacterStore.getState().character);
    return steps.indexOf(get().currentStepId) === steps.length - 1;
  },

  canAdvance: () => {
    const currentStepId = get().currentStepId;
    const character = useCharacterStore.getState().character;
    if (currentStepId === "featuresAndTalents") return getIncompleteRequiredChoices(character).length === 0;
    if (currentStepId === "invocations") return isInvocationSelectionComplete(character);
    if (currentStepId === "equipment") return isStartingEquipmentResolved(character);
    if (currentStepId === "wildShapeForms") return isWildShapeFormSelectionComplete(character);
    if (currentStepId === "earthCircleTerrain") {
      const selection = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
      return typeof selection === "string" && (EARTH_CIRCLE_TERRAIN_OPTIONS as readonly string[]).includes(selection);
    }
    if (currentStepId === "elementalAffinity") {
      const selection = character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value;
      return typeof selection === "string" && (ELEMENTAL_AFFINITY_OPTIONS as readonly string[]).includes(selection);
    }
    if (currentStepId === "metamagic") return isMetamagicSelectionComplete(character);
    return true;
  },
}));
