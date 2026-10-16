import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getMonkSubclassPrintedBlocks } from "./monkSubclassPrintedFeatures.js";
import { getMonkPrintedBlocks } from "./monkPrintedFeatures.js";

function monkAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("monk-subclass-printed-test");
  character.classId = "monge";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.DEX.score = 14; // +2
  character.abilities.SAB.score = 16; // +3
  return character;
}

describe("getMonkSubclassPrintedBlocks — sem subclasse", () => {
  it("sem subclasse escolhida — nearFocus/rest vazios", () => {
    expect(getMonkSubclassPrintedBlocks(monkAt(5, null))).toEqual({ nearFocus: [], rest: [], focusExtraLines: {} });
  });
});

describe("Caminho da Mão Aberta — Técnica da Mão Aberta, Integridade Corporal, Passo Veloz, Palma Vibrante", () => {
  it("nível 3: só Técnica da Mão Aberta, CD de Foco resolvida (8+3+2=13)", () => {
    const { nearFocus, rest, focusExtraLines } = getMonkSubclassPrintedBlocks(monkAt(3, "Guerreiro da Mão Aberta"));
    expect(nearFocus.join("\n\n")).toContain("# TÉCNICA DA MÃO ABERTA");
    expect(nearFocus.join("\n\n")).toContain("Salv DEX CD 13");
    expect(nearFocus.join("\n\n")).not.toContain("INTEGRIDADE CORPORAL");
    expect(rest).toEqual([]);
    expect(focusExtraLines).toEqual({});
  });

  it("nível 6: Integridade Corporal com cura e usos resolvidos (die 1d8, mod SAB +3, 3 usos)", () => {
    const { nearFocus } = getMonkSubclassPrintedBlocks(monkAt(6, "Guerreiro da Mão Aberta"));
    const joined = nearFocus.join("\n\n");
    expect(joined).toContain("# INTEGRIDADE CORPORAL");
    expect(joined).toContain("cura 1d8+3 [__][__][__]/DL");
  });

  it("nível 11: Passo Veloz entra só como focusExtraLines.afterWindStep, sem bloco/marcador próprio", () => {
    const { focusExtraLines, nearFocus, rest } = getMonkSubclassPrintedBlocks(monkAt(11, "Guerreiro da Mão Aberta"));
    expect(focusExtraLines.afterWindStep).toEqual(["> Após outra AB: pode usar Passo do Vento"]);
    expect([...nearFocus, ...rest].join("\n\n")).not.toContain("PASSO VELOZ");
  });

  it("nível 17: Palma Vibrante com duração = nível e CD de Foco resolvida", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(17, "Guerreiro da Mão Aberta"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# PALMA VIBRANTE");
    expect(joined).toContain("vibrações por 17 dias");
    expect(joined).toContain("Salv CON CD 17");
    expect(joined).toContain("falha 10d12 Força, sucesso 1/2");
  });
});

describe("Caminho da Misericórdia — Mão de Cura, Mão de Dolo, Toque de Médico, Torrente de Cura e Dolo, Mão da Misericórdia Final", () => {
  it("nível 3: Mão de Cura e Mão de Dolo com a mesma fórmula (1d6+3), sem os efeitos de Toque de Médico", () => {
    const { nearFocus } = getMonkSubclassPrintedBlocks(monkAt(3, "Guerreiro da Misericórdia"));
    const joined = nearFocus.join("\n\n");
    expect(joined).toContain("# MÃO DE CURA");
    expect(joined).toContain("cura 1d6+3");
    expect(joined).toContain("# MÃO DE DOLO");
    expect(joined).toContain("+1d6+3 Necrótico");
    expect(joined).not.toContain("encerra Atordoado");
    expect(joined).not.toContain("impõe Envenenado");
  });

  it("nível 6 (Toque de Médico): atualiza os MESMOS blocos de Mão de Cura/Mão de Dolo, nunca título separado", () => {
    const { nearFocus } = getMonkSubclassPrintedBlocks(monkAt(6, "Guerreiro da Misericórdia"));
    expect(nearFocus.filter((b) => b.startsWith("# MÃO DE CURA"))).toHaveLength(1);
    expect(nearFocus.filter((b) => b.startsWith("# MÃO DE DOLO"))).toHaveLength(1);
    const joined = nearFocus.join("\n\n");
    expect(joined).toContain("Também encerra Atordoado/Cego/Envenenado/Paralisado/Surdo no curado");
    expect(joined).toContain("Também impõe Envenenado no alvo até prxm turno");
    expect(joined).not.toContain("TOQUE DE MÉDICO");
  });

  it("nível 11: Torrente de Cura e Dolo com usos = máximo(1, mod SAB) = 3", () => {
    const { nearFocus } = getMonkSubclassPrintedBlocks(monkAt(11, "Guerreiro da Misericórdia"));
    const joined = nearFocus.join("\n\n");
    expect(joined).toContain("# TORRENTE DE CURA E DOLO");
    expect(joined).toContain("[__][__][__]/DL");
  });

  it("nível 17: Mão da Misericórdia Final com cura 4d10+3", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(17, "Guerreiro da Misericórdia"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# MÃO DA MISERICÓRDIA FINAL");
    expect(joined).toContain("cura 4d10+3");
    expect(joined).toContain("[__]/DL");
  });
});

