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

  it("aparece para Guerreiro + Tiefling, mesmo sem conjuração de classe/antecedente (fonte \"IMPLEMENTAR LINHAGENS...\" §3)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "guerreiro";
    character.speciesId = "tiefling";
    character.speciesLineageId = "tiefling-infernal";
    expect(isStepVisible("spellcasting", character)).toBe(true);
  });

  it("continua ausente para Guerreiro + Tiefling SEM linhagem escolhida ainda (nenhuma magia concedida de fato)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "guerreiro";
    character.speciesId = "tiefling";
    expect(isStepVisible("spellcasting", character)).toBe(false);
  });
});

describe("isStepVisible — Características e Talentos (condicional — só Espécie/Antecedente/Talento, desde a REORGANIZAÇÃO DO BUILDER §1/§2)", () => {
  it("some quando não existe nenhuma feature com escolha (personagem em branco, sem classe/espécie/antecedente)", () => {
    const character = createBlankCharacter("step-test");
    expect(isStepVisible("featuresAndTalents", character)).toBe(false);
  });

  it("some mesmo com a classe tendo escolha de Perícias de Classe (Bárbaro) — essa escolha agora mora na etapa Classe, não aqui", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "barbaro";
    character.level = 5;
    expect(isStepVisible("featuresAndTalents", character)).toBe(false);
  });
});

describe("isStepVisible — Invocações Místicas (condicional, só para Bruxo)", () => {
  it("some para qualquer classe que não seja Bruxo", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 5;
    expect(isStepVisible("invocations", character)).toBe(false);
  });

  it("some sem classe nenhuma", () => {
    expect(isStepVisible("invocations", createBlankCharacter("step-test"))).toBe(false);
  });

  it("aparece para Bruxo em qualquer nível (inclusive nível 1, que já concede 1 invocação)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "bruxo";
    character.level = 1;
    expect(isStepVisible("invocations", character)).toBe(true);
  });
});

describe("isStepVisible — Formas Conhecidas (condicional, só para Druida a partir do nível 2)", () => {
  it("some para qualquer classe que não seja Druida", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 5;
    expect(isStepVisible("wildShapeForms", character)).toBe(false);
  });

  it("some para Druida nível 1 (Forma Selvagem ainda não concedida)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 1;
    expect(isStepVisible("wildShapeForms", character)).toBe(false);
  });

  it("aparece para Druida a partir do nível 2", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 2;
    expect(isStepVisible("wildShapeForms", character)).toBe(true);
  });
});

describe("isStepVisible — Terreno do Círculo da Terra (condicional, só Círculo da Terra a partir do nível 3)", () => {
  it("some sem subclasse", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 5;
    expect(isStepVisible("earthCircleTerrain", character)).toBe(false);
  });

  it("some para outra subclasse de Druida", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 5;
    character.subclassId = "Círculo da Lua";
    expect(isStepVisible("earthCircleTerrain", character)).toBe(false);
  });

  it("some antes do nível 3 mesmo com Círculo da Terra (subclasse ainda não escolhível)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 2;
    character.subclassId = "Círculo da Terra";
    expect(isStepVisible("earthCircleTerrain", character)).toBe(false);
  });

  it("aparece para Círculo da Terra a partir do nível 3", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    character.subclassId = "Círculo da Terra";
    expect(isStepVisible("earthCircleTerrain", character)).toBe(true);
  });
});

describe("isStepVisible — Metamagia (condicional, só para Feiticeiro a partir do nível 2)", () => {
  it("some para qualquer classe que não seja Feiticeiro", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 5;
    expect(isStepVisible("metamagic", character)).toBe(false);
  });

  it("some para Feiticeiro nível 1 (Metamagia ainda não concedida)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 1;
    expect(isStepVisible("metamagic", character)).toBe(false);
  });

  it("aparece para Feiticeiro a partir do nível 2", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 2;
    expect(isStepVisible("metamagic", character)).toBe(true);
  });
});

describe("isStepVisible — Afinidade Elemental (condicional, só Feitiçaria Dracônica a partir do nível 6)", () => {
  it("some sem subclasse", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 10;
    expect(isStepVisible("elementalAffinity", character)).toBe(false);
  });

  it("some para outra subclasse de Feiticeiro", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 10;
    character.subclassId = "Feitiçaria Selvagem";
    expect(isStepVisible("elementalAffinity", character)).toBe(false);
  });

  it("some antes do nível 6 mesmo com Feitiçaria Dracônica", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 5;
    character.subclassId = "Feitiçaria Dracônica";
    expect(isStepVisible("elementalAffinity", character)).toBe(false);
  });

  it("aparece para Feitiçaria Dracônica a partir do nível 6", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    expect(isStepVisible("elementalAffinity", character)).toBe(true);
  });
});

describe("getVisibleSteps", () => {
  it("personagem em branco: 8 das 14 etapas (sem Subclasse/Formas Conhecidas/Terreno/Talentos/Invocações/Conjuração)", () => {
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

  it("Mago nível 3: soma Subclasse e Conjuração (a escolha de Perícias de Classe do Mago mora na etapa Classe, não mais aqui), mas nunca Invocações Místicas/Formas Conhecidas/Terreno/Características e Talentos — 10 das 14 etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("subclass");
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).not.toContain("invocations");
    expect(steps).not.toContain("wildShapeForms");
    expect(steps).not.toContain("earthCircleTerrain");
    expect(steps).toHaveLength(10);
  });

  it("Bruxo nível 3: soma Subclasse, Invocações Místicas e Conjuração — 11 das 14 etapas (nunca Formas Conhecidas/Terreno/Características e Talentos)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "bruxo";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("subclass");
    expect(steps).toContain("invocations");
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).toHaveLength(11);
  });

  it("Druida nível 3 sem subclasse: soma Subclasse e Formas Conhecidas, mas nunca Terreno (subclasse ainda não escolhida) nem Características e Talentos — 11 das 14 etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("subclass");
    expect(steps).toContain("wildShapeForms");
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).not.toContain("earthCircleTerrain");
    expect(steps).toHaveLength(11);
  });

  it("Druida/Círculo da Terra nível 3: soma também Terreno — 12 das 14 etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    character.subclassId = "Círculo da Terra";
    const steps = getVisibleSteps(character);
    expect(steps).toContain("wildShapeForms");
    expect(steps).toContain("earthCircleTerrain");
    expect(steps).toHaveLength(12);
  });

  it("respeita sempre a ordem canônica das etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "bruxo";
    character.level = 3;
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("Druida/Círculo da Terra nível 14: respeita a ordem canônica também com as 2 etapas novas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 14;
    character.subclassId = "Círculo da Terra";
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("Feiticeiro nível 2 sem subclasse: soma Metamagia, mas nunca Subclasse/Afinidade Elemental ainda", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 2;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("metamagic");
    expect(steps).not.toContain("subclass");
    expect(steps).not.toContain("elementalAffinity");
  });

  it("Feiticeiro/Feitiçaria Dracônica nível 6: soma também Afinidade Elemental", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    const steps = getVisibleSteps(character);
    expect(steps).toContain("metamagic");
    expect(steps).toContain("elementalAffinity");
  });

  it("Feiticeiro/Feitiçaria Dracônica nível 6: respeita a ordem canônica também com as 2 etapas de Metamagia/Afinidade Elemental", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});
