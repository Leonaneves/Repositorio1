import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getPaladinClassPrintedBlocks } from "./paladinClassPrintedFeatures.js";

function paladinAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("paladin-class-printed-test");
  character.classId = "paladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.CAR.score = 16; // +3
  return character;
}

describe("getPaladinClassPrintedBlocks — classe diferente", () => {
  it("classe diferente de Paladino — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    character.level = 20;
    expect(getPaladinClassPrintedBlocks(character)).toEqual([]);
  });
});

describe("Maestria em Arma — sempre presente desde o nível 1", () => {
  it("texto exato", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(1)).join("\n\n");
    expect(joined).toContain("# MAESTRIA EM ARMA");
    expect(joined).toContain("2 tipos de armas proficientes, pode trocar em DL");
  });
});

describe("Mãos Consagradas — reserva resolvida (5 × nível), Toque Restaurador a partir do nível 14", () => {
  it("nível 1: reserva [____]/5, linha base de uso", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(1)).join("\n\n");
    expect(joined).toContain("# MÃOS CONSAGRADAS");
    expect(joined).toContain("Reserva [____]/5 PV, recupera em DL");
    expect(joined).toContain("AB toque: gasta reserva para curar ou 5 PV para remover Envenenado");
  });

  it("nível 10: reserva [____]/50", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(10)).join("\n\n")).toContain("Reserva [____]/50 PV, recupera em DL");
  });

  it("nível 14 (Toque Restaurador): substitui a linha de uso pela versão com remoção de condições, nunca a linha antiga", () => {
    const blocks = getPaladinClassPrintedBlocks(paladinAt(14));
    expect(blocks.filter((b) => b.startsWith("# MÃOS CONSAGRADAS"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# MÃOS CONSAGRADAS"))!;
    expect(block).toContain("Reserva [____]/70 PV, recupera em DL");
    expect(block).toContain("AB toque: cura ou gasta 5 PV por condição removida");
    expect(block).toContain("Envenenado/Amedrontado/Atordoado/Cego/Enfeitiçado/Paralisado/Surdo");
    expect(block).not.toContain("gasta reserva para curar ou 5 PV para remover Envenenado");
    expect(blocks.join("\n\n")).not.toContain("TOQUE RESTAURADOR");
  });
});

describe("Destruição do Paladino — nível 2+, Destruição Protetora (Juramento da Devoção, nível 15+)", () => {
  it("ausente abaixo do nível 2", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(1)).join("\n\n")).not.toContain("DESTRUIÇÃO DO PALADINO");
  });

  it("nível 2: presente, sem linha extra (sem subclasse)", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(2)).join("\n\n");
    expect(joined).toContain("# DESTRUIÇÃO DO PALADINO");
    expect(joined).toContain("Destruição Divina sem espaço [__]/DL");
    expect(joined).not.toContain("Cobertura Parcial");
  });

  it("nível 15, Juramento da Devoção: acrescenta a linha de Destruição Protetora, nunca bloco separado", () => {
    const blocks = getPaladinClassPrintedBlocks(paladinAt(15, "Juramento da Devoção"));
    expect(blocks.filter((b) => b.startsWith("# DESTRUIÇÃO DO PALADINO"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain("> Conjurar Destruição Divina: Cobertura Parcial na aura até início do prxm turno");
    expect(blocks.join("\n\n")).not.toContain("DESTRUIÇÃO PROTETORA");
  });

  it("nível 15, outro Juramento: nunca recebe a linha de Destruição Protetora", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(15, "Juramento da Glória")).join("\n\n")).not.toContain("Cobertura Parcial");
  });
});

describe("Canalizar Divindade — marcadores/CD resolvidos, Repudiar Inimigos a partir do nível 9", () => {
  it("ausente abaixo do nível 3", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(2)).join("\n\n")).not.toContain("CANALIZAR DIVINDADE");
  });

  it("nível 3 (BP 2, mod CAR +3): 2 marcadores, CD 13, Sentido Divino presente, sem Repudiar Inimigos", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(3)).join("\n\n");
    expect(joined).toContain("# CANALIZAR DIVINDADE");
    expect(joined).toContain("[__][__] | DC: recupera 1 DL: todos | CD 13");
    expect(joined).toContain("Cada opção abaixo gasta 1 uso");
    expect(joined).toContain("Sentido Divino: AB, detecta Celestiais/Ínferos/Mortos-Vivos e consagrado/profanado a 18m");
    expect(joined).toContain("Dura 10min ou até Incapacitado");
    expect(joined).not.toContain("Repudiar Inimigos");
  });

  it("nível 11: 3 marcadores (em vez de 2)", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(11)).join("\n\n")).toContain("[__][__][__] | DC: recupera 1 DL: todos | CD");
  });

  it("nível 9 (mod CAR +3): Repudiar Inimigos com 3 alvos, mesmo bloco de Canalizar Divindade", () => {
    const blocks = getPaladinClassPrintedBlocks(paladinAt(9));
    expect(blocks.filter((b) => b.startsWith("# CANALIZAR DIVINDADE"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# CANALIZAR DIVINDADE"))!;
    expect(block).toContain("Repudiar Inimigos: Usar Magia, 3 alvos a 18m, Salv SAB");
    expect(block).toContain("Falha: Amedrontado 1min ou dano; no turno só mover ou ação ou AB");
  });
});

describe("Ataque Extra e Montaria Fiel — nível 5", () => {
  it("ausentes abaixo do nível 5", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(4)).join("\n\n");
    expect(joined).not.toContain("ATAQUE EXTRA");
    expect(joined).not.toContain("MONTARIA FIEL");
  });

  it("nível 5: Ataque Extra (2 Atq) e Montaria Fiel presentes", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(5)).join("\n\n");
    expect(joined).toContain("# ATAQUE EXTRA\n> Ação Atacar = 2 Atq");
    expect(joined).toContain("# MONTARIA FIEL");
    expect(joined).toContain("Convocar Montaria sem espaço [__]/DL");
  });
});

