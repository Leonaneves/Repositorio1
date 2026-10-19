import { createBlankCharacter, type Character } from "../domain/character.js";
import type { TalentOpportunityKind } from "../domain/characterBuild.js";
import type { ClassId } from "../domain/ids.js";
import { ASI_LEVELS_BY_CLASS } from "../data/features/classes.js";
import { epicBoons } from "../data/features/epicBoons.js";
import { generalFeats, ORIGIN_FEAT_IDS } from "../data/features/feats.js";
import { PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID } from "../data/features/paladin.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID } from "../data/features/ranger.js";
import { fightingStyles } from "../data/fightingStyles.js";
import { subclasses } from "../data/subclasses.js";
import { getTalentOpportunityFeatures } from "../rules/features.js";
import { classifyTalentOptionPick } from "../recommendations/opportunityKind.js";

/**
 * Oportunidades de talento que EXISTEM para uma classe — derivadas das
 * mesmas regras usadas pelo Builder (nunca uma tabela paralela), para a
 * validação de referências rejeitar só incompatibilidades comprovadas
 * (ex.: Estilo de Luta para um Mago, Talento Geral num nível sem ASI).
 */
export interface TalentOpportunitySlot {
  kind: TalentOpportunityKind;
  opportunityId: string;
  level: number | null;
  /** Subclasse sem a qual esta oportunidade não existe (ex.: Estilo de Luta Adicional do Campeão) — `null` = concedida pela classe. */
  requiredSubclassId: string | null;
}

/** Ids válidos por tipo de oportunidade — o catálogo que cada seletor oferece. */
export const TALENT_CATALOG_IDS: Readonly<Record<TalentOpportunityKind, ReadonlySet<string>>> = {
  originFeat: new Set(ORIGIN_FEAT_IDS),
  generalFeat: new Set(generalFeats.map((feat) => feat.id)),
  fightingStyle: new Set(fightingStyles.map((style) => style.id)),
  epicBoon: new Set(epicBoons.map((boon) => boon.id)),
};

/**
 * Personagem-sonda de nível 20 da classe/subclasse, com o ramo "Estilo de
 * Luta" escolhido nas alternativas do Patrulheiro/Paladino — só para
 * descobrir QUAIS oportunidades de Estilo de Luta/Dádiva Épica as regras
 * concedem (e em que nível). Nunca persistido nem exibido.
 */
function probeCharacter(classId: ClassId, subclassId: string | null): Character {
  const character = createBlankCharacter("reference-validation-probe");
  return {
    ...character,
    classId,
    subclassId,
    level: 20,
    featureChoiceSelections: {
      [RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID]: { value: "Estilo de Luta" },
      [PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID]: { value: "Estilo de Luta" },
    },
  };
}

function choiceSlots(classId: ClassId, subclassId: string | null): Omit<TalentOpportunitySlot, "requiredSubclassId">[] {
  const slots: Omit<TalentOpportunitySlot, "requiredSubclassId">[] = [];
  for (const feature of getTalentOpportunityFeatures(probeCharacter(classId, subclassId))) {
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "optionPick") continue;
      const kind = classifyTalentOptionPick(choice.effect.options);
      if (kind) slots.push({ kind, opportunityId: choice.id, level: feature.level });
    }
  }
  return slots;
}

const slotCache = new Map<ClassId, TalentOpportunitySlot[]>();

/**
 * Todas as oportunidades da classe: Talento de Origem (criação — a
 * restrição a Humano é checada à parte, pela espécie), Talento Geral em
 * cada nível de ASI da classe, e os Estilos de Luta/Dádiva Épica — os
 * que só existem com uma subclasse específica vêm com `requiredSubclassId`.
 */
export function getTalentOpportunitySlots(classId: ClassId): TalentOpportunitySlot[] {
  const cached = slotCache.get(classId);
  if (cached) return cached;

  const slots: TalentOpportunitySlot[] = [
    { kind: "originFeat", opportunityId: "species", level: null, requiredSubclassId: null },
    ...(ASI_LEVELS_BY_CLASS[classId] ?? []).map((level) => ({
      kind: "generalFeat" as const,
      opportunityId: `asi-${level}`,
      level,
      requiredSubclassId: null,
    })),
  ];

  const classOnly = choiceSlots(classId, null);
  slots.push(...classOnly.map((slot) => ({ ...slot, requiredSubclassId: null })));
  const classOnlyIds = new Set(classOnly.map((slot) => slot.opportunityId));
  for (const subclass of subclasses[classId] ?? []) {
    for (const slot of choiceSlots(classId, subclass.fullName)) {
      if (!classOnlyIds.has(slot.opportunityId)) slots.push({ ...slot, requiredSubclassId: subclass.fullName });
    }
  }

  slotCache.set(classId, slots);
  return slots;
}
