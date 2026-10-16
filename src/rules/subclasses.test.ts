import { describe, expect, it } from "vitest";
import { canChooseSubclass, getAvailableSubclasses, getSubclassDisplayName } from "./subclasses.js";
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

  it("Monge tem as 5 subclasses, com os 4 shortNames corrigidos para 'Caminho de...' e fullNames preservados", () => {
    const subclasses = getAvailableSubclasses("monge");
    expect(subclasses).toEqual([
      { shortName: "Caminho da Misericórdia", fullName: "Guerreiro da Misericórdia" },
      { shortName: "Caminho das Sombras", fullName: "Guerreiro das Sombras" },
      { shortName: "Caminho dos Elementos", fullName: "Guerreiro dos Elementos" },
      { shortName: "Caminho da Mão Aberta", fullName: "Guerreiro da Mão Aberta" },
      { shortName: "das Artes Místicas", fullName: "Guerreiro das Artes Místicas" },
    ]);
  });
});

describe("getSubclassDisplayName — resolve o shortName a partir do fullName salvo (fonte \"IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §1)", () => {
  it("Ladino/'Lâmina Psíquica' (valor interno preservado) exibe 'Adaga Espiritual'", () => {
    expect(getSubclassDisplayName("ladino", "Lâmina Psíquica")).toBe("Adaga Espiritual");
  });

  it("demais subclasses de Ladino continuam resolvendo para o próprio shortName já existente", () => {
    expect(getSubclassDisplayName("ladino", "Assassino")).toBe("Assassino");
    expect(getSubclassDisplayName("ladino", "Ladrão")).toBe("Ladrão");
    expect(getSubclassDisplayName("ladino", "Trapaceiro Arcano")).toBe("Arcano");
  });

  it("classId ou fullName nulos, ou fullName sem correspondência no catálogo: devolve o próprio fullName (nunca quebra)", () => {
    expect(getSubclassDisplayName(null, "Lâmina Psíquica")).toBe("Lâmina Psíquica");
    expect(getSubclassDisplayName("ladino", null)).toBeNull();
    expect(getSubclassDisplayName("ladino", "Nome Inexistente")).toBe("Nome Inexistente");
  });

  it("não afeta outras classes (ex.: Guerreiro/Cavaleiro Místico, onde shortName === fullName)", () => {
    expect(getSubclassDisplayName("guerreiro", "Cavaleiro Místico")).toBe("Cavaleiro Místico");
  });

  it("Mago/'Adivinho' (valor interno preservado, fonte \"IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §0/§9) exibe 'Adivinhador'", () => {
    expect(getSubclassDisplayName("mago", "Adivinho")).toBe("Adivinhador");
  });

  it("demais subclasses de Mago continuam resolvendo para o próprio nome", () => {
    expect(getSubclassDisplayName("mago", "Abjurador")).toBe("Abjurador");
    expect(getSubclassDisplayName("mago", "Evocador")).toBe("Evocador");
    expect(getSubclassDisplayName("mago", "Ilusionista")).toBe("Ilusionista");
  });

  it("Monge/'Guerreiro da Mão Aberta'/'Guerreiro da Misericórdia'/'Guerreiro das Sombras'/'Guerreiro dos Elementos' (valores internos preservados, contaminação de copia-e-cola do Guerreiro — fonte \"IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF\" §1) exibem 'Caminho da Mão Aberta'/'Caminho da Misericórdia'/'Caminho das Sombras'/'Caminho dos Elementos'", () => {
    expect(getSubclassDisplayName("monge", "Guerreiro da Mão Aberta")).toBe("Caminho da Mão Aberta");
    expect(getSubclassDisplayName("monge", "Guerreiro da Misericórdia")).toBe("Caminho da Misericórdia");
    expect(getSubclassDisplayName("monge", "Guerreiro das Sombras")).toBe("Caminho das Sombras");
    expect(getSubclassDisplayName("monge", "Guerreiro dos Elementos")).toBe("Caminho dos Elementos");
  });

  it("5ª subclasse de Monge (fora do escopo desta fonte) continua intocada", () => {
    expect(getSubclassDisplayName("monge", "Guerreiro das Artes Místicas")).toBe("das Artes Místicas");
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
