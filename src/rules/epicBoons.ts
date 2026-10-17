import type { AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { FeatureDefinition } from "../domain/features.js";
import { classFeatures, DADIVA_EPICA_CLASSES, getEpicBoonChoiceId } from "../data/features/classes.js";
import {
  DADIVA_DA_FORTITUDE_FEAT_ID,
  DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID,
  DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID,
  DADIVA_DA_RECUPERACAO_FEAT_ID,
  DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID,
  DADIVA_DA_VELOCIDADE_FEAT_ID,
  DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID,
  EPIC_BOON_NAMES,
  epicBoonsById,
  epicBoonsByName,
} from "../data/features/epicBoons.js";
import { subclassFeatures } from "../data/features/subclasses.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getMaxHitPoints } from "./hp.js";

/**
 * Motor das 12 Dádivas Épicas (fonte "IMPLEMENTAR TALENTOS DE DÁDIVA
 * ÉPICA NO BUILDER E NO PDF") — ao contrário dos Talentos Gerais
 * (`rules/feats.ts`), não existe aquisição repetível nem múltipla: no
 * máximo UMA Dádiva Épica ativa por personagem, escolhida na
 * `FeatureChoice` `getEpicBoonChoiceId(classId)` de
 * `data/features/classes.ts#epicBoonFeatures` (nível 19, só nas 12
 * classes de `DADIVA_EPICA_CLASSES` — nunca o Artífice). Por isso os ids
 * de escolha do catálogo (`data/features/epicBoons.ts`) já são os reais,
 * sem parametrização por `acquisitionKey`.
 */

/**
 * `true` se o personagem já possui uma `FeatureDefinition` CHAMADA
 * "Conjuração" (classe ou subclasse) — pré-requisito de Dádiva da
 * Recordação de Magia (fonte §1/§6: nunca satisfeito só por possuir
 * qualquer magia, e nunca satisfeito só por Magia de Pacto, que o Bruxo
 * tem sob o nome PRÓPRIO "Magia de Pacto" — ver `data/features/warlock.ts`,
 * nunca "Conjuração"). Varre os catálogos BRUTOS (`classFeatures`/
 * `subclassFeatures`), nunca `rules/features.ts#getCharacterFeatures`
 * (que inclui as próprias Dádivas Épicas — chamar por aqui criaria
 * dependência circular entre os dois módulos).
 */
export function hasConjuracaoFeature(character: Character): boolean {
  if (
    character.classId &&
    classFeatures.some((feature) => feature.classId === character.classId && feature.name === "Conjuração" && (feature.level === null || feature.level <= character.level))
  ) {
    return true;
  }
  if (
    character.subclassId &&
    subclassFeatures.some(
      (feature) => feature.subclassFullName === character.subclassId && feature.name === "Conjuração" && (feature.level === null || feature.level <= character.level),
    )
  ) {
    return true;
  }
  return false;
}

/**
 * `true` se o personagem pode acessar a característica "Dádiva Épica"
 * — nível de personagem 19+ E a classe atual concede essa característica
 * (`DADIVA_EPICA_CLASSES`, nunca o Artífice, que recebe Aumento no Valor
 * de Atributo no lugar — ver `ASI_LEVELS_BY_CLASS`).
 */
export function isEpicBoonEligible(character: Character): boolean {
  return character.level >= 19 && character.classId !== null && DADIVA_EPICA_CLASSES.includes(character.classId);
}

/**
 * Nomes das Dádivas Épicas elegíveis como opção da escolha de nível 19
 * — as 12 do catálogo, exceto Dádiva da Recordação de Magia quando o
 * personagem ainda não possui a característica Conjuração (fonte §1).
 * Devolve a lista completa quando `isEpicBoonEligible` for `false` (a
 * própria `FeatureChoice` já não aparece nesse caso — ver
 * `data/features/classes.ts#epicBoonFeatures` filtrado por nível 19 —
 * então o valor aqui nunca chega a ser exibido).
 */
export function getEpicBoonOptions(character: Character): string[] {
  if (hasConjuracaoFeature(character)) return EPIC_BOON_NAMES;
  return EPIC_BOON_NAMES.filter((name) => name !== epicBoonsById[DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID].name);
}

/** Id da Dádiva Épica escolhida pelo personagem — `null` sem elegibilidade, sem escolha feita, ou com um valor que não corresponde a nenhuma entrada do catálogo. */
export function getChosenEpicBoonId(character: Character): string | null {
  if (!isEpicBoonEligible(character)) return null;
  const choiceId = getEpicBoonChoiceId(character.classId!);
  const selection = character.featureChoiceSelections[choiceId]?.value;
  if (typeof selection !== "string") return null;
  const boon = epicBoonsByName[selection];
  return boon ? boon.id : null;
}

/** `true` se a Dádiva Épica `featId` está ativa no personagem. */
export function isEpicBoonActive(character: Character, featId: string): boolean {
  return getChosenEpicBoonId(character) === featId;
}

/**
 * `FeatureDefinition` completa da Dádiva Épica escolhida (com as
 * próprias `choices` — sempre o aumento de atributo, mais Especialização
 * de perícia só para Proficiência em Perícia), para entrar em
 * `rules/features.ts#getCharacterFeatures` com `sourceType: "feat"` —
 * mesmo padrão de `rules/feats.ts#getFeatAcquisitionFeatures` para os 26
 * Talentos Gerais. `[]` sem nenhuma Dádiva ativa.
 */
export function getEpicBoonFeatures(character: Character): FeatureDefinition[] {
  const id = getChosenEpicBoonId(character);
  if (!id) return [];
  const boon = epicBoonsById[id];
  return boon ? [boon] : [];
}

/** Atributo escolhido na `FeatureChoice` "+1 num atributo" da Dádiva Épica ATIVA — `null` enquanto não há Dádiva ativa ou a escolha ainda não foi resolvida. */
export function getEpicBoonAbilityIncreaseChoice(character: Character): AbilityKey | null {
  const id = getChosenEpicBoonId(character);
  if (!id) return null;
  const selection = character.featureChoiceSelections[`${id}-atributo`]?.value;
  return typeof selection === "string" && (["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const).includes(selection as AbilityKey) ? (selection as AbilityKey) : null;
}

/**
 * +1 se a Dádiva Épica ativa já resolveu sua escolha de atributo para
 * `ability`, senão `0` — consumido por
 * `rules/abilities.ts#getEffectiveAbilityScore` com teto PRÓPRIO de 30
 * (nunca o teto 20 dos Talentos Gerais, fonte §1: "Não aplicar o limite
 * 20 dos talentos anteriores"). Nunca mais de uma Dádiva Épica ativa, então
 * esta soma nunca ultrapassa 1.
 */
export function getEpicBoonAbilityIncreaseBonus(character: Character, ability: AbilityKey): number {
  return getEpicBoonAbilityIncreaseChoice(character) === ability ? 1 : 0;
}

/** Bônus fixo de PV máximo de Saúde Fortalecida (Dádiva da Fortitude, fonte §3): +40, uma ÚNICA vez — `0` sem a Dádiva ativa (soma direta em `rules/hp.ts#getMaxHitPoints`). */
export function getEpicBoonFortitudeHpBonus(character: Character): number {
  return isEpicBoonActive(character, DADIVA_DA_FORTITUDE_FEAT_ID) ? 40 : 0;
}

/** Modificador de Constituição somado a toda recuperação de PV por Recuperação Fortalecida (Dádiva da Fortitude, fonte §3) — `null` sem a Dádiva ativa. */
export function getEpicBoonFortitudeHealBonus(character: Character): number | null {
  if (!isEpicBoonActive(character, DADIVA_DA_FORTITUDE_FEAT_ID)) return null;
  return getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
}

/**
 * Metade do PV máximo ATUAL, arredondada para baixo — recuperação de
 * "Até a Morte" (Dádiva da Recuperação, fonte §7). Usa
 * `rules/hp.ts#getMaxHitPoints` (o `.total`, já com ajuste manual
 * incluído, igual ao "máximo atual" pedido pela fonte) — `null` sem a
 * Dádiva ativa.
 */
export function getEpicBoonRecoveryHalfMaxHp(character: Character): number | null {
  if (!isEpicBoonActive(character, DADIVA_DA_RECUPERACAO_FEAT_ID)) return null;
  return Math.floor(getMaxHitPoints(character).total / 2);
}

/** CD da salvaguarda de Destreza de Redirecionamento de Energia (Dádiva da Resistência à Energia, fonte §8): `8 + mod. CON + BP` — `null` sem a Dádiva ativa. */
export function getEpicBoonEnergyRedirectCd(character: Character): number | null {
  if (!isEpicBoonActive(character, DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID)) return null;
  const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
  return 8 + conMod + getProficiencyBonus(character.level);
}

/** Dano de Redirecionamento de Energia, já formatado (`2d12+N`/`2d12-N`/`2d12`) — `null` sem a Dádiva ativa. */
export function getEpicBoonEnergyRedirectDamage(character: Character): string | null {
  if (!isEpicBoonActive(character, DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID)) return null;
  const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
  if (conMod > 0) return `2d12+${conMod}`;
  if (conMod < 0) return `2d12${conMod}`;
  return "2d12";
}

/** Bônus de Deslocamento de Agilidade (Dádiva da Velocidade, fonte §9): +9m fixo — `0` sem a Dádiva ativa (soma direta em `rules/speed.ts`). */
export function getEpicBoonSpeedBonus(character: Character): number {
  return isEpicBoonActive(character, DADIVA_DA_VELOCIDADE_FEAT_ID) ? 9 : 0;
}

/**
 * Valor ATUAL (nunca o modificador) do atributo escolhido por Dádiva do
 * Ataque Irresistível — usado por Golpe Devastador (fonte §12: "usar o
 * valor do atributo, não seu modificador"). `null` sem a Dádiva ativa ou
 * com a escolha de atributo ainda não resolvida.
 */
export function getEpicBoonIrresistibleAttackValue(character: Character): number | null {
  if (!isEpicBoonActive(character, DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID)) return null;
  const ability = getEpicBoonAbilityIncreaseChoice(character);
  if (!ability) return null;
  return getEffectiveAbilityScore(character, ability);
}

/** `true` se Dádiva da Proficiência em Perícia está ativa — concede proficiência em TODAS as perícias (fonte §5, `rules/skills.ts#isSkillGrantedByEpicBoon`). */
export function hasEpicBoonSkillProficiencyGrant(character: Character): boolean {
  return isEpicBoonActive(character, DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID);
}
