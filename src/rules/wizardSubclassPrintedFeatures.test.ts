import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getWizardSubclassPrintedBlocks } from "./wizardSubclassPrintedFeatures.js";
import { getWizardPrintedBlocks } from "./wizardPrintedFeatures.js";

function wizardAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("wizard-subclass-printed-test");
  character.classId = "mago";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getWizardSubclassPrintedBlocks — sem subclasse", () => {
  it("sem subclasse escolhida — []", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(5, null))).toEqual([]);
  });
});

describe("Abjurador — Proteção Arcana, Proteção Projetada, Rompe-Magia, Resistência à Magia", () => {
  it("nível 3: só Proteção Arcana (sem Reação a 9m, sem Rompe-Magia/Resistência)", () => {
    const character = wizardAt(3, "Abjurador");
    character.abilities.INT.score = 14; // +2
    const joined = getWizardSubclassPrintedBlocks(character).join("\n\n");
    expect(joined).toContain("# PROTEÇÃO ARCANA");
    expect(joined).toContain("PV __/8"); // 2*3 + 2
    expect(joined).not.toContain("Reação: proteção absorve dano de criatura a 9m");
    expect(joined).not.toContain("ROMPE-MAGIA");
    expect(joined).not.toContain("RESISTÊNCIA À MAGIA");
  });

  it("nível 6: Proteção Projetada entra na MESMA seção Proteção Arcana, nunca título separado", () => {
    const blocks = getWizardSubclassPrintedBlocks(wizardAt(6, "Abjurador"));
    expect(blocks.filter((b) => b.startsWith("# PROTEÇÃO ARCANA"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# PROTEÇÃO ARCANA"))!;
    expect(block).toContain("Reação: proteção absorve dano de criatura a 9m");
  });

  it("nível 10: Rompe-Magia com +BP resolvido no teste", () => {
    const character = wizardAt(10, "Abjurador"); // BP 4
    const joined = getWizardSubclassPrintedBlocks(character).join("\n\n");
    expect(joined).toContain("# ROMPE-MAGIA");
    expect(joined).toContain("Dissipar Magia: AB e +4 no teste");
    expect(joined).toContain("Contramagia/Dissipar Magia: falhou em interromper, não gasta espaço");
  });

  it("nível 14: Resistência à Magia", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(14, "Abjurador")).join("\n\n")).toContain(
      "Vant em Salv contra magias e Res ao dano delas",
    );
  });
});

describe("Adivinho (exibido como Adivinhador) — Prodígio, Perito em Adivinhação, O Terceiro Olho, Prodígio Maior", () => {
  it("nível 3: Prodígio com 2d20/2 marcadores; sem Perito/Terceiro Olho ainda", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(3, "Adivinho")).join("\n\n");
    expect(joined).toContain("# PRODÍGIO");
    expect(joined).toContain("DL: role 2d20 e anote [__] [__]");
    expect(joined).not.toContain("PERITO EM ADIVINHAÇÃO");
    expect(joined).not.toContain("O TERCEIRO OLHO");
  });

  it("nível 14: Prodígio Maior atualiza o MESMO bloco Prodígio para 3d20/3 marcadores, nunca título separado", () => {
    const blocks = getWizardSubclassPrintedBlocks(wizardAt(14, "Adivinho"));
    expect(blocks.filter((b) => b.startsWith("# PRODÍGIO"))).toHaveLength(1);
    const block = blocks.find((b) => b.startsWith("# PRODÍGIO"))!;
    expect(block).toContain("DL: role 3d20 e anote [__] [__] [__]");
    expect(blocks.join("\n\n")).not.toContain("PRODÍGIO MAIOR");
  });

  it("nível 6: Perito em Adivinhação", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(6, "Adivinho")).join("\n\n")).toContain(
      "Adivinhação com espaço de 2º+: recupera 1 espaço inferior, até 5º",
    );
  });

  it("nível 10: O Terceiro Olho com as 3 opções", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(10, "Adivinho")).join("\n\n");
    expect(joined).toContain("# O TERCEIRO OLHO");
    expect(joined).toContain("1: ler qualquer idioma");
    expect(joined).toContain("2: Ver o Invisível sem espaço");
    expect(joined).toContain("3: Visão no Escuro 36m");
  });
});

