import type { AutoTextEntry, Character } from "../domain/character.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { getKnownManeuvers, getManeuverPrintedLine } from "./maneuvers.js";

/**
 * Texto automático do Guerreiro para a área de TALENTOS (fonte
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §8 — "Todas as
 * Manobras ESCOLHIDAS e os Estilos de Luta ADQUIRIDOS do Guerreiro
 * devem ir para a caixa de Talentos, saindo de Características de
 * Classe"). Nunca duplica: as Manobras somem do bloco "# MANOBRAS" em
 * `rules/fighterSubclassPrintedFeatures.ts` (que mantém só quantidade/
 * tipo de Dado de Superioridade/CD/Implacável em "SUPERIORIDADE EM
 * COMBATE", e "Conheça Seu Inimigo"); a mudança não transforma Manobra
 * em Talento no modelo de regras — é só reposicionamento de ONDE o
 * texto já calculado aparece no PDF. Mesmo padrão já aprovado de
 * `rules/warlockTalentEntries.ts` (Lições dos Grandes Antigos).
 */

/** Manobras CONHECIDAS do Mestre de Batalha — nunca lista as 20 do catálogo, só as realmente escolhidas. */
export function getFighterManeuverTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha") return [];
  const knownManeuvers = getKnownManeuvers(character);
  if (knownManeuvers.length === 0) return [];

  const lines = knownManeuvers.map((maneuver) => getManeuverPrintedLine(maneuver, character).replace(/^>\s*/, ""));
  return [{ text: ["Manobras:", ...lines].join("\n"), source: "class" }];
}

/**
 * "Estilo de Luta Adicional" (Campeão nível 7) — sem catálogo de
 * Estilos de Luta no projeto, o nome digitado pelo jogador (quando
 * preenchido) é impresso aqui, nunca em Características de Classe e
 * nunca inventado quando a escolha ainda está vazia. A concessão
 * original de Estilo de Luta do Guerreiro nível 1 continua sem
 * catálogo/escolha registrada (pendência à parte) — por isso não tem
 * entrada própria ainda: nunca se imprime um Estilo de Luta não
 * escolhido.
 */
export function getFighterFightingStyleTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "guerreiro" || character.subclassId !== "Campeão") return [];
  const selection = character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID]?.value;
  const name = typeof selection === "string" ? selection.trim() : "";
  if (!name) return [];

  return [{ text: `Estilo de Luta Adicional: ${name}`, source: "class" }];
}
