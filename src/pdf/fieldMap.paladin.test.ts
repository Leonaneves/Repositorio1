import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID,
  PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID,
  PALADIN_FIGHTING_STYLE_CHOICE_ID,
  PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID,
} from "../data/features/paladin.js";
import { pdfOverlayFields, pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Paladino nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `SUBCLASSE`, Talentos, magias automáticas) —
 * a fonte "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF"
 * pede explicitamente que essas áreas sejam atualizadas além do bloco
 * de Características de Classe. Não re-testa o CONTEÚDO detalhado de
 * cada texto (já coberto por `rules/paladinClassPrintedFeatures.test.ts`/
 * `paladinSubclassPrintedFeatures.test.ts`) — só que o fieldMap
 * realmente os invoca e entrega para o campo certo do PDF-molde.
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

function paladin(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fieldmap-paladin-test");
  character.classId = "paladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.CAR.score = 16; // +3
  return character;
}

describe("Carac.Classe.1/.2 — Paladino usa composição dinâmica (classe + subclasse)", () => {
  it("o conteúdo vem de getPaladinPrintedBlocks, nunca de character.classFeatures", () => {
    const character = paladin(6);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("# AURA DE PROTEÇÃO");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("inclui os blocos próprios da subclasse junto com os da classe base", () => {
    const character = paladin(20, "Juramento da Vingança");
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).toContain("VINGADOR IMPLACÁVEL");
    expect(joined).toContain("ANJO VINGADOR");
  });
});

describe("SUBCLASSE — exibe o nome curto, preservando o valor interno (fullName) salvo", () => {
  it("renderiza o nome de exibição compacto, não o valor interno salvo em subclassId", () => {
    const character = paladin(3, "Juramento da Devoção");
    expect(overlayValue("SUBCLASSE", character)).toBe("da Devoção");
    expect(character.subclassId).toBe("Juramento da Devoção");
  });

  it("demais Juramentos também exibem o nome curto correto", () => {
    expect(overlayValue("SUBCLASSE", paladin(3, "Juramento da Glória"))).toBe("da Glória");
    expect(overlayValue("SUBCLASSE", paladin(3, "Juramento da Vingança"))).toBe("da Vingança");
    expect(overlayValue("SUBCLASSE", paladin(3, "Juramento dos Anciões"))).toBe("dos Anciões");
  });
});

describe("Talentos — Estilo de Luta só aparece quando escolhido em vez de Combatente Abençoado", () => {
  it("escolheu Estilo de Luta com um estilo do catálogo: aparece na caixa Talentos", () => {
    const character = paladin(2);
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Estilo de Luta" };
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    expect(fieldValue("Talentos", character)).toContain("Defensivo");
  });

  it("escolheu Combatente Abençoado: nunca aparece o texto de Estilo de Luta", () => {
    const character = paladin(2);
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Combatente Abençoado" };
    expect(fieldValue("Talentos", character)).not.toContain("Estilo de Luta");
  });

  it("nenhuma escolha feita ainda: nunca aparece o texto de Estilo de Luta", () => {
    expect(fieldValue("Talentos", paladin(2))).not.toContain("Estilo de Luta");
  });
});

describe("Magias automáticas — Destruição Divina/Convocar Montaria, truques de Combatente Abençoado e magias de Juramento", () => {
  it("nível 2: Destruição Divina sempre preparada", () => {
    expect(fieldValue("nome.magia.1.0", paladin(2))).toBe("Destruição Divina");
  });

  it("nível 5: Destruição Divina seguida de Convocar Montaria", () => {
    const character = paladin(5);
    expect(fieldValue("nome.magia.1.0", character)).toBe("Destruição Divina");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Convocar Montaria");
  });

  it("Combatente Abençoado com os 2 truques nomeados: aparecem após Destruição Divina", () => {
    const character = paladin(2);
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Combatente Abençoado" };
    character.featureChoiceSelections[PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID] = { value: "Chama Sagrada" };
    character.featureChoiceSelections[PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID] = { value: "Orientação" };
    expect(fieldValue("nome.magia.1.1", character)).toBe("Chama Sagrada");
    expect(fieldValue("nome.magia.1.2", character)).toBe("Orientação");
  });

  it("Juramento da Devoção, nível 3: magias de juramento aparecem após as magias fixas da classe", () => {
    const character = paladin(3, "Juramento da Devoção");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Escudo da Fé");
    expect(fieldValue("nome.magia.1.2", character)).toBe("Proteção Contra o Bem e o Mal");
  });

  it("outro Juramento não concede as magias da Devoção", () => {
    const character = paladin(3, "Juramento da Glória");
    const joined = [0, 1, 2].map((i) => fieldValue(`nome.magia.1.${i}`, character)).join("|");
    expect(joined).not.toContain("Escudo da Fé");
    expect(joined).toContain("Heroísmo");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = paladin(5, "Juramento dos Anciões");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});
