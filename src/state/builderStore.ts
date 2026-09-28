import { create } from "zustand";
import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import {
  isAbilityGenerationValid,
  type AbilityGenerationMode,
  type DraftAbilityScores,
} from "../rules/abilityGeneration.js";
import { useCharacterStore } from "./characterStore.js";

export type { AbilityGenerationMode };

/**
 * Estado exclusivo do Character Builder — nunca é lido pelo motor de
 * regras nem persistido no `Character` (decisão aprovada §9: o método
 * de geração de atributos é só uma etapa do fluxo de criação, o
 * personagem final guarda apenas os 6 valores confirmados). Por ora
 * cobre só a geração de atributos; a navegação por etapas do Builder
 * (11 etapas — decisão §10) fica para a implementação da UI.
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
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  abilityGenerationMode: "standardArray",
  draftScores: {},

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
}));
