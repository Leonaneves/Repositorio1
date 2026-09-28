import type { Character } from "../domain/character.js";
import type { HitDie } from "../data/classes.js";
import {
  BARBARIAN_RAGE_COUNT,
  BARBARIAN_RAGE_DAMAGE,
  BARBARIAN_WEAPON_MASTERIES,
  BARDIC_INSPIRATION_DIE,
  CLERIC_CHANNEL_DIVINITY_USES,
  DRUID_WILD_SHAPE_USES,
  FIGHTER_SECOND_WIND_USES,
  FIGHTER_WEAPON_MASTERIES,
  MONK_FOCUS_POINTS,
  MONK_MARTIAL_ARTS_DIE,
  PALADIN_CHANNEL_DIVINITY_USES,
  RANGER_FAVORED_ENEMY_COUNT,
  ROGUE_SNEAK_ATTACK_DICE,
  SORCERER_SORCERY_POINTS,
  WARLOCK_INVOCATIONS_KNOWN,
} from "../data/classResources.js";

/**
 * Um getter por recurso próprio de classe (§7 da base consolidada de
 * classes) — `null` quando o personagem não é da classe certa, `0`
 * quando é da classe certa mas o recurso ainda não foi concedido
 * naquele nível (a tabela original usa "—"). Nunca deriva o valor de
 * fórmula própria — sempre lê a tabela transcrita em
 * `data/classResources.ts`.
 */

export function getBardicInspirationDie(character: Character): HitDie | null {
  if (character.classId !== "bardo") return null;
  return BARDIC_INSPIRATION_DIE[character.level] ?? null;
}

export function getRageCount(character: Character): number | null {
  if (character.classId !== "barbaro") return null;
  return BARBARIAN_RAGE_COUNT[character.level] ?? 0;
}

export function getRageDamageBonus(character: Character): number | null {
  if (character.classId !== "barbaro") return null;
  return BARBARIAN_RAGE_DAMAGE[character.level] ?? 0;
}

export function getWeaponMasteryCount(character: Character): number | null {
  if (character.classId === "barbaro") return BARBARIAN_WEAPON_MASTERIES[character.level] ?? 0;
  if (character.classId === "guerreiro") return FIGHTER_WEAPON_MASTERIES[character.level] ?? 0;
  return null;
}

export function getInvocationsKnown(character: Character): number | null {
  if (character.classId !== "bruxo") return null;
  return WARLOCK_INVOCATIONS_KNOWN[character.level] ?? 0;
}

export function getChannelDivinityUses(character: Character): number | null {
  if (character.classId === "clerigo") return CLERIC_CHANNEL_DIVINITY_USES[character.level] ?? 0;
  if (character.classId === "paladino") return PALADIN_CHANNEL_DIVINITY_USES[character.level] ?? 0;
  return null;
}

export function getWildShapeUses(character: Character): number | null {
  if (character.classId !== "druida") return null;
  return DRUID_WILD_SHAPE_USES[character.level] ?? 0;
}

export function getSorceryPoints(character: Character): number | null {
  if (character.classId !== "feiticeiro") return null;
  return SORCERER_SORCERY_POINTS[character.level] ?? 0;
}

export function getSecondWindUses(character: Character): number | null {
  if (character.classId !== "guerreiro") return null;
  return FIGHTER_SECOND_WIND_USES[character.level] ?? 0;
}

export function getSneakAttackDice(character: Character): string | null {
  if (character.classId !== "ladino") return null;
  return ROGUE_SNEAK_ATTACK_DICE[character.level] ?? null;
}

export function getMartialArtsDie(character: Character): HitDie | null {
  if (character.classId !== "monge") return null;
  return MONK_MARTIAL_ARTS_DIE[character.level] ?? null;
}

export function getFocusPoints(character: Character): number | null {
  if (character.classId !== "monge") return null;
  return MONK_FOCUS_POINTS[character.level] ?? 0;
}

export function getFavoredEnemyCount(character: Character): number | null {
  if (character.classId !== "patrulheiro") return null;
  return RANGER_FAVORED_ENEMY_COUNT[character.level] ?? 0;
}

/**
 * Quantidade de ataques extras concedidos por "Ataque Extra"/"Dois
 * Ataques Extras"/"Três Ataques Extras" — níveis confirmados
 * diretamente nas tabelas de características por classe (nunca a
 * regra genérica "nível 5" de memória): Guerreiro recebe 3 vezes (5,
 * 11, 20); Bárbaro, Monge, Paladino e Patrulheiro só uma vez (5). As
 * demais classes da base consolidada (Bardo, Bruxo, Clérigo, Druida,
 * Feiticeiro, Ladino, Mago) nunca têm essa feature — devolve 0.
 */
export function getExtraAttacksCount(character: Character): number {
  if (character.classId === "guerreiro") {
    if (character.level >= 20) return 3;
    if (character.level >= 11) return 2;
    if (character.level >= 5) return 1;
    return 0;
  }
  if (
    character.classId === "barbaro" ||
    character.classId === "monge" ||
    character.classId === "paladino" ||
    character.classId === "patrulheiro"
  ) {
    return character.level >= 5 ? 1 : 0;
  }
  return 0;
}
