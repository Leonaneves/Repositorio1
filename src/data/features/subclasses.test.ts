import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../../domain/character.js";
import type { Character } from "../../domain/character.js";
import { subclassFeatures } from "./subclasses.js";
import { CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID } from "./bard.js";
import { getIncompleteRequiredChoices, getSubclassFeatures, isFeatureComplete } from "../../rules/features.js";
import { getSkillProficiency } from "../../rules/skills.js";

const SUBCLASSES = [
  "Caminho da Árvore do Mundo",
  "Caminho do Berserker",
  "Caminho do Coração Selvagem",
  "Caminho do Fanático",
] as const;

const BARD_SUBCLASSES = ["Colégio da Bravura", "Colégio da Dança", "Colégio do Conhecimento", "Colégio do Glamour"] as const;

function barbarianWithSubclass(level: number, subclassFullName: string): Character {
  const character = createBlankCharacter("subclass-features-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

function bardWithSubclass(level: number, subclassFullName: string): Character {
  const character = createBlankCharacter("subclass-features-test-bard");
  character.classId = "bardo";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("as 4 subclasses de Bárbaro usam os nomes oficiais PT-BR 2024 ('Caminho do/da X')", () => {
  it("nenhuma feature usa o nome antigo 'Trilha'", () => {
    expect(subclassFeatures.some((f) => f.subclassFullName?.includes("Trilha"))).toBe(false);
  });

  it.each(SUBCLASSES)("%s tem ao menos 1 feature registrada", (subclass) => {
    expect(subclassFeatures.some((f) => f.subclassFullName === subclass)).toBe(true);
  });
});

describe("cada subclasse concede features exatamente nos níveis 3/6/10/14", () => {
  it.each(SUBCLASSES)("%s: cada feature tem level em {3,6,10,14}", (subclass) => {
    const levels = subclassFeatures.filter((f) => f.subclassFullName === subclass).map((f) => f.level);
    for (const level of levels) {
      expect([3, 6, 10, 14]).toContain(level);
    }
  });

  it.each(SUBCLASSES)("%s nível 14: getSubclassFeatures já inclui as dos níveis 3/6/10/14", (subclass) => {
    const character = barbarianWithSubclass(14, subclass);
    const levels = new Set(getSubclassFeatures(character).map((f) => f.level));
    expect(levels.has(3)).toBe(true);
    expect(levels.has(6)).toBe(true);
    expect(levels.has(10)).toBe(true);
    expect(levels.has(14)).toBe(true);
  });

  it.each(SUBCLASSES)("%s nível 5: só a feature de nível 3 já foi adquirida", (subclass) => {
    const character = barbarianWithSubclass(5, subclass);
    const levels = getSubclassFeatures(character).map((f) => f.level);
    expect(levels.every((level) => level === 3)).toBe(true);
    expect(levels.length).toBeGreaterThan(0);
  });
});

describe("Aspecto dos Selvagens (Coração Selvagem, nível 6) — a ÚNICA escolha de subclasse realmente permanente do Builder", () => {
  const CHOICE_ID = "barbaro-aspecto-dos-selvagens-escolha";

  it("bloqueia o avanço do Builder até ser escolhida", () => {
    const character = barbarianWithSubclass(6, "Caminho do Coração Selvagem");
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Aspecto dos Selvagens")).toBe(true);
  });

  it("aceita somente Coruja/Pantera/Salmão", () => {
    const character = barbarianWithSubclass(6, "Caminho do Coração Selvagem");
    const feature = getSubclassFeatures(character).find((f) => f.name === "Aspecto dos Selvagens")!;

    character.featureChoiceSelections[CHOICE_ID] = { value: "Pantera" };
    expect(isFeatureComplete(feature, character)).toBe(true);

    character.featureChoiceSelections[CHOICE_ID] = { value: "Golfinho" };
    expect(isFeatureComplete(feature, character)).toBe(false);
  });

  it("não aparece antes do nível 6", () => {
    const character = barbarianWithSubclass(5, "Caminho do Coração Selvagem");
    expect(getSubclassFeatures(character).some((f) => f.name === "Aspecto dos Selvagens")).toBe(false);
  });

  it("é a única feature de subclasse do Bárbaro com `choices` (as demais são só texto informativo — escolhas em jogo)", () => {
    const comChoices = subclassFeatures.filter((f) => f.subclassFullName === "Caminho do Coração Selvagem" && f.choices && f.choices.length > 0);
    expect(comChoices).toHaveLength(1);
    expect(comChoices[0].name).toBe("Aspecto dos Selvagens");
  });
});

describe("Arauto da Fauna/Arauto da Natureza ficam registrados como FeatureDefinition (texto), mas o conteúdo mágico vai para rules/barbarianRitualSpells.ts", () => {
  it("existem como features autoGranted, sem choices", () => {
    const fauna = subclassFeatures.find((f) => f.name === "Arauto da Fauna")!;
    const natureza = subclassFeatures.find((f) => f.name === "Arauto da Natureza")!;
    expect(fauna.autoGranted).toBe(true);
    expect(natureza.autoGranted).toBe(true);
    expect(fauna.choices).toBeUndefined();
    expect(natureza.choices).toBeUndefined();
  });
});

describe("as 4 subclasses de Bardo desta fonte têm conteúdo registrado", () => {
  it.each(BARD_SUBCLASSES)("%s tem ao menos 1 feature registrada", (subclass) => {
    expect(subclassFeatures.some((f) => f.subclassFullName === subclass)).toBe(true);
  });

  it("'Colégio dos Espíritos' (fora desta fonte) continua sem conteúdo", () => {
    expect(subclassFeatures.some((f) => f.subclassFullName === "Colégio dos Espíritos")).toBe(false);
  });
});

describe("cada subclasse de Bardo concede features exatamente nos níveis 3/6/14", () => {
  it.each(BARD_SUBCLASSES)("%s: cada feature tem level em {3,6,14}", (subclass) => {
    const levels = subclassFeatures.filter((f) => f.subclassFullName === subclass).map((f) => f.level);
    for (const level of levels) {
      expect([3, 6, 14]).toContain(level);
    }
  });

  it.each(BARD_SUBCLASSES)("%s nível 14: getSubclassFeatures já inclui as dos níveis 3/6/14", (subclass) => {
    const character = bardWithSubclass(14, subclass);
    const levels = new Set(getSubclassFeatures(character).map((f) => f.level));
    expect(levels.has(3)).toBe(true);
    expect(levels.has(6)).toBe(true);
    expect(levels.has(14)).toBe(true);
  });
});

describe("Proficiências Bônus (Colégio do Conhecimento, nível 3) — escolha obrigatória de 3 perícias, sem restrição de lista", () => {
  it("bloqueia o avanço do Builder até ser escolhida", () => {
    const character = bardWithSubclass(3, "Colégio do Conhecimento");
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Proficiências Bônus")).toBe(true);
  });

  it("completa com exatamente 3 perícias, aceitando qualquer uma da lista completa (não só as de Bardo)", () => {
    const character = bardWithSubclass(3, "Colégio do Conhecimento");
    character.featureChoiceSelections[CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID] = { value: ["medicina", "religiao", "lidarComAnimais"] };

    const feature = getSubclassFeatures(character).find((f) => f.name === "Proficiências Bônus")!;
    expect(isFeatureComplete(feature, character)).toBe(true);
    expect(getSkillProficiency(character, "medicina")).toBe(true);
    expect(getSkillProficiency(character, "religiao")).toBe(true);
    expect(getSkillProficiency(character, "lidarComAnimais")).toBe(true);
  });

  it("não aparece antes do nível 3", () => {
    const character = bardWithSubclass(2, "Colégio do Conhecimento");
    expect(getSubclassFeatures(character).some((f) => f.name === "Proficiências Bônus")).toBe(false);
  });
});

describe("Arauto da Fauna/Natureza equivalente do Bardo: Magia Fascinante/Manto de Majestade (Glamour) e Descobertas Mágicas (Conhecimento) ficam de fora do campo impresso", () => {
  it("Magia Fascinante e Manto de Majestade existem como FeatureDefinition e têm choices indefinido (sem catálogo de magias)", () => {
    const fascinante = subclassFeatures.find((f) => f.name === "Magia Fascinante")!;
    const majestade = subclassFeatures.find((f) => f.name === "Manto de Majestade")!;
    expect(fascinante.autoGranted).toBe(true);
    expect(majestade.autoGranted).toBe(true);
  });

  it("Descobertas Mágicas existe como FeatureDefinition informativa, sem choices (sem catálogo de magias)", () => {
    const descobertas = subclassFeatures.find((f) => f.name === "Descobertas Mágicas")!;
    expect(descobertas.autoGranted).toBe(true);
    expect(descobertas.choices).toBeUndefined();
  });
});