describe("Evocador — Truque Potente, Esculpir Magias, Evocação Potencializada, Sobrecarga", () => {
  it("nível 3: só Truque Potente", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(3, "Evocador")).join("\n\n");
    expect(joined).toContain("Truque erra/alvo passa Salv: 1/2 dano, sem efeitos adicionais");
    expect(joined).not.toContain("ESCULPIR MAGIAS");
  });

  it("nível 6: Esculpir Magias", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(6, "Evocador")).join("\n\n")).toContain(
      "Evocação: 1+círculo criaturas passam Salv; dano de 1/2 no sucesso vira 0",
    );
  });

  it("nível 10: Evocação Potencializada com mod INT resolvido (nunca mínimo +1)", () => {
    const character = wizardAt(10, "Evocador");
    character.abilities.INT.score = 8; // -1
    expect(getWizardSubclassPrintedBlocks(character).join("\n\n")).toContain("Evocação de Mago: -1 em 1 jogada de dano");
  });

  it("nível 14: Sobrecarga com custo crescente", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(14, "Evocador")).join("\n\n");
    expect(joined).toContain("# SOBRECARGA");
    expect(joined).toContain("1º uso sem dano [__]/DL");
    expect(joined).toContain("Demais usos: 2d12 Necrótico/círculo, +1d12/círculo por novo uso; ignora Res/Imunidade");
  });
});

describe("Ilusionista — Ilusões Aprimoradas, Criaturas Espectrais, Autoimagem Ilusória, Realidade Ilusória", () => {
  it("nível 3: só Ilusões Aprimoradas", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(3, "Ilusionista")).join("\n\n");
    expect(joined).toContain("Ilusão com alcance de 3m+: alcance +18m");
    expect(joined).toContain("Ilusão Menor: AB, som+imagem");
    expect(joined).not.toContain("CRIATURAS ESPECTRAIS");
  });

  it("nível 6: Criaturas Espectrais com os 2 usos gratuitos SEPARADOS (Convocar Feérico e Invocar Fera)", () => {
    const joined = getWizardSubclassPrintedBlocks(wizardAt(6, "Ilusionista")).join("\n\n");
    expect(joined).toContain("# CRIATURAS ESPECTRAIS");
    expect(joined).toContain("Convocar Feérico [__]/DL | Invocar Fera [__]/DL");
  });

  it("nível 10: Autoimagem Ilusória", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(10, "Ilusionista")).join("\n\n")).toContain(
      "Reação ao sofrer acerto: atq erra [__]/DC ou DL",
    );
  });

  it("nível 14: Realidade Ilusória", () => {
    expect(getWizardSubclassPrintedBlocks(wizardAt(14, "Ilusionista")).join("\n\n")).toContain(
      "Ilusão com espaço: torna objeto inanimado não mágico real por 1min",
    );
  });
});

describe("getWizardPrintedBlocks — classe base + subclasse, sem duplicar títulos", () => {
  it("Abjurador nível 14: classe base E subclasse presentes", () => {
    const blocks = getWizardPrintedBlocks(wizardAt(14, "Abjurador"));
    const joined = blocks.join("\n\n");
    expect(joined).toContain("# ADEPTO DE RITUAL");
    expect(joined).toContain("# RECUPERAÇÃO ARCANA");
    expect(joined).toContain("# MEMORIZAR MAGIA");
    expect(joined).toContain("# PROTEÇÃO ARCANA");
    expect(joined).toContain("# ROMPE-MAGIA");
    expect(joined).toContain("# RESISTÊNCIA À MAGIA");
    expect(blocks.filter((b) => b.startsWith("# PROTEÇÃO ARCANA"))).toHaveLength(1);
  });

  it("Evocador nível 20: inclui Maestria/Assinatura da classe base + Sobrecarga da subclasse", () => {
    const joined = getWizardPrintedBlocks(wizardAt(20, "Evocador")).join("\n\n");
    expect(joined).toContain("# MAESTRIA DE MAGIAS");
    expect(joined).toContain("# ASSINATURA MÁGICA");
    expect(joined).toContain("# SOBRECARGA");
  });
});
