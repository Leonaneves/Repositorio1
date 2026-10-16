import type { AutoTextEntry, Character } from "../domain/character.js";

/**
 * Texto automático de "Ferramentas de Assassino" (Assassino, nível 3)
 * para a área de Proficiências/Ferramentas — Kit de Disfarce e Kit de
 * Veneno são uma concessão FIXA (nunca uma `FeatureChoice`), por isso
 * entram aqui como texto puro, mesmo padrão já usado para Maestria em
 * Arma do Bárbaro/Pacto da Lâmina do Bruxo. Recalculado do zero a cada
 * chamada — nunca duplica itens a cada recálculo.
 */
export function getRogueAssassinToolProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "ladino" || character.subclassId !== "Assassino" || character.level < 3) return [];
  return [{ text: "Ferramentas de Assassino: Kit de Disfarce, Kit de Veneno", source: "class" }];
}
