import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBarbarianPrintedBlocks } from "./barbarianPrintedFeatures.js";

function barbarianAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("barb-print-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBarbarianPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Bárbaro", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getBarbarianPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Fúria — checkboxes de uso e texto por nível", () => {
  it("nível 1: 2 usos, +2 dano, texto de duração pré-15", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(1)).find((b) => b.startsWith("#Fúria"))!;
    expect(text).toContain("#Fúria [__][__]");
    expect(text).not.toContain("[__][__][__]");
    expect(text).toContain("+2 dano em Atq FOR");
    expect(text).toContain("Dura até fim do próx. turno");
    expect(text).not.toContain("Fúria Persistente");
    expect(text).not.toContain("Dura 10 min");
  });

  it("nível 9: dano sobe para +3, ainda 4 usos (pré-15)", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(9)).find((b) => b.startsWith("#Fúria"))!;
    expect(text).toContain("#Fúria [__][__][__][__]");
    expect(text).toContain("+3 dano em Atq FOR");
  });

  it("nível 15: evolui para Fúria Persistente — mesmo bloco, nunca duplicado", () => {
    const blocks = getBarbarianPrintedBlocks(barbarianAt(15));
    const furiaBlocks = blocks.filter((b) => b.startsWith("#Fúria ["));
    expect(furiaBlocks).toHaveLength(1);

    const text = furiaBlocks[0];
    expect(text).toContain("#Fúria [__][__][__][__][__]");
    expect(text).toContain("+3 dano em Atq FOR"); // Dano da Fúria só sobe para +4 no nível 16
    expect(text).toContain("Dura 10 min");
    expect(text).toContain("recupere todos os usos");
    expect(text).not.toContain("Dura até fim do próx. turno");
  });

  it("nível 20: 6 usos, +4 dano, continua com o texto de Fúria Persistente", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(20)).find((b) => b.startsWith("#Fúria"))!;
    expect(text).toContain("#Fúria [__][__][__][__][__][__]");
    expect(text).toContain("+4 dano em Atq FOR");
    expect(text).toContain("Dura 10 min");
  });
});

describe("Golpe Brutal — mesma característica evoluindo em 9/13/17, nunca duplicada", () => {
  it("abaixo do nível 9: não aparece", () => {
    const blocks = getBarbarianPrintedBlocks(barbarianAt(8));
    expect(blocks.some((b) => b.includes("Golpe Brutal"))).toBe(false);
  });

  it("nível 9: +1d10, só Debilitador/Poderoso", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(9)).find((b) => b.startsWith("#Golpe Brutal"))!;
    expect(text).toContain("+1d10 dano + escolha 1");
    expect(text).toContain("Debilitador");
    expect(text).toContain("Poderoso");
    expect(text).not.toContain("Atordoante");
    expect(text).not.toContain("Destruidor");
  });

  it("nível 13: ainda +1d10, mas agora com Atordoante/Destruidor também", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(13)).find((b) => b.startsWith("#Golpe Brutal"))!;
    expect(text).toContain("+1d10 dano + escolha 1");
    expect(text).toContain("Atordoante");
    expect(text).toContain("Destruidor");
  });

  it("nível 17: +2d10 e escolha de 2 efeitos diferentes", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(17)).find((b) => b.startsWith("#Golpe Brutal"))!;
    expect(text).toContain("+2d10 dano + escolha 2 efeitos diferentes");
    expect(text).toContain("Atordoante");
    expect(text).toContain("Destruidor");
  });

  it("nunca existe um bloco separado 'Golpe Brutal Fortalecido'", () => {
    for (const level of [9, 13, 17, 20]) {
      const blocks = getBarbarianPrintedBlocks(barbarianAt(level));
      expect(blocks.filter((b) => b.includes("Golpe Brutal"))).toHaveLength(1);
      expect(blocks.some((b) => b.includes("Fortalecido"))).toBe(false);
    }
  });
});

describe("Checkboxes vs. texto apenas — recursos limitados por Descanso/Fúria", () => {
  it("Fúria tem checkboxes (uso por Descanso Longo)", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(1)).find((b) => b.startsWith("#Fúria"))!;
    expect(text).toMatch(/#Fúria (\[__\])+/);
  });

  it("Golpe Brutal (1x/Fúria) nunca ganha checkbox diário", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(9)).find((b) => b.startsWith("#Golpe Brutal"))!;
    expect(text).not.toMatch(/\[__\]/);
  });

  it("Fúria Implacável (Reação/Salv., sem limite diário fixo) não ganha checkbox", () => {
    const text = getBarbarianPrintedBlocks(barbarianAt(11)).find((b) => b.startsWith("#Fúria Implacável"))!;
    expect(text).not.toMatch(/\[__\]/);
  });
});

describe("Características que nunca aparecem neste campo", () => {
  const blocks20 = getBarbarianPrintedBlocks(barbarianAt(20));
  const joined = blocks20.join("\n");

  it("Maestria em Arma nunca é impressa aqui", () => {
    expect(joined).not.toContain("Maestria em Arma");
  });

  it("Subclasse de Bárbaro (estrutural) nunca é impressa aqui", () => {
    expect(joined).not.toContain("Subclasse de Bárbaro");
  });

  it("Movimento Rápido nunca é impresso aqui (aplicado direto no Deslocamento)", () => {
    expect(joined).not.toContain("Movimento Rápido");
  });

  it("Dádiva Épica nunca é impressa aqui (sistema de Talentos)", () => {
    expect(joined).not.toContain("Dádiva Épica");
  });

  it("Campeão Primitivo nunca é impresso aqui (aplicado direto em FOR/CON)", () => {
    expect(joined).not.toContain("Campeão Primitivo");
  });
});

describe("snapshots do texto impresso por nível (Bárbaro puro, sem subclasse)", () => {
  it.each([1, 5, 10, 15, 20])("nível %i", (level) => {
    expect(getBarbarianPrintedBlocks(barbarianAt(level))).toMatchSnapshot();
  });
});
