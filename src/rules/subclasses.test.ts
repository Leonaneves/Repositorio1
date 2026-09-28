import { describe, expect, it } from "vitest";
import { canChooseSubclass, getAvailableSubclasses } from "./subclasses.js";
import { CLASS_IDS } from "../domain/ids.js";
import { SUBCLASS_FEATURE_LEVELS } from "../data/subclasses.js";

describe("getAvailableSubclasses", () => {
  it("toda classe do escopo tem ao menos 4 subclasses cadastradas", () => {
    for (const classId of CLASS_IDS) {
      expect(getAvailableSubclasses(classId).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("Mago tem as 8 escolas de magia", () => {
    const names = getAvailableSubclasses("mago").map((s) => s.fullName);
    expect(names).toEqual([
      "Abjurador",
      "Adivinho",
      "Evocador",
      "Ilusionista",
      "Conjurador",
      "Encantador",
      "Necromante",
      "Transmutador",
    ]);
  });

  it("Guerreiro inclui Cavaleiro Místico com o valor de exportação exato usado pela conjuração", () => {
    const subclasses = getAvailableSubclasses("guerreiro");
    expect(subclasses.some((s) => s.fullName === "Cavaleiro Místico")).toBe(true);
  });

  it("Ladino inclui Trapaceiro Arcano (nome curto 'Arcano', nome completo preservado)", () => {
    const subclasses = getAvailableSubclasses("ladino");
    const arcano = subclasses.find((s) => s.shortName === "Arcano");
    expect(arcano?.fullName).toBe("Trapaceiro Arcano");
  });

  it("Bruxo inclui as subclasses de Ravenloft: The Horrors Within (Morto-Vivo, Vestígio)", () => {
    const names = getAvailableSubclasses("bruxo").map((s) => s.fullName);
    expect(names).toContain("Patrono Morto-Vivo");
    expect(names).toContain("Patrono do Vestígio");
  });

  it("Artífice inclui a subclasse de Ravenloft (Reanimador)", () => {
    const names = getAvailableSubclasses("artifice").map((s) => s.fullName);
    expect(names).toContain("Reanimador");
  });
});

describe("canChooseSubclass — regra fixa de nível 3 para todas as classes", () => {
  it.each([1, 2])("nível %i: sem escolha de subclasse", (level) => {
    expect(canChooseSubclass(level)).toBe(false);
  });

  it.each([3, 4, 20])("nível %i: escolha de subclasse disponível", (level) => {
    expect(canChooseSubclass(level)).toBe(true);
  });
});

describe("SUBCLASS_FEATURE_LEVELS — níveis de Característica de Subclasse (base consolidada de classes + fonte do Artífice)", () => {
  it("as 13 classes têm nível 3 na lista (aquisição da subclasse)", () => {
    for (const classId of CLASS_IDS) {
      expect(SUBCLASS_FEATURE_LEVELS[classId]).toBeDefined();
      expect(SUBCLASS_FEATURE_LEVELS[classId]).toContain(3);
    }
  });

  it("Artífice: 3, 5, 9 e 15 (fonte própria do Artífice)", () => {
    expect(SUBCLASS_FEATURE_LEVELS.artifice).toEqual([3, 5, 9, 15]);
  });

  it("Clérigo: 3, 6 e 17 (só 2 características de subclasse além da aquisição)", () => {
    expect(SUBCLASS_FEATURE_LEVELS.clerigo).toEqual([3, 6, 17]);
  });

  it("Guerreiro: 3, 7, 10, 15 e 18 (a classe com mais características de subclasse)", () => {
    expect(SUBCLASS_FEATURE_LEVELS.guerreiro).toEqual([3, 7, 10, 15, 18]);
  });

  it("todo nível está em ordem crescente e dentro de 1–20", () => {
    for (const levels of Object.values(SUBCLASS_FEATURE_LEVELS)) {
      expect(levels).toEqual([...levels!].sort((a, b) => a - b));
      for (const level of levels!) {
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(20);
      }
    }
  });
});
