import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfOverlayFields, pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Ladino nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.ferramentas`, `idiomas`, `SUBCLASSE` e
 * magias preparadas) — a fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO
 * BUILDER E NO PDF" pede explicitamente que essas áreas sejam
 * atualizadas além do bloco de Características de Classe. Não re-testa
 * o CONTEÚDO detalhado de cada texto (já coberto por
 * `rules/rogueClassPrintedFeatures.test.ts`/`rogueSubclassPrintedFeatures.test.ts`)
 * — só que o fieldMap realmente os invoca e entrega para o campo certo
 * do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function rogue(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fieldmap-rogue-test");
  character.classId = "ladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.DEX.score = 16; // +3
  return character;
}

describe("Carac.Classe.1/.2 — Ladino usa composição dinâmica (classe + subclasse)", () => {
  it("o conteúdo vem de getRoguePrintedBlocks, nunca de character.classFeatures", () => {
    const character = rogue(5);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("ATAQUE FURTIVO");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("inclui os blocos da subclasse junto com os da classe base, sem duplicar Golpe Astuto", () => {
    const character = rogue(17, "Lâmina Psíquica");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).toContain("LÂMINAS PSÍQUICAS");
    expect(joined).toContain("RASGAR MENTE");
    expect((joined.match(/# GOLPE ASTUTO/g) ?? []).length).toBe(1);
  });
});

describe("SUBCLASSE — exibe 'Adaga Espiritual' (shortName) preservando o fullName salvo ('Lâmina Psíquica')", () => {
  function overlayValue(character: Character): string {
    const mapping = pdfOverlayFields.find((f) => f.pdfField === "SUBCLASSE");
    if (!mapping) throw new Error("Campo SUBCLASSE não encontrado em pdfOverlayFields");
    return mapping.getValue(character);
  }

  it("renderiza o nome de exibição, não o valor interno salvo em subclassId", () => {
    const character = rogue(3, "Lâmina Psíquica");
    expect(overlayValue(character)).toBe("Adaga Espiritual");
    expect(character.subclassId).toBe("Lâmina Psíquica");
  });

  it("demais subclasses de Ladino continuam com o shortName já existente (Trapaceiro Arcano já era exibido só como 'Arcano', antes desta fonte)", () => {
    expect(overlayValue(rogue(3, "Assassino"))).toBe("Assassino");
    expect(overlayValue(rogue(3, "Ladrão"))).toBe("Ladrão");
    expect(overlayValue(rogue(3, "Trapaceiro Arcano"))).toBe("Arcano");
  });
});

describe("PROF.ferramentas — Ferramentas de Assassino (Kit de Disfarce + Kit de Veneno)", () => {
  it("Assassino nível 3+: aparecem no texto automático", () => {
    const text = fieldValue("PROF.ferramentas", rogue(3, "Assassino"));
    expect(text).toContain("Kit de Disfarce");
    expect(text).toContain("Kit de Veneno");
  });

  it("outra subclasse de Ladino não ganha esses kits", () => {
    const text = fieldValue("PROF.ferramentas", rogue(3, "Ladrão"));
    expect(text).not.toContain("Kit de Disfarce");
    expect(text).not.toContain("Kit de Veneno");
  });
});

describe("idiomas — Gíria dos Ladrões aparece automaticamente, sem duplicar o texto manual", () => {
  it("nível 1+: prefixa Gíria dos Ladrões ao texto livre de idiomas", () => {
    const character = rogue(1);
    character.languages = "Comum";
    expect(fieldValue("idiomas", character)).toBe("Gíria dos Ladrões, Comum");
  });

  it("nunca duplica se o jogador já digitou manualmente", () => {
    const character = rogue(1);
    character.languages = "Gíria dos Ladrões, Élfico";
    expect(fieldValue("idiomas", character)).toBe("Gíria dos Ladrões, Élfico");
  });

  it("outra classe não é afetada", () => {
    const character = createBlankCharacter("fieldmap-fighter-test");
    character.classId = "guerreiro";
    character.languages = "Comum";
    expect(fieldValue("idiomas", character)).toBe("Comum");
  });
});

describe("Magias preparadas — Mãos Mágicas do Trapaceiro Arcano entra antes das magias manuais do jogador", () => {
  it("nível 3+: Mãos Mágicas aparece na 1ª linha, sem círculo impresso (é truque)", () => {
    const character = rogue(3, "Trapaceiro Arcano");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Mãos Mágicas");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
  });

  it("nunca grava Mãos Mágicas de volta em character.spellsPrepared", () => {
    const character = rogue(3, "Trapaceiro Arcano");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });

  it("outra subclasse de Ladino não ganha Mãos Mágicas automaticamente", () => {
    expect(fieldValue("nome.magia.1.0", rogue(10, "Assassino"))).toBe("");
  });
});
