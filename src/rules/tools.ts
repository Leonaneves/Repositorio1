import type { Character } from "../domain/character.js";
import { classes, getClassToolChoiceId } from "../data/classes.js";
import { tools, type ToolCategory, type ToolDefinition } from "../data/tools.js";

/** Ferramentas/Instrumentos do catálogo que pertencem a UMA das categorias informadas (array = "ou", ex.: Monge: Ferramenta de Artesão OU Instrumento Musical). */
export function getEligibleTools(category: ToolCategory | ToolCategory[]): ToolDefinition[] {
  const categories = Array.isArray(category) ? category : [category];
  return tools.filter((tool) => categories.includes(tool.category));
}

/** Ferramentas escolhidas pela `FeatureChoice` "Ferramentas de Classe" da classe atual (modo automático) — [] sem classe ou sem `toolChoice`. */
export function getAutomaticClassTools(character: Character): string[] {
  if (!character.classId) return [];
  if (!classes[character.classId].toolChoice) return [];
  const selection = character.featureChoiceSelections[getClassToolChoiceId(character.classId)]?.value;
  return Array.isArray(selection) ? selection : [];
}

/**
 * Ferramentas conhecidas "resultado final" (fonte §5: `automaticSources`
 * + `manualOverrides` = resultado final). Em modo Homebrew
 * (`character.manualToolOverrides !== null`), o override SUBSTITUI por
 * completo a lista automática — nunca soma às duas. Desativar o modo
 * Homebrew (`manualToolOverrides = null`) sempre volta ao resultado
 * calculado pelas regras, sem perder os dados automáticos (que nunca
 * são destruídos, só ignorados enquanto o override estiver ativo).
 */
export function getKnownTools(character: Character): string[] {
  return character.manualToolOverrides ?? getAutomaticClassTools(character);
}

/** Se a escolha "Ferramentas de Classe" está completa (modo automático) — Homebrew nunca bloqueia (escolha livre, sem quantidade fixa). */
export function isClassToolChoiceComplete(character: Character): boolean {
  if (character.manualToolOverrides !== null) return true;
  if (!character.classId) return true;
  const toolChoice = classes[character.classId].toolChoice;
  if (!toolChoice) return true;
  return getAutomaticClassTools(character).length === toolChoice.count;
}
