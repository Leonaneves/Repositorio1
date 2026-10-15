import type { Character } from "../domain/character.js";
import { getFighterClassPrintedBlocks } from "./fighterClassPrintedFeatures.js";
import { getFighterSubclassPrintedBlocks } from "./fighterSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Guerreiro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — combina a
 * classe BASE (`getFighterClassPrintedBlocks`, fonte "COMPLETAR A
 * CLASSE GUERREIRO NO BUILDER E NO PDF") com a SUBCLASSE atual
 * (`getFighterSubclassPrintedBlocks`, fonte anterior "IMPLEMENTAR
 * SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF") — mesmo padrão já
 * usado por `getRangerPrintedBlocks`. A classe base entra mesmo sem
 * subclasse escolhida, a partir do nível 1.
 */
export function getFighterPrintedBlocks(character: Character): string[] {
  if (character.classId !== "guerreiro") return [];
  return [...getFighterClassPrintedBlocks(character), ...getFighterSubclassPrintedBlocks(character)];
}
