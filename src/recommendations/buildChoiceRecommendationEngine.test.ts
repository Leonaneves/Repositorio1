import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryBuildStore } from "../repositories/index.js";
import { testAbilities, testUserBuild } from "../references/testFixtures.js";
import { clearBuildChoiceRecommendationCache, getBuildChoiceRecommendations } from "./buildChoiceRecommendationEngine.js";
import { backgroundAbilityAffinity, ruleMultiplier, skillAbilityAffinity } from "./ruleInfluence.js";
import type { BuildChoiceScoreQuery } from "./scoring.js";

const base: BuildChoiceScoreQuery = {
  kind: "background",
  classId: "guerreiro",
  speciesId: null,
  subclassId: null,
  choiceId: null,
  highestAbility: null,
  withValues: [],
  excludeCharacterId: null,
};

async function storeWith(builds: ReturnType<typeof testUserBuild>[]): Promise<InMemoryBuildStore> {
  const store = new InMemoryBuildStore();
  for (const build of builds) await store.insertConfirmed(build);
  return store;
}

beforeEach(() => clearBuildChoiceRecommendationCache());

describe("influência por regra — Antecedente × atributos que a classe mais usa", () => {
  it("afinidade: atributos do Antecedente que costumam ser o MAIOR somam; os que costumam ser o MENOR subtraem", () => {
    const high = { FOR: 0.8, DEX: 0.2 };
    const dump = { CAR: 0.7, INT: 0.3 };
    expect(backgroundAbilityAffinity("soldado", high, dump)).toBeCloseTo(1); // FOR, DEX, CON
    expect(backgroundAbilityAffinity("sabio", high, dump)).toBeCloseTo(-0.3); // CON, INT, SAB
    expect(ruleMultiplier(1)).toBe(1.5);
  });

  it("com o mesmo número de jogadores, o Antecedente que aumenta os atributos-chave da classe vem primeiro", async () => {
    // 12 guerreiros de FOR (menor: CAR): metade Soldado (FOR/DEX/CON), metade Charlatão (DEX/CON/CAR).
    const store = await storeWith(
      Array.from({ length: 12 }, (_, i) =>
        testUserBuild(i + 1, "guerreiro", [], { abilityScores: testAbilities({ FOR: 15, CAR: 8 }), backgroundId: i % 2 === 0 ? "charlatao" : "soldado" }),
      ),
    );
    const result = await getBuildChoiceRecommendations({ query: base, eligibleValues: ["charlatao", "soldado"], max: 1 }, { repository: store });
    expect(result?.values).toEqual(["soldado"]);
  });
});

describe("influência por regra — Perícias × atributos do personagem", () => {
  it("afinidade 1 para a perícia do maior atributo, 0 para a do menor", () => {
    const scores = testAbilities({ DEX: 16, INT: 8 });
    expect(skillAbilityAffinity("furtividade", scores)).toBe(1);
    expect(skillAbilityAffinity("arcanismo", scores)).toBe(0);
    expect(skillAbilityAffinity("atletismo", testAbilities())).toBe(0);
  });

  it("empate estatístico: a perícia do atributo alto do personagem vem primeiro", async () => {
    const choiceId = "classe-guerreiro-pericias";
    const store = await storeWith(
      Array.from({ length: 10 }, (_, i) => testUserBuild(i + 1, "guerreiro", [], { skillChoices: { [choiceId]: i < 5 ? ["acrobacia"] : ["atletismo"] } })),
    );
    const query = { ...base, kind: "skillChoice" as const, choiceId };
    const dexterous = await getBuildChoiceRecommendations(
      { query, eligibleValues: ["atletismo", "acrobacia"], max: 1, abilityScores: testAbilities({ DEX: 16, FOR: 8 }) },
      { repository: store },
    );
    expect(dexterous?.values).toEqual(["acrobacia"]);
    const strong = await getBuildChoiceRecommendations(
      { query, eligibleValues: ["atletismo", "acrobacia"], max: 1, abilityScores: testAbilities({ FOR: 16, DEX: 8 }) },
      { repository: store },
    );
    expect(strong?.values).toEqual(["atletismo"]);
  });
});

describe("getBuildChoiceRecommendations", () => {
  it("lista elegível vazia ou falha: nenhuma recomendação, sem lançar erro", async () => {
    expect(await getBuildChoiceRecommendations({ query: base, eligibleValues: [], max: 3 }, { repository: new InMemoryBuildStore() })).toBeNull();
    const failing = { getBuildChoiceScores: () => Promise.reject(new Error("offline")) };
    await expect(getBuildChoiceRecommendations({ query: base, eligibleValues: ["soldado"], max: 3 }, { repository: failing })).resolves.toBeNull();
  });
});
