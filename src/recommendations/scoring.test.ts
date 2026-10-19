import { describe, expect, it } from "vitest";
import { testAbilities, testBuildId, testUserBuild } from "../references/testFixtures.js";
import { MAX_BUILD_CHOICE_RECOMMENDATIONS, selectBuildChoiceRecommendations } from "./buildChoiceRecommendations.js";
import { scoreBuildChoices, scoreTalentChoices, SMOOTHING_K, SPECIES_SMOOTHING_K, type BuildChoiceScoreQuery, type BuildChoiceScoreRow } from "./scoring.js";
import { buildToTalentChoiceFacts } from "./countTalentChoices.js";
import type { TalentChoiceCountQuery } from "./types.js";

const query = (overrides: Partial<BuildChoiceScoreQuery> = {}): BuildChoiceScoreQuery => ({
  kind: "species",
  classId: "guerreiro",
  subclassId: null,
  choiceId: null,
  highestAbility: null,
  withValues: [],
  excludeCharacterId: null,
  ...overrides,
});

const fighters = (count: number, overrides: (index: number) => Parameters<typeof testUserBuild>[3] = () => ({})) =>
  Array.from({ length: count }, (_, index) => testUserBuild(index + 1, "guerreiro", [], overrides(index)));

const scoreOf = (rows: BuildChoiceScoreRow[], value: string) => rows.find((row) => row.value === value)?.score;

describe("limites por seletor", () => {
  it("Espécie/Antecedente/Perícias/Metamagia/Invocações/Manobras: até 3; atributos: 1 maior e 1 menor; Subclasse: 1", () => {
    expect(MAX_BUILD_CHOICE_RECOMMENDATIONS).toEqual({
      species: 3,
      background: 3,
      highestAbility: 1,
      dumpAbility: 1,
      skillChoice: 3,
      subclass: 1,
      metamagic: 3,
      invocation: 3,
      maneuver: 3,
    });
  });
});

describe("scoreBuildChoices — a classe é a base", () => {
  it("9 personagens da classe: nada; 10: fração da classe", () => {
    expect(scoreBuildChoices(fighters(9, () => ({ speciesId: "anao" })), query())).toEqual([]);
    const rows = scoreBuildChoices(fighters(10, (i) => ({ speciesId: i < 7 ? "anao" : "elfo" })), query());
    expect(scoreOf(rows, "anao")).toBeCloseTo(0.7);
    expect(rows.find((row) => row.value === "anao")).toMatchObject({ classCharacters: 7, classSample: 10 });
  });

  it("só a mesma classe; o próprio personagem nunca conta", () => {
    const builds = [...fighters(10, () => ({ speciesId: "anao" })), testUserBuild(50, "mago", [], { speciesId: "elfo" })];
    expect(scoreBuildChoices(builds, query()).map((row) => row.value)).toEqual(["anao"]);
    expect(scoreBuildChoices(builds, query({ excludeCharacterId: testBuildId(1) }))).toEqual([]);
  });
});

