import { describe, expect, it } from "vitest";
import { referenceDatasetsToFacts } from "../references/referenceFacts.js";
import { validateReferenceFile } from "../references/validateReferenceFile.js";
import type { NormalizedReferenceDataset, ReferenceFile } from "../references/referenceFormat.js";
import { testAbilities, testAcquisition, testCharacter, testFighterAsi4, testReferenceFile, testUserBuild, testBuildId } from "../references/testFixtures.js";
import { buildToTalentChoiceFacts, countTalentChoices } from "./countTalentChoices.js";
import type { TalentChoiceCountQuery, TalentChoiceCountRow } from "./types.js";

function dataset(file: ReferenceFile): NormalizedReferenceDataset {
  const result = validateReferenceFile(file);
  if (!result.ok || !result.dataset) throw new Error(JSON.stringify(result.issues));
  return result.dataset;
}

const FOR_HIGH = testAbilities({ FOR: 16, CON: 14 });
const DEX_HIGH = testAbilities({ DEX: 16, CON: 14 });

function query(overrides: Partial<TalentChoiceCountQuery> = {}): TalentChoiceCountQuery {
  return {
    opportunityKind: "generalFeat",
    classId: "guerreiro",
    level: 4,
    subclassId: "Campeão",
    highestAbility: "FOR",
    excludeCharacterId: null,
    includeUserRecords: false,
    ...overrides,
  };
}

function find(rows: TalentChoiceCountRow[], pool: string, tier: string, talentId: string) {
  return rows.find((row) => row.pool === pool && row.tier === tier && row.talentId === talentId);
}

describe("countTalentChoices — referências", () => {
  const sources = [
    dataset(testReferenceFile("a", { independenceGroup: "grupo-a", characters: [testFighterAsi4("a1", "sentinela", FOR_HIGH), testFighterAsi4("a2", "mestre-em-armas-grandes", FOR_HIGH)] })),
    // Republicação do grupo A: personagens distintos, mas NÃO uma fonte independente a mais.
    dataset(testReferenceFile("a-copia", { independenceGroup: "grupo-a", characters: [testFighterAsi4("c1", "sentinela", FOR_HIGH)] })),
    dataset(testReferenceFile("b", { independenceGroup: "grupo-b", characters: [testFighterAsi4("b1", "sentinela", DEX_HIGH), testFighterAsi4("b2", "resistente", null)] })),
  ];
  const facts = referenceDatasetsToFacts(sources);

  it("conta personagens distintos e grupos de fontes independentes (cópias compartilham o grupo)", () => {
    const rows = countTalentChoices(facts, query());
    const sentinela = find(rows, "reference_extracted", "level", "sentinela")!;
    expect(sentinela.characters).toBe(3);
    expect(sentinela.independentGroups).toBe(2);
    expect(sentinela.sampleCharacters).toBe(5);
    expect(sentinela.sampleGroups).toBe(2);
  });

  it("registro parcial (atributos desconhecidos) só entra nas faixas que não dependem de atributo", () => {
    const rows = countTalentChoices(facts, query());
    expect(find(rows, "reference_extracted", "level", "resistente")).toBeDefined();
    expect(find(rows, "reference_extracted", "level_ability", "resistente")).toBeUndefined();
    expect(find(rows, "reference_extracted", "level_subclass_ability", "resistente")).toBeUndefined();
    // Faixa com atributo: só quem tinha FOR como maior atributo antes da escolha.
    expect(find(rows, "reference_extracted", "level_ability", "sentinela")!.characters).toBe(2);
  });

  it("atributo/subclasse desconhecidos do personagem atual: faixas que dependem deles nem são consultadas", () => {
    const rows = countTalentChoices(facts, query({ highestAbility: null, subclassId: null }));
    expect(new Set(rows.map((row) => row.tier))).toEqual(new Set(["level", "level_band"]));
  });

  it("outra classe ou outro tipo de oportunidade não entra na contagem", () => {
    expect(countTalentChoices(facts, query({ classId: "mago" }))).toEqual([]);
    expect(countTalentChoices(facts, query({ opportunityKind: "fightingStyle", level: 1 }))).toEqual([]);
  });

  it("várias aquisições do MESMO personagem na mesma faixa contam como 1", () => {
    const repeated = dataset(
      testReferenceFile("repetido", {
        characters: [
          testCharacter("h", {
            classId: "guerreiro",
            subclassId: "Campeão",
            level: 8,
            acquisitions: [testAcquisition("generalFeat", 6, "habilidoso"), testAcquisition("generalFeat", 8, "habilidoso")],
          }),
        ],
      }),
    );
    const rows = countTalentChoices(referenceDatasetsToFacts([repeated]), query({ level: 6, highestAbility: null }));
    expect(find(rows, "reference_extracted", "level", "habilidoso")!.characters).toBe(1);
    const band = find(rows, "reference_extracted", "level_band", "habilidoso")!;
    expect(band.characters).toBe(1);
    expect(band.sampleCharacters).toBe(1);
  });

  it("reimportar a mesma fonte não duplica (a última versão substitui a anterior)", () => {
    const first = dataset(testReferenceFile("a", { characters: [testFighterAsi4("a1", "sentinela", FOR_HIGH)] }));
    const updated = dataset(testReferenceFile("a", { characters: [testFighterAsi4("a1", "alerta", FOR_HIGH)] }));
    const rows = countTalentChoices(referenceDatasetsToFacts([first, updated]), query());
    expect(find(rows, "reference_extracted", "level", "sentinela")).toBeUndefined();
    expect(find(rows, "reference_extracted", "level", "alerta")!.sampleCharacters).toBe(1);
  });
});

