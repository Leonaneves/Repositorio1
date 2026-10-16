import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character, WizardSpellbookEntry } from "../domain/character.js";
import {
  getStaleVersadoSpellbookIndices,
  getWizardClassProgressionSpellbookCount,
  getWizardMaxEligibleCircle,
  getWizardPreparedCount,
  getWizardPreparedSpellEntries,
  getWizardSignatureSpellEntries,
  getWizardSpellMasteryEntries,
  getWizardVersadoSpellbookCount,
  isWizardPreparedCountAtMax,
} from "./wizardSpellbook.js";

function wizardAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("wizard-spellbook-test");
  character.classId = "mago";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

function entry(overrides: Partial<WizardSpellbookEntry> = {}): WizardSpellbookEntry {
  return {
    name: "Magia Teste",
    circle: 1,
    origin: "classProgression",
    grantedUnderSubclass: null,
    prepared: false,
    isSpellMastery: false,
    isSignatureSpell: false,
    ...overrides,
  };
}

describe("getWizardMaxEligibleCircle — maior círculo com espaço na progressão atual", () => {
  it("null para quem não é Mago", () => {
    expect(getWizardMaxEligibleCircle(createBlankCharacter("x"))).toBeNull();
  });

  it("nível 1: 1º círculo; nível 3: 2º círculo; nível 5: 3º círculo; nível 20: 9º círculo", () => {
    expect(getWizardMaxEligibleCircle(wizardAt(1))).toBe(1);
    expect(getWizardMaxEligibleCircle(wizardAt(3))).toBe(2);
    expect(getWizardMaxEligibleCircle(wizardAt(5))).toBe(3);
    expect(getWizardMaxEligibleCircle(wizardAt(20))).toBe(9);
  });
});

describe("getStaleVersadoSpellbookIndices — concedidas sob outra subclasse, nunca apagadas automaticamente", () => {
  it("marca só as entradas subclassVersado cuja subclasse concedente difere da atual", () => {
    const character = wizardAt(6, "Evocador");
    character.wizardSpellbook = [
      entry({ name: "Bola de Fogo", origin: "subclassVersado", grantedUnderSubclass: "Evocador" }),
      entry({ name: "Imagem Espelhada", origin: "subclassVersado", grantedUnderSubclass: "Ilusionista" }),
      entry({ name: "Sono", origin: "classProgression" }),
    ];
    expect(getStaleVersadoSpellbookIndices(character)).toEqual([1]);
  });

  it("[] quando não há entradas subclassVersado desatualizadas", () => {
    const character = wizardAt(6, "Evocador");
    character.wizardSpellbook = [entry({ origin: "subclassVersado", grantedUnderSubclass: "Evocador" })];
    expect(getStaleVersadoSpellbookIndices(character)).toEqual([]);
  });
});

describe("getWizardClassProgressionSpellbookCount / getWizardVersadoSpellbookCount — contagem por origem", () => {
  it("conta só a origem pedida, inclusive entradas desatualizadas de Versado", () => {
    const character = wizardAt(6, "Evocador");
    character.wizardSpellbook = [
      entry({ origin: "classProgression" }),
      entry({ origin: "classProgression" }),
      entry({ origin: "subclassVersado", grantedUnderSubclass: "Ilusionista" }),
      entry({ origin: "other" }),
    ];
    expect(getWizardClassProgressionSpellbookCount(character)).toBe(2);
    expect(getWizardVersadoSpellbookCount(character)).toBe(1);
  });
});

describe("getWizardPreparedCount / isWizardPreparedCountAtMax — nunca conta Maestria/Assinatura", () => {
  it("conta só prepared:true; Maestria/Assinatura ficam fora mesmo sem prepared", () => {
    const character = wizardAt(1);
    character.wizardSpellbook = [
      entry({ prepared: true }),
      entry({ prepared: true }),
      entry({ isSpellMastery: true, prepared: false }),
      entry({ isSignatureSpell: true, prepared: false }),
    ];
    expect(getWizardPreparedCount(character)).toBe(2);
  });

  it("isWizardPreparedCountAtMax reflete o máximo da progressão (nível 1 = 4)", () => {
    const character = wizardAt(1);
    character.wizardSpellbook = [entry({ prepared: true }), entry({ prepared: true }), entry({ prepared: true })];
    expect(isWizardPreparedCountAtMax(character)).toBe(false);
    character.wizardSpellbook.push(entry({ prepared: true }));
    expect(isWizardPreparedCountAtMax(character)).toBe(true);
  });
});

describe("getWizardSpellMasteryEntries / getWizardSignatureSpellEntries", () => {
  it("devolve só as entradas com a flag correspondente marcada", () => {
    const character = wizardAt(20);
    character.wizardSpellbook = [
      entry({ name: "Escudo Arcano", circle: 1, isSpellMastery: true }),
      entry({ name: "Invisibilidade", circle: 2, isSpellMastery: true }),
      entry({ name: "Bola de Fogo", circle: 3, isSignatureSpell: true }),
      entry({ name: "Relâmpago", circle: 3, isSignatureSpell: true }),
      entry({ name: "Sono", circle: 1 }),
    ];
    expect(getWizardSpellMasteryEntries(character).map((e) => e.name)).toEqual(["Escudo Arcano", "Invisibilidade"]);
    expect(getWizardSignatureSpellEntries(character).map((e) => e.name)).toEqual(["Bola de Fogo", "Relâmpago"]);
  });
});

describe("getWizardPreparedSpellEntries — formato comum para a área de Magias", () => {
  it("[] para quem não é Mago", () => {
    expect(getWizardPreparedSpellEntries(createBlankCharacter("x"))).toEqual([]);
  });

  it("inclui preparadas normais e as de Maestria/Assinatura, com notas distintas, sem duplicar nenhuma", () => {
    const character = wizardAt(20);
    character.wizardSpellbook = [
      entry({ name: "Sono", circle: 1, prepared: true }),
      entry({ name: "Escudo Arcano", circle: 1, isSpellMastery: true }),
      entry({ name: "Bola de Fogo", circle: 3, isSignatureSpell: true }),
      entry({ name: "Detectar Magia", circle: 1 }), // no livro, nunca preparada — não deve aparecer
    ];
    const result = getWizardPreparedSpellEntries(character);
    expect(result.map((e) => e.name)).toEqual(["Sono", "Escudo Arcano", "Bola de Fogo"]);
    expect(result.find((e) => e.name === "Escudo Arcano")?.notes).toContain("Maestria de Magias");
    expect(result.find((e) => e.name === "Bola de Fogo")?.notes).toContain("Assinatura Mágica");
    expect(result.find((e) => e.name === "Sono")?.notes).toBe("");
  });
});
