import type { Character } from "../domain/character.js";
import { getMonkClassPrintedBlocks } from "./monkClassPrintedFeatures.js";
import { getMonkSubclassPrintedBlocks } from "./monkSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Monge ("Características de Classe",
 * campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — classe BASE (fonte
 * "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" §8) mais a
 * SUBCLASSE atual (§9-§12), mesmo padrão de
 * `getRoguePrintedBlocks`/`getWizardPrintedBlocks`.
 *
 * `nearFocus` (Técnica da Mão Aberta/Integridade Corporal, Mão de
 * Cura/Mão de Dolo/Torrente de Cura e Dolo, Passo Destrutivo) é
 * inserido logo depois do bloco "FOCO" da classe base — nunca ao final
 * da lista — para ficar ao lado de "Torrente de Golpes"/"Passo do
 * Vento" (§9/§10/§12: "agrupar perto de Torrente de Golpes/Passo do
 * Vento"). `focusExtraLines` injeta a linha de Passo Veloz direto no
 * grupo de Passo do Vento do bloco "FOCO" (nunca um bloco próprio).
 */
export function getMonkPrintedBlocks(character: Character): string[] {
  if (character.classId !== "monge") return [];

  const { nearFocus, rest, focusExtraLines } = getMonkSubclassPrintedBlocks(character);
  const classBlocks = getMonkClassPrintedBlocks(character, focusExtraLines);
  const focusIndex = classBlocks.findIndex((block) => block.startsWith("# FOCO"));

  if (focusIndex === -1) return [...classBlocks, ...nearFocus, ...rest];
  return [...classBlocks.slice(0, focusIndex + 1), ...nearFocus, ...classBlocks.slice(focusIndex + 1), ...rest];
}
