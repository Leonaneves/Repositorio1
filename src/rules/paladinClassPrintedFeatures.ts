import type { Character } from "../domain/character.js";
import { getChannelDivinityUses, getExtraAttacksCount, getMaosConsagradasMax, getPaladinAuraBonus, getPaladinAuraRange, getRepudiarInimigosTargetCount } from "./classResources.js";
import { getSpellSaveDC } from "./spellcasting.js";
import {
  getPaladinAuraExtraLines,
  getPaladinAuraImmunityConditions,
  getPaladinChannelDivinityOptionLines,
  getPaladinDivineSmiteExtraLines,
} from "./paladinSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão da classe BASE do Paladino (fonte
 * "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §7) —
 * mesma arquitetura de `rules/clericPrintedFeatures.ts`: "Canalizar
 * Divindade" é um recurso ÚNICO — o bloco impresso sempre começa com
 * as linhas-base (Sentido Divino, e Repudiar Inimigos a partir do
 * nível 9) e depois anexa as linhas do Juramento escolhido
 * (`getPaladinChannelDivinityOptionLines`) — nunca um segundo conjunto
 * de checkboxes. "Aura de Coragem" (10) e "Aura Expandida" (18) NUNCA
 * criam bloco próprio: atualizam o bloco de "Aura de Proteção" já
 * existente, que também recebe as linhas extras do Juramento (imunidade
 * somada, Vivacidade, Resistência). "Toque Restaurador" (14) substitui
 * a 2ª linha de "Mãos Consagradas" pela versão com remoção de
 * condições, nunca um contador novo. "Destruição Protetora" (Juramento
 * da Devoção, 15) acrescenta 1 linha ao bloco "Destruição do Paladino".
 *
 * Nunca aparecem aqui (ficam em Perícias/Proficiências/Magias/Talentos
 * ou no sistema de Talentos/ASI genérico): Conjuração, Estilo de Luta
 * (rules/fightingStyles.ts#getFightingStyleTalentEntries), Subclasse de
 * Paladino, Aumento no Valor de Atributo, Dádiva Épica.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function getWeaponMasteryBlock(): string {
  return ["# MAESTRIA EM ARMA", "> 2 tipos de armas proficientes, pode trocar em DL"].join("\n");
}

function getLayOnHandsBlock(character: Character): string {
  const max = getMaosConsagradasMax(character) ?? 0;
  const lines = ["# MÃOS CONSAGRADAS", `> Reserva [____]/${max} PV, recupera em DL`];
  if (character.level >= 14) {
    lines.push("> AB toque: cura ou gasta 5 PV por condição removida", "> Envenenado/Amedrontado/Atordoado/Cego/Enfeitiçado/Paralisado/Surdo");
  } else {
    lines.push("> AB toque: gasta reserva para curar ou 5 PV para remover Envenenado");
  }
  return lines.join("\n");
}

function getDivineSmiteBlock(character: Character): string {
  const lines = ["# DESTRUIÇÃO DO PALADINO", "> Destruição Divina sem espaço [__]/DL"];
  lines.push(...getPaladinDivineSmiteExtraLines(character));
  return lines.join("\n");
}

function getChannelDivinityBlock(character: Character): string {
  const uses = getChannelDivinityUses(character) ?? 0;
  const cd = getSpellSaveDC(character)?.total ?? "—";

  const lines = [
    "# CANALIZAR DIVINDADE",
    `> ${checkboxes(uses)} | DC: recupera 1 DL: todos | CD ${cd}`,
    "> Cada opção abaixo gasta 1 uso",
    "> Sentido Divino: AB, detecta Celestiais/Ínferos/Mortos-Vivos e consagrado/profanado a 18m",
    "> Dura 10min ou até Incapacitado",
  ];

  if (character.level >= 9) {
    const targetCount = getRepudiarInimigosTargetCount(character) ?? 1;
    lines.push(`> Repudiar Inimigos: Usar Magia, ${targetCount} alvos a 18m, Salv SAB`, "> Falha: Amedrontado 1min ou dano; no turno só mover ou ação ou AB");
  }

  lines.push(...getPaladinChannelDivinityOptionLines(character));

  return lines.join("\n");
}

function getFaithfulSteedBlock(): string {
  return ["# MONTARIA FIEL", "> Convocar Montaria sem espaço [__]/DL"].join("\n");
}

function getAuraOfProtectionBlock(character: Character): string {
  const range = getPaladinAuraRange(character) ?? 3;
  const bonus = getPaladinAuraBonus(character) ?? 1;
  const lines = ["# AURA DE PROTEÇÃO", `> Você e aliados a ${range}m: +${bonus} Salv, inativa Incapacitado`];

  const immunities: string[] = [];
  if (character.level >= 10) immunities.push("Amedrontado");
  immunities.push(...getPaladinAuraImmunityConditions(character));
  if (immunities.length > 0) lines.push(`> Imunidade a ${immunities.join("/")} na aura`);

  lines.push(...getPaladinAuraExtraLines(character));

  return lines.join("\n");
}

function getExtraAttackBlock(character: Character): string {
  const totalAttacks = 1 + getExtraAttacksCount(character);
  return ["# ATAQUE EXTRA", `> Ação Atacar = ${totalAttacks} Atq`].join("\n");
}

function getRadiantStrikesBlock(): string {
  return ["# GOLPES RADIANTES", "> Acerto com arma Corpo a Corpo/Atq Desarmado: +1d8 Radiante"].join("\n");
}

/**
 * Blocos da classe BASE do Paladino já adquiridos no nível atual, em
 * ordem de aquisição — nunca um sort genérico que separe Canalizar
 * Divindade/Aura de Proteção das próprias linhas extras do Juramento
 * (ambas ficam SEMPRE no nível de aquisição do recurso-base, mesmo
 * contendo linhas de subclasse de nível maior).
 */
export function getPaladinClassPrintedBlocks(character: Character): string[] {
  if (character.classId !== "paladino") return [];

  const blocks: string[] = [getWeaponMasteryBlock(), getLayOnHandsBlock(character)];

  if (character.level >= 2) blocks.push(getDivineSmiteBlock(character));
  if (character.level >= 3) blocks.push(getChannelDivinityBlock(character));
  if (character.level >= 5) {
    blocks.push(getFaithfulSteedBlock());
    blocks.push(getExtraAttackBlock(character));
  }
  if (character.level >= 6) blocks.push(getAuraOfProtectionBlock(character));
  if (character.level >= 11) blocks.push(getRadiantStrikesBlock());

  return blocks;
}
