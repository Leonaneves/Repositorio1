import type { Character } from "../domain/character.js";
import { getRangerSubclassPrintedBlocks } from "./rangerSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Patrulheiro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF). A classe
 * BASE (Inimigo Favorito, Explorador Hábil, Maestria em Arma, Estilo
 * de Luta, Errante, Especialista, Incansável, Predador Implacável, Véu
 * da Natureza, Caçador Preciso, Sentidos Selvagens, Matador de
 * Inimigos Favoritos) ainda não tem conteúdo mecânico fornecido (ver
 * `data/features/classes.ts#NAMED_FEATURES_BY_CLASS.patrulheiro`) —
 * por ora só as 4 SUBCLASSES têm texto impresso (fonte "IMPLEMENTAR
 * SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF"). Função separada por
 * nome, mesmo padrão de `getDruidPrintedBlocks`/`getClericPrintedBlocks`,
 * para quando a classe base chegar.
 */
export function getRangerPrintedBlocks(character: Character): string[] {
  if (character.classId !== "patrulheiro") return [];
  return getRangerSubclassPrintedBlocks(character);
}
