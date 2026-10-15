import type { Character } from "../domain/character.js";
import {
  getFavoredEnemyCount,
  getFavoredEnemyDie,
  getIndomitableTempHpText,
  getIndomitableUsesCount,
  getNatureVeilUsesCount,
} from "./classResources.js";
import { getSpeed } from "./speed.js";
import { getHunterFavoredEnemyExtraLines } from "./rangerSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão da classe BASE do Patrulheiro (fonte
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §7) — as 4
 * SUBCLASSES continuam em `rules/rangerSubclassPrintedFeatures.ts`
 * (fonte anterior, intocada), exceto pela integração explicitamente
 * pedida: "Marca do Predador" é UM ÚNICO bloco, com as linhas do
 * Caçador (`getHunterFavoredEnemyExtraLines`) entrelaçadas às melhorias
 * da própria classe base (Predador Implacável nível 13, Caçador
 * Preciso nível 17) — nunca dois títulos "MARCA DO PREDADOR" nem dois
 * contadores de usos. A posição deste bloco na lista ordenada fica
 * fixa no nível de aquisição (1), mesmo recebendo melhorias de níveis
 * maiores — mesmo padrão já usado por "Forma Selvagem" do Druida.
 *
 * Nunca aparecem aqui (ficam em Perícias/Proficiências/Idiomas/Magias
 * ou no sistema de Talentos/ASI): Conjuração, Estilo de Luta/Combatente
 * Druídico, Explorador Hábil, Especialista, Subclasse de Patrulheiro,
 * Aumento no Valor de Atributo, Dádiva Épica.
 */

/** `[__]` com espaço entre marcadores, igual ao exemplo literal da fonte ("quatro dados: `[__] [__] [__] [__]`"). */
function checkboxes(count: number): string {
  return Array(Math.max(0, count)).fill("[__]").join(" ");
}

function getMaestriaEmArmaBlock(): string {
  return ["# MAESTRIA EM ARMA", "> 2 tipos de armas com prof; pode trocar em DL"].join("\n");
}

/** Bloco único "Marca do Predador" — base + Predador Implacável(13)/Caçador Preciso(17) + extras do Caçador quando for a subclasse atual. */
function getFavoredEnemyBlock(character: Character): string {
  const die = getFavoredEnemyDie(character) ?? "1d6";
  const count = getFavoredEnemyCount(character) ?? 0;

  const lines = ["# MARCA DO PREDADOR", `> Sem espaço ${checkboxes(count)}/DL | Dano ${die}`];

  if (character.subclassId === "Caçador") {
    lines.push(...getHunterFavoredEnemyExtraLines(character));
  }

  if (character.level >= 13) lines.push("> Dano não quebra Concentração na Marca");
  if (character.level >= 17) lines.push("> Vant nos atq contra o marcado");

  return lines.join("\n");
}

function getExtraAttackBlock(): string {
  return ["# ATAQUE EXTRA", "> Ação Atacar no seu turno: 2 atq"].join("\n");
}

function getWanderBlock(character: Character): string {
  const effectiveSpeed = getSpeed(character).total;
  return ["# ERRANTE", `> Escalada/Natação ${effectiveSpeed}m`].join("\n");
}

function getIndomitableBlock(character: Character): string {
  const tempHp = getIndomitableTempHpText(character) ?? "1d8";
  const uses = getIndomitableUsesCount(character) ?? 0;
  return [
    "# INCANSÁVEL",
    `> Usar Magia: ${tempHp} PV Temporários, mín 1 ${checkboxes(uses)}/DL`,
    "> DC: reduz Exaustão em 1",
  ].join("\n");
}

function getNatureVeilBlock(character: Character): string {
  const uses = getNatureVeilUsesCount(character) ?? 0;
  return ["# VÉU DA NATUREZA", `> AB: Invisível até fim do prxm turno ${checkboxes(uses)}/DL`].join("\n");
}

function getWildSensesBlock(): string {
  return ["# SENTIDOS SELVAGENS", "> Visão às Cegas 9m"].join("\n");
}

/** Blocos da classe BASE do Patrulheiro já adquiridos no nível atual, em ordem de aquisição. */
export function getRangerClassPrintedBlocks(character: Character): string[] {
  if (character.classId !== "patrulheiro") return [];

  const blocks: string[] = [getMaestriaEmArmaBlock(), getFavoredEnemyBlock(character)];

  if (character.level >= 5) blocks.push(getExtraAttackBlock());
  if (character.level >= 6) blocks.push(getWanderBlock(character));
  if (character.level >= 10) blocks.push(getIndomitableBlock(character));
  if (character.level >= 14) blocks.push(getNatureVeilBlock(character));
  if (character.level >= 18) blocks.push(getWildSensesBlock());

  return blocks;
}
