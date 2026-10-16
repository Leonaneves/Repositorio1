import type { Character } from "../domain/character.js";
import { getRogueClassPrintedBlocks } from "./rogueClassPrintedFeatures.js";
import { getRogueCunningStrikeExtraLines, getRogueSubclassPrintedBlocks, isRogueMobileAimActive } from "./rogueSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Ladino ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — classe
 * BASE (fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO
 * PDF" §7) mais a SUBCLASSE atual (§8-§11), mesmo padrão de
 * `getFighterPrintedBlocks`/`getRangerPrintedBlocks`. As linhas que a
 * subclasse funde ao bloco "GOLPE ASTUTO"/"MIRA FIRME" da classe base
 * (Armas Venenosas, Ataque Escondido, Trapaceiro Versátil, Mira Móvel)
 * são calculadas aqui e passadas para `getRogueClassPrintedBlocks` —
 * nunca duplicadas nos blocos da própria subclasse.
 */
export function getRoguePrintedBlocks(character: Character): string[] {
  if (character.classId !== "ladino") return [];
  const classBlocks = getRogueClassPrintedBlocks(
    character,
    getRogueCunningStrikeExtraLines(character),
    isRogueMobileAimActive(character),
  );
  return [...classBlocks, ...getRogueSubclassPrintedBlocks(character)];
}
