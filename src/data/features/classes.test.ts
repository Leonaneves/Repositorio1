import { describe, expect, it } from "vitest";
import { classes, getClassSkillChoiceId } from "../classes.js";
import { classFeatures } from "./classes.js";

describe("classFeatures — 'Perícias de Classe' gerada a partir de classes[].skillChoice", () => {
  it("uma feature 'Perícias de Classe' por classe com skillChoice confirmado", () => {
    const skillChoiceFeatures = classFeatures.filter((f) => f.name === "Perícias de Classe");
    const classesWithSkillChoice = Object.values(classes).filter((c) => c.skillChoice !== undefined);
    expect(skillChoiceFeatures).toHaveLength(classesWithSkillChoice.length);
  });

  it("Artífice não gera 'Perícias de Classe' (sem skillChoice confirmado)", () => {
    expect(classFeatures.some((f) => f.classId === "artifice" && f.name === "Perícias de Classe")).toBe(false);
  });

  it("Bardo: 1 FeatureChoice skillProficiency com count=3 e options='any'", () => {
    const feature = classFeatures.find((f) => f.classId === "bardo" && f.name === "Perícias de Classe");
    expect(feature?.choices).toHaveLength(1);
    expect(feature?.choices?.[0].effect).toEqual({ kind: "skillProficiency", options: "any", count: 3 });
    expect(feature?.choices?.[0].id).toBe(getClassSkillChoiceId("bardo"));
  });

  it("Ladino: count=4 e a lista de opções exata de classes.ladino.skillChoice", () => {
    const feature = classFeatures.find((f) => f.classId === "ladino" && f.name === "Perícias de Classe");
    const effect = feature?.choices?.[0].effect;
    expect(effect).toEqual({ kind: "skillProficiency", options: classes.ladino.skillChoice!.from, count: 4 });
  });

  it("nível sempre 1 (perícias de classe são escolhidas na criação)", () => {
    for (const feature of classFeatures.filter((f) => f.name === "Perícias de Classe")) {
      expect(feature.level).toBe(1);
    }
  });
});
