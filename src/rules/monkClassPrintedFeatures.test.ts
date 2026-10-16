import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getMonkClassPrintedBlocks } from "./monkClassPrintedFeatures.js";

function monkAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("monk-class-printed-test");
  character.classId = "monge";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.DEX.score = 14; // +2
  character.abilities.SAB.score = 16; // +3
  return character;
}

describe("getMonkClassPrintedBlocks — classe diferente", () => {
  it("classe diferente de Monge — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getMonkClassPrintedBlocks(character)).toEqual([]);
  });
});

describe("Artes Marciais — sempre presente desde o nível 1; Energético a partir do nível 6 (Golpes Potencializados)", () => {
  it("nível 1: sem linha de Energético", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(1)).join("\n\n");
    expect(joined).toContain("# ARTES MARCIAIS");
    expect(joined).not.toContain("pode causar Energético");
  });

  it("nível 6: acrescenta a linha de Energético, sem título separado para Golpes Potencializados", () => {
    const blocks = getMonkClassPrintedBlocks(monkAt(6));
    expect(blocks.filter((b) => b.startsWith("# ARTES MARCIAIS"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain("> Atq Desarmado: pode causar Energético");
    expect(blocks.join("\n\n")).not.toContain("GOLPES POTENCIALIZADOS");
  });
});

describe("Foco — marcadores por nível, Defesa Paciente/Passo do Vento/Torrente, Foco Aprimorado no nível 10", () => {
  it("nível 1: sem bloco de Foco (ainda não existe)", () => {
    expect(getMonkClassPrintedBlocks(monkAt(1)).join("\n\n")).not.toContain("# FOCO");
  });

  it("nível 2: 2 marcadores, Torrente com 2 Atq Desarmado, sem as melhorias do nível 10", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(2)).join("\n\n");
    expect(joined).toContain("# FOCO");
    expect(joined).toContain("[__][__]/DC ou DL");
    expect(joined).toContain("Torrente de Golpes: AB+1 Foco: 2 Atq Desarmado");
    expect(joined).not.toContain("PV Temp");
    expect(joined).not.toContain("voluntário Grande ou menor");
  });

  it("nível 10 (Foco Aprimorado): Torrente passa a 3 Atq, insere PV Temp após Defesa Paciente e o aliado após Passo do Vento — nunca título separado", () => {
    const blocks = getMonkClassPrintedBlocks(monkAt(10));
    expect(blocks.filter((b) => b.startsWith("# FOCO"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# FOCO"))!;
    expect(block).toContain("Torrente de Golpes: AB+1 Foco: 3 Atq Desarmado");
    expect(block).toContain("com Foco +Esquivar e 2d8 PV Temp");
    expect(block).toContain("leva 1 voluntário Grande/menor 1,5m sem Atq de Oport");
    expect(blocks.join("\n\n")).not.toContain("FOCO APRIMORADO");

    // ordem: Defesa Paciente (com PV Temp na mesma linha) -> Passo do Vento (com aliado na mesma linha) -> Torrente
    const patientIndex = block.indexOf("Defesa Paciente");
    const windStepIndex = block.indexOf("Passo do Vento");
    const flurryIndex = block.indexOf("Torrente de Golpes");
    expect(patientIndex).toBeLessThan(windStepIndex);
    expect(windStepIndex).toBeLessThan(flurryIndex);
  });

  it("extraLines.afterWindStep é injetado logo depois do grupo de Passo do Vento", () => {
    const block = getMonkClassPrintedBlocks(monkAt(11), { afterWindStep: ["> linha extra de teste"] }).find((b) => b.startsWith("# FOCO"))!;
    expect(block).toContain("> linha extra de teste");
    expect(block.indexOf("> linha extra de teste")).toBeLessThan(block.indexOf("Torrente de Golpes"));
  });
});

describe("Metabolismo Incomum — cura resolvida, Foco Perfeito a partir do nível 15", () => {
  it("nível 2: cura 1d6+2, sem a linha de Foco Perfeito", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(2)).join("\n\n");
    expect(joined).toContain("# METABOLISMO INCOMUM");
    expect(joined).toContain("cura 1d6+2 [__]/DL");
    expect(joined).not.toContain("recupera Foco até 4");
  });

  it("nível 15: acrescenta a linha de Foco Perfeito no MESMO bloco, nunca título separado", () => {
    const blocks = getMonkClassPrintedBlocks(monkAt(15));
    expect(blocks.filter((b) => b.startsWith("# METABOLISMO INCOMUM"))).toHaveLength(1);
    expect(blocks.join("\n\n")).toContain("> Inic sem Metabolismo: recupera Foco até 4 se tiver menos");
    expect(blocks.join("\n\n")).not.toContain("FOCO PERFEITO");
  });
});

