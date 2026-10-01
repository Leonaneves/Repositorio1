import type { AutoTextEntry, Character } from "../domain/character.js";

/**
 * Texto automático de "Treinamento Marcial" (Colégio da Bravura, nível
 * 3) para a área de Proficiências/Armas — a proficiência em Armaduras
 * Médias/Escudos é uma flag mutável (`state/characterStore.ts#setSubclass`
 * → `applyBardSubclassProficiencies`, refletida nos checkboxes
 * PROF.leve/med/pesa/Escudo do PDF); Armas Marciais e o Foco de
 * Conjuração são só texto — nunca uma flag — por isso entram aqui,
 * igual ao padrão já usado para as Maestrias do Bárbaro.
 */
export function getBardWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "bardo" || character.subclassId !== "Colégio da Bravura") return [];
  return [{ text: "Treinamento Marcial: Armas Marciais; uma arma Simples ou Marcial pode ser Foco de Conjuração.", source: "class" }];
}
