import { describe, expect, it } from "vitest";
import { CLASS_IDS } from "../../domain/ids.js";
import { classes, getClassSkillChoiceId, getClassToolChoiceId } from "../classes.js";
import { classFeatures } from "./classes.js";

const CONFIRMED_CLASS_IDS = CLASS_IDS.filter((id) => id !== "artifice");

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

describe("classFeatures — 'Ferramentas de Classe' gerada a partir de classes[].toolChoice", () => {
  it("só Bardo e Monge têm toolChoice confirmado, e só eles geram 'Ferramentas de Classe'", () => {
    const toolChoiceFeatures = classFeatures.filter((f) => f.name === "Ferramentas de Classe");
    expect(toolChoiceFeatures.map((f) => f.classId).sort()).toEqual(["bardo", "monge"]);
  });

  it("Bardo: escolha de 3, effect toolProficiency com o texto correto", () => {
    const feature = classFeatures.find((f) => f.classId === "bardo" && f.name === "Ferramentas de Classe");
    expect(feature?.level).toBe(1);
    expect(feature?.choices).toHaveLength(1);
    expect(feature?.choices?.[0].effect).toEqual({ kind: "toolProficiency", optionsText: "Instrumentos Musicais", count: 3 });
    expect(feature?.choices?.[0].id).toBe(getClassToolChoiceId("bardo"));
  });

  it("Monge: escolha de 1, 'Ferramenta de Artesão OU Instrumento Musical'", () => {
    const feature = classFeatures.find((f) => f.classId === "monge" && f.name === "Ferramentas de Classe");
    expect(feature?.choices?.[0].effect).toEqual({
      kind: "toolProficiency",
      optionsText: "Ferramenta de Artesão OU Instrumento Musical",
      count: 1,
    });
  });

  it("Druida e Ladino (concessão automática fixa) não geram 'Ferramentas de Classe'", () => {
    expect(classFeatures.some((f) => f.classId === "druida" && f.name === "Ferramentas de Classe")).toBe(false);
    expect(classFeatures.some((f) => f.classId === "ladino" && f.name === "Ferramentas de Classe")).toBe(false);
  });
});

describe("classFeatures — nomes e níveis das 12 classes da base consolidada", () => {
  it("todo id de classFeatures é único (nenhuma colisão entre features nomeadas/ASI/Dádiva Épica/mecânicas)", () => {
    const ids = classFeatures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todas as 12 classes confirmadas têm ao menos uma feature de nível 1", () => {
    for (const classId of CONFIRMED_CLASS_IDS) {
      expect(classFeatures.some((f) => f.classId === classId && f.level === 1)).toBe(true);
    }
  });

  it("todas as 12 classes confirmadas têm Dádiva Épica no nível 19, com escolha manualText pendente", () => {
    for (const classId of CONFIRMED_CLASS_IDS) {
      const feature = classFeatures.find((f) => f.classId === classId && f.name === "Dádiva Épica");
      expect(feature?.level).toBe(19);
      expect(feature?.choices?.[0].effect.kind).toBe("manualText");
    }
  });

  it("todas as 12 classes confirmadas têm ao menos um Aumento no Valor de Atributo nos níveis 4/8/12/16", () => {
    for (const classId of CONFIRMED_CLASS_IDS) {
      const asiLevels = classFeatures.filter((f) => f.classId === classId && f.name === "Aumento no Valor de Atributo").map((f) => f.level);
      expect(asiLevels).toEqual(expect.arrayContaining([4, 8, 12, 16]));
    }
  });

  it("features com o mesmo nome em níveis diferentes da mesma classe não colidem (ex.: Bárbaro 'Golpe Brutal Fortalecido' em 13 e 17)", () => {
    const golpeBrutal = classFeatures.filter((f) => f.classId === "barbaro" && f.name === "Golpe Brutal Fortalecido");
    expect(golpeBrutal.map((f) => f.level).sort()).toEqual([13, 17]);
    expect(new Set(golpeBrutal.map((f) => f.id)).size).toBe(2);
  });

  it("Guerreiro 'Indomável' aparece 3 vezes (níveis 9, 13, 17), cada uma com id próprio", () => {
    const indomavel = classFeatures.filter((f) => f.classId === "guerreiro" && f.name === "Indomável");
    expect(indomavel.map((f) => f.level ?? 0).sort((a, b) => a - b)).toEqual([9, 13, 17]);
  });

  it("Artífice (fora da base) não ganha nenhuma feature nomeada/ASI/Dádiva Épica", () => {
    expect(classFeatures.filter((f) => f.classId === "artifice")).toHaveLength(0);
  });

  it("toda feature de classe (fora as de ASI/Dádiva Épica/skillChoice) tem sourceType 'class' e nível entre 1 e 20", () => {
    for (const feature of classFeatures) {
      expect(feature.sourceType).toBe("class");
      expect(feature.level).toBeGreaterThanOrEqual(1);
      expect(feature.level).toBeLessThanOrEqual(20);
    }
  });
});
