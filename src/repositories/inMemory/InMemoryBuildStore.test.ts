import { beforeEach, describe, expect, it } from "vitest";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import { InMemoryBuildStore } from "./InMemoryBuildStore.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    buildId: "b1",
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

describe("InMemoryBuildStore — filtro por highestAbility (§1.2)", () => {
  it("countBuilds/getArmorDistribution só consideram builds cujo maior atributo bate com o filtro", async () => {
    // Dois Magos com DEX como maior atributo, usando Couro Batido.
    await store.upsert(
      build({
        buildId: "dex1",
        classId: "mago",
        armorId: "couroBatido",
        abilityScores: { FOR: 8, DEX: 18, CON: 8, INT: 12, SAB: 8, CAR: 8 },
      }),
    );
    await store.upsert(
      build({
        buildId: "dex2",
        classId: "mago",
        armorId: "couroBatido",
        abilityScores: { FOR: 8, DEX: 17, CON: 8, INT: 12, SAB: 8, CAR: 8 },
      }),
    );
    // Um Mago com INT como maior atributo, sem armadura.
    await store.upsert(
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

describe("InMemoryBuildStore — estatísticas de escolhas reais só consideram usuários CONFIRMADOS (fonte \"IMPLEMENTAR A BASE DE DADOS PARA FUTURAS RECOMENDAÇÕES\" §7)", () => {
  beforeEach(async () => {
    await store.upsert(build({ buildId: "confirmado", origin: "user", status: "confirmed", classId: "mago" }));
    await store.upsert(build({ buildId: "rascunho", origin: "user", status: "draft", classId: "mago" }));
    await store.upsert(
      build({
        buildId: "referencia",
        origin: "reference",
        status: "confirmed",
        referenceSource: { sourceId: "livro-exemplo", contentType: "extracted" },
        classId: "mago",
      }),
    );
  });

  it("countBuilds exclui rascunhos e registros de referência, mesmo todos sendo 'mago'", async () => {
    expect(await store.countBuilds({ classId: "mago" })).toBe(1);
  });

  it("getSubclassDistribution/getArmorDistribution/getHighestAbilityDistribution também excluem rascunhos e referências", async () => {
    await store.upsert(build({ buildId: "confirmado", origin: "user", status: "confirmed", classId: "mago", subclassId: "Evocador", armorId: "placas" }));
    await store.upsert(build({ buildId: "rascunho", origin: "user", status: "draft", classId: "mago", subclassId: "Abjurador", armorId: "placas" }));
    await store.upsert(
      build({
        buildId: "referencia",
        origin: "reference",
        status: "confirmed",
        referenceSource: { sourceId: "livro-exemplo", contentType: "extracted" },
        classId: "mago",
        subclassId: "Invocador",
        armorId: "placas",
      }),
    );

    expect(await store.getSubclassDistribution({ classId: "mago" })).toEqual([{ value: "Evocador", count: 1 }]);
    expect(await store.getArmorDistribution({ classId: "mago" })).toEqual([{ value: "placas", count: 1 }]);
    expect(await store.getHighestAbilityDistribution({ classId: "mago" })).toHaveLength(1);
  });

  it("size (gravação crua) nunca é afetado pelo filtro de estatísticas — rascunhos e referências continuam gravados", () => {
    expect(store.size).toBe(3);
  });

  it("um rascunho confirmado depois passa a entrar nas estatísticas (upsert atualiza o MESMO registro, nunca duplica)", async () => {
    await store.upsert(build({ buildId: "rascunho", origin: "user", status: "confirmed", classId: "mago" }));
    expect(await store.countBuilds({ classId: "mago" })).toBe(2);
    expect(store.size).toBe(3);
  });
});
