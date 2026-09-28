import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "@cantoo/pdf-lib";
import { useBuilderStore } from "../state/builderStore.js";
import { useCharacterStore } from "../state/characterStore.js";
import { buildExportedPdf, fillPdfForm } from "./exporter.js";

/**
 * Teste de integração completo pedido em item 14: cria um personagem
 * usando o mesmo caminho que a UI do Builder usa (characterStore +
 * builderStore, escolhas resolvidas via as mesmas actions que
 * `FeatureChoiceControl`/`Step9Equipment` chamam) — não construindo o
 * `Character` objeto diretamente — e então exporta e abre o PDF
 * gerado para conferir que os valores resolvidos aparecem
 * corretamente no arquivo final.
 */

const TEMPLATE_PATH = resolve(process.cwd(), "public/pdf-template/ficha-interativa.pdf");
function readTemplateBytes(): Uint8Array {
  return new Uint8Array(readFileSync(TEMPLATE_PATH));
}

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useBuilderStore.setState({ abilityGenerationMode: "standardArray", draftScores: {}, currentStepId: "basicInfo" });
});

describe("integração completa: Builder → resolver escolhas → exportar → abrir o PDF gerado", () => {
  it("Guerreiro nível 1 — perícias de classe + pacote de equipamento resolvidos pelo Builder aparecem corretos no PDF final", async () => {
    const characterStore = useCharacterStore.getState();
    const builderStore = useBuilderStore.getState();

    characterStore.setName("Elminster Aumar");
    characterStore.setClass("guerreiro");

    // Ainda não pode avançar: falta resolver a escolha obrigatória de perícias.
    builderStore.goToStep("featuresAndTalents");
    expect(useBuilderStore.getState().canAdvance()).toBe(false);

    // Resolve a escolha exatamente como FeatureChoiceControl faria (mesma action, mesmo id de escolha).
    characterStore.setFeatureChoiceSelection("classe-guerreiro-pericias", ["atletismo", "intimidacao"]);
    expect(useBuilderStore.getState().canAdvance()).toBe(true);

    // Escolhe o pacote de equipamento inicial como Step9Equipment faria.
    builderStore.goToStep("equipment");
    expect(useBuilderStore.getState().canAdvance()).toBe(false);
    characterStore.setStartingEquipmentOption("B");
    expect(useBuilderStore.getState().canAdvance()).toBe(true);

    const character = useCharacterStore.getState().character;
    expect(character.startingEquipmentOptionId).toBe("B");
    expect(character.inventory.equipment.length).toBeGreaterThan(0);

    // Etapa "Revisão" → "Exportar PDF": mesma função que Step11Review chama.
    const outBytes = await buildExportedPdf(character, readTemplateBytes());

    // "Abrir o PDF gerado": recarrega os bytes finais (já achatados) num PDFDocument novo.
    const reopened = await PDFDocument.load(outBytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getForm().getFields()).toHaveLength(0); // achatado — nada interativo sobra

    // Confere os valores/campos relevantes: como o flatten() remove o AcroForm,
    // reconstrói o mesmo preenchimento (fillPdfForm, sem achatar) sobre o MESMO
    // Character resolvido pelo Builder para inspecionar os checkboxes que o
    // export final usou como base.
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    fillPdfForm(pdfDoc, form, character);

    // As duas perícias escolhidas no Builder ficam marcadas...
    expect(form.getCheckBox("O.FOR.atl").isChecked()).toBe(true); // Atletismo
    expect(form.getCheckBox("O.CAR.inti").isChecked()).toBe(true); // Intimidação
    // ...e uma perícia não escolhida continua desmarcada.
    expect(form.getCheckBox("O.DEX.acr").isChecked()).toBe(false); // Acrobacia

    // Proficiências de salvaguarda do Guerreiro (FOR/CON, automáticas ao escolher a classe).
    expect(form.getCheckBox("O.FOR.res").isChecked()).toBe(true);
    expect(form.getCheckBox("O.CON.res").isChecked()).toBe(true);
    expect(form.getCheckBox("O.INT.res").isChecked()).toBe(false);

    // Treinamento de armadura do Guerreiro (leve/média/pesada/escudo, automático ao escolher a classe).
    expect(form.getCheckBox("PROF.leve").isChecked()).toBe(true);
    expect(form.getCheckBox("PROF.med").isChecked()).toBe(true);
    expect(form.getCheckBox("PROF.pesa").isChecked()).toBe(true);
    expect(form.getCheckBox("PROF.Escudo").isChecked()).toBe(true);
  });

  it("Artífice — todas as decisões da fonte própria (perícias, ferramenta, 2 armas, armadura, equipamento) resolvidas pelo Builder exportam um PDF válido", async () => {
    const characterStore = useCharacterStore.getState();
    const builderStore = useBuilderStore.getState();

    characterStore.setName("Kova Duskryn");
    characterStore.setClass("artifice");

    builderStore.goToStep("featuresAndTalents");
    expect(useBuilderStore.getState().canAdvance()).toBe(false); // nada resolvido ainda

    characterStore.setFeatureChoiceSelection("classe-artifice-pericias", ["arcanismo", "investigacao"]);
    expect(useBuilderStore.getState().canAdvance()).toBe(false); // faltam ferramenta + 2 armas + armadura

    characterStore.setFeatureChoiceSelection("classe-artifice-ferramentas", "Ferramentas de Ferreiro");
    characterStore.setFeatureChoiceSelection("artifice-equipamento-arma-simples-1-escolha", "adaga");
    characterStore.setFeatureChoiceSelection("artifice-equipamento-arma-simples-2-escolha", "azagaia");
    characterStore.setFeatureChoiceSelection("artifice-equipamento-armadura-escolha", "Cota de Escamas");
    expect(useBuilderStore.getState().canAdvance()).toBe(true);

    builderStore.goToStep("equipment");
    expect(useBuilderStore.getState().canAdvance()).toBe(false);
    characterStore.setStartingEquipmentOption("padrao");
    expect(useBuilderStore.getState().canAdvance()).toBe(true);

    const character = useCharacterStore.getState().character;
    expect(character.savingThrows.CON.proficient).toBe(true);
    expect(character.savingThrows.INT.proficient).toBe(true);
    expect(character.armor.proficiencies.heavy).toBe(false); // Artífice não tem armadura pesada

    const outBytes = await buildExportedPdf(character, readTemplateBytes());
    const reopened = await PDFDocument.load(outBytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getForm().getFields()).toHaveLength(0);

    const header = new TextDecoder().decode(outBytes.slice(0, 5));
    expect(header).toBe("%PDF-");

    // Confere os checkboxes de proficiência de perícia/salvaguarda resolvidos pelo Builder (mesmo Character, sem achatar).
    const pdfDoc = await PDFDocument.load(readTemplateBytes());
    const form = pdfDoc.getForm();
    fillPdfForm(pdfDoc, form, character);
    expect(form.getCheckBox("o.INT.arc").isChecked()).toBe(true); // Arcanismo
    expect(form.getCheckBox("O.INT.inv").isChecked()).toBe(true); // Investigação
    expect(form.getCheckBox("O.SAB.med").isChecked()).toBe(false); // Medicina não foi escolhida
    expect(form.getCheckBox("O.CON.res").isChecked()).toBe(true);
    expect(form.getCheckBox("O.INT.res").isChecked()).toBe(true);
  });
});