describe("scoreBuildChoices — a subclasse refina", () => {
  // 20 guerreiros: no geral, Anão 12 × Elfo 8; entre os 4 Psiônicos, todos Elfo.
  const builds = fighters(20, (i) => ({ subclassId: i < 4 ? "Psiônico" : "Campeão", speciesId: i < 4 ? "elfo" : i < 16 ? "anao" : "elfo" }));

  it("poucos personagens da subclasse movem a base sem decidir sozinhos", () => {
    const rows = scoreBuildChoices(builds, query({ subclassId: "Psiônico" }));
    // Espécie: K = 20 (a classe pesa mais). Elfo: (4 + 20 × 0.4) / (4 + 20) = 0.5; Anão: (0 + 20 × 0.6) / 24 = 0.5.
    expect(scoreOf(rows, "elfo")).toBeCloseTo((4 + SPECIES_SMOOTHING_K * 0.4) / (4 + SPECIES_SMOOTHING_K));
    expect(scoreOf(rows, "anao")).toBeCloseTo((0 + SPECIES_SMOOTHING_K * 0.6) / (4 + SPECIES_SMOOTHING_K));
    // Sem subclasse: só a classe (Anão na frente).
    expect(scoreOf(scoreBuildChoices(builds, query()), "anao")).toBeCloseTo(0.6);
  });

  it("Antecedente e atributos usam K = 10 (a subclasse pesa mais que na Espécie)", () => {
    const bg = fighters(20, (i) => ({ subclassId: i < 4 ? "Psiônico" : "Campeão", backgroundId: i < 4 ? "sabio" : "soldado" }));
    expect(scoreOf(scoreBuildChoices(bg, query({ kind: "background", subclassId: "Psiônico" })), "sabio")).toBeCloseTo(
      (4 + SMOOTHING_K * 0.2) / (4 + SMOOTHING_K),
    );
  });

  it("Subclasse: só a classe (nunca refinada pela própria subclasse)", () => {
    const rows = scoreBuildChoices(builds, query({ kind: "subclass", subclassId: "Psiônico" }));
    expect(scoreOf(rows, "Campeão")).toBeCloseTo(0.8);
    expect(scoreOf(rows, "Psiônico")).toBeCloseTo(0.2);
  });
});

describe("scoreBuildChoices — atributos refinam as Perícias", () => {
  it("contexto: personagens da classe com o mesmo maior atributo", () => {
    const choiceId = "classe-guerreiro-pericias";
    const builds = fighters(20, (i) => ({
      abilityScores: i < 5 ? testAbilities({ DEX: 15 }) : testAbilities({ FOR: 15 }),
      skillChoices: { [choiceId]: i < 5 ? ["acrobacia", "percepcao"] : ["atletismo", "percepcao"] },
    }));
    const rows = scoreBuildChoices(builds, query({ kind: "skillChoice", choiceId, highestAbility: "DEX" }));
    expect(scoreOf(rows, "acrobacia")).toBeCloseTo((5 + SMOOTHING_K * 0.25) / (5 + SMOOTHING_K));
    expect(scoreOf(rows, "atletismo")).toBeCloseTo((0 + SMOOTHING_K * 0.75) / (5 + SMOOTHING_K));
  });
});

describe("scoreBuildChoices — escolhas já feitas (coocorrência)", () => {
  it("Metamagia: o que costuma ser escolhido JUNTO das que o personagem já tem; as já escolhidas nunca voltam", () => {
    // 12 feiticeiros: quem tem Acelerada quase sempre leva Duplicada; quem tem Sutil leva Cautelosa.
    const builds = Array.from({ length: 12 }, (_, i) =>
      testUserBuild(i + 1, "feiticeiro", [], { metamagicOptions: i < 6 ? ["acelerada", "duplicada"] : ["sutil", "cautelosa"] }),
    );
    const plain = scoreBuildChoices(builds, query({ kind: "metamagic", classId: "feiticeiro" }));
    expect(scoreOf(plain, "duplicada")).toBeCloseTo(scoreOf(plain, "cautelosa")!);

    const withQuickened = scoreBuildChoices(builds, query({ kind: "metamagic", classId: "feiticeiro", withValues: ["acelerada"] }));
    expect(scoreOf(withQuickened, "acelerada")).toBeUndefined();
    expect(scoreOf(withQuickened, "duplicada")!).toBeGreaterThan(scoreOf(withQuickened, "cautelosa")!);
    expect(scoreOf(withQuickened, "duplicada")).toBeCloseTo((6 + SMOOTHING_K * 0.5) / (6 + SMOOTHING_K));
  });

  it("Invocações: classe → subclasse → coocorrência", () => {
    const builds = Array.from({ length: 10 }, (_, i) =>
      testUserBuild(i + 1, "bruxo", [], { subclassId: "Patrono Ínfero", invocationIds: i < 5 ? ["explosao-agonizante", "lanca-mistica"] : ["mente-mistica"] }),
    );
    const rows = scoreBuildChoices(builds, query({ kind: "invocation", classId: "bruxo", subclassId: "Patrono Ínfero", withValues: ["explosao-agonizante"] }));
    expect(rows.map((row) => row.value).sort()).toEqual(["lanca-mistica", "mente-mistica"]);
    expect(scoreOf(rows, "lanca-mistica")!).toBeGreaterThan(scoreOf(rows, "mente-mistica")!);
  });
});

