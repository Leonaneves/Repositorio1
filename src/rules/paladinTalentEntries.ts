import type { AutoTextEntry, Character } from "../domain/character.js";
import { PALADIN_FIGHTING_STYLE_CHOICE_ID, PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID } from "../data/features/paladin.js";

/**
 * Estilo de Luta do Paladino (nível 2) — só aparece na caixa de
 * TALENTOS quando escolhido em vez de Combatente Abençoado (fonte
 * "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §4),
 * mesmo padrão já usado para o Estilo de Luta do Guerreiro
 * (`rules/fighterTalentEntries.ts#getFighterFightingStyleTalentEntries`).
 * Sem catálogo de Estilos de Luta no projeto, o nome digitado pelo
 * jogador (quando preenchido) é impresso aqui, nunca em Características
 * de Classe e nunca inventado quando a escolha ainda está vazia.
 */
export function getPaladinFightingStyleTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "paladino") return [];
  if (character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID]?.value !== "Estilo de Luta") return [];

  const selection = character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_CHOICE_ID]?.value;
  const name = typeof selection === "string" ? selection.trim() : "";
  if (!name) return [];

  return [{ text: `Estilo de Luta: ${name}`, source: "class" }];
}
