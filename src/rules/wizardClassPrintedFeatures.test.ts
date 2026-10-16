import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getWizardClassPrintedBlocks } from "./wizardClassPrintedFeatures.js";

function wizardAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("wizard-class-printed-test");
  character.classId = "mago";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getWizardClassPrintedBlocks — classe diferente", () => {
  it("classe diferente de Mago — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.classId = "ladino";
    character.level = 20;
    expect(getWizardClassPrintedBlocks(character)).toEqual([]);
  });
});

describe("Adepto de Ritual e Recuperação Arcana — sempre presentes do nível 1", () => {
  it("nível 1: só Adepto de Ritual e Recuperação Arcana (limite 1) — sem Memorizar Magia/Maestria/Assinatura", () => {
    const joined = getWizardClassPrintedBlocks(wizardAt(1)).join("\n\n");
    expect(joined).toContain("# ADEPTO DE RITUAL");
    expect(joined).toContain("Ritual do livro sem preparar; exige ler o livro");
    expect(joined).toContain("# RECUPERAÇÃO ARCANA");
    expect(joined).toContain("recupera espaços somando 1 círculos, até 5º cada [__]/DL");
    expect(joined).not.toContain("MEMORIZAR MAGIA");
    expect(joined).not.toContain("MAESTRIA DE MAGIAS");
    expect(joined).not.toContain("ASSINATURA MÁGICA");
  });

  it("limite de Recuperação Arcana resolvido por nível: 5 → 3 círculos, 20 → 10 círculos", () => {
    expect(getWizardClassPrintedBlocks(wizardAt(5)).join("\n\n")).toContain("recupera espaços somando 3 círculos");
    expect(getWizardClassPrintedBlocks(wizardAt(20)).join("\n\n")).toContain("recupera espaços somando 10 círculos");
  });
});

describe("Memorizar Magia — nível 5+", () => {
  it("aparece a partir do nível 5, ausente abaixo", () => {
    expect(getWizardClassPrintedBlocks(wizardAt(4)).join("\n\n")).not.toContain("MEMORIZAR MAGIA");
    const joined = getWizardClassPrintedBlocks(wizardAt(5)).join("\n\n");
    expect(joined).toContain("# MEMORIZAR MAGIA");
    expect(joined).toContain("DC com livro: troca 1 magia preparada por outra do livro");
  });
});

describe("Maestria de Magias — nível 18+", () => {
  it("aparece a partir do nível 18, ausente abaixo; sem nomes de magia (configuração alterável em descanso)", () => {
    expect(getWizardClassPrintedBlocks(wizardAt(17)).join("\n\n")).not.toContain("MAESTRIA DE MAGIAS");
    const joined = getWizardClassPrintedBlocks(wizardAt(18)).join("\n\n");
    expect(joined).toContain("# MAESTRIA DE MAGIAS");
    expect(joined).toContain("1 magia de 1º e 1 de 2º, de 1 ação: sempre preparadas, sem espaço no círculo base");
    expect(joined).toContain("DL: troca 1 por outra do mesmo círculo do livro");
  });
});

describe("Assinatura Mágica — nível 20, resolvendo os nomes escolhidos (nunca {magiaAssinatura1}/{magiaAssinatura2} literais)", () => {
  it("sem escolhas ainda — usa '—' como fallback, nunca o placeholder literal", () => {
    const joined = getWizardClassPrintedBlocks(wizardAt(20)).join("\n\n");
    expect(joined).toContain("# ASSINATURA MÁGICA");
    expect(joined).toContain("—: sem espaço no 3º [__]/DC ou DL");
    expect(joined).not.toContain("{magiaAssinatura1}");
    expect(joined).not.toContain("{magiaAssinatura2}");
  });

  it("com as 2 magias escolhidas (isSignatureSpell), resolve os 2 nomes, cada uma com seu próprio marcador", () => {
    const character = wizardAt(20);
    character.wizardSpellbook = [
      { name: "Bola de Fogo", circle: 3, origin: "classProgression", grantedUnderSubclass: null, prepared: false, isSpellMastery: false, isSignatureSpell: true },
      { name: "Relâmpago", circle: 3, origin: "classProgression", grantedUnderSubclass: null, prepared: false, isSpellMastery: false, isSignatureSpell: true },
    ];
    const joined = getWizardClassPrintedBlocks(character).join("\n\n");
    expect(joined).toContain("Bola de Fogo: sem espaço no 3º [__]/DC ou DL");
    expect(joined).toContain("Relâmpago: sem espaço no 3º [__]/DC ou DL");
  });

  it("ausente abaixo do nível 20", () => {
    expect(getWizardClassPrintedBlocks(wizardAt(19)).join("\n\n")).not.toContain("ASSINATURA MÁGICA");
  });
});

describe("Nunca aparecem aqui (ficam em Perícias/Magias/Talentos)", () => {
  it("Acadêmico, Conjuração, Aumento no Valor de Atributo e Dádiva Épica nunca aparecem aqui", () => {
    const joined = getWizardClassPrintedBlocks(wizardAt(20)).join("\n\n");
    expect(joined).not.toContain("ACADÊMICO");
    expect(joined).not.toContain("CONJURAÇÃO");
    expect(joined).not.toContain("AUMENTO NO VALOR DE ATRIBUTO");
    expect(joined).not.toContain("DÁDIVA ÉPICA");
  });
});
