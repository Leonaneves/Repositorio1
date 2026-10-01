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

  it("Artífice: escolha de 2 perícias entre as 7 da fonte própria do Artífice", () => {
    const feature = classFeatures.find((f) => f.classId === "artifice" && f.name === "Perícias de Classe");
    expect(feature?.choices?.[0].effect).toEqual({ kind: "skillProficiency", options: classes.artifice.skillChoice!.from, count: 2 });
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
  it("Bardo, Monge e Artífice têm toolChoice confirmado, e só eles geram 'Ferramentas de Classe'", () => {
    const toolChoiceFeatures = classFeatures.filter((f) => f.name === "Ferramentas de Classe");
    expect(toolChoiceFeatures.map((f) => f.classId).sort()).toEqual(["artifice", "bardo", "monge"]);
  });

  it("Artífice: escolha de 1, 'Ferramenta de Artesão'", () => {
    const feature = classFeatures.find((f) => f.classId === "artifice" && f.name === "Ferramentas de Classe");
    expect(feature?.choices?.[0].effect).toEqual({ kind: "toolProficiency", optionsText: "Ferramenta de Artesão", count: 1 });
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

  it("Bárbaro 'Golpe Brutal' é uma única FeatureDefinition (nível 9) — nunca duplicada como 'Golpe Brutal Fortalecido' em 13/17 (a evolução fica só no texto impresso)", () => {
    const golpeBrutal = classFeatures.filter((f) => f.classId === "barbaro" && f.name === "Golpe Brutal");
    expect(golpeBrutal).toHaveLength(1);
    expect(golpeBrutal[0].level).toBe(9);
    expect(classFeatures.some((f) => f.classId === "barbaro" && f.name === "Golpe Brutal Fortalecido")).toBe(false);
  });

  it("Guerreiro 'Indomável' aparece 3 vezes (níveis 9, 13, 17), cada uma com id próprio", () => {
    const indomavel = classFeatures.filter((f) => f.classId === "guerreiro" && f.name === "Indomável");
    expect(indomavel.map((f) => f.level ?? 0).sort((a, b) => a - b)).toEqual([9, 13, 17]);
  });

  it("Artífice: features nomeadas da fonte própria (nível 1 a 20), sem Dádiva Épica", () => {
    const artificeFeatureNames = classFeatures.filter((f) => f.classId === "artifice").map((f) => f.name);
    expect(artificeFeatureNames).toEqual(
      expect.arrayContaining([
        "Ajustes Mágicos",
        "Conjuração",
        "Infundir Item",
        "A Ferramenta Certa para o Trabalho",
        "Especialização em Ferramentas",
        "Lampejo de Gênio",
        "Adepto de Itens Mágicos",
        "Item de Armazenar Magia",
        "Sábio dos Itens Mágicos",
        "Mestre dos Itens Mágicos",
        "Alma do Artífice",
      ]),
    );
    expect(artificeFeatureNames).not.toContain("Dádiva Épica");
  });

  it("Artífice: Aumento no Valor de Atributo em 4/8/12/16/19 (único com ASI também no 19, no lugar da Dádiva Épica)", () => {
    const asiLevels = classFeatures.filter((f) => f.classId === "artifice" && f.name === "Aumento no Valor de Atributo").map((f) => f.level);
    expect(asiLevels.sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([4, 8, 12, 16, 19]);
  });

  it("Artífice: 3 decisões internas do equipamento inicial (2 Armas Simples + 1 armadura), todas de nível 1", () => {
    const equipmentChoices = classFeatures.filter((f) => f.classId === "artifice" && f.name.startsWith("Equipamento Inicial"));
    expect(equipmentChoices).toHaveLength(3);
    expect(equipmentChoices.every((f) => f.level === 1)).toBe(true);
    const weaponChoices = equipmentChoices.filter((f) => f.choices?.[0].effect.kind === "weaponPicker");
    expect(weaponChoices).toHaveLength(2);
    const armorChoice = equipmentChoices.find((f) => f.choices?.[0].effect.kind === "optionPick");
    expect(armorChoice?.choices?.[0].effect).toEqual({
      kind: "optionPick",
      options: ["Armadura de Couro Batido", "Cota de Escamas"],
    });
  });

  it("toda feature de classe (fora as de ASI/Dádiva Épica/skillChoice) tem sourceType 'class' e nível entre 1 e 20", () => {
    for (const feature of classFeatures) {
      expect(feature.sourceType).toBe("class");
      expect(feature.level).toBeGreaterThanOrEqual(1);
      expect(feature.level).toBeLessThanOrEqual(20);
    }
  });
});
