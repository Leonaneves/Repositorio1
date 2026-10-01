import { computedValue, type AbilityKey, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

export interface AttackBonusInput {
  /** Atributo usado no ataque (FOR para a maioria das armas corpo a corpo, DEX para à distância/acuidade). */
  ability: AbilityKey;
  /** Se o personagem é proficiente com a arma usada. */
  proficient: boolean;
  /** Ajuste manual (ex.: bônus mágico do item, situacional etc.). */
  manualAdjustment?: number;
}

/**
 * Bônus de ataque genérico = modificador do atributo + bônus de
 * proficiência (se proficiente) + ajuste manual.
 *
 * Por decisão do projeto, esta é uma fórmula genérica — ainda não há
 * um catálogo estruturado de armas específicas (isso é decisão
 * explícita para uma versão futura, que vai aplicar este mesmo bônus a
 * cada arma cadastrada). Por ora, `character.attacks` continua sendo
 * uma lista de entradas manuais (nome/dano/notas), e esta função fica
 * disponível para a UI calcular o bônus de ataque a partir do atributo
 * e da proficiência escolhidos para cada entrada.
 */
export function getAttackBonus(character: Character, input: AttackBonusInput): ComputedValue {
  const abilityMod = getAbilityModifier(getEffectiveAbilityScore(character, input.ability));
  const proficiencyBonus = input.proficient ? getProficiencyBonus(character.level) : 0;
  const auto = abilityMod + proficiencyBonus;
  return computedValue(auto, input.manualAdjustment ?? 0);
}
