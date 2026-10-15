import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getFighterClassPrintedBlocks } from "./fighterClassPrintedFeatures.js";
import { getFighterPrintedBlocks } from "./fighterPrintedFeatures.js";

function fighterAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fighter-class-printed-test");
  character.classId = "guerreiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getFighterClassPrintedBlocks — classe diferente ou nível 1", () => {
  it("classe diferente de Guerreiro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getFighterClassPrintedBlocks(character)).toEqual([]);
  });

  it("nível 1: só Maestria em Arma (3 tipos) e Recuperar Fôlego (1d10+1, 2 marcadores) — SEM Surto de Ação (começa no nível 2), Ataque Extra, Indomável ou Ataques Estudados", () => {
    const blocks = getFighterClassPrintedBlocks(fighterAt(1));
    const joined = blocks.join("\n\n");

    expect(joined).toContain("# MAESTRIA EM ARMA");
    expect(joined).toContain("3 tipos de armas Simples/Marciais; troca 1 em DL");
    expect(joined).toContain("# RECUPERAR FÔLEGO");
    expect(joined).toContain("AB: recupera 1d10+1 PV [__] [__]");
    expect(joined).toContain("DC: recupera 1 uso DL: todos");

    expect(joined).not.toContain("# SURTO DE AÇÃO");
    expect(joined).not.toContain("# ATAQUE EXTRA");
    expect(joined).not.toContain("# INDOMÁVEL");
    expect(joined).not.toContain("# ATAQUES ESTUDADOS");
    expect(joined).not.toContain("Falha em teste"); // Mente Tática, só a partir do nível 2
    expect(joined).not.toContain("Usar essa AB: move"); // Ajuste Tático, só a partir do nível 5
    expect(joined).not.toContain("Por atq com maestria"); // Mestre Tático, só a partir do nível 9
  });
});

