import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../../domain/character.js";
import type { Character } from "../../domain/character.js";
import { warlockClassFeatures } from "./warlock.js";
import { getCharacterFeatures, getIncompleteRequiredChoices } from "../../rules/features.js";

function warlockAt(level: number): Character {
  const character = createBlankCharacter("warlock-features-test");
  character.classId = "bruxo";
  character.level = level;
  return character;
}

describe("warlockClassFeatures — estrutura", () => {
  it("todos os ids são únicos", () => {
    const ids = warlockClassFeatures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("'Arcana Mística' aparece 4 vezes, nos níveis 11/13/15/17, cada uma com id próprio", () => {
    const arcana = warlockClassFeatures.filter((f) => f.name === "Arcana Mística");
    expect(arcana).toHaveLength(4);
    expect(arcana.map((f) => f.level).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([11, 13, 15, 17]);
    expect(new Set(arcana.map((f) => f.id)).size).toBe(4);
  });

  it("nenhuma feature do Bruxo base tem `choices` — Invocações Místicas usa a etapa própria do Builder, não FeatureChoice", () => {
    for (const feature of warlockClassFeatures) {
      expect(feature.choices).toBeUndefined();
    }
  });

  it("Mestre Místico (nível 20) existe como feature própria, mas nunca cria um 2º bloco impresso de Astúcia Mágica (ver rules/warlockPrintedFeatures.test.ts)", () => {
    const mestre = warlockClassFeatures.find((f) => f.name === "Mestre Místico")!;
    expect(mestre.level).toBe(20);
    expect(mestre.autoGranted).toBe(true);
  });
});

describe("Invocações Místicas e Magia de Pacto nunca bloqueiam o Builder via getIncompleteRequiredChoices (etapa própria resolve isso)", () => {
  it("Bruxo nível 1 sem nenhuma invocação escolhida: getIncompleteRequiredChoices não reclama (quem bloqueia é rules/invocations.ts)", () => {
    const character = warlockAt(1);
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Invocações Místicas")).toBe(false);
  });

  it("todas as features de classe do Bruxo já adquiridas no nível 20 aparecem em getCharacterFeatures", () => {
    const character = warlockAt(20);
    const names = getCharacterFeatures(character).map((f) => f.name);
    expect(names).toContain("Magia de Pacto");
    expect(names).toContain("Invocações Místicas");
    expect(names).toContain("Astúcia Mágica");
    expect(names).toContain("Contatar Patrono");
    expect(names.filter((n) => n === "Arcana Mística")).toHaveLength(4);
    expect(names).toContain("Mestre Místico");
  });
});
