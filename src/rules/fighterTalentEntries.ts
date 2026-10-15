import type { AutoTextEntry, Character } from "../domain/character.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { getKnownManeuvers, getManeuverPrintedLine } from "./maneuvers.js";

/**
 * Texto automático do Guerreiro para a área de TALENTOS (fontes
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §8 e "COMPLETAR
 * A CLASSE GUERREIRO NO BUILDER E NO PDF" §1/§3/§10 — "talentos já
 * adquiridos", "Estilos de Luta escolhidos, incluindo o adicional do
 * Campeão" e "todas as Manobras escolhidas e seus resumos" vão para
 * Talentos, nunca para Características de Classe). Nunca duplica: as
 * Manobras somem do bloco "# MANOBRAS" em
 * `rules/fighterSubclassPrintedFeatures.ts` (que mantém só quantidade/
 * tipo de Dado de Superioridade/CD/Implacável em "SUPERIORIDADE EM
 * COMBATE", e "Conheça Seu Inimigo"), e o Estilo de Luta (base e
 * adicional) nunca aparece em `rules/fighterClassPrintedFeatures.ts`;
 * a mudança não transforma Manobra/Estilo de Luta em outra coisa no
 * modelo de regras — é só reposicionamento de ONDE o texto já
 * calculado aparece no PDF. Mesmo padrão já aprovado de
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
 * Estilo de Luta do Guerreiro — a concessão BASE (nível 1, qualquer
 * subclasse) e a concessão ADICIONAL do Campeão (nível 7) são origens
 * SEPARADAS (fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF"
 * §3/§10): cada uma com sua própria `FeatureChoice`/`manualText`, nunca
 * a mesma escolha, nunca uma concedendo a outra. Sem catálogo de
 * Estilos de Luta no projeto, o nome digitado pelo jogador (quando
 * preenchido) é impresso aqui, nunca em Características de Classe e
 * nunca inventado quando a escolha ainda está vazia — nunca um
 * lembrete genérico de "escolher Estilo de Luta".
 */
export function getFighterFightingStyleTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "guerreiro") return [];
  const entries: AutoTextEntry[] = [];

  const base = character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID]?.value;
  const baseName = typeof base === "string" ? base.trim() : "";
  if (baseName) entries.push({ text: `Estilo de Luta: ${baseName}`, source: "class" });

  if (character.subclassId === "Campeão") {
    const extra = character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID]?.value;
    const extraName = typeof extra === "string" ? extra.trim() : "";
    if (extraName) entries.push({ text: `Estilo de Luta Adicional: ${extraName}`, source: "class" });
  }

  return entries;
}
