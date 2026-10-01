import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../../domain/character.js";
import type { Character } from "../../domain/character.js";
import { bardClassFeatures, getBardSkillExpertiseChoiceId } from "./bard.js";
import { getCharacterFeatures, getIncompleteRequiredChoices, isFeatureComplete } from "../../rules/features.js";

function bardAt(level: number): Character {
  const character = createBlankCharacter("bard-features-test");
  character.classId = "bardo";
  character.level = level;
  return character;
}

describe("bardClassFeatures — nunca duplica uma característica que evolui", () => {
  it("só existe uma FeatureDefinition chamada 'Inspiração de Bardo' (5 e 18 são evolução de texto, não features novas)", () => {
    expect(bardClassFeatures.filter((f) => f.name === "Inspiração de Bardo")).toHaveLength(1);
    expect(bardClassFeatures.some((f) => f.name === "Fonte de Inspiração")).toBe(true); // existe como FeatureDefinition informativa própria...
  });

  it("'Fonte de Inspiração' e 'Inspiração Superior' existem como FeatureDefinition próprias (para o Builder/Ficha Web), mas não duplicam Inspiração de Bardo no texto impresso (ver rules/bardPrintedFeatures.test.ts)", () => {
    expect(bardClassFeatures.some((f) => f.name === "Fonte de Inspiração" && f.level === 5)).toBe(true);
    expect(bardClassFeatures.some((f) => f.name === "Inspiração Superior" && f.level === 18)).toBe(true);
  });

  it("'Especialista' aparece 2 vezes (níveis 2 e 9), cada uma com id e choice id próprios", () => {
    const especialista = bardClassFeatures.filter((f) => f.name === "Especialista");
    expect(especialista).toHaveLength(2);
    expect(especialista.map((f) => f.level).sort()).toEqual([2, 9]);
    const choiceIds = especialista.flatMap((f) => f.choices?.map((c) => c.id) ?? []);
    expect(new Set(choiceIds).size).toBe(2);
  });

  it("todos os ids são únicos", () => {
    const ids = bardClassFeatures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Especialista — escolha obrigatória de Especialização (não concede proficiência)", () => {
  it("bloqueia o avanço do Builder enquanto não escolhida (nível 2)", () => {
    const character = bardAt(2);
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Especialista" && f.level === 2)).toBe(true);
  });

  it("completa com exatamente 2 perícias selecionadas", () => {
    const character = bardAt(2);
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao", "enganacao"] };
    const feature = getCharacterFeatures(character).find((f) => f.name === "Especialista" && f.level === 2)!;
    expect(isFeatureComplete(feature, character)).toBe(true);
  });

  it("não aparece antes do nível 2, e a 2ª escolha não aparece antes do nível 9", () => {
    const level1 = bardAt(1);
    expect(getCharacterFeatures(level1).some((f) => f.name === "Especialista")).toBe(false);

    const level8 = bardAt(8);
    const names = getCharacterFeatures(level8).filter((f) => f.name === "Especialista");
    expect(names).toHaveLength(1);
    expect(names[0].level).toBe(2);
  });

  it("nível 9: as duas FeatureDefinitions 'Especialista' já foram adquiridas", () => {
    const character = bardAt(9);
    const especialista = getCharacterFeatures(character).filter((f) => f.name === "Especialista");
    expect(especialista).toHaveLength(2);
  });
});

describe("Conjuração, Pau pra Toda Obra, Segredos Mágicos, Inspiração Superior — existem como FeatureDefinition, mas nunca bloqueiam o Builder (sem choices)", () => {
  it.each(["Conjuração", "Pau pra Toda Obra", "Segredos Mágicos", "Inspiração Superior", "Palavras de Criação", "Contra-Encantamento"])(
    "%s não tem `choices`",
    (name) => {
      const feature = bardClassFeatures.find((f) => f.name === name)!;
      expect(feature.choices).toBeUndefined();
      expect(feature.autoGranted).toBe(true);
    },
  );
});