describe("Defletir Ataques — redução/redirecionamento resolvidos, Defletir Energia no nível 13", () => {
  it("nível 3: restrito a Conc/Cort/Perf", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(3)).join("\n\n");
    expect(joined).toContain("# DEFLETIR ATAQUES");
    expect(joined).toContain("Reação ao sofrer Atq Conc/Cort/Perf: reduz 1d10+5");
    expect(joined).toContain("falha 2d6+2 mesmo tipo");
  });

  it("nível 13: primeira linha substituída (sem restrição de tipo), preservando o resto, nunca bloco separado", () => {
    const blocks = getMonkClassPrintedBlocks(monkAt(13));
    expect(blocks.filter((b) => b.startsWith("# DEFLETIR ATAQUES"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# DEFLETIR ATAQUES"))!;
    expect(block).toContain("Reação ao sofrer Atq: reduz 1d10+15");
    expect(block).not.toContain("Conc/Cort/Perf");
    expect(block).toContain("falha 2d10+2 mesmo tipo");
    expect(blocks.join("\n\n")).not.toContain("DEFLETIR ENERGIA");
  });
});

describe("Queda Lenta — 5 × nível de Monge", () => {
  it("nível 4: reduz 20", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(4)).join("\n\n");
    expect(joined).toContain("# QUEDA LENTA");
    expect(joined).toContain("reduz dano em 20");
  });

  it("ausente abaixo do nível 4", () => {
    expect(getMonkClassPrintedBlocks(monkAt(3)).join("\n\n")).not.toContain("QUEDA LENTA");
  });
});

describe("Ataque Extra — nível 5, hardcoded (Monge nunca passa de 2 Atq)", () => {
  it("ausente abaixo do nível 5, presente a partir dele", () => {
    expect(getMonkClassPrintedBlocks(monkAt(4)).join("\n\n")).not.toContain("ATAQUE EXTRA");
    expect(getMonkClassPrintedBlocks(monkAt(5)).join("\n\n")).toContain("# ATAQUE EXTRA\n> Ação Atacar = 2 Atq");
  });
});

describe("Golpe Atordoante — CD de Foco resolvida (8 + mod SAB + BP)", () => {
  it("nível 5 (BP 3, mod SAB +3): CD 14", () => {
    expect(getMonkClassPrintedBlocks(monkAt(5)).join("\n\n")).toContain("CD 14");
  });
});

describe("Evasão/Movimento Acrobático/Restauro Pessoal/Sobrevivente Disciplinado/Defesa Superior — gates de nível", () => {
  it("Evasão a partir do nível 7", () => {
    expect(getMonkClassPrintedBlocks(monkAt(6)).join("\n\n")).not.toContain("EVASÃO");
    expect(getMonkClassPrintedBlocks(monkAt(7)).join("\n\n")).toContain("# EVASÃO");
  });

  it("Movimento Acrobático a partir do nível 9", () => {
    expect(getMonkClassPrintedBlocks(monkAt(8)).join("\n\n")).not.toContain("MOVIMENTO ACROBÁTICO");
    expect(getMonkClassPrintedBlocks(monkAt(9)).join("\n\n")).toContain("# MOVIMENTO ACROBÁTICO");
  });

  it("Restauro Pessoal a partir do nível 10", () => {
    expect(getMonkClassPrintedBlocks(monkAt(9)).join("\n\n")).not.toContain("RESTAURO PESSOAL");
    expect(getMonkClassPrintedBlocks(monkAt(10)).join("\n\n")).toContain("# RESTAURO PESSOAL");
  });

  it("Sobrevivente Disciplinado a partir do nível 14", () => {
    expect(getMonkClassPrintedBlocks(monkAt(13)).join("\n\n")).not.toContain("SOBREVIVENTE DISCIPLINADO");
    expect(getMonkClassPrintedBlocks(monkAt(14)).join("\n\n")).toContain("# SOBREVIVENTE DISCIPLINADO");
  });

  it("Defesa Superior a partir do nível 18", () => {
    expect(getMonkClassPrintedBlocks(monkAt(17)).join("\n\n")).not.toContain("DEFESA SUPERIOR");
    expect(getMonkClassPrintedBlocks(monkAt(18)).join("\n\n")).toContain("# DEFESA SUPERIOR");
  });
});

describe("Nunca aparecem aqui (auto-visíveis em campo próprio, ou resolvidos em Talentos)", () => {
  it("Defesa sem Armadura, Movimento sem Armadura, Corpo e Mente, Subclasse, ASI e Dádiva Épica nunca aparecem", () => {
    const joined = getMonkClassPrintedBlocks(monkAt(20)).join("\n\n");
    expect(joined).not.toContain("DEFESA SEM ARMADURA");
    expect(joined).not.toContain("MOVIMENTO SEM ARMADURA");
    expect(joined).not.toContain("CORPO E MENTE");
    expect(joined).not.toContain("SUBCLASSE DE MONGE");
    expect(joined).not.toContain("AUMENTO NO VALOR DE ATRIBUTO");
    expect(joined).not.toContain("DÁDIVA ÉPICA");
  });
});
