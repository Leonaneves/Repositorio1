import type { AutoTextEntry, Character } from "../domain/character.js";
import { fightingStylesByName, FIGHTING_STYLE_NAMES, type FightingStyleDefinition } from "../data/fightingStyles.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import { PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID, PALADIN_FIGHTING_STYLE_CHOICE_ID } from "../data/features/paladin.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

/**
 * Os 4 pontos de concessão de Estilo de Luta cadastrados (fonte
 * "IMPLEMENTAR TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF" §1) —
 * usados pela cross-exclusão de `getFightingStyleOptions` abaixo. Sem
 * multiclasse no projeto, só Guerreiro-base/Campeão-adicional podem
 * coexistir de fato num mesmo personagem; os outros dois nunca têm
 * valor simultâneo a um desses dois, mas entram na lista do mesmo jeito
 * — nunca um caso especial só para o Guerreiro.
 */
const FIGHTING_STYLE_SLOT_CHOICE_IDS: string[] = [
  FIGHTER_FIGHTING_STYLE_CHOICE_ID,
  FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
  RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID,
  PALADIN_FIGHTING_STYLE_CHOICE_ID,
];

/**
 * Nomes dos Estilos de Luta ATIVOS no personagem, na ordem Guerreiro
 * (base, depois Campeão adicional) → Patrulheiro → Paladino. Para
 * Patrulheiro/Paladino, só conta quando o ramo "Estilo de Luta" foi
 * escolhido na característica alternativa (nunca quando o jogador
 * escolheu Combatente Druídico/Abençoado — mesmo que a sub-escolha
 * ainda guarde um valor antigo de quando o ramo era outro).
 */
function getActiveFightingStyleNames(character: Character): string[] {
  const names: string[] = [];

  if (character.classId === "guerreiro") {
    const base = character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID]?.value;
    if (typeof base === "string" && base in fightingStylesByName) names.push(base);

    if (character.subclassId === "Campeão") {
      const extra = character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID]?.value;
      if (typeof extra === "string" && extra in fightingStylesByName) names.push(extra);
    }
  }

  if (character.classId === "patrulheiro") {
    const branch = character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID]?.value;
    if (branch === "Estilo de Luta") {
      const chosen = character.featureChoiceSelections[RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID]?.value;
      if (typeof chosen === "string" && chosen in fightingStylesByName) names.push(chosen);
    }
  }

  if (character.classId === "paladino") {
    const branch = character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID]?.value;
    if (branch === "Estilo de Luta") {
      const chosen = character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_CHOICE_ID]?.value;
      if (typeof chosen === "string" && chosen in fightingStylesByName) names.push(chosen);
    }
  }

  return names;
}

/** Definições resolvidas dos Estilos de Luta ativos no personagem (ver `getActiveFightingStyleNames`). */
export function getActiveFightingStyles(character: Character): FightingStyleDefinition[] {
  return getActiveFightingStyleNames(character)
    .map((name) => fightingStylesByName[name])
    .filter((style): style is FightingStyleDefinition => style !== undefined);
}

/** Se o Estilo de Luta `name` está ativo no personagem, por qualquer uma das 4 origens. */
export function isFightingStyleActive(character: Character, name: string): boolean {
  return getActiveFightingStyleNames(character).includes(name);
}

/**
 * Opções elegíveis para a `FeatureChoice` de Estilo de Luta identificada
 * por `choiceId` — os 10 nomes do catálogo, menos os já escolhidos por
 * QUALQUER OUTRO dos 4 pontos de concessão (cross-exclusão §1: "nunca
 * permitir o mesmo Estilo de Luta duas vezes via origens diferentes").
 * A própria seleção atual de `choiceId` nunca é excluída daqui — senão
 * o próprio valor já escolhido desapareceria da lista ao reabrir o
 * `<select>`.
 */
export function getFightingStyleOptions(character: Character, choiceId: string): string[] {
  const takenByOthers = new Set(
    FIGHTING_STYLE_SLOT_CHOICE_IDS.filter((id) => id !== choiceId)
      .map((id) => character.featureChoiceSelections[id]?.value)
      .filter((value): value is string => typeof value === "string" && value in fightingStylesByName),
  );
  return FIGHTING_STYLE_NAMES.filter((name) => !takenByOthers.has(name));
}

/** `1d{die}` + modificador formatado — `+N`/`-N` quando diferente de zero, só `1d{die}` quando zero. */
function formatDieWithModifier(die: number, modifier: number): string {
  if (modifier > 0) return `1d${die}+${modifier}`;
  if (modifier < 0) return `1d${die}${modifier}`;
  return `1d${die}`;
}

/**
 * Linha impressa de um Estilo de Luta, com os placeholders dinâmicos já
 * resolvidos — só `interceptacao` (`{BP}`) e `combate-desarmado`
 * (`{danoDesarmado}`/`{danoSemArma}`) têm algum (§8/§10); os demais 8
 * voltam literalmente como cadastrados em `data/fightingStyles.ts`.
 */
export function getFightingStylePrintedLine(style: FightingStyleDefinition, character: Character): string {
  if (style.id === "interceptacao") {
    const proficiencyBonus = getProficiencyBonus(character.level);
    return style.printedLine.replace("{BP}", String(proficiencyBonus));
  }
  if (style.id === "combate-desarmado") {
    const forModifier = getAbilityModifier(getEffectiveAbilityScore(character, "FOR"));
    return style.printedLine
      .replace("{danoDesarmado}", formatDieWithModifier(6, forModifier))
      .replace("{danoSemArma}", formatDieWithModifier(8, forModifier));
  }
  return style.printedLine;
}

/**
 * Texto compacto dos Estilos de Luta ativos para a caixa "Talentos" do
 * PDF (§2/§14) — uma ÚNICA `AutoTextEntry`, com uma linha por estilo
 * ativo unidas por quebra de linha simples (nunca por linha em branco,
 * ao contrário do padrão de `renderAutoTextBlock` entre ENTRADAS
 * diferentes — aqui as linhas são todas de uma única entrada). Vazio
 * quando nenhum Estilo de Luta está ativo.
 */
export function getFightingStyleTalentEntries(character: Character): AutoTextEntry[] {
  const styles = getActiveFightingStyles(character);
  if (styles.length === 0) return [];
  const lines = styles.map((style) => getFightingStylePrintedLine(style, character));
  return [{ text: lines.join("\n"), source: "class" }];
}

/**
 * Bônus de CA do Estilo de Luta Defensivo (§2/§6) — só com armadura
 * (Leve/Média/Pesada) de fato equipada, nunca desarmado/sem armadura
 * (`character.armor.equipped === "unarmed"`, que cobre tanto "nenhuma
 * armadura" quanto qualquer CA alternativa sem armadura de outra
 * classe). Soma-se normalmente ao bônus de escudo, calculado em
 * `rules/armor.ts` por outro termo.
 */
export function getDefensiveFightingStyleBonus(character: Character): number {
  if (character.armor.equipped === "unarmed") return 0;
  return isFightingStyleActive(character, "Defensivo") ? 1 : 0;
}
