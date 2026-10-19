import { describe, expect, it } from "vitest";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { validateReferenceFile, type ReferenceValidationResult } from "./validateReferenceFile.js";
import { testAbilities, testAcquisition, testCharacter, testFighterAsi4, testReferenceFile } from "./testFixtures.js";

function invalidMessages(result: ReferenceValidationResult): string[] {
  return result.issues.filter((issue) => issue.severity === "invalid").map((issue) => `${issue.path}: ${issue.message}`);
}

function insufficientMessages(result: ReferenceValidationResult): string[] {
  return result.issues.filter((issue) => issue.severity === "insufficient").map((issue) => `${issue.path}: ${issue.message}`);
}

describe("validateReferenceFile — arquivo válido", () => {
  it("normaliza fonte, personagem e aquisição com a mesma identidade de oportunidade dos registros reais", () => {
    const file = testReferenceFile("valido", {
      independenceGroup: "grupo-x",
      characters: [
        testCharacter("campeao-8", {
          classId: "guerreiro",
          subclassId: "Campeão",
          speciesId: "humano",
          backgroundId: "soldado",
          level: 8,
          acquisitions: [
            testAcquisition("originFeat", null, "vigoroso"),
            testAcquisition("fightingStyle", 1, "defensivo", testAbilities({ FOR: 15, CON: 14 })),
            testAcquisition("generalFeat", 4, "sentinela", testAbilities({ FOR: 16, CON: 14 })),
            testAcquisition("fightingStyle", 7, "arquearia", null),
          ],
        }),
      ],
    });
    const result = validateReferenceFile(file);
    expect(invalidMessages(result)).toEqual([]);
    expect(result.ok).toBe(true);
    const character = result.dataset!.characters[0];
    expect(character.characterId).toBe("teste-valido/campeao-8");
    expect(character.acquisitions.map((a) => [a.opportunityId, a.opportunityKind, a.level, a.subclassId])).toEqual([
      ["species", "originFeat", null, null],
      [FIGHTER_FIGHTING_STYLE_CHOICE_ID, "fightingStyle", 1, null], // nível 1: subclasse ainda não existia
      ["asi-4", "generalFeat", 4, "Campeão"],
      [FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID, "fightingStyle", 7, "Campeão"],
    ]);
    expect(result.dataset!.source).toMatchObject({ sourceId: "teste-valido", independenceGroup: "grupo-x", contentType: "extracted", generationRuleId: null });
  });

  it("menções parciais ficam separadas dos personagens", () => {
    const file = testReferenceFile("mencao", {
      mentions: [{ key: "m1", opportunityKind: "generalFeat", talentId: "sentinela", classId: "guerreiro", level: null }],
    });
    const result = validateReferenceFile(file);
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters).toEqual([]);
    expect(result.dataset!.mentions).toEqual([
      { mentionKey: "m1", opportunityKind: "generalFeat", talentId: "sentinela", classId: "guerreiro", subclassId: null, level: null, sourceLocation: null },
    ]);
  });

  it("personagem republicado (sameAs) vira citação, nunca um segundo personagem", () => {
    const file = testReferenceFile("copia", { characters: [{ key: "x", sameAs: { sourceId: "teste-original", characterKey: "y" } }] });
    const result = validateReferenceFile(file);
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters).toEqual([]);
    expect(result.dataset!.citations).toEqual([{ characterKey: "x", canonicalCharacterId: "teste-original/y", sourceLocation: null }]);
  });
});

