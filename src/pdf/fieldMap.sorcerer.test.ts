import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Feiticeiro nos campos do PDF
 * (`Carac.Classe.1`/`.2`, magias preparadas) — a fonte "INTEGRAÇÃO
 * COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" pede explicitamente
 * que essas áreas sejam atualizadas além do campo de Características
 * de Classe. Não re-testa o CONTEÚDO de cada texto (já coberto por
 * rules/sorcerer*.test.ts) — só que o fieldMap realmente os invoca e
 * entrega para o campo certo do PDF-molde, nos níveis-chave 1/2/5/7/10/
 * 17/20 e nas 4 subclasses no nível 18.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullSorcerer(level: number, subclassFullName: string | null, carisma = 16): Character {
  const character = createBlankCharacter("fieldmap-sorcerer-test");
  character.classId = "feiticeiro";
  character.level = level;
  character.abilities.CAR.score = carisma;
  character.subclassId = subclassFullName;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

function classFeaturesColumns(character: Character): string {
  return fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
}

describe("Carac.Classe.1/.2 — Feiticeiro também usa a composição dinâmica", () => {
  it("o conteúdo vem de getSorcererPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullSorcerer(2, null);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Feitiçaria Inata");
    expect(joined).not.toContain("texto manual nunca deveria aparecer");
  });

  it("Conjuração, Subclasse de Feiticeiro, ASI, Dádiva Épica nunca aparecem", () => {
    const character = fullSorcerer(20, "Feitiçaria Mecânica");
    character.knownMetamagicOptions = ["sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada"];
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("Conjuração");
    expect(joined).not.toContain("Subclasse de Feiticeiro");
    expect(joined).not.toContain("Aumento no Valor de Atributo");
    expect(joined).not.toContain("Dádiva Épica");
  });

  it.each([1, 2, 5, 7, 10, 17, 20])("nível %i, sem subclasse: nenhum {Variável} literal nem símbolo banido chega ao PDF", (level) => {
    const character = fullSorcerer(level, null);
    character.knownMetamagicOptions = ["sutil", "distante"];
    const joined = classFeaturesColumns(character);
    expect(joined).not.toMatch(BANNED_PATTERN);
  });

  it.each(["Feitiçaria Aberrante", "Feitiçaria Dracônica", "Feitiçaria Mecânica", "Feitiçaria Selvagem"])(
    "%s nível 18: nenhum {Variável} literal nem símbolo banido, nenhuma lista de Magias de subclasse",
    (subclass) => {
      const character = fullSorcerer(18, subclass);
      character.knownMetamagicOptions = ["sutil", "distante"];
      character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Fogo" };
      const joined = classFeaturesColumns(character);
      expect(joined).not.toMatch(BANNED_PATTERN);
      expect(joined).not.toContain("Magias Psiônicas");
      expect(joined).not.toContain("Magias Dracônicas");
      expect(joined).not.toContain("Magias Mecânicas");
    },
  );

  it("nível 1: aparece só Feitiçaria Inata, sem Fonte de Magia/Metamagia (ainda não concedidas)", () => {
    const character = fullSorcerer(1, null);
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Feitiçaria Inata");
    expect(joined).not.toContain("Fonte de Magia");
    expect(joined).not.toContain("Metamagia");
  });

  it("nível 2 com Metamagia escolhida: aparece o bloco de Metamagia com as opções certas", () => {
    const character = fullSorcerer(2, null);
    character.knownMetamagicOptions = ["sutil"];
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("#Metamagia");
    expect(joined).toContain("Sutil");
  });

  it("PF nunca gera um checkbox por ponto (aparece como contador 'PF: ___/N')", () => {
    const character = fullSorcerer(10, null);
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("PF: ___/10");
  });

  it("subclasses só entram nos blocos quando character.subclassId corresponde — sem mistura entre Feitiçarias", () => {
    const character = fullSorcerer(18, "Feitiçaria Mecânica");
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Bastião da Lei");
    expect(joined).not.toContain("Fala Telepática");
    expect(joined).not.toContain("Asas de Dragão");
    expect(joined).not.toContain("Marés do Caos");
  });
});

describe("Magias preparadas — Magias das 4 subclasses de Feiticeiro entram antes das magias manuais", () => {
  it("Feitiçaria Mecânica nível 3: as 4 magias de nível 3 aparecem nas primeiras linhas", () => {
    const character = fullSorcerer(3, "Feitiçaria Mecânica");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Alarme");
    expect(fieldValue("nome.magia.1.4", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.0", character)).toContain("Feitiçaria Mecânica");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullSorcerer(20, "Feitiçaria Dracônica");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
