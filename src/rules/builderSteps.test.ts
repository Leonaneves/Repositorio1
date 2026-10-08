import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { BUILDER_STEP_ORDER, getVisibleSteps, isEarthCircleTerrainApplicable, isElementalAffinityApplicable, isStepVisible } from "./builderSteps.js";

describe("isStepVisible — etapas sempre visíveis", () => {
  it.each(["basicInfo", "class", "species", "background", "abilities", "skills", "equipment", "review"] as const)(
    "%s aparece sempre, independente do personagem",
    (stepId) => {
      expect(isStepVisible(stepId, createBlankCharacter("step-test"))).toBe(true);
    },
  );

  it("'class' aparece mesmo antes do nível 3 (a seção de Subclasse dentro dela é que fica condicional a canChooseSubclass, nunca a etapa toda — fonte \"REORGANIZAR O BUILDER...\" §2)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 1;
    expect(isStepVisible("class", character)).toBe(true);
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

describe("isEarthCircleTerrainApplicable — Terreno do Círculo da Terra (seção dentro da etapa Classe, condicional, só Círculo da Terra a partir do nível 3 — fonte \"REORGANIZAR O BUILDER...\" §2)", () => {
  it("some sem subclasse", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 5;
    expect(isEarthCircleTerrainApplicable(character)).toBe(false);
  });

  it("some para outra subclasse de Druida", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 5;
    character.subclassId = "Círculo da Lua";
    expect(isEarthCircleTerrainApplicable(character)).toBe(false);
  });

  it("some antes do nível 3 mesmo com Círculo da Terra (subclasse ainda não escolhível)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 2;
    character.subclassId = "Círculo da Terra";
    expect(isEarthCircleTerrainApplicable(character)).toBe(false);
  });

  it("aparece para Círculo da Terra a partir do nível 3", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    character.subclassId = "Círculo da Terra";
    expect(isEarthCircleTerrainApplicable(character)).toBe(true);
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

describe("isElementalAffinityApplicable — Afinidade Elemental (seção dentro da etapa Classe, condicional, só Feitiçaria Dracônica a partir do nível 6)", () => {
  it("some sem subclasse", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 10;
    expect(isElementalAffinityApplicable(character)).toBe(false);
  });

  it("some para outra subclasse de Feiticeiro", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 10;
    character.subclassId = "Feitiçaria Selvagem";
    expect(isElementalAffinityApplicable(character)).toBe(false);
  });

  it("some antes do nível 6 mesmo com Feitiçaria Dracônica", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 5;
    character.subclassId = "Feitiçaria Dracônica";
    expect(isElementalAffinityApplicable(character)).toBe(false);
  });

  it("aparece para Feitiçaria Dracônica a partir do nível 6", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    expect(isElementalAffinityApplicable(character)).toBe(true);
  });
});

describe("getVisibleSteps", () => {
  it("personagem em branco: 8 das 13 etapas (sem Formas Conhecidas/Metamagia/Talentos/Invocações/Conjuração — Subclasse/Terreno/Afinidade não são mais etapas, são seções dentro de Classe)", () => {
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

  it("Mago nível 3: soma Conjuração (a escolha de Perícias de Classe e a seção de Subclasse do Mago moram dentro da etapa Classe, não em etapas próprias), mas nunca Invocações Místicas/Formas Conhecidas/Metamagia/Características e Talentos — 9 das 13 etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "mago";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).not.toContain("invocations");
    expect(steps).not.toContain("wildShapeForms");
    expect(steps).not.toContain("metamagic");
    expect(steps).toHaveLength(9);
  });

  it("Bruxo nível 3: soma Invocações Místicas e Conjuração — 10 das 13 etapas (nunca Formas Conhecidas/Metamagia/Características e Talentos)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "bruxo";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("invocations");
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).toHaveLength(10);
  });

  it("Druida nível 3 sem subclasse: soma Formas Conhecidas e Conjuração, mas nunca Características e Talentos — 10 das 13 etapas (Terreno do Círculo da Terra não é uma etapa, é uma seção dentro de Classe — ver isEarthCircleTerrainApplicable)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("wildShapeForms");
    expect(steps).toContain("spellcasting");
    expect(steps).not.toContain("featuresAndTalents");
    expect(steps).toHaveLength(10);
    expect(isEarthCircleTerrainApplicable(character)).toBe(false);
  });

  it("Druida/Círculo da Terra nível 3: getVisibleSteps não muda (Terreno é seção de Classe, não etapa própria), mas isEarthCircleTerrainApplicable passa a ser true", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 3;
    character.subclassId = "Círculo da Terra";
    const steps = getVisibleSteps(character);
    expect(steps).toContain("wildShapeForms");
    expect(steps).toHaveLength(10);
    expect(isEarthCircleTerrainApplicable(character)).toBe(true);
  });

  it("respeita sempre a ordem canônica das etapas", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "bruxo";
    character.level = 3;
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("Druida/Círculo da Terra nível 14: respeita a ordem canônica também no nível máximo", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "druida";
    character.level = 14;
    character.subclassId = "Círculo da Terra";
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("Feiticeiro nível 2 sem subclasse: soma Metamagia, mas Afinidade Elemental ainda não se aplica", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 2;
    const steps = getVisibleSteps(character);
    expect(steps).toContain("metamagic");
    expect(isElementalAffinityApplicable(character)).toBe(false);
  });

  it("Feiticeiro/Feitiçaria Dracônica nível 6: soma Metamagia e passa a aplicar Afinidade Elemental (seção de Classe)", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    const steps = getVisibleSteps(character);
    expect(steps).toContain("metamagic");
    expect(isElementalAffinityApplicable(character)).toBe(true);
  });

  it("Feiticeiro/Feitiçaria Dracônica nível 6: respeita a ordem canônica também com Metamagia", () => {
    const character = createBlankCharacter("step-test");
    character.classId = "feiticeiro";
    character.level = 6;
    character.subclassId = "Feitiçaria Dracônica";
    const steps = getVisibleSteps(character);
    const indices = steps.map((s) => BUILDER_STEP_ORDER.indexOf(s));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});
