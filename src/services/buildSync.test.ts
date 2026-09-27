import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCharacterStore } from "../state/characterStore.js";
import { InMemoryBuildStore } from "../repositories/inMemory/InMemoryBuildStore.js";
import { createBuildSyncSubscription } from "./buildSync.js";

beforeEach(() => {
  vi.useFakeTimers();
  useCharacterStore.getState().resetCharacter();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createBuildSyncSubscription", () => {
  it("não escreve nada antes do tempo de debounce passar", () => {
    const store = new InMemoryBuildStore();
    const upsertSpy = vi.spyOn(store, "upsert");
    const unsubscribe = createBuildSyncSubscription(useCharacterStore, store, 500);

    useCharacterStore.getState().setClass("mago");
    expect(upsertSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(upsertSpy).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("escreve exatamente uma vez, mesmo com várias mudanças em sequência rápida (§6/§18)", () => {
    const store = new InMemoryBuildStore();
    const upsertSpy = vi.spyOn(store, "upsert");
    const unsubscribe = createBuildSyncSubscription(useCharacterStore, store, 500);

    useCharacterStore.getState().setClass("mago");
    vi.advanceTimersByTime(100);
    useCharacterStore.getState().setClass("barbaro");
    vi.advanceTimersByTime(100);
    useCharacterStore.getState().setClass("mago");
    vi.advanceTimersByTime(100);
    useCharacterStore.getState().setClass("feiticeiro");

    vi.advanceTimersByTime(500);

    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy.mock.calls[0]?.[0].classId).toBe("feiticeiro");

    unsubscribe();
  });

  it("atualiza o mesmo buildId em vez de criar um registro por mudança", () => {
    const store = new InMemoryBuildStore();
    const unsubscribe = createBuildSyncSubscription(useCharacterStore, store, 500);

    useCharacterStore.getState().setClass("mago");
    vi.advanceTimersByTime(500);
    useCharacterStore.getState().setClass("barbaro");
    vi.advanceTimersByTime(500);

    expect(store.size).toBe(1);

    unsubscribe();
  });

  it("para de sincronizar depois de cancelada a inscrição", () => {
    const store = new InMemoryBuildStore();
    const upsertSpy = vi.spyOn(store, "upsert");
    const unsubscribe = createBuildSyncSubscription(useCharacterStore, store, 500);

    unsubscribe();
    useCharacterStore.getState().setClass("mago");
    vi.advanceTimersByTime(1000);

    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