describe("Recuperar Fôlego — marcadores por faixa de nível e cura com o nível de Guerreiro (nunca BP)", () => {
  it.each([
    [1, "1d10+1", "[__] [__]"],
    [3, "1d10+3", "[__] [__]"],
    [4, "1d10+4", "[__] [__] [__]"],
    [9, "1d10+9", "[__] [__] [__]"],
    [10, "1d10+10", "[__] [__] [__] [__]"],
    [20, "1d10+20", "[__] [__] [__] [__]"],
  ])("nível %i: cura %s, marcadores %s", (level, healing, markers) => {
    const joined = getFighterClassPrintedBlocks(fighterAt(level)).join("\n\n");
    expect(joined).toContain(`AB: recupera ${healing} PV ${markers}`);
  });

  it("nível 2+: acrescenta a linha de Mente Tática no MESMO bloco, nunca título separado", () => {
    const blocks = getFighterClassPrintedBlocks(fighterAt(2));
    const secondWind = blocks.find((b) => b.startsWith("# RECUPERAR FÔLEGO"))!;
    expect(secondWind).toContain("Falha em teste: +1d10 em vez de curar; gasta uso se passar");
    expect(blocks.filter((b) => b.includes("Falha em teste"))).toHaveLength(1);
  });

  it("nível 5+: acrescenta a linha de Ajuste Tático IMEDIATAMENTE após a linha da AB, antes da linha de DC/DL", () => {
    const blocks = getFighterClassPrintedBlocks(fighterAt(5));
    const secondWind = blocks.find((b) => b.startsWith("# RECUPERAR FÔLEGO"))!;
    const lines = secondWind.split("\n");
    const abIndex = lines.findIndex((l) => l.startsWith("> AB:"));
    const ajusteIndex = lines.findIndex((l) => l.includes("Usar essa AB: move 1/2 desl sem Atq de Oport"));
    const dcIndex = lines.findIndex((l) => l.startsWith("> DC:"));
    expect(ajusteIndex).toBe(abIndex + 1);
    expect(dcIndex).toBeGreaterThan(ajusteIndex);
  });

  it("nunca mostra as duas versões antigas/novas juntas ao subir de nível — só o bloco atualizado", () => {
    const level1 = getFighterClassPrintedBlocks(fighterAt(1)).join("\n\n");
    const level10 = getFighterClassPrintedBlocks(fighterAt(10)).join("\n\n");
    expect(level1).not.toContain("1d10+10");
    expect(level10).not.toContain("1d10+1 ");
    expect(level10.match(/# RECUPERAR FÔLEGO/g)).toHaveLength(1);
  });
});

describe("Maestria em Arma — quantidade por faixa de nível e Mestre Tático (nível 9+)", () => {
  it.each([
    [1, 3],
    [4, 4],
    [10, 5],
    [16, 6],
    [20, 6],
  ])("nível %i: %i tipos de armas", (level, count) => {
    const joined = getFighterClassPrintedBlocks(fighterAt(level)).join("\n\n");
    expect(joined).toContain(`> ${count} tipos de armas Simples/Marciais; troca 1 em DL`);
  });

  it("nível 9+: acrescenta a linha de Mestre Tático com os 3 nomes já cadastrados no catálogo (Empurrar/Drenar/Lentidão), nunca título separado", () => {
    const blocks = getFighterClassPrintedBlocks(fighterAt(9));
    const mastery = blocks.find((b) => b.startsWith("# MAESTRIA EM ARMA"))!;
    expect(mastery).toContain("Por atq com maestria: pode trocar por Empurrar/Drenar/Lentidão");
    expect(blocks.filter((b) => b.startsWith("# MAESTRIA EM ARMA"))).toHaveLength(1);
  });
});

describe("Surto de Ação — marcadores e fusão com Investida Mística do Cavaleiro Místico", () => {
  it("nível 2–16: 1 marcador; nível 17–20: 2 marcadores", () => {
    expect(getFighterClassPrintedBlocks(fighterAt(2)).join("\n\n")).toContain("1/turno [__]/DC ou DL");
    expect(getFighterClassPrintedBlocks(fighterAt(16)).join("\n\n")).toContain("1/turno [__]/DC ou DL");
    expect(getFighterClassPrintedBlocks(fighterAt(17)).join("\n\n")).toContain("1/turno [__] [__]/DC ou DL");
    expect(getFighterClassPrintedBlocks(fighterAt(20)).join("\n\n")).toContain("1/turno [__] [__]/DC ou DL");
  });

  it("Cavaleiro Místico nível 15+: a linha de Investida Mística entra no MESMO bloco, via o orquestrador completo — nunca título/contador separado", () => {
    const blocks = getFighterPrintedBlocks(fighterAt(15, "Cavaleiro Místico"));
    const actionSurgeBlocks = blocks.filter((b) => b.startsWith("# SURTO DE AÇÃO"));
    expect(actionSurgeBlocks).toHaveLength(1);
    expect(actionSurgeBlocks[0]).toContain("Pode teleportar 9m antes/depois da ação adicional");
  });

  it("Cavaleiro Místico nível 14 (abaixo do limiar): sem a linha de Investida Mística", () => {
    const blocks = getFighterPrintedBlocks(fighterAt(14, "Cavaleiro Místico"));
    const actionSurgeBlock = blocks.find((b) => b.startsWith("# SURTO DE AÇÃO"))!;
    expect(actionSurgeBlock).not.toContain("teleportar");
  });

  it("outras subclasses nunca recebem a linha de Investida Mística", () => {
    const blocks = getFighterPrintedBlocks(fighterAt(18, "Campeão"));
    const actionSurgeBlock = blocks.find((b) => b.startsWith("# SURTO DE AÇÃO"))!;
    expect(actionSurgeBlock).not.toContain("teleportar");
  });
});

describe("Ataque Extra — quantidade TOTAL (nunca duplica Dois/Três Ataques Extras em títulos separados)", () => {
  it.each([
    [5, 2],
    [10, 2],
    [11, 3],
    [19, 3],
    [20, 4],
  ])("nível %i: %i atq no total", (level, total) => {
    const blocks = getFighterClassPrintedBlocks(fighterAt(level));
    expect(blocks.filter((b) => b.startsWith("# ATAQUE EXTRA"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain(`Ação Atacar = ${total} atq`);
  });

  it("nível 20: nunca soma 4 aos 3 anteriores nem cria 'Dois'/'Três Ataques Extras' como título", () => {
    const joined = getFighterClassPrintedBlocks(fighterAt(20)).join("\n\n");
    expect(joined).not.toContain("DOIS ATAQUES EXTRAS");
    expect(joined).not.toContain("TRÊS ATAQUES EXTRAS");
    expect(joined).not.toContain("Ação Atacar = 7 atq");
  });
});

describe("Indomável (refazer Salv) — marcadores por faixa de nível, bônus = nível de Guerreiro", () => {
  it.each([
    [9, 1, "+9"],
    [12, 1, "+12"],
    [13, 2, "+13"],
    [16, 2, "+16"],
    [17, 3, "+17"],
    [20, 3, "+20"],
  ])("nível %i: %i marcador(es), bônus %s", (level, markerCount, bonus) => {
    const joined = getFighterClassPrintedBlocks(fighterAt(level)).join("\n\n");
    const markers = Array(markerCount).fill("[__]").join(" ");
    expect(joined).toContain(`Falhou Salv: refaz ${bonus}, usa novo resultado ${markers}/DL`);
  });

  it("abaixo do nível 9: nunca aparece o bloco Indomável", () => {
    expect(getFighterClassPrintedBlocks(fighterAt(8)).join("\n\n")).not.toContain("# INDOMÁVEL");
  });
});

describe("Ataques Estudados — a partir do nível 13", () => {
  it("nível 13+: aparece; abaixo, nunca", () => {
    expect(getFighterClassPrintedBlocks(fighterAt(13)).join("\n\n")).toContain("# ATAQUES ESTUDADOS");
    expect(getFighterClassPrintedBlocks(fighterAt(13)).join("\n\n")).toContain("Errou atq: Vant no prxm atq contra mesmo alvo");
    expect(getFighterClassPrintedBlocks(fighterAt(12)).join("\n\n")).not.toContain("# ATAQUES ESTUDADOS");
  });
});

describe("Nunca aparecem em Características de Classe (ficam em Talentos/ASI/Dádiva Épica)", () => {
  it("Estilo de Luta nunca aparece aqui, mesmo com o nome escolhido no featureChoiceSelections", () => {
    const character = fighterAt(7, "Campeão");
    const joined = getFighterClassPrintedBlocks(character).join("\n\n");
    expect(joined).not.toContain("ESTILO DE LUTA");
    expect(joined).not.toContain("Duelista");
  });

  it("nunca imprime Aumento no Valor de Atributo nem Dádiva Épica", () => {
    const joined = getFighterClassPrintedBlocks(fighterAt(19)).join("\n\n");
    expect(joined).not.toContain("AUMENTO NO VALOR DE ATRIBUTO");
    expect(joined).not.toContain("DÁDIVA ÉPICA");
  });
});