describe("Caminho das Sombras — Artes das Sombras, Passo da Sombra, Manto da Sombra", () => {
  it("nível 3: Artes das Sombras com Visão no Escuro 18m (sem Visão no Escuro prévia)", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(3, "Guerreiro das Sombras"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# ARTES DAS SOMBRAS");
    expect(joined).toContain("Concede o truque Ilusão Menor (SAB)");
    expect(joined).toContain("Visão no Escuro 18m");
    expect(joined).not.toContain("PASSO DA SOMBRA");
  });

  it("espécie com Visão no Escuro prévia (Anão, 36m): soma +18m = 54m, nunca re-soma o próprio bônus", () => {
    const character = monkAt(3, "Guerreiro das Sombras");
    character.speciesId = "anao";
    const joined = getMonkSubclassPrintedBlocks(character).rest.join("\n\n");
    expect(joined).toContain("Visão no Escuro 54m");
  });

  it("nível 6: Passo da Sombra, sem a melhoria do nível 11", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(6, "Guerreiro das Sombras"));
    const block = rest.find((b) => b.startsWith("# PASSO DA SOMBRA"))!;
    expect(block).toContain("teleporta 18m");
    expect(block).not.toContain("ignora iluminação");
  });

  it("nível 11: insere a linha de Passo da Sombra Aprimorado no MESMO bloco, nunca título separado", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(11, "Guerreiro das Sombras"));
    expect(rest.filter((b) => b.startsWith("# PASSO DA SOMBRA"))).toHaveLength(1);
    expect(rest.join("\n\n")).toContain("> Com 1 Foco: ignora iluminação + 1 Atq Desarmado após teleportar");
    expect(rest.join("\n\n")).not.toContain("PASSO DA SOMBRA APRIMORADO");
  });

  it("nível 17: Manto da Sombra", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(17, "Guerreiro das Sombras"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# MANTO DA SOMBRA");
    expect(joined).toContain("Torrente de Golpes não custa Foco");
  });
});

describe("Caminho dos Elementos — Sintonia Elemental, Explosão Elemental, Passo dos Elementos, Ápice Elemental, Passo Destrutivo", () => {
  it("nível 3: só Sintonia Elemental, sem Explosão Elemental/Passo dos Elementos/Ápice Elemental", () => {
    const { rest, nearFocus } = getMonkSubclassPrintedBlocks(monkAt(3, "Guerreiro dos Elementos"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# SINTONIA ELEMENTAL");
    expect(joined).not.toContain("EXPLOSÃO ELEMENTAL");
    expect(joined).not.toContain("Durante Sintonia: Natação e Voo");
    expect(nearFocus).toEqual([]);
  });

  it("nível 6: Explosão Elemental com CD de Foco e 3 dados de Artes Marciais resolvidos (3d8)", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(6, "Guerreiro dos Elementos"));
    const joined = rest.join("\n\n");
    expect(joined).toContain("# EXPLOSÃO ELEMENTAL");
    expect(joined).toContain("CD 14");
    expect(joined).toContain("falha 3d8, sucesso 1/2");
  });

  it("nível 11: insere a linha de Passo dos Elementos no MESMO bloco de Sintonia Elemental", () => {
    const { rest } = getMonkSubclassPrintedBlocks(monkAt(11, "Guerreiro dos Elementos"));
    expect(rest.filter((b) => b.startsWith("# SINTONIA ELEMENTAL"))).toHaveLength(1);
    expect(rest.join("\n\n")).toContain("> Durante Sintonia: Natação e Voo iguais ao Desl");
    expect(rest.join("\n\n")).not.toContain("PASSO DOS ELEMENTOS");
  });

  it("nível 17: Ápice Elemental insere as 2 linhas no MESMO bloco de Sintonia Elemental, e Passo Destrutivo vai para nearFocus (ao lado de Passo do Vento)", () => {
    const { rest, nearFocus } = getMonkSubclassPrintedBlocks(monkAt(17, "Guerreiro dos Elementos"));
    expect(rest.filter((b) => b.startsWith("# SINTONIA ELEMENTAL"))).toHaveLength(1);
    const sintoniaBlock = rest.find((b) => b.startsWith("# SINTONIA ELEMENTAL"))!;
    expect(sintoniaBlock).toContain("No seu turno, 1 acerto desarmado: +1d12 do mesmo tipo");
    expect(sintoniaBlock).toContain("Res a 1 tipo elemental, pode trocar no início do turno");
    expect(rest.join("\n\n")).not.toContain("ÁPICE ELEMENTAL");

    expect(nearFocus.join("\n\n")).toContain("# PASSO DESTRUTIVO");
    expect(nearFocus.join("\n\n")).toContain("+6m de Desl até fim do turno");
    expect(nearFocus.join("\n\n")).toContain("1d12 de dano elemental");
  });
});