describe("validateReferenceFile — inválidos (arquivo rejeitado)", () => {
  const cases: { name: string; file: unknown; expected: RegExp }[] = [
    { name: "talento inexistente", file: testReferenceFile("a", { characters: [testFighterAsi4("c", "talento-que-nao-existe", null)] }), expected: /não existe no catálogo/ },
    {
      name: "classe inexistente",
      file: testReferenceFile("a", { characters: [testCharacter("c", { classId: "samurai", level: 4, acquisitions: [] })] }),
      expected: /classe do catálogo/,
    },
    {
      name: "subclasse de outra classe",
      file: testReferenceFile("a", { characters: [testFighterAsi4("c", "sentinela", null, "Caminho do Berserker")] }),
      expected: /não é subclasse de guerreiro/,
    },
    {
      name: "Estilo de Luta para Mago (oportunidade inexistente)",
      file: testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "mago", level: 2, acquisitions: [testAcquisition("fightingStyle", 1, "defensivo")] })],
      }),
      expected: /não tem oportunidade de fightingStyle/,
    },
    {
      name: "Talento Geral num nível sem ASI",
      file: testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "mago", level: 5, acquisitions: [testAcquisition("generalFeat", 5, "alerta")] })],
      }),
      expected: /não tem oportunidade de generalFeat no nível 5/,
    },
    {
      name: "Talento de Origem para espécie que não é Humano",
      file: testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "mago", speciesId: "elfo", level: 1, acquisitions: [testAcquisition("originFeat", null, "alerta")] })],
      }),
      expected: /Só o Humano/,
    },
    {
      name: "talento não repetível duas vezes (contando o do Antecedente)",
      file: testReferenceFile("a", {
        characters: [
          testCharacter("c", { classId: "guerreiro", speciesId: "humano", backgroundId: "criminoso", level: 1, acquisitions: [testAcquisition("originFeat", null, "alerta")] }),
        ],
      }),
      expected: /não é repetível/,
    },
    {
      name: "pré-requisito comprovadamente não atendido (Mestre Atirador com DEX 12)",
      file: testReferenceFile("a", { characters: [testFighterAsi4("c", "mestre-atirador", testAbilities({ DEX: 12, FOR: 16 }))] }),
      expected: /exige DEX 13\+/,
    },
    {
      name: "escolha acima do nível do personagem",
      file: testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "guerreiro", level: 3, subclassId: "Campeão", acquisitions: [testAcquisition("generalFeat", 4, "alerta")] })],
      }),
      expected: /personagem é de nível 3/,
    },
    {
      name: "subclasse antes do nível 3",
      file: testReferenceFile("a", { characters: [testCharacter("c", { classId: "guerreiro", subclassId: "Campeão", level: 2, acquisitions: [] })] }),
      expected: /a partir do nível 3/,
    },
    {
      name: "Estilo de Luta Adicional para guerreiro que não é Campeão",
      file: testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "guerreiro", subclassId: "Mestre de Batalha", level: 7, acquisitions: [testAcquisition("fightingStyle", 7, "arquearia")] })],
      }),
      expected: /só existe para Campeão/,
    },
    {
      name: "mesmo Estilo de Luta duas vezes",
      file: testReferenceFile("a", {
        characters: [
          testCharacter("c", {
            classId: "guerreiro",
            subclassId: "Campeão",
            level: 7,
            acquisitions: [testAcquisition("fightingStyle", 1, "arquearia"), testAcquisition("fightingStyle", 7, "arquearia")],
          }),
        ],
      }),
      expected: /mesmo Estilo de Luta/,
    },
    {
      name: "Dádiva da Recordação de Magia sem Conjuração (Bárbaro)",
      file: testReferenceFile("a", {
        characters: [
          testCharacter("c", {
            classId: "barbaro",
            subclassId: "Caminho do Berserker",
            level: 19,
            acquisitions: [testAcquisition("epicBoon", 19, "dadiva-da-recordacao-de-magia")],
          }),
        ],
      }),
      expected: /exige a característica Conjuração/,
    },
    {
      name: "atributos parciais (inventar o resto é proibido — use null)",
      file: testReferenceFile("a", { characters: [testFighterAsi4("c", "sentinela", { FOR: 16 } as never)] }),
      expected: /Informe os 6 atributos/,
    },
    {
      name: "campo desconhecido (erro de digitação)",
      file: (() => {
        const file = testReferenceFile("a", { characters: [testFighterAsi4("c", "sentinela", null)] });
        (file.characters![0].acquisitions![0] as unknown as Record<string, unknown>).abilityScoreBefore = testAbilities();
        return file;
      })(),
      expected: /Campo desconhecido "abilityScoreBefore"/,
    },
    {
      name: "chave de personagem repetida",
      file: testReferenceFile("a", { characters: [testFighterAsi4("c", "sentinela", null), testFighterAsi4("c", "alerta", null)] }),
      expected: /Chave "c" repetida/,
    },
    {
      name: "conteúdo sintético sem os metadados de geração",
      file: testReferenceFile("a", { contentType: "synthetic", characters: [testFighterAsi4("c", "sentinela", null)] }),
      expected: /Obrigatório para conteúdo sintético/,
    },
  ];

  for (const { name, file, expected } of cases) {
    it(name, () => {
      const result = validateReferenceFile(file);
      expect(result.ok).toBe(false);
      expect(result.dataset).toBeNull();
      expect(invalidMessages(result).join("\n")).toMatch(expected);
    });
  }

  it("conteúdo sintético continua rejeitado mesmo com regra informada (nenhuma aprovada nesta etapa)", () => {
    const file = testReferenceFile("a", { contentType: "synthetic", characters: [testFighterAsi4("c", "sentinela", null)] });
    file.source.synthetic = { generationRuleId: "qualquer-regra", derivedFromSourceIds: ["teste-b"] };
    expect(invalidMessages(validateReferenceFile(file)).join("\n")).toMatch(/Nenhuma regra de geração sintética foi aprovada/);
  });
});

