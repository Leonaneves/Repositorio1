import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfCheckboxFields, pdfOverlayFields, pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Monge nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `SUBCLASSE`, PROF.ferramentas, perícias
 * concedidas fixas e magias automáticas) — a fonte "IMPLEMENTAR MONGE E
 * SUAS SUBCLASSES NO BUILDER E NO PDF" pede explicitamente que essas
 * áreas sejam atualizadas além do bloco de Características de Classe.
 * Não re-testa o CONTEÚDO detalhado de cada texto (já coberto por
 * `rules/monkClassPrintedFeatures.test.ts`/`monkSubclassPrintedFeatures.test.ts`)
 * — só que o fieldMap realmente os invoca e entrega para o campo certo
 * do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function overlayValue(pdfField: string, character: Character): string {
  const mapping = pdfOverlayFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado em pdfOverlayFields: ${pdfField}`);
  return mapping.getValue(character);
}

function checkboxValue(pdfField: string, character: Character): boolean {
  const mapping = pdfCheckboxFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado em pdfCheckboxFields: ${pdfField}`);
  return mapping.getValue(character);
}

function monk(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fieldmap-monk-test");
  character.classId = "monge";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("Carac.Classe.1/.2 — Monge usa composição dinâmica (classe + subclasse)", () => {
  it("o conteúdo vem de getMonkPrintedBlocks, nunca de character.classFeatures", () => {
    const character = monk(5);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("ARTES MARCIAIS");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("inclui os blocos da subclasse junto com os da classe base", () => {
    const character = monk(17, "Guerreiro da Misericórdia");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).toContain("MÃO DE CURA");
    expect(joined).toContain("MÃO DA MISERICÓRDIA FINAL");
  });
});

describe("SUBCLASSE — exibe os 4 nomes 'Caminho de...' preservando os valores internos salvos", () => {
  it("renderiza o nome de exibição, não o valor interno salvo em subclassId", () => {
    const character = monk(3, "Guerreiro da Misericórdia");
    expect(overlayValue("SUBCLASSE", character)).toBe("Caminho da Misericórdia");
    expect(character.subclassId).toBe("Guerreiro da Misericórdia");
  });

  it("demais subclasses de Monge também exibem o nome completo correto", () => {
    expect(overlayValue("SUBCLASSE", monk(3, "Guerreiro da Mão Aberta"))).toBe("Caminho da Mão Aberta");
    expect(overlayValue("SUBCLASSE", monk(3, "Guerreiro das Sombras"))).toBe("Caminho das Sombras");
    expect(overlayValue("SUBCLASSE", monk(3, "Guerreiro dos Elementos"))).toBe("Caminho dos Elementos");
  });
});

describe("PROF.ferramentas — Kit de Herbalismo do Caminho da Misericórdia", () => {
  it("aparece a partir do nível 3 da subclasse, ausente nas demais", () => {
    expect(fieldValue("PROF.ferramentas", monk(3, "Guerreiro da Misericórdia"))).toContain("Kit de Herbalismo");
    expect(fieldValue("PROF.ferramentas", monk(3, "Guerreiro da Mão Aberta"))).not.toContain("Kit de Herbalismo");
  });
});

describe("Perícias concedidas automaticamente — Intuição/Medicina fixas do Caminho da Misericórdia", () => {
  it("Intuição e Medicina aparecem como proficientes sem nenhuma escolha do jogador", () => {
    const character = monk(3, "Guerreiro da Misericórdia");
    expect(checkboxValue("O.SAB.int", character)).toBe(true);
    expect(checkboxValue("O.SAB.med", character)).toBe(true);
  });

  it("outra subclasse de Monge não ganha a concessão fixa", () => {
    const character = monk(3, "Guerreiro das Sombras");
    expect(checkboxValue("O.SAB.int", character)).toBe(false);
    expect(checkboxValue("O.SAB.med", character)).toBe(false);
  });
});

describe("Magias automáticas — Ilusão Menor (Sombras) e Elementalismo (Elementos), sem espaços de magia", () => {
  it("Caminho das Sombras concede Ilusão Menor", () => {
    expect(fieldValue("nome.magia.1.0", monk(3, "Guerreiro das Sombras"))).toBe("Ilusão Menor");
  });

  it("Caminho dos Elementos concede Elementalismo", () => {
    expect(fieldValue("nome.magia.1.0", monk(3, "Guerreiro dos Elementos"))).toBe("Elementalismo");
  });

  it("Caminho da Mão Aberta não concede nenhum truque automático", () => {
    expect(fieldValue("nome.magia.1.0", monk(3, "Guerreiro da Mão Aberta"))).toBe("");
  });
});
