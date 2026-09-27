import { useEffect } from "react";
import type { StoreApi } from "zustand";
import { useCharacterStore } from "../state/characterStore.js";
import type { Character } from "../domain/character.js";
import { mapCharacterToBuild } from "./mapCharacterToBuild.js";
import { getCharacterBuildRepository } from "../repositories/index.js";
import type { CharacterBuildRepository } from "../repositories/CharacterBuildRepository.js";

const DEFAULT_DEBOUNCE_MS = 500;

interface CharacterStoreLike {
  character: Character;
}

/**
 * Liga o store do personagem ao repositório de builds anônimos: toda
 * mudança agenda um upsert (por `buildId` = `character.id`) depois de
 * `debounceMs` sem novas mudanças — várias edições em sequência (ex.:
 * trocar de classe repetidas vezes, digitar um atributo) viram UMA
 * escrita, nunca uma por tecla (ver §6/§18).
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
      const { character } = store.getState();
      void repository.upsert(mapCharacterToBuild(character));
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
