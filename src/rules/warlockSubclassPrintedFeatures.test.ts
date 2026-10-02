import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getWarlockSubclassPrintedBlocks } from "./warlockSubclassPrintedFeatures.js";
import { getWarlockPrintedBlocks } from "./warlockPrintedFeatures.js";

const SUBCLASSES = {
  arquifada: "Patrono Arquifada",
  celestial: "Patrono Celestial",
  grandeAntigo: "Patrono Grande Antigo",
  infero: "Patrono Ínfero",
} as const;

function warlockAt(level: number, subclassFullName: string | null, charisma = 14): Character {
  const character = createBlankCharacter("warlock-subclass-print-test");
  character.classId = "bruxo";
  character.level = level;
  character.abilities.CAR.score = charisma;
  character.subclassId = subclassFullName;
  return character;
}

describe("getWarlockSubclassPrintedBlocks — sem subclasse escolhida", () => {
  it("devolve [] quando subclassId é null", () => {
    expect(getWarlockSubclassPrintedBlocks(warlockAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/10/14)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3", (subclass) => {
    expect(getWarlockSubclassPrintedBlocks(warlockAt(2, subclass))).toEqual([]);
  });
});

describe("Patrono Arquifada — Passos Feéricos evoluindo com Fuga em Névoa (nível 6), nunca um bloco separado", () => {
  it("nível 3-5: só Provocante/Revigorante", () => {
    const text = getWarlockSubclassPrintedBlocks(warlockAt(5, SUBCLASSES.arquifada)).find((b) => b.text.includes("Passos Feéricos"))!.text;
    expect(text).toContain("Provocante");
    expect(text).toContain("Revigorante");
    expect(text).not.toContain("Desvanecedor");
    expect(text).not.toContain("Reação ao sofrer dano");
  });

  it("nível 6+: soma Desvanecedor/Terrível e a opção de Reação, no MESMO bloco", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(6, SUBCLASSES.arquifada));
    const passosFeericos = blocks.filter((b) => b.text.includes("Passos Feéricos"));
    expect(passosFeericos).toHaveLength(1);
    expect(passosFeericos[0].text).toContain("Desvanecedor");
    expect(passosFeericos[0].text).toContain("Terrível");
    expect(passosFeericos[0].text).toContain("Reação ao sofrer dano");
    expect(blocks.some((b) => b.text.startsWith("#Fuga em Névoa"))).toBe(false);
  });

  it("checkboxes = modificador de CAR, mínimo 1", () => {
    const highCar = getWarlockSubclassPrintedBlocks(warlockAt(3, SUBCLASSES.arquifada, 18)).find((b) => b.text.includes("Passos Feéricos"))!.text; // CAR 18 → +4
    expect(highCar).toContain("#Passos Feéricos [__][__][__][__]");

    const lowCar = getWarlockSubclassPrintedBlocks(warlockAt(3, SUBCLASSES.arquifada, 8)).find((b) => b.text.includes("Passos Feéricos"))!.text; // CAR 8 → -1
    expect(lowCar).toContain("#Passos Feéricos [__]");
  });

  it("nível 10: Defesas Sedutoras; nível 14: Magia Sedutora", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(14, SUBCLASSES.arquifada));
    expect(blocks.some((b) => b.text.startsWith("#Defesas Sedutoras [__]"))).toBe(true);
    expect(blocks.some((b) => b.text.startsWith("#Magia Sedutora"))).toBe(true);
  });
});

describe("Patrono Celestial — Luz Medicinal = nível+1 d6", () => {
  it.each([
    [3, 4],
    [6, 7],
    [14, 15],
  ])("nível %i → %i d6", (level, dice) => {
    const text = getWarlockSubclassPrintedBlocks(warlockAt(level, SUBCLASSES.celestial)).find((b) => b.text.includes("Luz Medicinal"))!.text;
    expect(text).toContain(`d6: ${"[__]".repeat(dice)}`);
  });

  it("Alma Radiante (6) e Vingança Calcinante (14) aparecem corretamente", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(14, SUBCLASSES.celestial));
    expect(blocks.some((b) => b.text.startsWith("#Alma Radiante"))).toBe(true);
    expect(blocks.some((b) => b.text.startsWith("#Vingança Calcinante [__]"))).toBe(true);
  });

  it("Resiliência Celestial (10): PV Temp resolvidos (nível+CAR e metade do nível+CAR)", () => {
    const character = warlockAt(10, SUBCLASSES.celestial, 16); // CAR +3
    const text = getWarlockSubclassPrintedBlocks(character).find((b) => b.text.includes("Resiliência Celestial"))!.text;
    expect(text).toContain("você ganha 13 PV Temp"); // 10 + 3
    expect(text).toContain("ganham 8 PV Temp"); // floor(10/2) + 3
    expect(text).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });
});

