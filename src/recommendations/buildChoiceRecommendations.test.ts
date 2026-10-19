import { describe, expect, it } from "vitest";
import { testAbilities, testBuildId, testUserBuild } from "../references/testFixtures.js";
import {
  countBuildChoices,
  MAX_BUILD_CHOICE_RECOMMENDATIONS,
  selectBuildChoiceRecommendations,
  type BuildChoiceCountQuery,
  type BuildChoiceCountRow,
} from "./buildChoiceRecommendations.js";

const query = (overrides: Partial<BuildChoiceCountQuery> = {}): BuildChoiceCountQuery => ({
  kind: "species",
  classId: "guerreiro",
  subclassId: null,
  choiceId: null,
  excludeCharacterId: null,
  ...overrides,
});

const fighters = (count: number, overrides: (index: number) => Parameters<typeof testUserBuild>[3] = () => ({})) =>
  Array.from({ length: count }, (_, index) => testUserBuild(index + 1, "guerreiro", [], overrides(index)));

describe("limites por seletor", () => {
  it("Espécie/Antecedente/Perícias: até 3; atributos: 1 maior e 1 menor", () => {
    expect(MAX_BUILD_CHOICE_RECOMMENDATIONS).toEqual({ species: 3, background: 3, highestAbility: 1, dumpAbility: 1, skillChoice: 3 });
  });
});

describe("countBuildChoices", () => {
  it("9 personagens: nada sai; 10: sai", () => {
    expect(countBuildChoices(fighters(9, () => ({ speciesId: "anao" })), query())).toEqual([]);
    expect(countBuildChoices(fighters(10, () => ({ speciesId: "anao" })), query())).toEqual([{ tier: "class", value: "anao", characters: 10, sampleCharacters: 10 }]);
  });

  it("só a mesma classe; o próprio personagem nunca conta", () => {
    const builds = [...fighters(10, () => ({ speciesId: "anao" })), testUserBuild(50, "mago", [], { speciesId: "elfo" })];
    expect(countBuildChoices(builds, query()).map((row) => row.value)).toEqual(["anao"]);
    expect(countBuildChoices(builds, query({ excludeCharacterId: testBuildId(1) }))).toEqual([]);
  });

  it("espécie/antecedente desconhecidos não entram na amostra", () => {
    const builds = fighters(12, (index) => ({ backgroundId: index < 3 ? null : "soldado" }));
    expect(countBuildChoices(builds, query({ kind: "background" }))).toEqual([]);
  });

  it("faixa da subclasse só quando o personagem atual tem subclasse", () => {
    const builds = fighters(12, (index) => ({ subclassId: index < 10 ? "Campeão" : "Psiônico", speciesId: index < 10 ? "anao" : "elfo" }));
    expect(countBuildChoices(builds, query()).every((row) => row.tier === "class")).toBe(true);
    expect(countBuildChoices(builds, query({ subclassId: "Campeão" })).filter((row) => row.tier === "class_subclass")).toEqual([
      { tier: "class_subclass", value: "anao", characters: 10, sampleCharacters: 10 },
    ]);
  });

  it("maior e menor atributo pelos valores base, empate pelo primeiro na ordem FOR > DEX > CON > INT > SAB > CAR", () => {
    const builds = fighters(10, () => ({ abilityScores: testAbilities({ DEX: 15, CON: 15, INT: 8, CAR: 8 }) }));
    expect(countBuildChoices(builds, query({ kind: "highestAbility" })).map((row) => row.value)).toEqual(["DEX"]);
    expect(countBuildChoices(builds, query({ kind: "dumpAbility" })).map((row) => row.value)).toEqual(["INT"]);
  });

  it("perícias: só a MESMA escolha; cada perícia escolhida conta o personagem uma vez", () => {
    const builds = fighters(10, (index) => ({
      skillChoices: { "classe-guerreiro-pericias": index < 7 ? ["atletismo", "percepcao"] : ["atletismo", "intimidacao"], "outra-escolha": ["arcanismo"] },
    }));
    const rows = countBuildChoices(builds, query({ kind: "skillChoice", choiceId: "classe-guerreiro-pericias" }));
    expect(Object.fromEntries(rows.map((row) => [row.value, row.characters]))).toEqual({ atletismo: 10, percepcao: 7, intimidacao: 3 });
    expect(rows.every((row) => row.sampleCharacters === 10)).toBe(true);
  });

  it("registros antigos sem `skillChoices` não quebram nem contam", () => {
    const legacy = fighters(10).map((build) => ({ ...build, skillChoices: undefined as unknown as Record<string, never> }));
    expect(countBuildChoices(legacy, query({ kind: "skillChoice", choiceId: "classe-guerreiro-pericias" }))).toEqual([]);
  });
});

describe("selectBuildChoiceRecommendations", () => {
  const row = (tier: BuildChoiceCountRow["tier"], value: string, characters: number, sampleCharacters = 12): BuildChoiceCountRow => ({ tier, value, characters, sampleCharacters });

  it("ranking por personagens, empate pela ordem do seletor, corte no máximo", () => {
    const rows = [row("class", "elfo", 3), row("class", "anao", 3), row("class", "humano", 5), row("class", "orc", 1)];
    expect(selectBuildChoiceRecommendations(rows, ["anao", "elfo", "humano", "orc"], 3)?.values).toEqual(["humano", "anao", "elfo"]);
    expect(selectBuildChoiceRecommendations(rows, ["anao", "elfo", "humano", "orc"], 1)?.values).toEqual(["humano"]);
  });

  it("só opções elegíveis; nenhuma elegível → próxima faixa ou nada", () => {
    const rows = [row("class_subclass", "humano", 8), row("class", "anao", 4)];
    expect(selectBuildChoiceRecommendations(rows, ["anao"], 3)).toMatchObject({ tier: "class", values: ["anao"] });
    expect(selectBuildChoiceRecommendations(rows, ["elfo"], 3)).toBeNull();
  });

  it("a faixa da subclasse vence quando tem amostra; abaixo de 10 cai para a classe", () => {
    expect(selectBuildChoiceRecommendations([row("class_subclass", "humano", 8, 10), row("class", "anao", 9)], ["anao", "humano"], 3)?.values).toEqual(["humano"]);
    expect(selectBuildChoiceRecommendations([row("class_subclass", "humano", 8, 9), row("class", "anao", 9)], ["anao", "humano"], 3)?.values).toEqual(["anao"]);
  });
});
