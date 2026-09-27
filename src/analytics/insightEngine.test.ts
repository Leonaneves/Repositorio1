import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryBuildStore } from "../repositories/inMemory/InMemoryBuildStore.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { clearInsightCache, getChoiceInsights } from "./insightEngine.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    buildId: `b-${Math.random()}`,
    level: 5,
    classId: "mago",
    subclassId: "Evocador",
    speciesId: "humano",
    backgroundId: "sabio",
    abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 18, SAB: 10, CAR: 10 },
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
  clearInsightCache();
});

describe("getChoiceInsights", () => {
  it("retorna array vazio em cold start, sem lançar erro (§12)", async () => {
    const store = new InMemoryBuildStore();
    const insights = await getChoiceInsights({ classId: "mago" }, { repository: store });
    expect(insights).toEqual([]);
  });

  it("retorna vários insights quando a amostra é suficiente para mais de uma métrica", async () => {
    const store = new InMemoryBuildStore();
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `b${i}` }));
    }
    const insights = await getChoiceInsights({ classId: "mago" }, { repository: store, minSampleSize: 20 });
    const metrics = insights.map((i) => i.metric);
    expect(metrics).toContain("subclassPopularity");
    expect(metrics).toContain("speciesPopularity");
    expect(metrics).toContain("backgroundPopularity");
    expect(metrics).toContain("abilityHighest");
  });

  it("toda entrada tem sampleSize e nunca aparece percentual sem ele", async () => {
    const store = new InMemoryBuildStore();
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `b${i}` }));
    }
    const insights = await getChoiceInsights({ classId: "mago" }, { repository: store, minSampleSize: 20 });
    for (const insight of insights) {
      expect(typeof insight.sampleSize).toBe("number");
      expect(insight.sampleSize).toBeGreaterThanOrEqual(20);
      expect(insight.scopeLabel.length).toBeGreaterThan(0);
    }
  });

  it("usa cache: a segunda chamada com o mesmo contexto não consulta o repositório de novo", async () => {
    const store = new InMemoryBuildStore();
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `b${i}` }));
    }
    const countSpy = vi.spyOn(store, "countBuilds");

    await getChoiceInsights({ classId: "mago" }, { repository: store, minSampleSize: 20 });
    const callsAfterFirst = countSpy.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    await getChoiceInsights({ classId: "mago" }, { repository: store, minSampleSize: 20 });
    expect(countSpy.mock.calls.length).toBe(callsAfterFirst); // não cresceu: veio do cache
  });

  it("contextos diferentes não compartilham cache", async () => {
    const store = new InMemoryBuildStore();
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `mago-${i}`, classId: "mago" }));
      await store.upsert(build({ buildId: `barbaro-${i}`, classId: "barbaro", subclassId: "Trilha do Berserker" }));
    }

    const magoInsights = await getChoiceInsights({ classId: "mago" }, { repository: store, minSampleSize: 20 });
    const barbaroInsights = await getChoiceInsights({ classId: "barbaro" }, { repository: store, minSampleSize: 20 });

    const magoSubclass = magoInsights.find((i) => i.metric === "subclassPopularity");
    const barbaroSubclass = barbaroInsights.find((i) => i.metric === "subclassPopularity");
    expect(magoSubclass?.items[0]?.label).toBe("Evocador");
    expect(barbaroSubclass?.items[0]?.label).toBe("Trilha do Berserker");
  });
});
