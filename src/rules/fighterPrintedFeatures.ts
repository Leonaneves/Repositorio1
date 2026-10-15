import type { Character } from "../domain/character.js";
import { getFighterSubclassPrintedBlocks } from "./fighterSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Guerreiro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF). A classe
 * BASE (Estilo de Luta, Maestria em Arma, Recuperar Fôlego, Mente
 * Tática, Surto de Ação, Ajuste Tático, Ataque Extra, Indomável, Mestre
 * Tático, Ataques Estudados) ainda não tem conteúdo mecânico fornecido
 * (ver `data/features/classes.ts#NAMED_FEATURES_BY_CLASS.guerreiro`) —
 * por ora só as 4 SUBCLASSES têm texto impresso (fonte "IMPLEMENTAR
 * SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF"). Função separada por
 * nome, mesmo padrão de `getRangerPrintedBlocks`, para quando a classe
 * base chegar.
 */
export function getFighterPrintedBlocks(character: Character): string[] {
  if (character.classId !== "guerreiro") return [];
  return getFighterSubclassPrintedBlocks(character);
}
