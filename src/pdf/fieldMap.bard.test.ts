import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Bardo nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.armas`, `PROF.med`/`PROF.Escudo`, magias
 * preparadas) — a fonte "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" pede
 * explicitamente que essas áreas sejam atualizadas além do campo de
 * Características de Classe. Não re-testa o CONTEÚDO de cada texto (já
 * coberto por `rules/bardPrintedFeatures.test.ts` etc.) — só que o
 * fieldMap realmente os invoca e entrega para o campo certo do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullBard(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("fieldmap-bard-test");
  character.classId = "bardo";
  character.level = level;
  character.abilities.CAR.score = 16; // +3
  character.subclassId = subclassFullName;
  return character;
}

describe("Carac.Classe.1/.2 — Bardo também usa a composição dinâmica", () => {
  it("Bardo: o conteúdo vem de getBardPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullBard(5, null);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("#Inspiração de Bardo");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("Conjuração, Especialista, Pau pra Toda Obra, Segredos Mágicos e Dádiva Épica nunca aparecem neste campo", () => {
    const character = fullBard(20, "Colégio do Conhecimento");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).not.toContain("Conjuração");
    expect(joined).not.toContain("Especialista");
    expect(joined).not.toContain("Pau pra Toda Obra");
    expect(joined).not.toContain("Segredos Mágicos");
    expect(joined).not.toContain("Dádiva Épica");
  });
});

describe("PROF.armas — Treinamento Marcial (Bravura) entra como texto automático", () => {
  it("Bravura: inclui a linha de Armas Marciais/Foco de Conjuração", () => {
    const character = fullBard(3, "Colégio da Bravura");
    const text = fieldValue("PROF.armas", character);
    expect(text).toContain("Treinamento Marcial: Armas Marciais; uma arma Simples ou Marcial pode ser Foco de Conjuração.");
  });

  it("outra subclasse de Bardo não ganha essa linha", () => {
    const character = fullBard(3, "Colégio da Dança");
    const text = fieldValue("PROF.armas", character);
    expect(text).not.toContain("Treinamento Marcial");
  });
});

describe("Magias preparadas — Glamour e Palavras de Criação entram antes das magias manuais do jogador", () => {
  it("Glamour nível 6: Enfeitiçar Pessoa, Reflexos e Comando aparecem nas 3 primeiras linhas", () => {
    const character = fullBard(6, "Colégio do Glamour");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Enfeitiçar Pessoa");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Reflexos");
    expect(fieldValue("nome.magia.1.2", character)).toBe("Comando");
    expect(fieldValue("nome.magia.1.3", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.0", character)).toContain("Magia Fascinante");
  });

  it("Bardo nível 20 (qualquer subclasse): Palavra de Poder Matar/Salvar entram na lista", () => {
    const character = fullBard(20, "Colégio da Bravura");
    expect(fieldValue("nome.magia.1.0", character)).toBe("Palavra de Poder: Matar");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Palavra de Poder: Salvar");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullBard(20, "Colégio do Glamour");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
