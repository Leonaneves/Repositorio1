import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassToolChoiceId } from "../data/classes.js";
import { getAutomaticClassTools, getEligibleTools, getKnownTools, isClassToolChoiceComplete } from "./tools.js";

describe("getEligibleTools — filtra pelo catálogo estruturado (nunca mais texto livre)", () => {
  it("'musicalInstrument' nunca inclui Ferramentas de Ladrão nem Ferramentas de Artesão", () => {
    const options = getEligibleTools("musicalInstrument");
    expect(options.some((t) => t.id === "ferramentas-ladrao")).toBe(false);
    expect(options.some((t) => t.category === "artisanTool")).toBe(false);
    expect(options.length).toBe(15);
  });

  it("'artisanTool' tem as 17 ferramentas de artesão, sem Ferramentas de Ladrão", () => {
    const options = getEligibleTools("artisanTool");
    expect(options).toHaveLength(17);
    expect(options.some((t) => t.id === "ferramentas-ladrao")).toBe(false);
  });

  it("array de categorias funciona como OU (Monge: artisanTool OU musicalInstrument)", () => {
    const options = getEligibleTools(["artisanTool", "musicalInstrument"]);
    expect(options).toHaveLength(17 + 15);
  });
});

describe("getAutomaticClassTools / isClassToolChoiceComplete — quantidade obrigatória, sem duplicatas (escolha automática)", () => {
  it("[] sem classe, ou classe sem toolChoice", () => {
    const character = createBlankCharacter("tools-test");
    expect(getAutomaticClassTools(character)).toEqual([]);
    character.classId = "guerreiro"; // sem toolChoice
    expect(getAutomaticClassTools(character)).toEqual([]);
    expect(isClassToolChoiceComplete(character)).toBe(true); // nada a resolver nunca bloqueia
  });

  it("Bardo: incompleta até escolher exatamente 3", () => {
    const character = createBlankCharacter("tools-test");
    character.classId = "bardo";
    expect(isClassToolChoiceComplete(character)).toBe(false);

    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta"] };
    expect(isClassToolChoiceComplete(character)).toBe(false);

    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta", "tambor"] };
    expect(isClassToolChoiceComplete(character)).toBe(true);
    expect(getAutomaticClassTools(character)).toEqual(["alaude", "flauta", "tambor"]);
  });
});

describe("getKnownTools — Homebrew substitui por completo o resultado automático, nunca soma", () => {
  it("sem Homebrew: resultado = escolha automática", () => {
    const character = createBlankCharacter("tools-test");
    character.classId = "bardo";
    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta", "tambor"] };
    expect(getKnownTools(character)).toEqual(["alaude", "flauta", "tambor"]);
  });

  it("com Homebrew ativo: resultado = manualToolOverrides, ignora a escolha automática", () => {
    const character = createBlankCharacter("tools-test");
    character.classId = "bardo";
    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta", "tambor"] };
    character.manualToolOverrides = ["ferramentas-ladrao"];
    expect(getKnownTools(character)).toEqual(["ferramentas-ladrao"]);
    expect(isClassToolChoiceComplete(character)).toBe(true); // Homebrew nunca bloqueia
  });

  it("desativar o Homebrew (voltar a null) restaura o resultado automático sem perder os dados automáticos", () => {
    const character = createBlankCharacter("tools-test");
    character.classId = "bardo";
    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta", "tambor"] };
    character.manualToolOverrides = ["ferramentas-ladrao"];
    expect(getKnownTools(character)).toEqual(["ferramentas-ladrao"]);

    character.manualToolOverrides = null;
    expect(getKnownTools(character)).toEqual(["alaude", "flauta", "tambor"]);
  });
});
