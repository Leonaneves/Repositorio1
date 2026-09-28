import type { Character } from "../domain/character.js";
import type { ClassId } from "../domain/ids.js";
import type { SpellCircle } from "../domain/ids.js";
import { classes, type HitDie } from "../data/classes.js";
import { PACT_MAGIC_TABLE, type PactMagicState } from "../data/spellProgression.js";
import { getMaxHitDice } from "./hp.js";
import { getSpellSlots } from "./spellcasting.js";
import {
  getBardicInspirationDie,
  getCantripsKnown,
  getChannelDivinityUses,
  getExtraAttacksCount,
  getFavoredEnemyCount,
  getFocusPoints,
  getInfusedItemsMax,
  getInfusionsKnown,
  getInvocationsKnown,
  getMartialArtsDie,
  getRageCount,
  getRageDamageBonus,
  getSecondWindUses,
  getSneakAttackDice,
  getSorceryPoints,
  getSpellsPreparedMax,
  getWeaponMasteryCount,
  getWildShapeUses,
} from "./classResources.js";

export interface ClassProgressionResources {
  rageCount: number | null;
  rageDamageBonus: number | null;
  weaponMasteryCount: number | null;
  bardicInspirationDie: HitDie | null;
  invocationsKnown: number | null;
  channelDivinityUses: number | null;
  wildShapeUses: number | null;
  sorceryPoints: number | null;
  secondWindUses: number | null;
  sneakAttackDice: string | null;
  martialArtsDie: HitDie | null;
  focusPoints: number | null;
  favoredEnemyCount: number | null;
  /** Só o Artífice tem Infusões Conhecidas/Itens Infundidos — `null` para todas as outras classes. */
  infusionsKnown: number | null;
  infusedItemsMax: number | null;
}

export interface ClassProgressionSnapshot {
  classId: ClassId | null;
  level: number;
  hitDie: HitDie | null;
  hitDiceMax: number;
  /** `null` para Paladino/Patrulheiro (sem truques de classe) e para quem não conjura. */
  cantripsKnown: number | null;
  /** `null` para quem não prepara magias (inclui Bruxo, que usa `pactMagic` em vez de espaços comuns). */
  spellsPreparedMax: number | null;
  spellSlots: Record<SpellCircle, number>;
  /** Só o Bruxo tem Magia de Pacto — `null` para todas as outras classes. */
  pactMagic: PactMagicState | null;
  extraAttacks: number;
  resources: ClassProgressionResources;
}

/**
 * Único ponto de consulta para "tudo que uma classe concede num dado
 * nível" — junta Dado de Vida, truques/magias/espaços de magia
 * (incluindo Magia de Pacto do Bruxo), ataques extras e os recursos
 * próprios de cada classe (§7 da base consolidada) num objeto só,
 * consultável diretamente pelo motor/Builder/PDF. Nunca faz a UI (ou
 * qualquer outro consumidor) interpretar string de tabela — cada campo
 * já vem como número/objeto pronto, lido das tabelas de
 * `data/classResources.ts`/`data/spellProgression.ts`.
 */
export function getClassProgression(character: Character): ClassProgressionSnapshot {
  return {
    classId: character.classId,
    level: character.level,
    hitDie: character.classId ? classes[character.classId].hitDie : null,
    hitDiceMax: getMaxHitDice(character),
    cantripsKnown: getCantripsKnown(character),
    spellsPreparedMax: getSpellsPreparedMax(character),
    spellSlots: getSpellSlots(character),
    pactMagic: character.classId === "bruxo" ? (PACT_MAGIC_TABLE[character.level] ?? null) : null,
    extraAttacks: getExtraAttacksCount(character),
    resources: {
      rageCount: getRageCount(character),
      rageDamageBonus: getRageDamageBonus(character),
      weaponMasteryCount: getWeaponMasteryCount(character),
      bardicInspirationDie: getBardicInspirationDie(character),
      invocationsKnown: getInvocationsKnown(character),
      channelDivinityUses: getChannelDivinityUses(character),
      wildShapeUses: getWildShapeUses(character),
      sorceryPoints: getSorceryPoints(character),
      secondWindUses: getSecondWindUses(character),
      sneakAttackDice: getSneakAttackDice(character),
      martialArtsDie: getMartialArtsDie(character),
      focusPoints: getFocusPoints(character),
      favoredEnemyCount: getFavoredEnemyCount(character),
      infusionsKnown: getInfusionsKnown(character),
      infusedItemsMax: getInfusedItemsMax(character),
    },
  };
}
