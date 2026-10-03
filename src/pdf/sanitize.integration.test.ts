import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { GOLPES_ABENCOADOS_CHOICE_ID, ORDEM_DIVINA_CHOICE_ID, TAUMATURGO_TRUQUE_CHOICE_ID } from "../data/features/cleric.js";
import { FURIA_ELEMENTAL_CHOICE_ID, ORDEM_PRIMAL_CHOICE_ID, XAMA_TRUQUE_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";
import { fillPdfForm } from "./exporter.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Garante que NENHUM texto escrito no PDF contenha os símbolos banidos
 * pela fonte "PADRONIZAÇÃO DE CARACTERES PARA O PDF" (→, ½, ×, ≥, ≤,
 * ±) — testa a sanitização de ponta a ponta (pdf/exporter.ts#fillPdfForm
 * -> sanitizeForPdf), não só a função `sanitizeForPdf` isolada (já
 * coberta em sanitize.test.ts). Usa personagens de Bárbaro/Bardo/Bruxo/
 * Clérigo com o máximo de conteúdo impresso escolhido, já que são as
 * classes com texto compacto dinâmico mais rico.
 */
const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");
const BANNED_PATTERN = /→|½|×|≥|≤|±/;

function readTemplateBytes(): Uint8Array {
  return new Uint8Array(readFileSync(TEMPLATE_PATH));
}

function fullBarbarian(): Character {
  const character = createBlankCharacter("sanitize-test-barb");
  character.classId = "barbaro";
  character.level = 20;
  character.subclassId = "Caminho do Fanático";
  character.abilities.CAR.score = 16;
  return character;
}

function fullBard(): Character {
  const character = createBlankCharacter("sanitize-test-bard");
  character.classId = "bardo";
  character.level = 20;
  character.subclassId = "Colégio da Dança";
  character.abilities.CAR.score = 16;
  return character;
}

function fullCleric(): Character {
  const character = createBlankCharacter("sanitize-test-cleric");
  character.classId = "clerigo";
  character.level = 20;
  character.subclassId = "Domínio da Trapaça";
  character.abilities.SAB.score = 18;
  character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
  character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID] = { value: "Chama Sagrada" };
  character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Conjuração Poderosa" };
  return character;
}

function fullDruid(): Character {
  const character = createBlankCharacter("sanitize-test-druid");
  character.classId = "druida";
  character.level = 20;
  character.subclassId = "Círculo da Lua";
  character.abilities.SAB.score = 18;
  character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
  character.featureChoiceSelections[XAMA_TRUQUE_CHOICE_ID] = { value: "Produzir Chama" };
  character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value: "Conjuração Poderosa" };
  character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Tropical" };
  character.knownWildShapeForms = [
    { name: "Urso Negro", challengeRating: "1/2", hasFlySpeed: false },
    { name: "Águia", challengeRating: "0", hasFlySpeed: true },
  ];
  return character;
}

function fullWarlock(): Character {
  const character = createBlankCharacter("sanitize-test-warlock");
  character.classId = "bruxo";
  character.level = 20;
  character.subclassId = "Patrono Ínfero";
  character.abilities.CAR.score = 18;
  character.chosenInvocations = [
    { invocationId: "pacto-da-lamina", subChoice: "Espada Longa" },
    { invocationId: "lamina-sedenta", subChoice: "" },
    { invocationId: "lamina-devoradora", subChoice: "" },
    { invocationId: "explosao-agonizante", subChoice: "Raio de Fogo" },
    { invocationId: "explosao-repulsiva", subChoice: "Mãos Flamejantes" },
    { invocationId: "lanca-mistica", subChoice: "Dardo de Fogo" },
    { invocationId: "punicao-mistica", subChoice: "" },
    { invocationId: "presente-dos-protetores", subChoice: "" },
    { invocationId: "pacto-do-tomo", subChoice: "" },
    { invocationId: "mente-mistica", subChoice: "" },
  ];
  return character;
}

async function assertNoForbiddenCharacters(character: Character): Promise<void> {
  const pdfDoc = await PDFDocument.load(readTemplateBytes());
  const form = pdfDoc.getForm();
  fillPdfForm(pdfDoc, form, character);

  const offenders: string[] = [];
  for (const mapping of pdfTextFields) {
    const field = form.getFieldMaybe(mapping.pdfField);
    if (!field) continue;
    const text = form.getTextField(mapping.pdfField).getText() ?? "";
    if (BANNED_PATTERN.test(text)) offenders.push(`${mapping.pdfField}: ${text}`);
  }

  expect(offenders).toEqual([]);
}

describe("Sanitização de ponta a ponta — nenhum campo de texto do PDF contém → ½ × ≥ ≤ ±", () => {
  it("Bárbaro (Caminho do Fanático) nível 20", async () => {
    await assertNoForbiddenCharacters(fullBarbarian());
  });

  it("Bardo (Colégio da Dança) nível 20", async () => {
    await assertNoForbiddenCharacters(fullBard());
  });

  it("Bruxo (Patrono Ínfero) nível 20, com 10 invocações escolhidas (inclusive as com texto dinâmico mais rico)", async () => {
    await assertNoForbiddenCharacters(fullWarlock());
  });

  it("Clérigo (Domínio da Trapaça) nível 20, Taumaturgo + Conjuração Poderosa", async () => {
    await assertNoForbiddenCharacters(fullCleric());
  });

  it("Druida (Círculo da Lua) nível 20, Xamã + Conjuração Poderosa", async () => {
    await assertNoForbiddenCharacters(fullDruid());
  });

  it("personagem em branco (sem classe) também não produz nenhum símbolo banido", async () => {
    await assertNoForbiddenCharacters(createBlankCharacter("sanitize-test-blank"));
  });
});
