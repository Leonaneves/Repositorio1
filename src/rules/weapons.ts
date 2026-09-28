import { type AbilityKey, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { weapons, weaponsById, type WeaponCategory, type WeaponDefinition } from "../data/weapons.js";
import { getAttackBonus } from "./attack.js";

export { weapons, weaponsById };
export type { WeaponDefinition };

/** Lista de armas do catálogo filtrada por categoria (simples/marcial). */
export function getWeaponsByCategory(category: WeaponCategory): WeaponDefinition[] {
  return weapons.filter((weapon) => weapon.category === category);
}

/**
 * Atributo recomendado para o ataque com a arma: DEX para armas à
 * distância ou com a propriedade Acuidade; FOR para as demais
 * corpo a corpo. É só a recomendação padrão — a UI pode sempre deixar
 * o jogador escolher outro atributo via `getAttackBonus`.
 */
export function getRecommendedAttackAbility(weapon: WeaponDefinition): AbilityKey {
  if (weapon.rangeKind === "distancia" || weapon.properties.acuidade) return "DEX";
  return "FOR";
}

/** Dado de dano considerando a versão empunhada com as duas mãos (propriedade Versátil), quando aplicável. */
export function getWeaponDamageDice(weapon: WeaponDefinition, twoHanded: boolean): string {
  if (twoHanded && weapon.properties.versatil) return weapon.properties.versatil;
  return weapon.damageDice;
}

/**
 * Bônus de ataque para uma arma específica do catálogo — reaproveita a
 * fórmula genérica de `rules/attack.ts#getAttackBonus` com o atributo
 * recomendado da arma (ou o atributo escolhido pelo jogador).
 */
export function getWeaponAttackBonus(
  character: Character,
  weaponId: string,
  options: { proficient: boolean; ability?: AbilityKey; manualAdjustment?: number },
): ComputedValue {
  const weapon = weaponsById[weaponId];
  const ability = options.ability ?? getRecommendedAttackAbility(weapon);
  return getAttackBonus(character, { ability, proficient: options.proficient, manualAdjustment: options.manualAdjustment });
}
