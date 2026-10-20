import type { Character } from "../domain/character.js";
import { classes, getClassToolChoiceId } from "../data/classes.js";
import { tools, toolsById, type ToolCategory, type ToolDefinition } from "../data/tools.js";
import { CHEF_FEAT_ID, ENVENENADOR_FEAT_ID } from "../data/features/feats.js";
import { getCharacterFeatures } from "./features.js";
import { getFeatAcquisitions } from "./feats.js";

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

/** Ferramenta FIXA (nunca uma escolha) concedida por Talento: Chef → Utensílios de Cozinheiro; Envenenador → Kit de Veneno. */
export const FEAT_FIXED_TOOLS: Partial<Record<string, string>> = {
  [CHEF_FEAT_ID]: "utensilios-cozinheiro",
  [ENVENENADOR_FEAT_ID]: "kit-veneno",
};

/**
 * Ferramentas concedidas por escolhas de Talento (`toolProficiency` de
 * Artifista/Músico, ou a metade "ferramenta" da reserva combinada
 * `skillOrToolProficiency` de Habilidoso — fonte "IMPLEMENTAR TALENTOS
 * DE ORIGEM NO BUILDER E NO PDF" §5/§8/§10) — varre TODAS as aquisições
 * de Talento do personagem (Antecedente + cada nível de ASI), nunca só
 * a classe atual.
 */
export function getFeatGrantedTools(character: Character): string[] {
  const result: string[] = [];
  for (const acquisition of getFeatAcquisitions(character)) {
    const fixed = FEAT_FIXED_TOOLS[acquisition.featId];
    if (fixed) result.push(fixed);
  }
  for (const feature of getCharacterFeatures(character)) {
    if (feature.sourceType !== "feat") continue;
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "toolProficiency" && choice.effect.kind !== "skillOrToolProficiency") continue;
      const selection = character.featureChoiceSelections[choice.id]?.value;
      const selected = Array.isArray(selection) ? selection : [];
      result.push(...selected.filter((value) => value in toolsById));
    }
  }
  return result;
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
  return character.manualToolOverrides ?? [...getAutomaticClassTools(character), ...getFeatGrantedTools(character)];
}

/** Se a escolha "Ferramentas de Classe" está completa (modo automático) — Homebrew nunca bloqueia (escolha livre, sem quantidade fixa). */
export function isClassToolChoiceComplete(character: Character): boolean {
  if (character.manualToolOverrides !== null) return true;
  if (!character.classId) return true;
  const toolChoice = classes[character.classId].toolChoice;
  if (!toolChoice) return true;
  return getAutomaticClassTools(character).length === toolChoice.count;
}
