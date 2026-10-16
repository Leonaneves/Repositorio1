import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getRogueClassPrintedBlocks } from "./rogueClassPrintedFeatures.js";
import { getRoguePrintedBlocks } from "./roguePrintedFeatures.js";

function rogueAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("rogue-class-printed-test");
  character.classId = "ladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.DEX.score = 16; // +3
  return character;
}

describe("getRogueClassPrintedBlocks — classe diferente ou nível 1", () => {
  it("classe diferente de Ladino — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getRogueClassPrintedBlocks(character)).toEqual([]);
  });

  it("nível 1: só Ataque Furtivo (1d6) e Ação Ardilosa — SEM Golpe Astuto/Esquiva Sobrenatural (nível 5+), Evasão/Talento Confiável (7+)", () => {
    const joined = getRogueClassPrintedBlocks(rogueAt(1)).join("\n\n");
    expect(joined).toContain("# ATAQUE FURTIVO");
    expect(joined).toContain("> 1/turno: +1d6");
    expect(joined).toContain("# AÇÃO ARDILOSA");
    expect(joined).toContain("# MIRA FIRME");
    expect(joined).not.toContain("# GOLPE ASTUTO");
    expect(joined).not.toContain("# ESQUIVA SOBRENATURAL");
    expect(joined).not.toContain("# EVASÃO");
    expect(joined).not.toContain("# TALENTO CONFIÁVEL");
    expect(joined).not.toContain("# ELUSIVO");
    expect(joined).not.toContain("# GOLPE DE SORTE");
  });
});

describe("Ataque Furtivo — progressão de dano por nível (rules/classResources.ts#ROGUE_SNEAK_ATTACK_DICE)", () => {
  it.each([
    [1, "1d6"],
    [3, "2d6"],
    [10, "5d6"],
    [11, "6d6"],
    [20, "10d6"],
  ])("nível %i: +%s", (level, dice) => {
    const joined = getRogueClassPrintedBlocks(rogueAt(level)).join("\n\n");
    expect(joined).toContain(`> 1/turno: +${dice}`);
  });
});

describe("Golpe Astuto — CD, limite de efeitos (nunca 'efeito(s)' literal) e Golpes Sujos", () => {
  it("nível 5: CD = 8+BP+mod DEX, 1 efeito (nunca 'efeito(s)')", () => {
    const character = rogueAt(5); // BP 3, DEX +3 → CD 14
    const block = getRogueClassPrintedBlocks(character).find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(block).toContain("Retire dados do Ataque Furtivo: até 1 efeito, CD 14");
    expect(block).not.toContain("efeito(s)");
    expect(block).toContain("Envenenar 1d6: Salv CON falha: Envenenado 1min, repete no fim do turno");
    expect(block).toContain("Retirada 1d6: 1/2 desl sem Atq de Oport");
    expect(block).toContain("Tropeço 1d6: Salv DEX; falha: Caído");
  });

  it("nível 11: até 2 efeitos (Golpe Astuto Aprimorado) — nunca 'efeito(s)'", () => {
    const block = getRogueClassPrintedBlocks(rogueAt(11)).find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(block).toContain("até 2 efeitos");
    expect(block).not.toContain("efeito(s)");
  });

  it("nível 10: ainda 1 efeito; nível 14+: acrescenta Aturdir/Nocaute/Obscurecer (Golpes Sujos), nunca título separado", () => {
    const level10 = getRogueClassPrintedBlocks(rogueAt(10)).find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(level10).toContain("até 1 efeito");
    expect(level10).not.toContain("Aturdir");

    const level14 = getRogueClassPrintedBlocks(rogueAt(14));
    expect(level14.filter((b) => b.startsWith("# GOLPE ASTUTO"))).toHaveLength(1);
    const block14 = level14.find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(block14).toContain("Aturdir 2d6: Salv CON; prxm turno do alvo: mover ou ação ou AB");
    expect(block14).toContain("Nocaute 6d6: Salv CON; Inconsciente 1min ou dano, repete todo turno");
    expect(block14).toContain("Obscurecer 3d6: Salv DEX; Cego até fim do prxm turno do alvo");
  });

  it("abaixo do nível 5: nunca aparece o bloco Golpe Astuto", () => {
    expect(getRogueClassPrintedBlocks(rogueAt(4)).join("\n\n")).not.toContain("# GOLPE ASTUTO");
  });
});

describe("Mira Firme — Mira Móvel do Assassino (nível 9+) substitui a 2ª linha, nunca soma", () => {
  it("sem Mira Móvel: desl 0 até fim do turno", () => {
    const block = getRogueClassPrintedBlocks(rogueAt(3)).find((b) => b.startsWith("# MIRA FIRME"))!;
    expect(block).toContain("desl 0 até fim do turno");
  });

  it("com Mira Móvel ativa: pode mover depois, sem desl 0 — via o orquestrador completo (Assassino nível 9+)", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(9, "Assassino"));
    const block = blocks.find((b) => b.startsWith("# MIRA FIRME"))!;
    expect(block).toContain("pode mover depois");
    expect(block).not.toContain("desl 0");
    expect(blocks.filter((b) => b.startsWith("# MIRA FIRME"))).toHaveLength(1);
  });
});

describe("Esquiva Sobrenatural/Evasão/Talento Confiável/Elusivo/Golpe de Sorte — limiares de nível", () => {
  it("nível 5+: Esquiva Sobrenatural", () => {
    expect(getRogueClassPrintedBlocks(rogueAt(5)).join("\n\n")).toContain("# ESQUIVA SOBRENATURAL");
    expect(getRogueClassPrintedBlocks(rogueAt(4)).join("\n\n")).not.toContain("# ESQUIVA SOBRENATURAL");
  });

  it("nível 7+: Evasão e Talento Confiável juntos", () => {
    const joined = getRogueClassPrintedBlocks(rogueAt(7)).join("\n\n");
    expect(joined).toContain("# EVASÃO");
    expect(joined).toContain("# TALENTO CONFIÁVEL");
  });

  it("nível 18+: Elusivo; nível 20+: Golpe de Sorte", () => {
    expect(getRogueClassPrintedBlocks(rogueAt(18)).join("\n\n")).toContain("# ELUSIVO");
    expect(getRogueClassPrintedBlocks(rogueAt(19)).join("\n\n")).not.toContain("# GOLPE DE SORTE");
    expect(getRogueClassPrintedBlocks(rogueAt(20)).join("\n\n")).toContain("# GOLPE DE SORTE");
  });
});

describe("Nunca aparecem em Características de Classe (ficam em Perícias/Idiomas/ASI/Dádiva Épica)", () => {
  it("Especialista, Gíria dos Ladrões, Aumento no Valor de Atributo e Dádiva Épica nunca aparecem aqui", () => {
    const joined = getRogueClassPrintedBlocks(rogueAt(20)).join("\n\n");
    expect(joined).not.toContain("ESPECIALISTA");
    expect(joined).not.toContain("GÍRIA");
    expect(joined).not.toContain("AUMENTO NO VALOR DE ATRIBUTO");
    expect(joined).not.toContain("DÁDIVA ÉPICA");
  });

  it("Mente Escorregadia (nível 15) nunca aparece aqui — vai direto para as Salvaguardas", () => {
    expect(getRogueClassPrintedBlocks(rogueAt(15)).join("\n\n")).not.toContain("MENTE ESCORREGADIA");
  });
});
