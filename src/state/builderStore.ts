import { create } from "zustand";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import {
  isAbilityGenerationValid,
  type AbilityGenerationMode,
  type DraftAbilityScores,
} from "../rules/abilityGeneration.js";
import { BUILDER_STEP_ORDER, getVisibleSteps, type BuilderStepId } from "../rules/builderSteps.js";
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
}));
