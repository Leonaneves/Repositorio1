import { beforeEach, describe, expect, it } from "vitest";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import { InMemoryBuildStore } from "./InMemoryBuildStore.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    buildId: "b1",
    level: 1,
    classId: "mago",
    subclassId: null,
    speciesId: null,
    backgroundId: null,
    abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    skillProficiencies: [],
    skillExpertise: [],
    savingThrowProficiencies: [],
    armorId: null,
    shield: false,
    spellcastingAbility: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let store: InMemoryBuildStore;

beforeEach(() => {
  store = new InMemoryBuildStore();
});

describe("InMemoryBuildStore — upsert não duplica (§6/§19)", () => {
  it("gravar o mesmo buildId várias vezes mantém um único registro", async () => {
    await store.upsert(build({ buildId: "b1", classId: "mago" }));
    await store.upsert(build({ buildId: "b1", classId: "barbaro" }));
    await store.upsert(build({ buildId: "b1", classId: "feiticeiro" }));

    expect(store.size).toBe(1);
    expect(await store.countBuilds({})).toBe(1);
    expect(await store.countBuilds({ classId: "feiticeiro" })).toBe(1);
    expect(await store.countBuilds({ classId: "mago" })).toBe(0);
  });

  it("builds diferentes contam separadamente", async () => {
    await store.upsert(build({ buildId: "b1" }));
    await store.upsert(build({ buildId: "b2" }));
    expect(store.size).toBe(2);
  });
});

describe("InMemoryBuildStore — filtragem por contexto", () => {
  beforeEach(async () => {
    await store.upsert(build({ buildId: "b1", classId: "mago", subclassId: "Evocador", level: 5 }));
    await store.upsert(build({ buildId: "b2", classId: "mago", subclassId: "Evocador", level: 10 }));
    await store.upsert(build({ buildId: "b3", classId: "mago", subclassId: "Abjurador", level: 5 }));
    await store.upsert(build({ buildId: "b4", classId: "barbaro", subclassId: "Trilha do Berserker", level: 5 }));
  });

  it("filtra por classe", async () => {
    expect(await store.countBuilds({ classId: "mago" })).toBe(3);
    expect(await store.countBuilds({ classId: "barbaro" })).toBe(1);
  });

  it("filtra por classe + faixa de nível", async () => {
    expect(await store.countBuilds({ classId: "mago", minLevel: 8 })).toBe(1);
    expect(await store.countBuilds({ classId: "mago", maxLevel: 5 })).toBe(2);
  });

  it("getSubclassDistribution agrega só dentro do filtro", async () => {
    const distribution = await store.getSubclassDistribution({ classId: "mago" });
    expect(distribution).toEqual(
      expect.arrayContaining([
        { value: "Evocador", count: 2 },
        { value: "Abjurador", count: 1 },
      ]),
    );
    expect(distribution.find((d) => d.value === "Trilha do Berserker")).toBeUndefined();
  });
});

describe("InMemoryBuildStore — distribuições diversas", () => {
  it("getArmorDistribution trata 'sem armadura' como categoria própria", async () => {
    await store.upsert(build({ buildId: "b1", armorId: null }));
    await store.upsert(build({ buildId: "b2", armorId: "placas" }));
    const distribution = await store.getArmorDistribution({});
    expect(distribution).toEqual(
      expect.arrayContaining([
        { value: "unarmed", count: 1 },
        { value: "placas", count: 1 },
      ]),
    );
  });

  it("getHighestAbilityDistribution identifica o maior atributo de cada build", async () => {
    await store.upsert(build({ buildId: "b1", abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 18, SAB: 10, CAR: 10 } }));
    await store.upsert(build({ buildId: "b2", abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 16, SAB: 10, CAR: 10 } }));
    await store.upsert(build({ buildId: "b3", abilityScores: { FOR: 18, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 } }));

    const distribution = await store.getHighestAbilityDistribution({});
    expect(distribution).toEqual(
      expect.arrayContaining([
        { value: "INT", count: 2 },
        { value: "FOR", count: 1 },
      ]),
    );
  });
});
