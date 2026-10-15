import type { AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { maneuvers, maneuversById, type ManeuverDefinition } from "../data/maneuvers.js";
import { BATTLE_MASTER_CD_ABILITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getBattleMasterManeuversKnownCount } from "./classResources.js";

/** Todas as manobras elegíveis para escolha (catálogo completo — nenhum pré-requisito cruzado entre manobras). */
export function getSelectableManeuvers(): ManeuverDefinition[] {
  return maneuvers;
}

/** Definições resolvidas das manobras conhecidas pelo personagem, na ordem em que foram escolhidas. */
export function getKnownManeuvers(character: Character): ManeuverDefinition[] {
  return character.chosenManeuvers
    .map((id) => maneuversById[id])
    .filter((maneuver): maneuver is ManeuverDefinition => maneuver !== undefined);
}

/**
 * Se a quantidade de manobras conhecidas corresponde exatamente ao
 * exigido pelo nível atual, sem duplicatas — usado para travar o
 * avanço do Builder na subetapa própria "Manobras" (fonte "IMPLEMENTAR
 * SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §6). Classes/subclasses
 * diferentes de Mestre de Batalha, ou níveis abaixo de 3 (manobra ainda
 * não concedida), nunca bloqueiam por aqui — `getBattleMasterManeuversKnownCount`
 * já devolve `null`/`0` nesses casos.
 */
export function isManeuverSelectionComplete(character: Character): boolean {
  const required = getBattleMasterManeuversKnownCount(character) ?? 0;
  if (required === 0) return true;
  const unique = new Set(character.chosenManeuvers);
  return unique.size === character.chosenManeuvers.length && unique.size === required;
}

/**
 * Atributo escolhido para a CD de Manobras (Força ou Destreza) — escolha
 * PERSISTENTE e editável, independente da escolha de Força/Destreza
 * feita a cada uso de Aparar (§6: "A escolha de FOR/DEX em Aparar é
 * independente da escolha do atributo da CD"). `null` enquanto não
 * respondida — nunca escolhe o maior silenciosamente.
 */
export function getManeuversCdAbility(character: Character): AbilityKey | null {
  const selection = character.featureChoiceSelections[BATTLE_MASTER_CD_ABILITY_CHOICE_ID]?.value;
  if (selection === "Força") return "FOR";
  if (selection === "Destreza") return "DEX";
  return null;
}

/**
 * CD de Manobras = `8 + BP + mod FOR ou DEX escolhido` — fórmula PRÓPRIA
 * (§1: "não deve ser confundida com a CD de magia do personagem"),
 * calculada mesmo sem conjuração. `null` se a escolha de atributo ainda
 * não foi respondida (o Builder trava o avanço nessa `FeatureChoice`
 * antes de chegar à Revisão/PDF).
 */
export function getManeuversCd(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha" || character.level < 3) return null;
  const ability = getManeuversCdAbility(character);
  if (!ability) return null;
  const modifier = getAbilityModifier(getEffectiveAbilityScore(character, ability));
  return 8 + getProficiencyBonus(character.level) + modifier;
}

function formatSignedModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Linha impressa de uma manobra, com os placeholders dinâmicos já
 * resolvidos — só `aparar` e `recuperar-energia` têm algum (§8): as
 * demais 18 voltam literalmente como cadastradas em `data/maneuvers.ts`,
 * sem nenhuma substituição.
 */
export function getManeuverPrintedLine(maneuver: ManeuverDefinition, character: Character): string {
  if (maneuver.id === "aparar") {
    const maxModifier = Math.max(
      getAbilityModifier(getEffectiveAbilityScore(character, "FOR")),
      getAbilityModifier(getEffectiveAbilityScore(character, "DEX")),
    );
    return maneuver.printedLine.replace("+{FOR ou DEX, o que for maior}", formatSignedModifier(maxModifier));
  }
  if (maneuver.id === "recuperar-energia") {
    const halfLevel = Math.floor(character.level / 2);
    return maneuver.printedLine.replace("+{metadeNivel}", `+${halfLevel}`);
  }
  return maneuver.printedLine;
}
