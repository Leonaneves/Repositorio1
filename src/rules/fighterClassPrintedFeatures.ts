import type { Character } from "../domain/character.js";
import {
  getActionSurgeUsesCount,
  getExtraAttacksCount,
  getFighterIndomitableRerollUsesCount,
  getSecondWindHealingText,
  getSecondWindUses,
  getWeaponMasteryCount,
} from "./classResources.js";
import { getEldritchKnightActionSurgeExtraLines } from "./fighterSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão da classe BASE do Guerreiro (fonte
 * "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF" §9) — as 4
 * SUBCLASSES continuam em `rules/fighterSubclassPrintedFeatures.ts`
 * (fonte anterior, intocada), exceto pela integração explicitamente
 * pedida: a linha de Investida Mística do Cavaleiro Místico entra no
 * MESMO bloco "SURTO DE AÇÃO" da classe base (via
 * `getEldritchKnightActionSurgeExtraLines`) — nunca um segundo título
 * nem um contador separado de Surto de Ação.
 *
 * Nunca aparecem aqui (ficam na caixa de Talentos ou no sistema de
 * ASI/Dádiva Épica genérico): Estilo de Luta — base e o adicional do
 * Campeão (`rules/fighterTalentEntries.ts`) —, Manobras escolhidas,
 * Subclasse de Guerreiro, Aumento no Valor de Atributo, Dádiva Épica.
 */

/** `[__]` com espaço entre marcadores, igual ao exemplo literal da fonte. */
function checkboxes(count: number): string {
  return Array(Math.max(0, count)).fill("[__]").join(" ");
}

/** Bloco único "Recuperar Fôlego" — base + Mente Tática (nível 2+) + Ajuste Tático (nível 5+), nunca títulos separados. */
function getSecondWindBlock(character: Character): string {
  const healing = getSecondWindHealingText(character) ?? "1d10";
  const uses = getSecondWindUses(character) ?? 0;

  const lines = ["# RECUPERAR FÔLEGO", `> AB: recupera ${healing} PV ${checkboxes(uses)}`];
  if (character.level >= 5) lines.push("> Usar essa AB: move 1/2 desl sem Atq de Oport");
  lines.push("> DC: recupera 1 uso DL: todos");
  if (character.level >= 2) lines.push("> Falha em teste: +1d10 em vez de curar; gasta uso se passar");

  return lines.join("\n");
}

/** Bloco único "Maestria em Arma" — base + Mestre Tático (nível 9+), nunca título separado. */
function getWeaponMasteryBlock(character: Character): string {
  const count = getWeaponMasteryCount(character) ?? 0;
  const lines = ["# MAESTRIA EM ARMA", `> ${count} tipos de armas Simples/Marciais; troca 1 em DL`];
  if (character.level >= 9) lines.push("> Por atq com maestria: pode trocar por Empurrar/Drenar/Lentidão");
  return lines.join("\n");
}

/** Bloco único "Surto de Ação" — base + Investida Mística do Cavaleiro Místico (nível 15+), nunca título/contador separado. */
function getActionSurgeBlock(character: Character): string {
  const uses = getActionSurgeUsesCount(character) ?? 0;
  const lines = ["# SURTO DE AÇÃO", `> +1 ação exceto Usar Magia, 1/turno ${checkboxes(uses)}/DC ou DL`];
  lines.push(...getEldritchKnightActionSurgeExtraLines(character));
  return lines.join("\n");
}

/** Bloco único "Ataque Extra" — já resolve Dois/Três Ataques Extras como atualização da mesma quantidade, nunca títulos separados. */
function getExtraAttackBlock(character: Character): string {
  const totalAttacks = 1 + getExtraAttacksCount(character);
  return ["# ATAQUE EXTRA", `> Ação Atacar = ${totalAttacks} atq`].join("\n");
}

function getIndomitableBlock(character: Character): string {
  const uses = getFighterIndomitableRerollUsesCount(character) ?? 0;
  return ["# INDOMÁVEL", `> Falhou Salv: refaz +${character.level}, usa novo resultado ${checkboxes(uses)}/DL`].join("\n");
}

function getStudiedAttacksBlock(): string {
  return ["# ATAQUES ESTUDADOS", "> Errou atq: Vant no prxm atq contra mesmo alvo"].join("\n");
}

/** Blocos da classe BASE do Guerreiro já adquiridos no nível atual, em ordem de aquisição. */
export function getFighterClassPrintedBlocks(character: Character): string[] {
  if (character.classId !== "guerreiro") return [];

  const blocks: string[] = [getWeaponMasteryBlock(character), getSecondWindBlock(character)];

  if (character.level >= 2) blocks.push(getActionSurgeBlock(character));
  if (character.level >= 5) blocks.push(getExtraAttackBlock(character));
  if (character.level >= 9) blocks.push(getIndomitableBlock(character));
  if (character.level >= 13) blocks.push(getStudiedAttacksBlock());

  return blocks;
}
