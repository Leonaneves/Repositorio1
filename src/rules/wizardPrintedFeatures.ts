import type { Character } from "../domain/character.js";
import { getWizardClassPrintedBlocks } from "./wizardClassPrintedFeatures.js";
import { getWizardSubclassPrintedBlocks } from "./wizardSubclassPrintedFeatures.js";

/** Classe base + subclasse ATUAL do Mago, sem duplicar blocos entre si — mesmo padrão de `rules/roguePrintedFeatures.ts`. */
export function getWizardPrintedBlocks(character: Character): string[] {
  if (character.classId !== "mago") return [];
  return [...getWizardClassPrintedBlocks(character), ...getWizardSubclassPrintedBlocks(character)];
}
