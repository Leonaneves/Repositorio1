import type { AutoTextEntry, Character } from "../domain/character.js";

/**
 * Texto automático de "Implementos de Misericórdia" (Caminho da
 * Misericórdia, nível 3) para a área de Proficiências/Ferramentas —
 * Kit de Herbalismo é uma concessão FIXA (nunca uma `FeatureChoice`),
 * mesmo padrão já usado para Ferramentas de Assassino do Ladino. A
 * proficiência em Intuição/Medicina da mesma característica vai pela
 * etapa própria "Perícias" (rules/skills.ts#isSkillGrantedBySubclassFixed),
 * nunca por aqui. Recalculado do zero a cada chamada — nunca duplica
 * itens a cada recálculo.
 */
export function getMonkMercyToolProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "monge" || character.subclassId !== "Guerreiro da Misericórdia" || character.level < 3) return [];
  return [{ text: "Implementos de Misericórdia: Kit de Herbalismo", source: "class" }];
}
