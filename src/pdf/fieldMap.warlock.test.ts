import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Bruxo nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.armas`, `Talentos`, magias preparadas)
 * — a fonte "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E
 * SUBCLASSES" pede explicitamente que essas áreas sejam atualizadas
 * além do campo de Características de Classe. Não re-testa o
 * CONTEÚDO de cada texto (já coberto pelos outros arquivos de teste de
 * rules/warlock*) — só que o fieldMap realmente os invoca e entrega
 * para o campo certo do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullWarlock(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("fieldmap-warlock-test");
  character.classId = "bruxo";
  character.level = level;
  character.abilities.CAR.score = 16;
  character.subclassId = subclassFullName;
  return character;
}

describe("Carac.Classe.1/.2 — Bruxo também usa a composição dinâmica", () => {
  it("Bruxo: o conteúdo vem de getWarlockPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullWarlock(5, null);
    character.chosenInvocations.push({ invocationId: "mente-mistica", subChoice: "" });
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("Mente Mística");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("Magia de Pacto, Subclasse de Bruxo, Contatar Patrono, Arcana Mística e Dádiva Épica nunca aparecem", () => {
    const character = fullWarlock(20, "Patrono Celestial");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).not.toContain("Magia de Pacto");
    expect(joined).not.toContain("Contatar Patrono");
    expect(joined).not.toContain("Arcana Mística");
    expect(joined).not.toContain("Dádiva Épica");
  });
});

describe("PROF.armas — Pacto da Lâmina entra como texto automático (proficiência com a arma de pacto atual)", () => {
  it("com arma de pacto configurada: inclui o nome dela", () => {
    const character = fullWarlock(5, null);
    character.chosenInvocations.push({ invocationId: "pacto-da-lamina", subChoice: "Espada Longa" });
    const text = fieldValue("PROF.armas", character);
    expect(text).toContain("Pacto da Lâmina: proficiência com a arma de pacto atual (Espada Longa); Atq/dano pode usar CAR");
  });

  it("sem Pacto da Lâmina escolhido: nenhuma linha adicionada", () => {
    const character = fullWarlock(5, null);
    character.chosenInvocations.push({ invocationId: "mente-mistica", subChoice: "" });
    const text = fieldValue("PROF.armas", character);
    expect(text).not.toContain("Pacto da Lâmina");
  });
});

describe("Talentos — Lições dos Grandes Antigos entra como texto automático", () => {
  it("lista os talentos de cada cópia da invocação", () => {
    const character = fullWarlock(5, null);
    character.chosenInvocations.push(
      { invocationId: "licoes-dos-grandes-antigos", subChoice: "Afortunado" },
      { invocationId: "licoes-dos-grandes-antigos", subChoice: "Resiliente" },
    );
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Lições dos Grandes Antigos: Afortunado; Resiliente");
  });
});

describe("Magias preparadas — listas de Patrono, Contatar Patrono e invocações concedentes entram antes das magias manuais", () => {
  it("Patrono Ínfero nível 3: as 4 magias de nível 3 aparecem nas primeiras linhas", () => {
    const character = fullWarlock(3, "Patrono Ínfero");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Comando");
    expect(fieldValue("nome.magia.1.4", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.0", character)).toContain("Patrono Ínfero");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullWarlock(20, "Patrono Arquifada");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
