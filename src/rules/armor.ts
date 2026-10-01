import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { armors, SHIELD_AC_BONUS, type ArmorDefinition } from "../data/armors.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";

/**
 * Armaduras disponíveis para seleção, filtradas pelas proficiências
 * atuais do personagem (marcadas inicialmente pela classe, mas sempre
 * editáveis) — reconstrói a mesma lista dinâmica do script
 * `AtualizarArmaduras` do PDF original. "Sem Armadura" não entra nesta
 * lista: é o valor-sentinela `"unarmed"` de `character.armor.equipped`,
 * sempre disponível.
 */
export function getAvailableArmor(character: Character): ArmorDefinition[] {
  const { light, medium, heavy } = character.armor.proficiencies;
  return Object.values(armors).filter(
    (armor) =>
      (armor.category === "light" && light) ||
      (armor.category === "medium" && medium) ||
      (armor.category === "heavy" && heavy),
  );
}

/**
 * Classe de Armadura, com as regras especiais de Bárbaro e Monge
 * extraídas literalmente do script `CA` do PDF original:
 *
 * - Sem armadura, geral: `10 + DEX` (+2 se escudo)
 * - Sem armadura, Bárbaro: `10 + DEX + CON` (+2 se escudo)
 * - Sem armadura, Monge sem escudo: `10 + DEX + SAB`
 * - Sem armadura, Monge com escudo: `10 + DEX + 2` (perde a defesa sem
 *   armadura do Monge; usa a CA normal + escudo)
 * - Armadura leve: base + DEX inteiro
 * - Armadura média: base + DEX limitado a +2
 * - Armadura pesada: valor fixo (sem DEX)
 * - Escudo com armadura: sempre +2
 */
export function getArmorClass(character: Character): ComputedValue {
  const dexMod = getAbilityModifier(getEffectiveAbilityScore(character, "DEX"));
  const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
  const wisMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  const hasShield = character.armor.shield;

  let auto: number;

  if (character.armor.equipped === "unarmed") {
    if (character.classId === "barbaro") {
      auto = 10 + dexMod + conMod + (hasShield ? SHIELD_AC_BONUS : 0);
    } else if (character.classId === "monge" && !hasShield) {
      auto = 10 + dexMod + wisMod;
    } else if (character.classId === "monge" && hasShield) {
      auto = 10 + dexMod + SHIELD_AC_BONUS;
    } else {
      auto = 10 + dexMod + (hasShield ? SHIELD_AC_BONUS : 0);
    }
  } else {
    const armor = armors[character.armor.equipped];
    const dexContribution = armor.dexBonus === "full" ? dexMod : armor.dexBonus === "max2" ? Math.min(dexMod, 2) : 0;
    auto = armor.baseAC + dexContribution + (hasShield ? SHIELD_AC_BONUS : 0);
  }

  return computedValue(auto, character.armor.manualAdjustment);
}
