import type { AutoTextEntry, Character } from "../domain/character.js";
import { weaponsById } from "../data/weapons.js";
import { getBarbarianWeaponMasteryChoiceId } from "../data/features/barbarian.js";

/**
 * Entrada de texto automático com as armas escolhidas em "Maestria em
 * Arma" do Bárbaro, para a área de Proficiências/Armas do PDF
 * (`PROF.armas`) — nunca o campo "Características de Classe" (decisão
 * explícita da fonte "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" §3).
 * Usa o nome da arma e o nome real da propriedade de Maestria do
 * catálogo (`data/weapons.ts`) — nunca inventa texto.
 */
export function getBarbarianWeaponMasteryEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "barbaro") return [];

  const parts: string[] = [];
  for (const slot of [1, 2, 3, 4] as const) {
    const choiceId = getBarbarianWeaponMasteryChoiceId(slot);
    const selection = character.featureChoiceSelections[choiceId]?.value;
    const weaponId = typeof selection === "string" ? selection : "";
    const weapon = weaponId ? weaponsById[weaponId] : undefined;
    if (weapon) parts.push(`${weapon.name} — ${weapon.mastery}`);
  }

  if (parts.length === 0) return [];
  return [{ text: `Maestrias: ${parts.join("; ")}`, source: "class" }];
}
