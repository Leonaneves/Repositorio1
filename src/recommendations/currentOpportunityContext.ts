import type { Character } from "../domain/character.js";
import type { TalentOpportunityKind } from "../domain/characterBuild.js";
import { getBackgroundAbilityAllocationConfig } from "../data/backgrounds.js";
import { generalFeats } from "../data/features/feats.js";
import { highestAbility } from "../repositories/AnalyticsRepository.js";
import { hasGeneratedBaseAbilityScores } from "../rules/abilities.js";
import { isAllocationComplete } from "../rules/abilityAllocation.js";
import { getUnlockedAsiLevels, isAsiLevelComplete } from "../rules/asi.js";
import { getFeatAbilityIncreaseChoice, getFeatAbilityIncreaseChoiceId } from "../rules/feats.js";
import { getTalentOpportunityFeatures } from "../rules/features.js";
import { getTalentAcquisitionContext } from "../rules/talentAcquisitionHistory.js";
import { classifyTalentOptionPick } from "./opportunityKind.js";
import type { TalentChoiceCountQuery } from "./types.js";

/**
 * Qual oportunidade um seletor representa — mesma identidade usada nos
 * registros gravados (`TalentAcquisitionRecord.opportunityId`/`opportunityKind`/
 * `acquisitionLevel`), para o personagem atual ser comparado exatamente
 * com aquisições do mesmo tipo.
 */
export interface TalentOpportunityDescriptor {
  kind: TalentOpportunityKind;
  opportunityId: string;
  /** `null` só para o Talento de Origem do Humano (criação). */
  level: number | null;
}

/** Talento de Origem do Humano (traço Versátil) — escolhido na criação, sem nível numérico. */
export const HUMAN_ORIGIN_FEAT_OPPORTUNITY: TalentOpportunityDescriptor = { kind: "originFeat", opportunityId: "species", level: null };

/** Talento escolhido no Aumento no Valor de Atributo de `level`. */
export function getAsiFeatOpportunity(level: number): TalentOpportunityDescriptor {
  return { kind: "generalFeat", opportunityId: `asi-${level}`, level };
}

/**
 * Oportunidade de Estilo de Luta/Dádiva Épica a que pertence a
 * `FeatureChoice` `choiceId` — `null` para qualquer outra escolha
 * (inclusive o ramo "Estilo de Luta ou Combatente…" e os truques
 * alternativos, que nunca recebem recomendação). O nível vem da
 * `FeatureDefinition` que concede a oportunidade (Guerreiro 1, Campeão 7,
 * Patrulheiro/Paladino 2, Dádiva Épica 19).
 */
export function getTalentChoiceOpportunity(character: Character, choiceId: string): TalentOpportunityDescriptor | null {
  for (const feature of getTalentOpportunityFeatures(character)) {
    const choice = feature.choices?.find((candidate) => candidate.id === choiceId);
    if (!choice || choice.effect.kind !== "optionPick") continue;
    const kind = classifyTalentOptionPick(choice.effect.options);
    if (!kind) return null;
    return { kind, opportunityId: choiceId, level: feature.level };
  }
  return null;
}

/** Se o talento tem a escolha "+1 num atributo" (convenção `${featId}-atributo` com efeito `abilityScoreIncrease`). */
function featHasAbilityIncrease(featId: string): boolean {
  const feat = generalFeats.find((candidate) => candidate.id === featId);
  const choiceId = getFeatAbilityIncreaseChoiceId(featId);
  return feat?.choices?.some((choice) => choice.id === choiceId && choice.effect.kind === "abilityScoreIncrease") ?? false;
}

/**
 * Se os atributos do personagem IMEDIATAMENTE ANTES de `acquisitionLevel`
 * são conhecidos — base gerada, bônus do Antecedente distribuído e todo
 * Aumento no Valor de Atributo ANTERIOR resolvido (inclusive o "+1" de
 * um talento escolhido nele). Qualquer lacuna = desconhecido (fonte §4:
 * "o que for desconhecido deve permanecer desconhecido"): o maior
 * atributo nunca é calculado a partir de valores padrão ou parciais.
 */
export function areAbilitiesKnownBefore(character: Character, acquisitionLevel: number | null): boolean {
  if (!hasGeneratedBaseAbilityScores(character)) return false;
  if (!character.backgroundId) return false;
  if (!isAllocationComplete(getBackgroundAbilityAllocationConfig(character.backgroundId), character.backgroundAbilityBonuses)) return false;
  if (acquisitionLevel === null) return true;

  return getUnlockedAsiLevels(character)
    .filter((level) => level < acquisitionLevel)
    .every((level) => {
      const selection = character.asiSelections[level];
      if (!isAsiLevelComplete(selection)) return false;
      if (selection?.kind !== "feat" || !selection.featId || !featHasAbilityIncrease(selection.featId)) return true;
      return getFeatAbilityIncreaseChoice(character, { acquisitionKey: `asi-${level}`, featId: selection.featId }) !== null;
    });
}

export interface BuildQueryOptions {
  includeUserRecords: boolean;
}

/**
 * Consulta de contagem para a oportunidade `descriptor` do personagem
 * atual — `null` sem classe (a classe é parte obrigatória do contexto).
 * Reaproveita `rules/talentAcquisitionHistory.ts#getTalentAcquisitionContext`
 * (o MESMO corte histórico dos registros gravados): subclasse só a
 * partir do nível 3, atributos sem a contribuição da própria aquisição
 * nem de aquisições posteriores.
 */
export function buildTalentChoiceCountQuery(
  character: Character,
  descriptor: TalentOpportunityDescriptor,
  options: BuildQueryOptions,
): TalentChoiceCountQuery | null {
  if (!character.classId) return null;
  const context = getTalentAcquisitionContext(character, descriptor.level);
  const subclassId = context.subclassId === "desconhecido" ? null : context.subclassId;
  return {
    opportunityKind: descriptor.kind,
    classId: character.classId,
    subclassId,
    highestAbility: areAbilitiesKnownBefore(character, descriptor.level) ? highestAbility(context.abilityScores) : null,
    excludeCharacterId: character.id,
    includeUserRecords: options.includeUserRecords,
  };
}
