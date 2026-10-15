import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { BATTLE_MASTER_CD_ABILITY_CHOICE_ID, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { pdfTextFields } from "./fieldMap.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";

/**
 * Testes de integração do wiring da classe BASE + 4 subclasses de
 * Guerreiro nos campos do PDF (`Carac.Classe.1`/`.2`, Talentos) —
 * fontes "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" e
 * "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF". Não re-testa o
 * CONTEÚDO de cada texto (já coberto por
 * rules/fighterClassPrintedFeatures.test.ts/fighterSubclassPrintedFeatures.test.ts/
 * fighterTalentEntries.test.ts) — só que o fieldMap realmente os invoca
 * e entrega para o campo certo do PDF-molde, e que o export de ponta a
 * ponta funciona nos exemplos explicitamente pedidos na fonte (§10):
 * Campeão nível 18; Cavaleiro Místico níveis 7 e 18; Psiônico nível 18
 * com 12 dados; Mestre de Batalha nível 18 com nove manobras.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullFighter(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("fieldmap-fighter-test");
  character.classId = "guerreiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

function classFeaturesColumns(character: Character): string {
  return fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
}

describe("Carac.Classe.1/.2 — Guerreiro usa a composição dinâmica (só as 4 subclasses)", () => {
  it("o conteúdo vem de getFighterPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullFighter(3, "Campeão");
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("ATLETA EXTRAORDINÁRIO");
    expect(joined).not.toContain("texto manual nunca deveria aparecer");
  });

  it("sem subclasse escolhida: já usa a composição dinâmica da classe BASE (fonte \"COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF\"), nunca o campo manual", () => {
    const character = fullFighter(5, null);
    character.classFeatures = { column1: "texto manual do jogador", column2: "" };
    const joined = classFeaturesColumns(character);
    expect(joined).not.toContain("texto manual do jogador");
    expect(joined).toContain("MAESTRIA EM ARMA");
    expect(joined).toContain("RECUPERAR FÔLEGO");
    expect(joined).toContain("ATAQUE EXTRA");
  });

  it("subclasses só entram nos blocos quando character.subclassId corresponde — sem mistura entre elas (blocos da classe BASE aparecem sempre)", () => {
    const character = fullFighter(10, "Campeão");
    const joined = classFeaturesColumns(character);
    expect(joined).toContain("ATLETA EXTRAORDINÁRIO");
    expect(joined).toContain("RECUPERAR FÔLEGO"); // classe base, nunca exclusivo de uma subclasse
    expect(joined).not.toContain("VÍNCULO COM ARMA");
    expect(joined).not.toContain("ENERGIA PSIÔNICA");
    expect(joined).not.toContain("SUPERIORIDADE EM COMBATE");
  });
});

describe("exportação de ponta a ponta — exemplos pedidos explicitamente na fonte (§10)", () => {
  const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");
  function readTemplateBytes(): Uint8Array {
    return new Uint8Array(readFileSync(TEMPLATE_PATH));
  }

  async function expectValidExport(character: Character) {
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
    return joined;
  }

  it("Campeão nível 18: exporta um PDF válido com Sobrevivente e Crítico 18-20", async () => {
    const character = fullFighter(18, "Campeão");
    character.name = "Exemplo Campeão";
    character.abilities.CON.score = 16;
    const joined = await expectValidExport(character);
    expect(joined).toContain("SOBREVIVENTE");
    expect(joined).toContain("18–20");
  });

  it("Cavaleiro Místico nível 7: exporta um PDF válido com Vínculo com Arma e Magia de Guerra (1 truque)", async () => {
    const character = fullFighter(7, "Cavaleiro Místico");
    character.name = "Exemplo Cavaleiro Místico 7";
    const joined = await expectValidExport(character);
    expect(joined).toContain("VÍNCULO COM ARMA");
    expect(joined).toContain("MAGIA DE GUERRA");
  });

  it("Cavaleiro Místico nível 18: exporta um PDF válido com Magia de Guerra Aprimorada e Surto de Ação", async () => {
    const character = fullFighter(18, "Cavaleiro Místico");
    character.name = "Exemplo Cavaleiro Místico 18";
    const joined = await expectValidExport(character);
    expect(joined).toContain("trocar 1 atq por truque ou 2 por magia de 1º/2º círculo");
    expect(joined).toContain("SURTO DE AÇÃO");
  });

  it("Psiônico nível 18 (12 dados): exporta um PDF válido com Energia Psiônica d12 x12 e Mestre Telecinético", async () => {
    const character = fullFighter(18, "Guerreiro Psiônico");
    character.name = "Exemplo Psiônico 18";
    character.speciesId = "humano";
    const joined = await expectValidExport(character);
    expect(joined).toContain("DP d12");
    expect((joined.match(/\[__\]/g) ?? []).length).toBeGreaterThanOrEqual(12);
    expect(joined).toContain("MESTRE TELECINÉTICO");
  });

  it("Mestre de Batalha nível 18 (nove manobras): exporta um PDF válido com DS d12 em Carac.Classe; as 9 manobras vão para a caixa de Talentos, preservando talentos já existentes (fonte \"COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF\" §8)", async () => {
    const character = fullFighter(18, "Mestre da Batalha");
    character.name = "Exemplo Mestre de Batalha 18";
    character.abilities.FOR.score = 16;
    character.featureChoiceSelections[BATTLE_MASTER_CD_ABILITY_CHOICE_ID] = { value: "Força" };
    character.chosenManeuvers = [
      "aparar",
      "ataque-ameacador",
      "ataque-de-varredura",
      "ataque-estendido",
      "ataque-para-distrair",
      "ataque-preciso",
      "ataque-provocante",
      "avaliacao-tatica",
      "contra-ataque",
    ];
    character.talentsNotes = "Talento manual do jogador, preservado";
    const joined = await expectValidExport(character);
    expect(joined).toContain("DS d12");
    expect(joined).toContain("CONHEÇA SEU INIMIGO");
    expect(joined).not.toContain("# MANOBRAS");
    expect(joined).not.toContain("Aparar:");

    const talentos = fieldValue("Talentos", character);
    expect(talentos).toContain("Manobras:");
    expect(talentos).toContain("Aparar:");
    expect(talentos).toContain("Contra-ataque:");
    expect(talentos).toContain("Talento manual do jogador, preservado");
  });

  it("Campeão nível 7 com Estilo de Luta Adicional preenchido: vai para a caixa de Talentos, nunca para Características de Classe", async () => {
    const character = fullFighter(7, "Campeão");
    character.name = "Exemplo Campeão — Estilo de Luta Adicional";
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelista" };
    const joined = await expectValidExport(character);
    expect(joined).not.toContain("Duelista");

    const talentos = fieldValue("Talentos", character);
    expect(talentos).toContain("Estilo de Luta Adicional: Duelista");
  });

  it("Campeão nível 7 sem Estilo de Luta Adicional preenchido: nunca inventa nem imprime nada em Talentos", () => {
    const character = fullFighter(7, "Campeão");
    expect(fieldValue("Talentos", character)).toBe("");
  });

  it("Estilo de Luta BASE (nível 1, qualquer subclasse) preenchido: vai para a caixa de Talentos, nunca para Características de Classe, nunca como lembrete genérico (fonte \"COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF\" §1/§3)", async () => {
    const character = fullFighter(3, "Mestre da Batalha");
    character.name = "Exemplo Mestre de Batalha — Estilo de Luta";
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Combate com Arma Grande" };
    const joined = await expectValidExport(character);
    expect(joined).not.toContain("Combate com Arma Grande");
    expect(joined).not.toContain("ESTILO DE LUTA");

    const talentos = fieldValue("Talentos", character);
    expect(talentos).toContain("Estilo de Luta: Combate com Arma Grande");
    expect(talentos).not.toContain("escolher Estilo de Luta");
  });
});