describe("Patrono Grande Antigo", () => {
  it("nível 3: Magias Psíquicas e Mente Desperta (2 blocos distintos), com alcance/duração resolvidos", () => {
    const character = warlockAt(5, SUBCLASSES.grandeAntigo, 16); // CAR +3
    const blocks = getWarlockSubclassPrintedBlocks(character).filter((b) => b.level === 3);
    expect(blocks).toHaveLength(2);
    const mente = blocks.find((b) => b.text.includes("Mente Desperta"))!.text;
    expect(mente).toContain("telepatia 4,5km por 5 min"); // 1.5*3 = 4.5; nível 5
    expect(mente).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });

  it("nível 6: Combatente Clarividente com checkbox", () => {
    const text = getWarlockSubclassPrintedBlocks(warlockAt(6, SUBCLASSES.grandeAntigo)).find((b) => b.text.includes("Combatente Clarividente"))!.text;
    expect(text).toContain("#Combatente Clarividente [__]");
  });

  it("nível 10: Escudo Mental aparece; Danação Mística NUNCA aparece neste campo", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(10, SUBCLASSES.grandeAntigo));
    expect(blocks.some((b) => b.text.startsWith("#Escudo Mental"))).toBe(true);
    expect(blocks.some((b) => b.text.includes("Danação Mística"))).toBe(false);
  });

  it("nível 14: Criar Servo NUNCA aparece neste campo (vai para a entrada de Invocar Aberração na área de Magias)", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(14, SUBCLASSES.grandeAntigo));
    expect(blocks.some((b) => b.text.includes("Criar Servo"))).toBe(false);
  });
});

describe("Patrono Ínfero", () => {
  it("Bênção do Tenebroso (3): PV Temp = CAR+nível, mínimo 1", () => {
    const character = warlockAt(3, SUBCLASSES.infero, 16); // CAR +3
    const text = getWarlockSubclassPrintedBlocks(character).find((b) => b.text.includes("Bênção do Tenebroso"))!.text;
    expect(text).toBe("#Bênção do Tenebroso\nInimigo cai a 0 PV por você ou a 3m -> 6 PV Temp"); // 3+3
  });

  it("A Sorte do Próprio Tenebroso (6): checkboxes = CAR, mínimo 1", () => {
    const highCar = getWarlockSubclassPrintedBlocks(warlockAt(6, SUBCLASSES.infero, 18)).find((b) => b.text.includes("Sorte do Próprio Tenebroso"))!.text; // +4
    expect(highCar).toContain("#Sorte do Próprio Tenebroso [__][__][__][__]");

    const lowCar = getWarlockSubclassPrintedBlocks(warlockAt(6, SUBCLASSES.infero, 8)).find((b) => b.text.includes("Sorte do Próprio Tenebroso"))!.text; // -1
    expect(lowCar).toContain("#Sorte do Próprio Tenebroso [__]");
  });

  it("Resistência Ínfera (10) e Lançar no Inferno (14, com checkbox)", () => {
    const blocks = getWarlockSubclassPrintedBlocks(warlockAt(14, SUBCLASSES.infero));
    expect(blocks.some((b) => b.text.startsWith("#Resistência Ínfera"))).toBe(true);
    expect(blocks.some((b) => b.text.startsWith("#Lançar no Inferno [__]"))).toBe(true);
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 14 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 14", (_key, subclass) => {
    expect(getWarlockPrintedBlocks(warlockAt(14, subclass))).toMatchSnapshot();
  });
});