describe("countTalentChoices — dados reais", () => {
  const asi4 = (talentId: string) => ({ kind: "generalFeat" as const, opportunityId: "asi-4", level: 4, talentId, subclassId: "Campeão", abilityScores: FOR_HIGH });

  function tenConfirmed(talentId = "sentinela") {
    return Array.from({ length: 10 }, (_, index) => testUserBuild(index + 1, "guerreiro", [asi4(talentId)]));
  }

  it("com includeUserRecords desligado, nenhum dado real é contado", () => {
    const facts = tenConfirmed().flatMap(buildToTalentChoiceFacts);
    expect(countTalentChoices(facts, query())).toEqual([]);
  });

  it("faixas reais abaixo de 10 personagens nunca saem do repositório; com 10 saem", () => {
    const nine = tenConfirmed().slice(0, 9).flatMap(buildToTalentChoiceFacts);
    expect(countTalentChoices(nine, query({ includeUserRecords: true }))).toEqual([]);
    const ten = tenConfirmed().flatMap(buildToTalentChoiceFacts);
    expect(find(countTalentChoices(ten, query({ includeUserRecords: true })), "user", "level", "sentinela")!.characters).toBe(10);
  });

  it("o próprio personagem é excluído da sua amostra", () => {
    const facts = tenConfirmed().flatMap(buildToTalentChoiceFacts);
    expect(countTalentChoices(facts, query({ includeUserRecords: true, excludeCharacterId: testBuildId(1) }))).toEqual([]);
  });

  it("rascunhos, referências gravadas em character_builds e o talento do Antecedente (não voluntário) nunca contam", () => {
    expect(buildToTalentChoiceFacts(testUserBuild(1, "guerreiro", [asi4("sentinela")], { status: "draft" }))).toEqual([]);
    expect(buildToTalentChoiceFacts(testUserBuild(1, "guerreiro", [asi4("sentinela")], { origin: "reference" }))).toEqual([]);
    const background = testUserBuild(1, "guerreiro", [{ kind: "originFeat", opportunityId: "background", level: null, talentId: "alerta", voluntary: false }]);
    expect(buildToTalentChoiceFacts(background)).toEqual([]);
  });

  it("registro antigo sem opportunityKind tem o tipo derivado do opportunityId", () => {
    const legacy = testUserBuild(1, "guerreiro", [{ ...asi4("sentinela"), legacyWithoutKind: true }]);
    expect(buildToTalentChoiceFacts(legacy)[0]).toMatchObject({ opportunityKind: "generalFeat", subclassId: "Campeão", highestAbility: "FOR", level: 4 });
  });

  it("subclasse 'desconhecido' gravada vira desconhecida (null), nunca um valor", () => {
    const build = testUserBuild(1, "guerreiro", [{ kind: "fightingStyle", opportunityId: "guerreiro-estilo-de-luta-escolha", level: 1, talentId: "defensivo" }]);
    expect(buildToTalentChoiceFacts(build)[0].subclassId).toBeNull();
  });
});
