import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { RANGER_GLAMOUR_SKILL_CHOICE_ID, RANGER_MENTE_DE_FERRO_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import { pdfTextFields } from "./fieldMap.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";

/**
 * Testes de integração do wiring das 4 subclasses de Patrulheiro nos
 * campos do PDF (`Carac.Classe.1`/`.2`, magias preparadas) — fonte
 * "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF". Não
 * re-testa o CONTEÚDO de cada texto (já coberto por
 * rules/rangerSubclassPrintedFeatures.test.ts/rangerAutoPreparedSpells.test.ts)
 * — só que o fieldMap realmente os invoca e entrega para o campo certo
 * do PDF-molde, e que o export de ponta a ponta funciona nas 4
 * subclasses no nível 15 (item pedido explicitamente na fonte).
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullRanger(level: number, subclassFullName: string | null, wisdom = 16): Character {
  const character = createBlankCharacter("fieldmap-ranger-test");
  character.classId = "patrulheiro";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

function classFeaturesColumns(character: Character): string {
  return fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
}

describe("Carac.Classe.1/.2 — Patrulheiro usa a composição dinâmica (classe base completa + as 4 subclasses)", () => {
  it("o conteúdo vem de getRangerPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullRanger(5, "Andarilho Feérico");
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("GLAMOUR TRANSCENDENTAL");
    expect(joined).not.toContain("texto manual nunca deveria aparecer");
  });

  it("sem subclasse escolhida: já usa a composição dinâmica da classe BASE (fonte \"COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF\"), nunca o campo manual", () => {
    const character = fullRanger(5, null);
    character.classFeatures = { column1: "texto manual do jogador", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("texto manual do jogador");
    expect(joined).toContain("MAESTRIA EM ARMA");
    expect(joined).toContain("MARCA DO PREDADOR");
  });

  it.each(["Andarilho Feérico", "Caçador", "Senhor das Feras", "Vigilante das Sombras"])(
    "%s nível 15: nenhum {Variável} literal nem símbolo banido chega ao PDF",
    (subclass) => {
      const character = fullRanger(15, subclass);
      const joined = classFeaturesColumns(character);
      expect(joined).not.toMatch(BANNED_PATTERN);
      expect(joined.length).toBeGreaterThan(0);
    },
  );

  it("'Mente de Ferro' nunca aparece em Características de Classe, mesmo com a escolha Carisma/Inteligência respondida", () => {
    const character = fullRanger(15, "Vigilante das Sombras");
    character.savingThrows.SAB.proficient = true;
    character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID] = { value: "Carisma" };
    expect(classFeaturesColumns(character)).not.toContain("Mente de Ferro");
  });

  it("a proficiência escolhida em Glamour Transcendental nunca aparece em Características de Classe (já aparece nas Perícias)", () => {
    const character = fullRanger(15, "Andarilho Feérico");
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["persuasao"] };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("Persuasão");
  });

  it("subclasses só entram nos blocos quando character.subclassId corresponde — sem mistura entre elas (Marca do Predador é da classe BASE, aparece sempre)", () => {
    const character = fullRanger(15, "Senhor das Feras");
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("COMPANHEIRO PRIMAL");
    expect(joined).toContain("MARCA DO PREDADOR"); // classe base, nunca exclusivo de uma subclasse
    expect(joined).not.toContain("GLAMOUR TRANSCENDENTAL");
    expect(joined).not.toContain("EMBOSCADOR DAS SOMBRAS");
  });
});

describe("Talentos — Estilo de Luta do Patrulheiro nível 2 (fonte \"IMPLEMENTAR TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF\" — gap fechado: antes nenhuma função imprimia essa escolha)", () => {
  it("escolheu Estilo de Luta com um estilo do catálogo: aparece na caixa Talentos", () => {
    const character = fullRanger(2, null);
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Estilo de Luta" };
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID] = { value: "Arquearia" };
    expect(fieldValue("Talentos", character)).toContain("Arquearia: +2 Atq com armas à Distância");
  });

  it("escolheu Combatente Druídico: nunca aparece texto de Estilo de Luta", () => {
    const character = fullRanger(2, null);
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
    expect(fieldValue("Talentos", character)).toBe("");
  });

  it("nenhuma escolha feita ainda: campo Talentos vazio", () => {
    expect(fieldValue("Talentos", fullRanger(2, null))).toBe("");
  });
});

describe("Magias preparadas — Andarilho Feérico/Vigilante das Sombras entram antes das magias manuais, sem duplicar", () => {
  it("Andarilho Feérico nível 9: as 3 primeiras magias sempre preparadas aparecem antes da magia manual", () => {
    const character = fullRanger(9, "Andarilho Feérico");
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Marca do Predador");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Enfeitiçar Pessoa");
    expect(fieldValue("nome.magia.1.2", character)).toBe("Passo Nebuloso");
    expect(fieldValue("nome.magia.1.3", character)).toBe("Convocar Feérico");
    expect(fieldValue("circulo1.0", character)).toBe("");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = fullRanger(17, "Vigilante das Sombras");
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });
});

describe("exportação de ponta a ponta — as 4 subclasses no nível 15 (item pedido explicitamente na fonte)", () => {
  const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");
  function readTemplateBytes(): Uint8Array {
    return new Uint8Array(readFileSync(TEMPLATE_PATH));
  }

  it.each(["Andarilho Feérico", "Caçador", "Senhor das Feras", "Vigilante das Sombras"])(
    "%s nível 15: exporta um PDF válido, com Carac.Classe.1/.2 preenchidos a partir do texto da subclasse",
    async (subclass) => {
      const character = fullRanger(15, subclass);
      character.name = `Exemplo ${subclass}`;

      const outBytes = await buildExportedPdf(character, readTemplateBytes());
      const reopened = await PDFDocument.load(outBytes);
      expect(reopened.getPageCount()).toBe(2);
      expect(reopened.getForm().getFields()).toHaveLength(0); // achatado

      const pdfDoc = await PDFDocument.load(readTemplateBytes());
      const form = pdfDoc.getForm();
      fillPdfForm(pdfDoc, form, character);

      const column1 = form.getTextField("Carac.Classe.1").getText() ?? "";
      const column2 = form.getTextField("Carac.Classe.2").getText() ?? "";
      const joined = column1 + column2;
      expect(joined.length).toBeGreaterThan(0);
      expect(joined).not.toMatch(BANNED_PATTERN);
    },
  );
});
