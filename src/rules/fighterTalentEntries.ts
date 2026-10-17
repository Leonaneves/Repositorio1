import type { AutoTextEntry, Character } from "../domain/character.js";
import { getKnownManeuvers, getManeuverPrintedLine } from "./maneuvers.js";

/**
 * Texto automático do Guerreiro para a área de TALENTOS (fontes
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §8 e "COMPLETAR
 * A CLASSE GUERREIRO NO BUILDER E NO PDF" §1/§3/§10 — "talentos já
 * adquiridos" e "todas as Manobras escolhidas e seus resumos" vão para
 * Talentos, nunca para Características de Classe). Nunca duplica: as
 * Manobras somem do bloco "# MANOBRAS" em
 * `rules/fighterSubclassPrintedFeatures.ts` (que mantém só quantidade/
 * tipo de Dado de Superioridade/CD/Implacável em "SUPERIORIDADE EM
 * COMBATE", e "Conheça Seu Inimigo"). Mesmo padrão já aprovado de
 * `rules/warlockTalentEntries.ts` (Lições dos Grandes Antigos). Os
 * Estilos de Luta (base e adicional do Campeão) saíram daqui para
 * `rules/fightingStyles.ts#getFightingStyleTalentEntries` (fonte
 * "IMPLEMENTAR TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF" §2/§9) —
 * compartilhado com Patrulheiro/Paladino, nunca duplicado neste arquivo.
 */

/** Manobras CONHECIDAS do Mestre de Batalha — nunca lista as 20 do catálogo, só as realmente escolhidas. */
export function getFighterManeuverTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha") return [];
  const knownManeuvers = getKnownManeuvers(character);
  if (knownManeuvers.length === 0) return [];

  const lines = knownManeuvers.map((maneuver) => getManeuverPrintedLine(maneuver, character).replace(/^>\s*/, ""));
  return [{ text: ["Manobras:", ...lines].join("\n"), source: "class" }];
}
