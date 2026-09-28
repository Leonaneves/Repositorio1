import type { Character } from "../domain/character.js";
import type { HitDie } from "../data/classes.js";
import {
  ARTIFICER_CANTRIPS_KNOWN,
  ARTIFICER_INFUSED_ITEMS_MAX,
  ARTIFICER_INFUSIONS_KNOWN,
  BARBARIAN_RAGE_COUNT,
  BARBARIAN_RAGE_DAMAGE,
  BARBARIAN_WEAPON_MASTERIES,
  BARD_CANTRIPS_KNOWN,
  BARD_SPELLS_PREPARED,
  BARDIC_INSPIRATION_DIE,
  CLERIC_CANTRIPS_KNOWN,
  CLERIC_CHANNEL_DIVINITY_USES,
  CLERIC_SPELLS_PREPARED,
  DRUID_CANTRIPS_KNOWN,
  DRUID_SPELLS_PREPARED,
  DRUID_WILD_SHAPE_USES,
  FIGHTER_SECOND_WIND_USES,
  FIGHTER_WEAPON_MASTERIES,
  MONK_FOCUS_POINTS,
  MONK_MARTIAL_ARTS_DIE,
  PALADIN_CHANNEL_DIVINITY_USES,
  PALADIN_SPELLS_PREPARED,
  RANGER_FAVORED_ENEMY_COUNT,
  RANGER_SPELLS_PREPARED,
  ROGUE_SNEAK_ATTACK_DICE,
  SORCERER_CANTRIPS_KNOWN,
  SORCERER_SORCERY_POINTS,
  SORCERER_SPELLS_PREPARED,
  WARLOCK_CANTRIPS_KNOWN,
  WARLOCK_INVOCATIONS_KNOWN,
  WARLOCK_SPELLS_PREPARED,
  WIZARD_CANTRIPS_KNOWN,
  WIZARD_SPELLS_PREPARED,
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

const CANTRIPS_KNOWN_TABLES = {
  artifice: ARTIFICER_CANTRIPS_KNOWN,
  bardo: BARD_CANTRIPS_KNOWN,
  bruxo: WARLOCK_CANTRIPS_KNOWN,
  clerigo: CLERIC_CANTRIPS_KNOWN,
  druida: DRUID_CANTRIPS_KNOWN,
  feiticeiro: SORCERER_CANTRIPS_KNOWN,
  mago: WIZARD_CANTRIPS_KNOWN,
} as const;

const SPELLS_PREPARED_TABLES = {
  bardo: BARD_SPELLS_PREPARED,
  bruxo: WARLOCK_SPELLS_PREPARED,
  clerigo: CLERIC_SPELLS_PREPARED,
  druida: DRUID_SPELLS_PREPARED,
  feiticeiro: SORCERER_SPELLS_PREPARED,
  mago: WIZARD_SPELLS_PREPARED,
  paladino: PALADIN_SPELLS_PREPARED,
  patrulheiro: RANGER_SPELLS_PREPARED,
} as const;

/**
 * Truques conhecidos, por nível — coluna "Truques" da tabela da
 * classe. Paladino e Patrulheiro não têm essa coluna (meio-conjuradores
 * sem truques de classe no PHB 2024): `null`, nunca `0`.
 */
export function getCantripsKnown(character: Character): number | null {
  if (!character.classId || !(character.classId in CANTRIPS_KNOWN_TABLES)) return null;
  const table = CANTRIPS_KNOWN_TABLES[character.classId as keyof typeof CANTRIPS_KNOWN_TABLES];
  return table[character.level] ?? 0;
}

/** Magias Preparadas máximas, por nível — coluna "Magias Preparadas" da tabela da classe. */
export function getSpellsPreparedMax(character: Character): number | null {
  if (!character.classId || !(character.classId in SPELLS_PREPARED_TABLES)) return null;
  const table = SPELLS_PREPARED_TABLES[character.classId as keyof typeof SPELLS_PREPARED_TABLES];
  return table[character.level] ?? 0;
}

/** Infusões Conhecidas do Artífice, por nível — `null` para as demais classes, `0` no nível 1 (indisponível na fonte). */
export function getInfusionsKnown(character: Character): number | null {
  if (character.classId !== "artifice") return null;
  return ARTIFICER_INFUSIONS_KNOWN[character.level] ?? 0;
}

/** Itens Infundidos (máximo simultâneo) do Artífice, por nível — `null` para as demais classes, `0` no nível 1 (indisponível na fonte). */
export function getInfusedItemsMax(character: Character): number | null {
  if (character.classId !== "artifice") return null;
  return ARTIFICER_INFUSED_ITEMS_MAX[character.level] ?? 0;
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
