import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { FURIA_ELEMENTAL_CHOICE_ID, ORDEM_PRIMAL_CHOICE_ID, XAMA_TRUQUE_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Druida nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.armas`, `idiomas`, magias preparadas) —
 * a fonte "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" pede
 * explicitamente que essas áreas sejam atualizadas além do campo de
 * Características de Classe. Não re-testa o CONTEÚDO de cada texto (já
 * coberto por rules/druid*.test.ts) — só que o fieldMap realmente os
 * invoca e entrega para o campo certo do PDF-molde, nos níveis-chave
 * 2/5/7/18/20 e nas 4 subclasses no nível 14.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullDruid(level: number, subclassFullName: string | null, wisdom = 16): Character {
  const character = createBlankCharacter("fieldmap-druid-test");
  character.classId = "druida";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

function classFeaturesColumns(character: Character): string {
  return fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
}

describe("Carac.Classe.1/.2 — Druida também usa a composição dinâmica", () => {
  it("o conteúdo vem de getDruidPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullDruid(5, null);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Forma Selvagem");
    expect(joined).not.toContain("texto manual nunca deveria aparecer");
  });

  it("Conjuração, Ordem Primal, Protetor, Xamã, Subclasse de Druida, ASI, Dádiva Épica nunca aparecem", () => {
    const character = fullDruid(20, "Círculo da Terra");
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value: "Ataque Primal" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("Ordem Primal");
    expect(joined).not.toContain("Protetor");
    expect(joined).not.toContain("Xamã");
    expect(joined).not.toContain("Subclasse de Druida");
    expect(joined).not.toContain("Dádiva Épica");
  });

  it.each([2, 5, 7, 18, 20])("nível %i, sem subclasse: nenhum {Variável} literal nem símbolo banido chega ao PDF", (level) => {
    const character = fullDruid(level, null);
    character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value: "Conjuração Poderosa" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toMatch(BANNED_PATTERN);
  });

  it.each(["Círculo da Lua", "Círculo da Terra", "Círculo das Estrelas", "Círculo do Mar"])(
    "%s nível 14: nenhum {Variável} literal nem símbolo banido, nenhuma lista de Magias de Círculo",
    (subclass) => {
      const character = fullDruid(14, subclass);
      character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Tropical" };
      const joined = classFeaturesColumns(character);
      expect(joined).not.toMatch(BANNED_PATTERN);
      expect(joined).not.toContain("Magias do Círculo");
    },
  );

  it("nível 2: bloco de Forma Selvagem com 2 checkboxes (tabela já registrada)", () => {
    const character = fullDruid(2, null);
    expect(classFeaturesColumns(character)).toContain("#Forma Selvagem [__][__]");
  });

  it("nível 7 com Ataque Primal: aparece o bloco de Ataque Primal, nunca Conjuração Poderosa", () => {
    const character = fullDruid(7, null);
    character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value: "Ataque Primal" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("#Ataque Primal");
    expect(joined).not.toContain("Conjuração Poderosa");
  });

  it("subclasses só entram nos blocos quando character.subclassId corresponde — sem mistura entre Círculos", () => {
    const character = fullDruid(14, "Círculo da Lua");
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("Lua");
    expect(joined).not.toContain("Auxílio da Terra");
    expect(joined).not.toContain("Presságio Cósmico");
    expect(joined).not.toContain("Ira do Mar");
  });
});

describe("PROF.armas — Protetor entra como texto automático (Armas Marciais)", () => {
  it("com Protetor escolhido: inclui a linha de Armas Marciais", () => {
    const character = fullDruid(1, null);
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Protetor" };
    const text = fieldValue("PROF.armas", character);
    expect(text).toContain("Protetor: Armas Marciais.");
  });

  it("com Xamã escolhido: nenhuma linha adicionada", () => {
    const character = fullDruid(1, null);
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    const text = fieldValue("PROF.armas", character);
    expect(text).not.toContain("Protetor");
  });
});

describe("idiomas — Druídico entra automaticamente, nunca duplicado", () => {
  it("personagem sem idiomas manuais: só 'Druídico'", () => {
    const character = fullDruid(1, null);
    expect(fieldValue("idiomas", character)).toBe("Druídico");
  });

  it("personagem com idiomas manuais: soma 'Druídico, ' antes", () => {
    const character = fullDruid(1, null);
    character.languages = "Comum, Élfico";
    expect(fieldValue("idiomas", character)).toBe("Druídico, Comum, Élfico");
  });

  it("se o jogador já digitou 'Druídico' manualmente, não duplica", () => {
    const character = fullDruid(1, null);
    character.languages = "Comum, Druídico";
    expect(fieldValue("idiomas", character)).toBe("Comum, Druídico");
  });

  it("outra classe nunca recebe Druídico automaticamente", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.languages = "Comum";
    expect(fieldValue("idiomas", character)).toBe("Comum");
  });
});

describe("Magias preparadas — Falar com Animais/Convocar Familiar/Magias de Círculo/Truque de Xamã entram antes das magias manuais", () => {
  it("Círculo da Lua nível 3: Falar com Animais, Convocar Familiar e as magias de nível 3 aparecem nas primeiras linhas", () => {
    const character = fullDruid(3, "Círculo da Lua");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Falar com Animais");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Convocar Familiar");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.1", character)).toContain("Companheiro Selvagem");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullDruid(20, "Círculo do Mar");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
