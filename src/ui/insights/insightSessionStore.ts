import { useEffect } from "react";
import { create } from "zustand";

/**
 * Camada de UX das dicas — separada de propósito da análise
 * estatística (`analytics/`), como pedido em §15: se um insight está
 * DISPONÍVEL é uma pergunta para `analytics/`; se ele DEVE aparecer
 * automaticamente agora é uma pergunta só desta camada.
 *
 * Regras implementadas:
 * - nunca mais de um popup automático simultâneo (`activeAutoInsightId`);
 * - a mesma dica não repete na mesma sessão (`shownIds`);
 * - sempre dispensável (`dismiss`);
 * - preparado para uma futura preferência "não mostrar dicas"
 *   (`tipsDisabled`) — sem UI de configuração ainda, por decisão de
 *   escopo desta etapa.
 */
interface InsightSessionState {
  shownIds: Set<string>;
  activeAutoInsightId: string | null;
  tipsDisabled: boolean;
  /**
   * Única porta de entrada para "eu gostaria de aparecer agora".
   * Verifica e grava atomicamente dentro do mesmo `set()` — importante
   * porque, quando dois `InsightPopover` montam no mesmo commit do
   * React, seus efeitos rodam em sequência mas cada um só vê o estado
   * ATUALIZADO do store no momento em que de fato executa (ao
   * contrário de checar um valor já capturado antes, via seletor, o
   * que permitiria os dois "vencerem a corrida" e aparecerem juntos).
   */
  requestAutoShow: (id: string) => void;
  dismiss: (id: string) => void;
  setTipsDisabled: (disabled: boolean) => void;
  /** Só para testes: volta ao estado inicial (uma "nova sessão"). */
  resetSession: () => void;
}

export const useInsightSessionStore = create<InsightSessionState>((set) => ({
  shownIds: new Set(),
  activeAutoInsightId: null,
  tipsDisabled: false,

  requestAutoShow: (id) =>
    set((state) => {
      if (state.tipsDisabled) return {};
      if (state.shownIds.has(id)) return {}; // já apareceu nesta sessão
      if (state.activeAutoInsightId !== null && state.activeAutoInsightId !== id) return {}; // outro já está ativo

      const shownIds = new Set(state.shownIds);
      shownIds.add(id);
      return { shownIds, activeAutoInsightId: id };
    }),

  dismiss: (id) => set((state) => (state.activeAutoInsightId === id ? { activeAutoInsightId: null } : {})),

  setTipsDisabled: (disabled) => set({ tipsDisabled: disabled }),

  resetSession: () => set({ shownIds: new Set(), activeAutoInsightId: null }),
}));

export interface AutoInsightVisibility {
  visible: boolean;
  dismiss: () => void;
}

/**
 * Decide se UM insight automático (`InsightPopover`) deve aparecer
 * agora, aplicando as três regras acima. Componentes de insight nunca
 * decidem isso sozinhos — sempre perguntam a este hook.
 */
export function useAutoInsightVisibility(id: string | undefined): AutoInsightVisibility {
  const activeAutoInsightId = useInsightSessionStore((s) => s.activeAutoInsightId);
  const tipsDisabled = useInsightSessionStore((s) => s.tipsDisabled);
  const requestAutoShow = useInsightSessionStore((s) => s.requestAutoShow);
  const dismissAction = useInsightSessionStore((s) => s.dismiss);

  useEffect(() => {
    if (!id) return;
    requestAutoShow(id);
    // `activeAutoInsightId` entra nas dependências de propósito: quando
    // o popup ativo é dispensado (vira `null`), isso faz os demais
    // `InsightPopover` montados tentarem de novo assumir o lugar — sem
    // isso, um popup que perdeu a corrida na montagem inicial ficaria
    // preso para sempre, mesmo depois de o outro ser fechado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, requestAutoShow, activeAutoInsightId]);

  return {
    visible: Boolean(id) && !tipsDisabled && activeAutoInsightId === id,
    dismiss: () => {
      if (id) dismissAction(id);
    },
  };
}
