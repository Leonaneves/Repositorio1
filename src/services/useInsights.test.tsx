import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCharacterStore } from "../state/characterStore.js";
import { InMemoryBuildStore } from "../repositories/inMemory/InMemoryBuildStore.js";
import { clearInsightCache } from "../analytics/insightEngine.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import * as repositoriesModule from "../repositories/index.js";
import { useInsightContext, useInsights } from "./useInsights.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    buildId: `b-${Math.random()}`,
    level: 5,
    classId: "mago",
    subclassId: "Evocador",
    speciesId: null,
    backgroundId: null,
    abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    skillProficiencies: [],
    skillExpertise: [],
    savingThrowProficiencies: [],
    armorId: null,
    shield: false,
    spellcastingAbility: "INT",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  clearInsightCache();
});

describe("useInsightContext — muda quando a classe (ou outro campo relevante) muda", () => {
  it("reflete classId/subclassId/speciesId/backgroundId/level do personagem", () => {
    const { result } = renderHook(() => useInsightContext());
    expect(result.current).toEqual({ classId: undefined, subclassId: undefined, speciesId: undefined, backgroundId: undefined, level: 1 });

    act(() => {
      useCharacterStore.getState().setClass("mago");
    });
    expect(result.current.classId).toBe("mago");
  });
});

describe("useInsights — mudança de classe atualiza os insights", () => {
  it("busca de novo ao trocar de classe, refletindo a nova população", async () => {
    const store = new InMemoryBuildStore();
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `mago-${i}`, classId: "mago", subclassId: "Evocador" }));
      await store.upsert(build({ buildId: `barbaro-${i}`, classId: "barbaro", subclassId: "Trilha do Berserker" }));
    }

    // Troca a implementação usada pela fábrica só para este teste, sem
    // que `useInsights` precise saber disso (continua chamando
    // getChoiceInsights normalmente).
    vi.spyOn(repositoriesModule, "getAnalyticsRepository").mockReturnValue(store);

    act(() => {
      useCharacterStore.getState().setClass("mago");
    });
    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.insights.find((i) => i.metric === "subclassPopularity")?.items[0]?.label).toBe("Evocador");
    });

    act(() => {
      useCharacterStore.getState().setClass("barbaro");
    });

    await waitFor(() => {
      expect(result.current.insights.find((i) => i.metric === "subclassPopularity")?.items[0]?.label).toBe(
        "Trilha do Berserker",
      );
    });
  });
});
