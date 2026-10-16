import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getRogueSubclassPrintedBlocks } from "./rogueSubclassPrintedFeatures.js";
import { getRoguePrintedBlocks } from "./roguePrintedFeatures.js";

function rogueAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("rogue-subclass-printed-test");
  character.classId = "ladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.FOR.score = 10;
  character.abilities.DEX.score = 16; // +3
  return character;
}

describe("getRogueSubclassPrintedBlocks — sem subclasse ou outra classe", () => {
  it("sem subclasse escolhida — []", () => {
    expect(getRogueSubclassPrintedBlocks(rogueAt(5, null))).toEqual([]);
  });
});

describe("Lâmina Psíquica (exibida como Adaga Espiritual) — Poder Psiônico, Sussurros, Teleporte, Véu, Rasgar Mente", () => {
  it("nível 3: Lâminas Psíquicas com dano resolvido (1d6+3/1d4+3, maior entre FOR/DEX) + Energia Psiônica d6 x4 + Sussurros Psíquicos — sem Teleporte/Véu/Rasgar Mente", () => {
    const blocks = getRogueSubclassPrintedBlocks(rogueAt(3, "Lâmina Psíquica"));
    const joined = blocks.join("\n\n");

    expect(joined).toContain("# LÂMINAS PSÍQUICAS");
    expect(joined).toContain("1ª: 1d6+3 Psíquico, Acuidade, Arremesso 18/36m, Afligir | 2ª: 1d4+3 Psíquico");
    expect(joined).toContain("# ENERGIA PSIÔNICA");
    expect(joined).toContain("DP d6 [__] [__] [__] [__] | DC: recupera 1 DL: todos");
    expect(joined).toContain("# SUSSURROS PSÍQUICOS");
    expect(joined).toContain("telepatia com 2 criaturas por d6 h"); // BP nível 3 = 2

    expect(joined).not.toContain("# TELEPORTE PSÍQUICO");
    expect(joined).not.toContain("# VÉU PSÍQUICO");
    expect(joined).not.toContain("# RASGAR MENTE");
    expect(joined).not.toContain("Errou atq"); // Golpes Teleguiados é nível 9 — ainda não aparece
  });

  it("progressão de Energia Psiônica por faixa de nível (rules/classResources.ts#ROGUE_SOULKNIFE_PSIONIC_DIE/_DICE_COUNT)", () => {
    const at5 = getRogueSubclassPrintedBlocks(rogueAt(5, "Lâmina Psíquica")).join("\n\n");
    expect(at5).toContain("DP d8 [__] [__] [__] [__] [__] [__] | DC: recupera 1 DL: todos");

    const at17 = getRogueSubclassPrintedBlocks(rogueAt(17, "Lâmina Psíquica")).join("\n\n");
    expect(at17).toContain("DP d12");
  });

  it("nível 9: acrescenta Teleporte Psíquico (3x o resultado do dado) e Golpes Teleguiados IMEDIATAMENTE após as regras da lâmina (mesmo bloco LÂMINAS PSÍQUICAS, nunca título/contador próprio)", () => {
    const blocks = getRogueSubclassPrintedBlocks(rogueAt(9, "Lâmina Psíquica"));
    expect(blocks.join("\n\n")).toContain("# TELEPORTE PSÍQUICO");
    expect(blocks.join("\n\n")).toContain("AB: gastar 1 DP, teleportar 3 vezes o resultado em m");

    const bladeBlock = blocks.find((b) => b.startsWith("# LÂMINAS PSÍQUICAS"))!;
    const lines = bladeBlock.split("\n");
    expect(lines[lines.length - 1]).toBe("> Errou atq: +DP na jogada, gasta se acertar");
    expect(blocks.filter((b) => b.startsWith("# LÂMINAS PSÍQUICAS"))).toHaveLength(1);
  });

  it("nível 13: acrescenta Véu Psíquico", () => {
    const joined = getRogueSubclassPrintedBlocks(rogueAt(13, "Lâmina Psíquica")).join("\n\n");
    expect(joined).toContain("# VÉU PSÍQUICO");
    expect(joined).toContain("Invisível 1h; encerra ao causar dano/forçar Salv [__]/DL");
    expect(joined).toContain("1 DP recupera uso sem ação");
  });

  it("nível 17: acrescenta Rasgar Mente com a MESMA CD de Golpe Astuto (8+BP+mod DEX)", () => {
    const character = rogueAt(17, "Lâmina Psíquica"); // BP 6, DEX +3 → CD 17
    const joined = getRogueSubclassPrintedBlocks(character).join("\n\n");
    expect(joined).toContain("# RASGAR MENTE");
    expect(joined).toContain("Ataque Furtivo: Salv SAB CD17; Atordoado 1min, repete todo turno [__]/DL");
    expect(joined).toContain("3 DP recuperam uso sem ação");
  });
});

