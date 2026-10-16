import type { Character } from "../domain/character.js";
import { getProficiencyBonus } from "./abilities.js";
import { getAbjurerArcaneWardMaxHp, getDivinationProdigyDiceCount, getEvocationPotentIntBonus } from "./classResources.js";

/**
 * Texto compacto para impressão das 4 subclasses de Mago (fonte
 * "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" §8-§11) —
 * cada subclasse tem sua PRÓPRIA função com ORDEM FIXA de blocos,
 * mesmo padrão de `rules/rogueSubclassPrintedFeatures.ts`. A classe
 * BASE (Adepto de Ritual, Recuperação Arcana, Memorizar Magia, Maestria
 * de Magias, Assinatura Mágica) mora em `rules/wizardClassPrintedFeatures.ts`
 * — este arquivo só acrescenta o que é exclusivo de cada subclasse,
 * inclusive a linha de "Proteção Projetada" que se funde ao bloco
 * "PROTEÇÃO ARCANA" (nunca um título duplicado). "Versado" NUNCA
 * aparece aqui — vai só para a integração de Magias.
 */

function checkboxes(count: number): string {
  return Array(Math.max(0, count)).fill("[__]").join(" ");
}

// ---------- Abjurador ----------
function getAbjurerBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const maxHp = getAbjurerArcaneWardMaxHp(character) ?? 0;
  const lines = [
    "# PROTEÇÃO ARCANA",
    `> Abjuração com espaço cria proteção [__]/DL; PV __/${maxHp}`,
    "> Absorve dano após Res/Vulnerabilidade; excedente atinge você; dura até DL",
  ];
  if (character.level >= 6) {
    lines.push("> Reação: proteção absorve dano de criatura a 9m");
  }
  lines.push("> Abjuração com espaço ou AB gastando espaço: recupera 2x círculo em PV");
  blocks.push(lines.join("\n"));

  if (character.level >= 10) {
    blocks.push(
      [
        "# ROMPE-MAGIA",
        `> Dissipar Magia: AB e +${getProficiencyBonus(character.level)} no teste`,
        "> Contramagia/Dissipar Magia: falhou em interromper, não gasta espaço",
      ].join("\n"),
    );
  }

  if (character.level >= 14) {
    blocks.push(["# RESISTÊNCIA À MAGIA", "> Vant em Salv contra magias e Res ao dano delas"].join("\n"));
  }

  return blocks;
}

// ---------- Adivinho (exibido como "Adivinhador") ----------
function getDivinerBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const diceCount = getDivinationProdigyDiceCount(character) ?? 2;
  blocks.push(
    [
      "# PRODÍGIO",
      `> DL: role ${diceCount}d20 e anote ${checkboxes(diceCount)}`,
      "> Antes do Teste de D20 seu/de outra criatura: substitua por 1 resultado, 1/turno",
      "> Cada resultado 1 uso; DL descarta os antigos",
    ].join("\n"),
  );

  if (character.level >= 6) {
    blocks.push(["# PERITO EM ADIVINHAÇÃO", "> Adivinhação com espaço de 2º+: recupera 1 espaço inferior, até 5º"].join("\n"));
  }

  if (character.level >= 10) {
    blocks.push(
      [
        "# O TERCEIRO OLHO",
        "> AB escolha 1 até iniciar DC/DL [__]/DC ou DL",
        "> 1: ler qualquer idioma",
        "> 2: Ver o Invisível sem espaço",
        "> 3: Visão no Escuro 36m",
      ].join("\n"),
    );
  }

  return blocks;
}

// ---------- Evocador ----------
function getEvokerBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(["# TRUQUE POTENTE", "> Truque erra/alvo passa Salv: 1/2 dano, sem efeitos adicionais"].join("\n"));

  if (character.level >= 6) {
    blocks.push(["# ESCULPIR MAGIAS", "> Evocação: 1+círculo criaturas passam Salv; dano de 1/2 no sucesso vira 0"].join("\n"));
  }

  if (character.level >= 10) {
    const bonus = getEvocationPotentIntBonus(character) ?? 0;
    const sign = bonus >= 0 ? "+" : "";
    blocks.push(["# EVOCAÇÃO POTENCIALIZADA", `> Evocação de Mago: ${sign}${bonus} em 1 jogada de dano`].join("\n"));
  }

  if (character.level >= 14) {
    blocks.push(
      [
        "# SOBRECARGA",
        "> Magia de Mago com espaço de 1º-5º: dano máximo no turno da conjuração",
        "> 1º uso sem dano [__]/DL",
        "> Demais usos: 2d12 Necrótico/círculo, +1d12/círculo por novo uso; ignora Res/Imunidade",
      ].join("\n"),
    );
  }

  return blocks;
}

// ---------- Ilusionista ----------
function getIllusionistBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(["# ILUSÕES APRIMORADAS", "> Ilusão com alcance de 3m+: alcance +18m", "> Ilusão Menor: AB, som+imagem"].join("\n"));

  if (character.level >= 6) {
    blocks.push(
      [
        "# CRIATURAS ESPECTRAIS",
        "> Convocar Feérico/Invocar Fera podem virar Ilusão",
        "> Sem espaço, versão Ilusão com 1/2 PV:",
        "> Convocar Feérico [__]/DL | Invocar Fera [__]/DL",
      ].join("\n"),
    );
  }

  if (character.level >= 10) {
    blocks.push(
      ["# AUTOIMAGEM ILUSÓRIA", "> Reação ao sofrer acerto: atq erra [__]/DC ou DL", "> Espaço de 2º+ recupera uso sem ação"].join("\n"),
    );
  }

  if (character.level >= 14) {
    blocks.push(
      [
        "# REALIDADE ILUSÓRIA",
        "> Ilusão com espaço: torna objeto inanimado não mágico real por 1min",
        "> Ao conjurar ou AB durante a magia; objeto não causa dano/condições",
      ].join("\n"),
    );
  }

  return blocks;
}

/** Blocos da subclasse ATUAL do Mago — `[]` sem subclasse escolhida ou para qualquer outra classe. */
export function getWizardSubclassPrintedBlocks(character: Character): string[] {
  if (character.subclassId === "Abjurador") return getAbjurerBlocks(character);
  if (character.subclassId === "Adivinho") return getDivinerBlocks(character);
  if (character.subclassId === "Evocador") return getEvokerBlocks(character);
  if (character.subclassId === "Ilusionista") return getIllusionistBlocks(character);
  return [];
}