describe("getMonkPrintedBlocks — classe base + subclasse, nearFocus logo após o bloco FOCO", () => {
  it("Caminho da Mão Aberta nível 17: Técnica da Mão Aberta/Integridade Corporal entram logo após FOCO; Palma Vibrante ao final; Passo Veloz some direto no FOCO", () => {
    const blocks = getMonkPrintedBlocks(monkAt(17, "Guerreiro da Mão Aberta"));
    const focusIndex = blocks.findIndex((b) => b.startsWith("# FOCO"));
    const techniqueIndex = blocks.findIndex((b) => b.startsWith("# TÉCNICA DA MÃO ABERTA"));
    const bodyIndex = blocks.findIndex((b) => b.startsWith("# INTEGRIDADE CORPORAL"));
    expect(techniqueIndex).toBe(focusIndex + 1);
    expect(bodyIndex).toBe(focusIndex + 2);
    expect(blocks[focusIndex]).toContain("> Após outra AB: pode usar Passo do Vento");
    expect(blocks.some((b) => b.startsWith("# PALMA VIBRANTE"))).toBe(true);
  });

  it("Caminho dos Elementos nível 17: Passo Destrutivo entra logo após FOCO, Sintonia Elemental/Explosão Elemental vão ao final", () => {
    const blocks = getMonkPrintedBlocks(monkAt(17, "Guerreiro dos Elementos"));
    const focusIndex = blocks.findIndex((b) => b.startsWith("# FOCO"));
    const destructiveIndex = blocks.findIndex((b) => b.startsWith("# PASSO DESTRUTIVO"));
    expect(destructiveIndex).toBe(focusIndex + 1);
    expect(blocks.some((b) => b.startsWith("# SINTONIA ELEMENTAL"))).toBe(true);
    expect(blocks.some((b) => b.startsWith("# EXPLOSÃO ELEMENTAL"))).toBe(true);
  });

  it("Caminho da Misericórdia nível 17: classe base e subclasse presentes, sem duplicar títulos", () => {
    const blocks = getMonkPrintedBlocks(monkAt(17, "Guerreiro da Misericórdia"));
    const joined = blocks.join("\n\n");
    expect(joined).toContain("# ARTES MARCIAIS");
    expect(joined).toContain("# FOCO");
    expect(joined).toContain("# MÃO DE CURA");
    expect(joined).toContain("# MÃO DE DOLO");
    expect(joined).toContain("# TORRENTE DE CURA E DOLO");
    expect(joined).toContain("# MÃO DA MISERICÓRDIA FINAL");
    expect(blocks.filter((b) => b.startsWith("# MÃO DE CURA"))).toHaveLength(1);
  });

  it("Caminho das Sombras nível 17: classe base e subclasse presentes, Passo da Sombra aprimorado", () => {
    const joined = getMonkPrintedBlocks(monkAt(17, "Guerreiro das Sombras")).join("\n\n");
    expect(joined).toContain("# ARTES DAS SOMBRAS");
    expect(joined).toContain("ignora iluminação");
    expect(joined).toContain("# MANTO DA SOMBRA");
  });

  it("classe diferente de Monge — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    expect(getMonkPrintedBlocks(character)).toEqual([]);
  });
});
