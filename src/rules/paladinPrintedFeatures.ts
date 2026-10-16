import type { Character } from "../domain/character.js";
import { getPaladinClassPrintedBlocks } from "./paladinClassPrintedFeatures.js";
import { getPaladinSubclassPrintedBlocks } from "./paladinSubclassPrintedFeatures.js";

/**
 * Classe base + subclasse ATUAL do Paladino, sem duplicar blocos entre
 * si — mesmo padrão de `rules/roguePrintedFeatures.ts`/
 * `wizardPrintedFeatures.ts`/`monkPrintedFeatures.ts`. Os blocos
 * PRÓPRIOS do Juramento (Vingador Implacável, Defesa Gloriosa,
 * Sentinela Imortal, os 4 poderes de nível 20) vão ordenados pelo
 * próprio nível de aquisição, sempre APÓS os blocos da classe base —
 * tudo que precisa ficar junto a um bloco da classe (opções de
 * Canalizar Divindade, linhas extras de Aura de Proteção/Destruição do
 * Paladino) já é injetado diretamente dentro dele por
 * `rules/paladinClassPrintedFeatures.ts`, nunca por reordenação aqui.
 */
export function getPaladinPrintedBlocks(character: Character): string[] {
  if (character.classId !== "paladino") return [];

  const subclassBlocks = getPaladinSubclassPrintedBlocks(character).sort((a, b) => a.level - b.level);

  return [...getPaladinClassPrintedBlocks(character), ...subclassBlocks.map((block) => block.text)];
}