describe("validateReferenceFile — dados insuficientes (aceitos, sem inventar nada)", () => {
  it("atributos desconhecidos: a escolha entra, sem atributos, com aviso de pré-requisito não verificável", () => {
    const result = validateReferenceFile(testReferenceFile("a", { characters: [testFighterAsi4("c", "mestre-atirador", null)] }));
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters[0].acquisitions[0].abilityScores).toBeNull();
    expect(insufficientMessages(result).join("\n")).toMatch(/não verificável \(atributos não informados\)/);
  });

  it("subclasse desconhecida: escolhas a partir do nível 3 ficam com subclasse null (nunca presumida)", () => {
    const result = validateReferenceFile(testReferenceFile("a", { characters: [testFighterAsi4("c", "sentinela", null, null)] }));
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters[0].acquisitions[0].subclassId).toBeNull();
    expect(insufficientMessages(result).join("\n")).toMatch(/Subclasse não informada/);
  });

  it("Estilo de Luta de nível 7 sem subclasse informada: aceito com aviso (não é incompatibilidade comprovada)", () => {
    const result = validateReferenceFile(
      testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "guerreiro", level: 7, acquisitions: [testAcquisition("fightingStyle", 7, "arquearia")] })],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters[0].acquisitions[0].opportunityId).toBe(FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID);
  });

  it("Talento de Origem sem espécie informada: aquisição ignorada (não dá para confirmar que foi escolha do Humano)", () => {
    const result = validateReferenceFile(
      testReferenceFile("a", { characters: [testCharacter("c", { classId: "mago", level: 1, acquisitions: [testAcquisition("originFeat", null, "alerta")] })] }),
    );
    expect(result.ok).toBe(true);
    expect(result.dataset!.characters[0].acquisitions).toEqual([]);
    expect(insufficientMessages(result).join("\n")).toMatch(/Espécie não informada/);
  });

  it("treinamento em armadura não comprovável pela classe: aviso, não rejeição", () => {
    const result = validateReferenceFile(
      testReferenceFile("a", {
        characters: [testCharacter("c", { classId: "clerigo", level: 4, acquisitions: [testAcquisition("generalFeat", 4, "mestre-em-armaduras-pesadas")] })],
      }),
    );
    expect(result.ok).toBe(true);
    expect(insufficientMessages(result).join("\n")).toMatch(/treinamento em armadura \(heavy\)/);
  });
});
