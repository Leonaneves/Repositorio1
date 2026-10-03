import type { AutoTextEntry, Character } from "../domain/character.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";

/**
 * Texto automático de "Protetor" (Ordem Primal, nível 1) para a área de
 * Proficiências/Armas — Armadura Média é uma flag mutável
 * (`state/characterStore.ts#setFeatureChoiceSelection` →
 * `applyDruidOrdemPrimalProficiencies`, refletida nos checkboxes
 * PROF.leve/med/pesa do PDF); Armas Marciais é só texto — nunca uma
 * flag — por isso entra aqui, igual ao padrão já usado para o Protetor
 * do Clérigo (`rules/clericProficiencies.ts`).
 */
export function getDruidWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "druida") return [];
  if (character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID]?.value !== "Protetor") return [];
  return [{ text: "Protetor: Armas Marciais.", source: "class" }];
}
