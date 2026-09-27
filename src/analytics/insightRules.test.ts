import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryBuildStore } from "../repositories/inMemory/InMemoryBuildStore.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import type { ArmorId } from "../domain/ids.js";
import { computeInsight, insightMetricDefinitions } from "./insightRules.js";

function build(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    buildId: `b-${Math.random()}`,
    level: 5,
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

function definitionFor(metric: string) {
  const definition = insightMetricDefinitions.find((d) => d.metric === metric);
  if (!definition) throw new Error(`métrica não encontrada: ${metric}`);
  return definition;
}

let store: InMemoryBuildStore;

beforeEach(() => {
  store = new InMemoryBuildStore();
});

describe("computeInsight — tamanho mínimo de amostra (§11)", () => {
  it("não gera insight com amostra abaixo do mínimo configurado", async () => {
    for (let i = 0; i < 3; i++) {
      await store.upsert(build({ buildId: `b${i}`, subclassId: "Evocador" }));
    }
    const insight = await computeInsight(definitionFor("subclassPopularity"), store, { classId: "mago" }, { minSampleSize: 20 });
    expect(insight).toBeNull();
  });

  it("gera o insight assim que a amostra atinge o mínimo configurado", async () => {
    for (let i = 0; i < 20; i++) {
      await store.upsert(build({ buildId: `b${i}`, subclassId: "Evocador" }));
    }
    const insight = await computeInsight(definitionFor("subclassPopularity"), store, { classId: "mago" }, { minSampleSize: 20 });
    expect(insight).not.toBeNull();
    expect(insight?.sampleSize).toBe(20);
  });
});

describe("computeInsight — cálculo de percentual", () => {
  it("calcula a porcentagem corretamente e arredonda", async () => {
    for (let i = 0; i < 31; i++) {
      await store.upsert(build({ buildId: `evocador-${i}`, subclassId: "Evocador" }));
    }
    for (let i = 0; i < 69; i++) {
      await store.upsert(build({ buildId: `abjurador-${i}`, subclassId: "Abjurador" }));
    }
    const insight = await computeInsight(definitionFor("subclassPopularity"), store, { classId: "mago" }, { minSampleSize: 20 });
    expect(insight?.sampleSize).toBe(100);
    expect(insight?.items).toEqual([
      { label: "Abjurador", percentage: 69 },
      { label: "Evocador", percentage: 31 },
    ]);
  });
});

describe("computeInsight — filtragem por contexto (§10)", () => {
  it("não mistura builds de outra classe na população analisada", async () => {
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `mago-${i}`, classId: "mago", subclassId: "Evocador" }));
    }
    for (let i = 0; i < 25; i++) {
      await store.upsert(build({ buildId: `barbaro-${i}`, classId: "barbaro", subclassId: "Trilha do Berserker" }));
    }
    const insight = await computeInsight(definitionFor("subclassPopularity"), store, { classId: "mago" }, { minSampleSize: 20 });
    expect(insight?.sampleSize).toBe(25);
    expect(insight?.items).toEqual([{ label: "Evocador", percentage: 100 }]);
  });

  it("tenta o contexto mais específico primeiro, mas cai para um mais amplo se a amostra for insuficiente", async () => {
    // Só 5 Magos Humanos — não é amostra suficiente sozinha.
    for (let i = 0; i < 5; i++) {
      await store.upsert(build({ buildId: `mh-${i}`, speciesId: "humano", subclassId: "Evocador" }));
    }
    // Mas 25 Magos no total (contando os humanos) — suficiente no nível "classe apenas".
    for (let i = 0; i < 20; i++) {
      await store.upsert(build({ buildId: `mo-${i}`, speciesId: "elfo", subclassId: "Abjurador" }));
    }

    const insight = await computeInsight(
      definitionFor("subclassPopularity"),
      store,
      { classId: "mago", speciesId: "humano" },
      { minSampleSize: 20 },
    );

    expect(insight).not.toBeNull();
    expect(insight?.sampleSize).toBe(25); // caiu para "todos os Magos", não só os 5 humanos
    expect(insight?.scopeLabel).not.toContain("humano");
  });

  it("subclassPopularity não se aplica sem uma classe escolhida", async () => {
    const insight = await computeInsight(definitionFor("subclassPopularity"), store, {}, { minSampleSize: 20 });
    expect(insight).toBeNull();
  });
});

describe("computeInsight — cold start / fallback sem dados (§12)", () => {
  it("devolve null quando não há nenhum build (base vazia)", async () => {
    for (const definition of insightMetricDefinitions) {
      const insight = await computeInsight(definition, store, { classId: "mago", level: 5 }, { minSampleSize: 20 });
      expect(insight).toBeNull();
    }
  });

  it("nunca lança erro nem bloqueia — apenas retorna null", async () => {
    await expect(
      computeInsight(definitionFor("armorPopularity"), store, { classId: "clerigo" }, { minSampleSize: 20 }),
    ).resolves.toBeNull();
  });
});

