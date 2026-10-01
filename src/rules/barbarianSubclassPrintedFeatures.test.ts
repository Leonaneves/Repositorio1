import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBarbarianSubclassPrintedBlocks } from "./barbarianSubclassPrintedFeatures.js";
import { getBarbarianPrintedBlocks } from "./barbarianPrintedFeatures.js";

const SUBCLASSES = {
  arvore: "Caminho da Árvore do Mundo",
  berserker: "Caminho do Berserker",
  coracao: "Caminho do Coração Selvagem",
  fanatico: "Caminho do Fanático",
} as const;

function barbarianAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("barb-subclass-print-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBarbarianSubclassPrintedBlocks — sem subclasse escolhida", () => {
  it("devolve [] quando subclassId é null", () => {
    expect(getBarbarianSubclassPrintedBlocks(barbarianAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/10/14)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3", (subclass) => {
    expect(getBarbarianSubclassPrintedBlocks(barbarianAt(2, subclass))).toEqual([]);
  });

  it.each(Object.values(SUBCLASSES))("%s nível 14: já tem blocos de todos os níveis com texto impresso (3/6/14 sempre; 10 só fora do Coração Selvagem)", (subclass) => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(14, subclass));
    const levelsPresent = new Set(blocks.map((b) => b.level));
    expect(levelsPresent.has(3)).toBe(true);
    expect(levelsPresent.has(6)).toBe(true);
    expect(levelsPresent.has(14)).toBe(true);
    if (subclass !== SUBCLASSES.coracao) expect(levelsPresent.has(10)).toBe(true);
  });

  it("Caminho do Coração Selvagem nível 10: 'Arauto da Natureza' NÃO gera bloco impresso (vai para Magias, não para Características de Classe)", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(10, SUBCLASSES.coracao));
    expect(blocks.some((b) => b.level === 10)).toBe(false);
    expect(blocks.some((b) => b.text.includes("Arauto da Natureza"))).toBe(false);
  });
});

describe("Caminho da Árvore do Mundo", () => {
  it("nível 3: Vitalidade da Árvore com d6 de dano (2d6 pré-9)", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(3, SUBCLASSES.arvore));
    const text = blocks.find((b) => b.text.includes("Vitalidade da Árvore"))!.text;
    expect(text).toContain("2d6");
  });

  it("nível 16: Força Revigorante escala para 4d6 (mesma progressão do Dano da Fúria)", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(16, SUBCLASSES.arvore));
    const text = blocks.find((b) => b.text.includes("Vitalidade da Árvore"))!.text;
    expect(text).toContain("4d6");
  });
});

describe("Caminho do Berserker", () => {
  it("Frenesi escala com o Dano da Fúria (2d6 em nível baixo, 3d6 a partir do 9)", () => {
    const low = getBarbarianSubclassPrintedBlocks(barbarianAt(3, SUBCLASSES.berserker)).find((b) => b.text.includes("Frenesi"))!.text;
    expect(low).toContain("2d6");

    const high = getBarbarianSubclassPrintedBlocks(barbarianAt(9, SUBCLASSES.berserker)).find((b) => b.text.includes("Frenesi"))!.text;
    expect(high).toContain("3d6");
  });

  it("Presença Intimidante (nível 14) tem checkbox de uso diário", () => {
    const text = getBarbarianSubclassPrintedBlocks(barbarianAt(14, SUBCLASSES.berserker)).find((b) => b.text.includes("Presença Intimidante"))!.text;
    expect(text).toMatch(/\[__\]/);
  });
});

describe("Caminho do Coração Selvagem", () => {
  it("Arauto da Fauna/Arauto da Natureza NUNCA aparecem no texto impresso (vão para Magias)", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(14, SUBCLASSES.coracao));
    const joined = blocks.map((b) => b.text).join("\n");
    expect(joined).not.toContain("Arauto da Fauna");
    expect(joined).not.toContain("Arauto da Natureza");
  });

  it("Fúria dos Selvagens e Poder dos Selvagens aparecem só como texto informativo (escolha em jogo, não do Builder)", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(14, SUBCLASSES.coracao));
    expect(blocks.some((b) => b.text.includes("Fúria dos Selvagens"))).toBe(true);
    expect(blocks.some((b) => b.text.includes("Poder dos Selvagens"))).toBe(true);
  });
});

describe("Caminho do Fanático — Campeão dos Deuses (reserva de d12)", () => {
  it.each([
    [3, 4],
    [5, 4],
    [6, 5],
    [11, 5],
    [12, 6],
    [16, 6],
    [17, 7],
    [20, 7],
  ])("nível %i → %i d12 (checkboxes)", (level, diceCount) => {
    const text = getBarbarianSubclassPrintedBlocks(barbarianAt(level, SUBCLASSES.fanatico)).find((b) => b.text.includes("Campeão dos Deuses"))!.text;
    expect(text).toContain(`Reserva d12: ${"[__]".repeat(diceCount)}`);
  });

  it("Fúria Divina: bônus = metade do nível de Bárbaro (arredondado para baixo)", () => {
    const text3 = getBarbarianSubclassPrintedBlocks(barbarianAt(3, SUBCLASSES.fanatico)).find((b) => b.text.includes("Fúria Divina"))!.text;
    expect(text3).toContain("+1d6+1");

    const text20 = getBarbarianSubclassPrintedBlocks(barbarianAt(20, SUBCLASSES.fanatico)).find((b) => b.text.includes("Fúria Divina"))!.text;
    expect(text20).toContain("+1d6+10");
  });

  it("Presença Zelosa (nível 10) e Fúria dos Deuses (nível 14) têm checkbox de uso diário", () => {
    const blocks = getBarbarianSubclassPrintedBlocks(barbarianAt(14, SUBCLASSES.fanatico));
    expect(blocks.find((b) => b.text.includes("Presença Zelosa"))!.text).toMatch(/\[__\]/);
    expect(blocks.find((b) => b.text.includes("Fúria dos Deuses"))!.text).toMatch(/\[__\]/);
  });

  it("Concentração Fanática (1x/Fúria) nunca ganha checkbox diário", () => {
    const text = getBarbarianSubclassPrintedBlocks(barbarianAt(6, SUBCLASSES.fanatico)).find((b) => b.text.includes("Concentração Fanática"))!.text;
    expect(text).not.toMatch(/\[__\]/);
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 14 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 14", (_key, subclass) => {
    expect(getBarbarianPrintedBlocks(barbarianAt(14, subclass))).toMatchSnapshot();
  });

  it("Fanático nível 20", () => {
    expect(getBarbarianPrintedBlocks(barbarianAt(20, SUBCLASSES.fanatico))).toMatchSnapshot();
  });
});