describe("Assassino — Assassinar, Mimetismo Magistral, Mira Móvel, Armas Venenosas, Golpe Mortal", () => {
  it("nível 3: Assassinar com dano adicional = nível de Ladino; sem Mimetismo/Golpe Mortal ainda", () => {
    const joined = getRogueSubclassPrintedBlocks(rogueAt(3, "Assassino")).join("\n\n");
    expect(joined).toContain("# ASSASSINAR");
    expect(joined).toContain("> Vant em Inic");
    expect(joined).toContain("1ª rodada: Vant contra quem não teve turno; Ataque Furtivo +3 dano");
    expect(joined).not.toContain("MIMETISMO");
    expect(joined).not.toContain("2x dano");
  });

  it("nível 9: Mimetismo Magistral aparece", () => {
    expect(getRogueSubclassPrintedBlocks(rogueAt(9, "Assassino")).join("\n\n")).toContain("# MIMETISMO MAGISTRAL");
  });

  it("nível 13: Armas Venenosas entra IMEDIATAMENTE após Envenenar no bloco GOLPE ASTUTO da classe base, via o orquestrador completo", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(13, "Assassino"));
    const block = blocks.find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    const lines = block.split("\n");
    const poisonIndex = lines.findIndex((l) => l.includes("Envenenar 1d6"));
    const extraIndex = lines.findIndex((l) => l.includes("Cada falha nessa Salv: +2d6 Venenoso, ignora Res"));
    expect(extraIndex).toBe(poisonIndex + 1);
    expect(blocks.filter((b) => b.startsWith("# GOLPE ASTUTO"))).toHaveLength(1);
  });

  it("nível 17: Golpe Mortal acrescenta a linha de 2x dano ao bloco ASSASSINAR, nunca título separado", () => {
    const character = rogueAt(17, "Assassino"); // BP 6, DEX +3 → CD 17
    const blocks = getRogueSubclassPrintedBlocks(character);
    expect(blocks.filter((b) => b.startsWith("# ASSASSINAR"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# ASSASSINAR"))!;
    expect(block).toContain("Ataque Furtivo 1ª rodada: Salv CON CD 17; falha: 2x dano");
  });
});

describe("Ladrão — Andarilho de Telhados, Mão Leve, Furtividade Suprema, Usar Dispositivo Mágico, Reflexos de Ladrão", () => {
  it("nível 3: Andarilho de Telhados e Mão Leve; sem os de nível superior", () => {
    const joined = getRogueSubclassPrintedBlocks(rogueAt(3, "Ladrão")).join("\n\n");
    expect(joined).toContain("# ANDARILHO DE TELHADOS");
    expect(joined).toContain("Saltos podem usar DEX em vez de FOR");
    expect(joined).toContain("# MÃO LEVE");
    expect(joined).not.toContain("USAR DISPOSITIVO MÁGICO");
    expect(joined).not.toContain("REFLEXOS DE LADRÃO");
  });

  it("nível 9: Ataque Escondido entra no bloco GOLPE ASTUTO da classe base, via o orquestrador completo", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(9, "Ladrão"));
    const block = blocks.find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(block).toContain("Ataque Escondido 1d6: atq mantém Invisível se terminar turno em 3/4 ou total");
  });

  it("nível 13: Usar Dispositivo Mágico (sintoniza 4, cargas 1d6, pergaminhos)", () => {
    const joined = getRogueSubclassPrintedBlocks(rogueAt(13, "Ladrão")).join("\n\n");
    expect(joined).toContain("# USAR DISPOSITIVO MÁGICO");
    expect(joined).toContain("Sintoniza 4 itens");
    expect(joined).toContain("Gastar cargas: 1d6, no 6 não gasta");
    expect(joined).toContain("Pergaminhos usam INT; acima do 1º círculo: Arca CD 10+círculo, falha destrói");
  });

  it("nível 17: Reflexos de Ladrão", () => {
    expect(getRogueSubclassPrintedBlocks(rogueAt(17, "Ladrão")).join("\n\n")).toContain("1ª rodada: 2 turnos, na Inic e Inic-10");
  });
});

