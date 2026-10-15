import type { Character } from "../domain/character.js";
import { getRangerClassPrintedBlocks } from "./rangerClassPrintedFeatures.js";
import { getRangerSubclassPrintedBlocks } from "./rangerSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Patrulheiro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — classe
 * BASE (fonte "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF")
 * mais as 4 SUBCLASSES (fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO
 * BUILDER E NO PDF", intocada exceto pela fusão do bloco "Marca do
 * Predador" — ver `rules/rangerClassPrintedFeatures.ts`). Os blocos da
 * classe base vêm primeiro (nível de aquisição sempre ≤ nível 3, onde a
 * primeira característica de subclasse aparece), seguidos pelos blocos
 * já em ordem fixa de cada subclasse — nunca uma intercalação por
 * nível entre classe e subclasse, que exigiria reescrever a ordem já
 * aprovada das 4 subclasses.
 */
export function getRangerPrintedBlocks(character: Character): string[] {
  if (character.classId !== "patrulheiro") return [];
  return [...getRangerClassPrintedBlocks(character), ...getRangerSubclassPrintedBlocks(character)];
}
