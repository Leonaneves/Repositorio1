import { beforeEach, describe, expect, it } from "vitest";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import { InMemoryBuildStore } from "./InMemoryBuildStore.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  const buildId = overrides.buildId ?? "b1";
  return {
    buildId,
    characterId: overrides.characterId ?? buildId,
    origin: "user",
    status: "confirmed",
    referenceSource: null,
    level: 1,
    classId: "mago",
    subclassId: null,
    speciesId: null,
    backgroundId: null,
    abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 },
    skillProficiencies: [],
    skillExpertise: [],
    skillChoices: {},
    metamagicOptions: [],
    speciesLineageId: null,
    invocationIds: [],
    maneuverIds: [],
    savingThrowProficiencies: [],
    armorId: null,
    shield: false,
    spellcastingAbility: null,
    talentAcquisitions: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let store: InMemoryBuildStore;

beforeEach(() => {
  store = new InMemoryBuildStore();
});

describe("InMemoryBuildStore — cada confirmação é uma versão nova e imutável (fonte \"CONFIRMAR PERSONAGENS SEM ALTERAR OS ANTERIORES\")", () => {
  it("várias versões do MESMO personagem ficam gravadas, mas as estatísticas contam só a mais recente", async () => {
    await store.insertConfirmed(build({ buildId: "v1", characterId: "p1", classId: "mago", updatedAt: "2026-01-01T00:00:00.000Z" }));
    await store.insertConfirmed(build({ buildId: "v2", characterId: "p1", classId: "feiticeiro", updatedAt: "2026-01-02T00:00:00.000Z" }));

    expect(store.size).toBe(2);
    expect(await store.countBuilds({})).toBe(1);
    expect(await store.countBuilds({ classId: "feiticeiro" })).toBe(1);
    expect(await store.countBuilds({ classId: "mago" })).toBe(0);
  });

  it("personagens diferentes contam separadamente — um personagem novo nunca altera os anteriores", async () => {
    await store.insertConfirmed(build({ buildId: "v1", characterId: "p1", classId: "mago" }));
    await store.insertConfirmed(build({ buildId: "v2", characterId: "p2", classId: "barbaro" }));
    expect(await store.countBuilds({ classId: "mago" })).toBe(1);
    expect(await store.countBuilds({ classId: "barbaro" })).toBe(1);
  });

  it("um registro já gravado nunca é sobrescrito (mesmo buildId é recusado, como a chave primária do banco)", async () => {
    await store.insertConfirmed(build({ buildId: "v1", classId: "mago" }));
    await expect(store.insertConfirmed(build({ buildId: "v1", classId: "barbaro" }))).rejects.toThrow();
    expect(await store.countBuilds({ classId: "mago" })).toBe(1);
  });

  it("rascunhos nunca são gravados", async () => {
    await expect(store.insertConfirmed(build({ buildId: "d1", status: "draft" }))).rejects.toThrow();
    expect(store.size).toBe(0);
  });
});

describe("InMemoryBuildStore — filtragem por contexto", () => {
  beforeEach(async () => {
    await store.insertConfirmed(build({ buildId: "b1", classId: "mago", subclassId: "Evocador", level: 5 }));
    await store.insertConfirmed(build({ buildId: "b2", classId: "mago", subclassId: "Evocador", level: 10 }));
    await store.insertConfirmed(build({ buildId: "b3", classId: "mago", subclassId: "Abjurador", level: 5 }));
    await store.insertConfirmed(build({ buildId: "b4", classId: "barbaro", subclassId: "Trilha do Berserker", level: 5 }));
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
    await store.insertConfirmed(build({ buildId: "b1", armorId: null }));
    await store.insertConfirmed(build({ buildId: "b2", armorId: "placas" }));
    const distribution = await store.getArmorDistribution({});
    expect(distribution).toEqual(
      expect.arrayContaining([
        { value: "unarmed", count: 1 },
        { value: "placas", count: 1 },
      ]),
    );
  });

  it("getHighestAbilityDistribution identifica o maior atributo de cada build", async () => {
    await store.insertConfirmed(build({ buildId: "b1", abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 18, SAB: 10, CAR: 10 } }));
    await store.insertConfirmed(build({ buildId: "b2", abilityScores: { FOR: 10, DEX: 10, CON: 10, INT: 16, SAB: 10, CAR: 10 } }));
    await store.insertConfirmed(build({ buildId: "b3", abilityScores: { FOR: 18, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 } }));

    const distribution = await store.getHighestAbilityDistribution({});
    expect(distribution).toEqual(
      expect.arrayContaining([
        { value: "INT", count: 2 },
        { value: "FOR", count: 1 },
      ]),
    );
  });
});

describe("InMemoryBuildStore — filtro por highestAbility (§1.2)", () => {
  it("countBuilds/getArmorDistribution só consideram builds cujo maior atributo bate com o filtro", async () => {
    // Dois Magos com DEX como maior atributo, usando Couro Batido.
    await store.insertConfirmed(
      build({
        buildId: "dex1",
        classId: "mago",
        armorId: "couroBatido",
        abilityScores: { FOR: 8, DEX: 18, CON: 8, INT: 12, SAB: 8, CAR: 8 },
      }),
    );
    await store.insertConfirmed(
      build({
        buildId: "dex2",
        classId: "mago",
        armorId: "couroBatido",
        abilityScores: { FOR: 8, DEX: 17, CON: 8, INT: 12, SAB: 8, CAR: 8 },
      }),
    );
    // Um Mago com INT como maior atributo, sem armadura.
    await store.insertConfirmed(
      build({
        buildId: "int1",
        classId: "mago",
        armorId: null,
        abilityScores: { FOR: 8, DEX: 8, CON: 8, INT: 18, SAB: 8, CAR: 8 },
      }),
    );

    expect(await store.countBuilds({ classId: "mago", highestAbility: "DEX" })).toBe(2);
    expect(await store.countBuilds({ classId: "mago", highestAbility: "INT" })).toBe(1);

    const armorForDex = await store.getArmorDistribution({ classId: "mago", highestAbility: "DEX" });
    expect(armorForDex).toEqual([{ value: "couroBatido", count: 2 }]);
  });
});

describe("InMemoryBuildStore — estatísticas de escolhas reais só consideram personagens reais confirmados", () => {
  it("referências gravadas por engano nunca entram nas estatísticas de escolhas reais", async () => {
    await store.insertConfirmed(build({ buildId: "confirmado", classId: "mago", subclassId: "Evocador" }));
    await expect(
      store.insertConfirmed(build({ buildId: "referencia", origin: "reference", referenceSource: { sourceId: "x", contentType: "extracted" }, classId: "mago" })),
    ).rejects.toThrow();
    expect(await store.countBuilds({ classId: "mago" })).toBe(1);
    expect(await store.getSubclassDistribution({ classId: "mago" })).toEqual([{ value: "Evocador", count: 1 }]);
  });
});
