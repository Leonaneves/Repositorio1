import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { BUILDER_STEP_ORDER, getVisibleSteps, isStepVisible } from "./builderSteps.js";

describe("isStepVisible — etapas sempre visíveis", () => {
  it.each(["basicInfo", "class", "species", "background", "abilities", "skills", "equipment", "review"] as const)(
    "%s aparece sempre, independente do personagem",
    (stepId) => {
      expect(isStepVisible(stepId, createBlankCharacter("step-test"))).toBe(true);
    },
  );
});

describe("isStepVisible — Subclasse (condicional, nível 3+)", () => {
  it("some antes do nível 3", () => {
    const character = createBlankCharacter("step-test");
    character.level = 2;
    expect(isStepVisible("subclass", character)).toBe(false);
  });

  it("aparece a partir do nível 3", () => {
    const character = createBlankCharacter("step-test");
    character.level = 3;
    expect(isStepVisible("subclass", character)).toBe(true);
  });
});

describe("isStepVisible — Conjuração (condicional, depende do atributo de conjuração)", () => {
  it("some para uma classe sem conjuração e sem antecedente que a conceda", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "barbaro";
    expect(isStepVisible("spellcasting", character)).toBe(false);
  });

  it("aparece para uma classe conjuradora", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    expect(isStepVisible("spellcasting", character)).toBe(true);
  });

  it("aparece para Guerreiro com antecedente que concede conjuração (Sábio)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "guerreiro";
    character.backgroundId = "sabio";
    expect(isStepVisible("spellcasting", character)).toBe(true);
  });
});

describe("isStepVisible — Características e Talentos (condicional, precisa de FeatureChoice pendente)", () => {
  it("some quando nenhuma feature atual tem escolha (nenhuma feature cadastrada tem choices ainda)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "barbaro";
    character.level = 5; // já tem Movimento Rápido, mas sem escolha
    expect(isStepVisible("featuresAndTalents", character)).toBe(false);
  });
});

describe("getVisibleSteps", () => {
  it("personagem em branco: 8 das 11 etapas (sem Subclasse/Talentos/Conjuração)", () => {
    const character = createBlankCharacter("step-test");
    expect(getVisibleSteps(character)).toEqual([
      "basicInfo",
      "class",
      "species",
      "background",
      "abilities",
      "skills",
      "equipment",
      "review",
    ]);
  });

  it("Mago nível 3: soma Subclasse e Conjuração (10 etapas)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("subclass");
    expect(steps).toContain("spellcasting");
    expect(steps).toHaveLength(10);
  });

  it("respeita sempre a ordem canônica das 11 etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 3;
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});
