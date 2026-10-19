import { useEffect } from "react";
import type { StoreApi } from "zustand";
import { useCharacterStore } from "../state/characterStore.js";
import type { Character } from "../domain/character.js";
import { mapCharacterToBuild } from "./mapCharacterToBuild.js";
import { isConfirmationStillValid } from "./buildConfirmation.js";
import { getCharacterBuildRepository } from "../repositories/index.js";
import type { CharacterBuildRepository } from "../repositories/CharacterBuildRepository.js";

const DEFAULT_DEBOUNCE_MS = 500;

interface CharacterStoreLike {
  character: Character;
  /** Ver `state/characterStore.ts#confirmedBuildSnapshot`/`services/buildConfirmation.ts`. */
  confirmedBuildSnapshot: string | null;
}

/**
 * Liga o store do personagem ao repositório de builds anônimos: toda
 * mudança agenda um upsert (por `buildId` = `character.id`) depois de
 * `debounceMs` sem novas mudanças — várias edições em sequência (ex.:
 * trocar de classe repetidas vezes, digitar um atributo) viram UMA
 * escrita, nunca uma por tecla (ver §6/§18).
 *
 * `status` do build enviado nunca vem de `mapCharacterToBuild` sozinho
 * (que sempre devolve `"draft"`): é decidido aqui, a cada sincronização,
 * comparando o personagem ATUAL com o que foi confirmado por último
 * (`isConfirmationStillValid`) — fonte "IMPLEMENTAR A BASE DE DADOS
 * PARA FUTURAS RECOMENDAÇÕES" §4: uma mudança relevante depois da
 * confirmação volta o registro a rascunho sozinho, na PRÓXIMA
 * sincronização, sem exigir nenhuma ação do jogador.
 *
 * Uma falha de rede/Supabase aqui NUNCA deve impedir a criação nem a
 * exportação do personagem (fonte §7) — por isso o erro é só
 * registrado (console, modo dev) e descartado, nunca propagado como
 * promise rejeitada sem tratamento nem relançado.
 *
 * Função pura de fiação (sem React), para poder ser testada
 * diretamente; `useBuildSync` abaixo só a liga ao ciclo de vida do
 * componente.
 */
export function createBuildSyncSubscription(
  store: StoreApi<CharacterStoreLike>,
  repository: CharacterBuildRepository,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const scheduleSync = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      const { character, confirmedBuildSnapshot } = store.getState();
      const build = mapCharacterToBuild(character);
      build.status = isConfirmationStillValid(character, confirmedBuildSnapshot) ? "confirmed" : "draft";
      repository.upsert(build).catch((error: unknown) => {
        if (typeof console !== "undefined") {
          console.warn("Falha ao sincronizar build anônimo para estatísticas (ignorada — não afeta a criação/exportação do personagem):", error);
        }
      });
    }, debounceMs);
  };

  const unsubscribe = store.subscribe(scheduleSync);

  return () => {
    if (timeout) clearTimeout(timeout);
    unsubscribe();
  };
}

/** Ativa a sincronização de build enquanto o componente que a chama estiver montado (chamar uma única vez, perto da raiz do app). */
export function useBuildSync(): void {
  useEffect(() => {
    const repository = getCharacterBuildRepository();
    return createBuildSyncSubscription(useCharacterStore, repository);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