describe("Trapaceiro Arcano — Mãos Mágicas Ligeiras, Emboscada Mágica, Trapaceiro Versátil, Ladrão de Magias", () => {
  it("nível 3: só Mãos Mágicas Ligeiras; sem tabela/atributo/quantidade de magias impressos aqui", () => {
    const joined = getRogueSubclassPrintedBlocks(rogueAt(3, "Trapaceiro Arcano")).join("\n\n");
    expect(joined).toContain("# MÃOS MÁGICAS LIGEIRAS");
    expect(joined).not.toContain("EMBOSCADA");
    expect(joined).not.toContain("LADRÃO DE MAGIAS");
    expect(joined).not.toContain("Truques");
    expect(joined).not.toContain("círculo");
  });

  it("nível 9: Emboscada Mágica", () => {
    expect(getRogueSubclassPrintedBlocks(rogueAt(9, "Trapaceiro Arcano")).join("\n\n")).toContain("# EMBOSCADA MÁGICA");
  });

  it("nível 13: a linha de Trapaceiro Versátil entra no bloco GOLPE ASTUTO da classe base, nunca título próprio", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(13, "Trapaceiro Arcano"));
    expect(blocks.join("\n\n")).not.toContain("TRAPACEIRO VERSÁTIL");
    const block = blocks.find((b) => b.startsWith("# GOLPE ASTUTO"))!;
    expect(block).toContain("Pode aplicar a opção em outra criatura a 1,5m de Mãos Mágicas");
  });

  it("nível 17: Ladrão de Magias, com a CD de magia RESOLVIDA (nunca o placeholder literal {CDMagia})", () => {
    const character = rogueAt(17, "Trapaceiro Arcano");
    character.abilities.INT.score = 16; // +3
    const joined = getRogueSubclassPrintedBlocks(character).join("\n\n");
    expect(joined).toContain("# LADRÃO DE MAGIAS");
    expect(joined).toContain("Reação à magia: conjurador faz Salv INT CD 17"); // 8 + BP 6 + mod INT 3
    expect(joined).not.toContain("{CDMagia}");
    expect(joined).toContain("Só gasta uso se ele falhar");
  });
});

describe("getRoguePrintedBlocks — classe base + subclasse, nunca duplicando blocos entre si", () => {
  it("Adaga Espiritual nível 17: blocos da classe base E da subclasse presentes, Golpe Astuto aparece 1 única vez", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(17, "Lâmina Psíquica"));
    expect(blocks.filter((b) => b.startsWith("# GOLPE ASTUTO"))).toHaveLength(1);
    expect(blocks.some((b) => b.startsWith("# ATAQUE FURTIVO"))).toBe(true);
    expect(blocks.some((b) => b.startsWith("# RASGAR MENTE"))).toBe(true);
  });

  it("Trapaceiro Arcano nível 20: inclui classe base completa + as 3 características de subclasse", () => {
    const blocks = getRoguePrintedBlocks(rogueAt(20, "Trapaceiro Arcano"));
    const joined = blocks.join("\n\n");
    expect(joined).toContain("# GOLPE DE SORTE");
    expect(joined).toContain("# MÃOS MÁGICAS LIGEIRAS");
    expect(joined).toContain("# EMBOSCADA MÁGICA");
    expect(joined).toContain("# LADRÃO DE MAGIAS");
  });
});
