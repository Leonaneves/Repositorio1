import { describe, expect, it } from "vitest";
import { getAvailableSubclasses } from "./subclasses.js";
import { CLASS_IDS } from "../domain/ids.js";

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
