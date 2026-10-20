import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTalentChoiceStatsRepository, InMemoryBuildStore } from "../repositories/index.js";
import type { TalentChoiceStatsRepository } from "../repositories/TalentChoiceStatsRepository.js";
import { referenceDatasetsToFacts } from "../references/referenceFacts.js";
import { validateReferenceFile } from "../references/validateReferenceFile.js";
import { testAbilities, testFighterAsi4, testReferenceFile } from "../references/testFixtures.js";
import { clearTalentRecommendationCache, getTalentRecommendations } from "./talentRecommendationEngine.js";
import type { TalentChoiceCountQuery } from "./types.js";

const QUERY: TalentChoiceCountQuery = {
  opportunityKind: "generalFeat",
  classId: "guerreiro",
  subclassId: "Campeão",
  highestAbility: "FOR",
  excludeCharacterId: null,
  includeUserRecords: false,
};

function storeWithReferences(): InMemoryBuildStore {
  const store = new InMemoryBuildStore();
  const files = [
    testReferenceFile("a", { independenceGroup: "a", characters: [testFighterAsi4("a1", "sentinela", testAbilities({ FOR: 16 })), testFighterAsi4("a2", "alerta", testAbilities({ FOR: 16 }))] }),
    testReferenceFile("b", { independenceGroup: "b", characters: [testFighterAsi4("b1", "sentinela", testAbilities({ FOR: 16 }))] }),
  ];
  store.setReferenceFacts(referenceDatasetsToFacts(files.map((file) => validateReferenceFile(file).dataset!)));
  return store;
}

beforeEach(() => {
  clearTalentRecommendationCache();
});

describe("getTalentRecommendations", () => {
  it("devolve as recomendações elegíveis com a origem dos dados guardada internamente", async () => {
    const result = await getTalentRecommendations(QUERY, ["alerta", "sentinela", "resistente"], { repository: storeWithReferences() });
    expect(result).toEqual({ talentIds: ["sentinela", "alerta"], characters: { sentinela: 2, alerta: 1 }, pool: "reference_extracted", sampleCharacters: 3 });
  });

  it("sem dados (repositório vazio): nenhuma recomendação", async () => {
    expect(await getTalentRecommendations(QUERY, ["alerta"], { repository: new InMemoryBuildStore() })).toBeNull();
  });

  it("lista elegível vazia: nem consulta o repositório", async () => {
    const repository: TalentChoiceStatsRepository = { getTalentChoiceCounts: vi.fn(), getTalentChoiceScores: vi.fn() };
    expect(await getTalentRecommendations(QUERY, [], { repository })).toBeNull();
    expect(repository.getTalentChoiceScores).not.toHaveBeenCalled();
  });

  it("falha de conexão: nenhuma recomendação, sem lançar erro", async () => {
    const repository: TalentChoiceStatsRepository = { getTalentChoiceCounts: vi.fn(), getTalentChoiceScores: vi.fn().mockRejectedValue(new Error("Failed to fetch")) };
    await expect(getTalentRecommendations(QUERY, ["alerta"], { repository })).resolves.toBeNull();
  });

  it("repositório padrão: cacheia a consulta, e uma falha nunca fica presa no cache", async () => {
    const repository = getTalentChoiceStatsRepository();
    const spy = vi.spyOn(repository, "getTalentChoiceScores").mockRejectedValueOnce(new Error("offline"));
    expect(await getTalentRecommendations(QUERY, ["alerta"])).toBeNull();
    expect(await getTalentRecommendations(QUERY, ["alerta"])).toBeNull(); // tentou de novo (sem dados no app)
    expect(spy).toHaveBeenCalledTimes(2);
    await getTalentRecommendations(QUERY, ["alerta"]);
    expect(spy).toHaveBeenCalledTimes(2); // agora em cache
    spy.mockRestore();
  });

  it("o app, sem nenhuma importação, não tem referência alguma embutida", async () => {
    expect(await getTalentChoiceStatsRepository().getTalentChoiceCounts(QUERY)).toEqual([]);
  });
});
