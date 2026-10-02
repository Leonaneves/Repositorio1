import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ORDEM_DIVINA_CHOICE_ID, GOLPES_ABENCOADOS_CHOICE_ID, TAUMATURGO_TRUQUE_CHOICE_ID } from "../data/features/cleric.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Clérigo nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.armas`, magias preparadas) — a fonte
 * "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES" pede explicitamente que
 * essas áreas sejam atualizadas além do campo de Características de
 * Classe. Não re-testa o CONTEÚDO de cada texto (já coberto por
 * rules/cleric*.test.ts) — só que o fieldMap realmente os invoca e
 * entrega para o campo certo do PDF-molde, nos níveis-chave 2/5/7/14/20
 * e nas 4 subclasses no nível 17.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullCleric(level: number, subclassFullName: string | null, wisdom = 16): Character {
  const character = createBlankCharacter("fieldmap-cleric-test");
  character.classId = "clerigo";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

function classFeaturesColumns(character: Character): string {
  return fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
}

describe("Carac.Classe.1/.2 — Clérigo também usa a composição dinâmica", () => {
  it("o conteúdo vem de getClericPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullCleric(5, null);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Canalizar Divindade");
    expect(joined).not.toContain("texto manual nunca deveria aparecer");
  });

  it("Conjuração (feature genérica), Ordem Divina, Protetor, Taumaturgo, Subclasse de Clérigo, ASI e Dádiva Épica nunca aparecem", () => {
    const character = fullCleric(20, "Domínio da Vida");
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Golpe Divino" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("Conjuração"); // "Conjuração Poderosa" testado separadamente (é a opção impressa quando escolhida)
    expect(joined).not.toContain("Ordem Divina");
    expect(joined).not.toContain("Protetor");
    expect(joined).not.toContain("Taumaturgo");
    expect(joined).not.toContain("Subclasse de Clérigo");
    expect(joined).not.toContain("Dádiva Épica");
  });

  it("quando Conjuração Poderosa é a opção escolhida, ela aparece normalmente (nunca confundida com a feature genérica 'Conjuração')", () => {
    const character = fullCleric(14, null);
    character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Conjuração Poderosa" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("#Conjuração Poderosa");
  });

  it.each([2, 5, 7, 14, 20])("nível %i, sem subclasse: nenhum {Variável} literal nem símbolo banido chega ao PDF", (level) => {
    const character = fullCleric(level, null);
    character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Golpe Divino" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toMatch(BANNED_PATTERN);
  });

  it.each(["Domínio da Guerra", "Domínio da Luz", "Domínio da Trapaça", "Domínio da Vida"])(
    "%s nível 17: nenhum {Variável} literal nem símbolo banido, nenhuma lista de Magias de Domínio",
    (subclass) => {
      const character = fullCleric(17, subclass);
      const joined = classFeaturesColumns(character);
      expect(joined).not.toMatch(BANNED_PATTERN);
      expect(joined).not.toContain("Magias de Domínio");
    },
  );

  it("nível 2: bloco de Canalizar Divindade com 2 checkboxes (tabela já registrada)", () => {
    const character = fullCleric(2, null);
    expect(classFeaturesColumns(character)).toContain("#Canalizar Divindade [__][__]");
  });

  it("nível 7 com Golpe Divino: aparece o bloco de Golpe Divino, nunca Conjuração Poderosa", () => {
    const character = fullCleric(7, null);
    character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Golpe Divino" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("#Golpe Divino");
    expect(joined).not.toContain("Conjuração Poderosa");
  });

  it("subclasses só entram nos blocos quando character.subclassId corresponde — sem mistura entre domínios", () => {
    const character = fullCleric(17, "Domínio da Guerra");
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Sacerdote da Guerra");
    expect(joined).not.toContain("Labareda Protetora");
    expect(joined).not.toContain("Discípulo da Vida");
    expect(joined).not.toContain("Bênção do Trapaceiro");
  });
});

describe("PROF.armas — Protetor entra como texto automático (Armas Marciais)", () => {
  it("com Protetor escolhido: inclui a linha de Armas Marciais", () => {
    const character = fullCleric(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Protetor" };
    const text = fieldValue("PROF.armas", character);
    expect(text).toContain("Protetor: Armas Marciais.");
  });

  it("com Taumaturgo escolhido: nenhuma linha adicionada", () => {
    const character = fullCleric(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    const text = fieldValue("PROF.armas", character);
    expect(text).not.toContain("Protetor");
  });
});

describe("Magias preparadas — Magias de Domínio e Truque de Taumaturgo entram antes das magias manuais", () => {
  it("Domínio da Vida nível 3: as 4 magias de nível 3 aparecem nas primeiras linhas", () => {
    const character = fullCleric(3, "Domínio da Vida");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Auxílio");
    expect(fieldValue("nome.magia.1.4", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.0", character)).toContain("Domínio da Vida");
  });

  it("Truque extra de Taumaturgo entra na área de Magias", () => {
    const character = fullCleric(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID] = { value: "Chama Sagrada" };
    expect(fieldValue("nome.magia.1.0", character)).toBe("Chama Sagrada");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullCleric(20, "Domínio da Guerra");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