describe("Aura de Proteção — alcance/bônus resolvidos, Aura de Coragem (10) e Aura Expandida (18)", () => {
  it("ausente abaixo do nível 6", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(5)).join("\n\n")).not.toContain("AURA DE PROTEÇÃO");
  });

  it("nível 6 (mod CAR +3): alcance 3m, bônus +3, sem imunidade", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(6)).join("\n\n");
    expect(joined).toContain("# AURA DE PROTEÇÃO");
    expect(joined).toContain("Você e aliados a 3m: +3 Salv, inativa Incapacitado");
    expect(joined).not.toContain("Imunidade");
  });

  it("nível 10 (Aura de Coragem): acrescenta Imunidade a Amedrontado, mesmo bloco, nunca título separado", () => {
    const blocks = getPaladinClassPrintedBlocks(paladinAt(10));
    expect(blocks.filter((b) => b.startsWith("# AURA DE PROTEÇÃO"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain("> Imunidade a Amedrontado na aura");
    expect(blocks.join("\n\n")).not.toContain("AURA DE CORAGEM");
  });

  it("nível 18 (Aura Expandida): alcance passa a 9m, nunca título separado", () => {
    const blocks = getPaladinClassPrintedBlocks(paladinAt(18));
    expect(blocks.filter((b) => b.startsWith("# AURA DE PROTEÇÃO"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain("Você e aliados a 9m: +3 Salv, inativa Incapacitado");
    expect(blocks.join("\n\n")).not.toContain("AURA EXPANDIDA");
  });

  it("Juramento da Devoção, nível 7-9: só Imunidade a Enfeitiçado (Aura de Coragem ainda não existe)", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(7, "Juramento da Devoção")).join("\n\n")).toContain("> Imunidade a Enfeitiçado na aura");
  });

  it("Juramento da Devoção, nível 10+: une as 2 imunidades numa ÚNICA linha", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(10, "Juramento da Devoção")).join("\n\n");
    expect(joined).toContain("> Imunidade a Amedrontado/Enfeitiçado na aura");
    expect(joined).not.toContain("> Imunidade a Amedrontado na aura\n");
    expect(joined).not.toContain("> Imunidade a Enfeitiçado na aura\n");
  });

  it("Juramento da Glória, nível 7+: acrescenta a linha de Aura de Vivacidade", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(7, "Juramento da Glória")).join("\n\n")).toContain(
      "> Aliado entra/inicia turno na aura: Desl +3m até fim do prxm turno dele",
    );
  });

  it("Juramento dos Anciões, nível 7+: acrescenta a linha de Aura de Resistência", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(7, "Juramento dos Anciões")).join("\n\n")).toContain("> Res a Necrótico/Psíquico/Radiante na aura");
  });

  it("Juramento da Vingança: nunca acrescenta linha extra de aura (nível 7 é Vingador Implacável, não aura)", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(10, "Juramento da Vingança")).join("\n\n");
    expect(joined).toContain("> Imunidade a Amedrontado na aura");
    expect(joined).not.toContain("Vivacidade");
    expect(joined).not.toContain("Res a Necrótico");
  });
});

describe("Golpes Radiantes — nível 11", () => {
  it("ausente abaixo do nível 11, presente a partir dele", () => {
    expect(getPaladinClassPrintedBlocks(paladinAt(10)).join("\n\n")).not.toContain("GOLPES RADIANTES");
    const joined = getPaladinClassPrintedBlocks(paladinAt(11)).join("\n\n");
    expect(joined).toContain("# GOLPES RADIANTES");
    expect(joined).toContain("Acerto com arma Corpo a Corpo/Atq Desarmado: +1d8 Radiante");
  });
});

describe("Nunca aparecem aqui (auto-visíveis em campo próprio, Talentos, ou resolvidos em Magias)", () => {
  it("Conjuração, Estilo de Luta, Subclasse, ASI e Dádiva Épica nunca aparecem", () => {
    const joined = getPaladinClassPrintedBlocks(paladinAt(20, "Juramento da Glória")).join("\n\n");
    expect(joined).not.toContain("CONJURAÇÃO");
    expect(joined).not.toContain("ESTILO DE LUTA");
    expect(joined).not.toContain("SUBCLASSE DE PALADINO");
    expect(joined).not.toContain("AUMENTO NO VALOR DE ATRIBUTO");
    expect(joined).not.toContain("DÁDIVA ÉPICA");
  });
});
