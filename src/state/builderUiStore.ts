import { create } from "zustand";

/**
 * Estado de UI puramente de SESSÃO (nunca persistido no `Character`,
 * mesmo padrão de `builderStore.ts`) — hoje só o modo Homebrew de
 * Perícias (fonte "REORGANIZAÇÃO DO BUILDER" §11): em modo normal, a
 * proficiência de uma perícia só muda pelas fontes estruturadas
 * (Antecedente/escolha de Classe); em modo Homebrew, o jogador pode
 * sobrescrever manualmente qualquer perícia (`character.skills[x].manualOverride`,
 * que já existe e nunca é destruído ao desativar o modo — só para de
 * ser editável pela UI).
 */
interface BuilderUiStore {
  skillsHomebrew: boolean;
  toggleSkillsHomebrew: () => void;
}

export const useBuilderUiStore = create<BuilderUiStore>((set) => ({
  skillsHomebrew: false,
  toggleSkillsHomebrew: () => set((state) => ({ skillsHomebrew: !state.skillsHomebrew })),
}));