describe("computeInsight — rótulos legíveis por métrica", () => {
  it("mapeia espécie/antecedente/armadura/atributo para nomes de exibição em português", async () => {
    for (let i = 0; i < 20; i++) {
      await store.upsert(
        build({
          buildId: `b${i}`,
          classId: "bardo",
          speciesId: "halfling",
          backgroundId: "artista",
          armorId: "couroBatido",
          abilityScores: { FOR: 8, DEX: 8, CON: 8, INT: 8, SAB: 8, CAR: 18 },
        }),
      );
    }

    const species = await computeInsight(definitionFor("speciesPopularity"), store, { classId: "bardo" }, { minSampleSize: 20 });
    expect(species?.items[0]?.label).toBe("Halfling");

    const background = await computeInsight(definitionFor("backgroundPopularity"), store, { classId: "bardo" }, { minSampleSize: 20 });
    expect(background?.items[0]?.label).toBe("Artista");

    const armor = await computeInsight(definitionFor("armorPopularity"), store, { classId: "bardo" }, { minSampleSize: 20 });
    expect(armor?.items[0]?.label).toBe("Couro Batido");

    const ability = await computeInsight(definitionFor("abilityHighest"), store, { classId: "bardo" }, { minSampleSize: 20 });
    expect(ability?.items[0]?.label).toBe("Carisma");
  });
});

describe("computeInsight — dimensão highestAbility em armorPopularity (§1.2)", () => {
  function withHighestDex(buildId: string, armorId: ArmorId) {
    return build({
      buildId,
      classId: "mago",
      armorId,
      abilityScores: { FOR: 8, DEX: 18, CON: 8, INT: 12, SAB: 8, CAR: 8 },
    });
  }

  function withHighestInt(buildId: string, armorId: ArmorId) {
    return build({
      buildId,
      classId: "mago",
      armorId,
      abilityScores: { FOR: 8, DEX: 8, CON: 8, INT: 18, SAB: 8, CAR: 8 },
    });
  }

  it("usa o contexto classe+highestAbility quando a amostra é suficiente", async () => {
    for (let i = 0; i < 25; i++) {
      await store.upsert(withHighestDex(`dex-${i}`, "couroBatido"));
    }
    for (let i = 0; i < 25; i++) {
      await store.upsert(withHighestInt(`int-${i}`, "placas"));
    }

    const insight = await computeInsight(
      definitionFor("armorPopularity"),
      store,
      { classId: "mago", highestAbility: "DEX" },
      { minSampleSize: 20 },
    );

    expect(insight?.sampleSize).toBe(25);
    expect(insight?.items).toEqual([{ label: "Couro Batido", percentage: 100 }]);
  });

  it("calcula o percentual corretamente dentro do contexto highestAbility", async () => {
    for (let i = 0; i < 15; i++) {
      await store.upsert(withHighestDex(`a-${i}`, "couroBatido"));
    }
    for (let i = 0; i < 5; i++) {
      await store.upsert(withHighestDex(`b-${i}`, "couro"));
    }

    const insight = await computeInsight(
      definitionFor("armorPopularity"),
      store,
      { classId: "mago", highestAbility: "DEX" },
      { minSampleSize: 20 },
    );

    expect(insight?.sampleSize).toBe(20);
    expect(insight?.items).toEqual(
      expect.arrayContaining([
        { label: "Couro Batido", percentage: 75 },
        { label: "Couro", percentage: 25 },
      ]),
    );
  });

  it("cai para um contexto mais amplo quando highestAbility não tem amostra suficiente", async () => {
    // Só 3 Magos com DEX como maior atributo — insuficiente sozinho.
    for (let i = 0; i < 3; i++) {
      await store.upsert(withHighestDex(`dex-${i}`, "couroBatido"));
    }
    // Mas 25 Magos no total (incluindo os 3 acima) — suficiente sem o filtro de atributo.
    for (let i = 0; i < 22; i++) {
      await store.upsert(withHighestInt(`int-${i}`, "placas"));
    }

    const insight = await computeInsight(
      definitionFor("armorPopularity"),
      store,
      { classId: "mago", highestAbility: "DEX" },
      { minSampleSize: 20 },
    );

    expect(insight).not.toBeNull();
    expect(insight?.sampleSize).toBe(25); // caiu para "todos os Magos"
  });

  it("não inventa resultado quando nem o contexto amplo tem amostra suficiente", async () => {
    for (let i = 0; i < 3; i++) {
      await store.upsert(withHighestDex(`dex-${i}`, "couroBatido"));
    }

    const insight = await computeInsight(
      definitionFor("armorPopularity"),
      store,
      { classId: "mago", highestAbility: "DEX" },
      { minSampleSize: 20 },
    );

    expect(insight).toBeNull();
  });
});