describe("selectBuildChoiceRecommendations", () => {
  const row = (value: string, score: number, classCharacters = 3): BuildChoiceScoreRow => ({ value, score, classCharacters, classSample: 12 });

  it("ranking pela pontuação, empate pelos personagens da classe e depois pela ordem do seletor; corte no máximo", () => {
    const rows = [row("elfo", 0.3, 4), row("anao", 0.3, 4), row("humano", 0.5), row("orc", 0.3, 5)];
    expect(selectBuildChoiceRecommendations(rows, ["anao", "elfo", "humano", "orc"], 3)).toEqual({
      values: ["humano", "orc", "anao"],
      characters: { humano: 3, orc: 5, anao: 4 },
      classSample: 12,
    });
  });

  it("só opções elegíveis; ajuste por regra reordena", () => {
    const rows = [row("soldado", 0.5), row("sabio", 0.4)];
    expect(selectBuildChoiceRecommendations(rows, ["sabio"], 3)?.values).toEqual(["sabio"]);
    expect(selectBuildChoiceRecommendations(rows, ["soldado", "sabio"], 1, (value) => (value === "sabio" ? 1.5 : 0.8))?.values).toEqual(["sabio"]);
    expect(selectBuildChoiceRecommendations(rows, ["guarda"], 3)).toBeNull();
  });
});

describe("scoreTalentChoices — classe/nível → subclasse e atributos", () => {
  const asi4 = (talentId: string, subclassId: string, abilityScores = testAbilities({ FOR: 16 })) => ({
    kind: "generalFeat" as const,
    opportunityId: "asi-4",
    level: 4,
    talentId,
    subclassId,
    abilityScores,
  });
  const base: TalentChoiceCountQuery = {
    opportunityKind: "generalFeat",
    classId: "guerreiro",
    level: 4,
    subclassId: null,
    highestAbility: null,
    excludeCharacterId: null,
    includeUserRecords: true,
  };
  // 12 Campeões FOR escolheram Sentinela; 3 Mestres de Batalha DEX escolheram Alerta.
  const facts = [
    ...Array.from({ length: 12 }, (_, i) => testUserBuild(i + 1, "guerreiro", [asi4("sentinela", "Campeão")])),
    ...Array.from({ length: 3 }, (_, i) => testUserBuild(20 + i, "guerreiro", [asi4("alerta", "Mestre de Batalha", testAbilities({ DEX: 16 }))])),
  ].flatMap(buildToTalentChoiceFacts);

  it("sem subclasse/atributos: fração da classe no nível", () => {
    const rows = scoreTalentChoices(facts, base);
    expect(rows.find((row) => row.talentId === "sentinela")).toMatchObject({ pool: "user", baseCharacters: 12, baseSample: 15 });
    expect(rows.find((row) => row.talentId === "sentinela")!.score).toBeCloseTo(12 / 15);
  });

  it("a subclasse e o maior atributo puxam para o que esse perfil escolhe", () => {
    const rows = scoreTalentChoices(facts, { ...base, subclassId: "Mestre de Batalha", highestAbility: "DEX" });
    const alerta = rows.find((row) => row.talentId === "alerta")!.score;
    expect(alerta).toBeGreaterThan(3 / 15);
    expect(rows.find((row) => row.talentId === "sentinela")!.score).toBeLessThan(12 / 15);
  });

  it("menos de 10 personagens reais na base: nada", () => {
    expect(scoreTalentChoices(facts.slice(0, 9), base)).toEqual([]);
  });
});
