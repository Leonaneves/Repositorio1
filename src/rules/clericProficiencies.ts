import type { AutoTextEntry, Character } from "../domain/character.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";

/**
 * Texto automático de "Protetor" (Ordem Divina, nível 1) para a área de
 * Proficiências/Armas — Armadura Pesada é uma flag mutável
 * (`state/characterStore.ts#setFeatureChoiceSelection` →
 * `applyClericOrdemDivinaProficiencies`, refletida nos checkboxes
 * PROF.leve/med/pesa do PDF); Armas Marciais é só texto — nunca uma flag
 * — por isso entra aqui, igual ao padrão já usado para o Treinamento
 * Marcial do Bardo.
 */
export function getClericWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "clerigo") return [];
  if (character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID]?.value !== "Protetor") return [];
  return [{ text: "Protetor: Armas Marciais.", source: "class" }];
}
