import { ABILITY_KEYS } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { warlockInvocationsById } from "../data/invocations.js";
import { metamagicOptionsById } from "../data/metamagic.js";
import { skills } from "../data/skills.js";
import { getBackgroundAbilityAllocationConfig } from "../data/backgrounds.js";
import { getSpeciesLineageLabel, hasSpeciesLineage } from "../data/speciesLineages.js";
import { isSpeciesLineageResolved } from "./speciesLineage.js";
import {
  EARTH_CIRCLE_TERRAIN_CHOICE_ID,
  EARTH_CIRCLE_TERRAIN_OPTIONS,
  ELEMENTAL_AFFINITY_CHOICE_ID,
  ELEMENTAL_AFFINITY_OPTIONS,
} from "../data/features/subclasses.js";
import { getInvocationsKnown } from "./classResources.js";
import { BUILDER_STEP_LABELS, getVisibleSteps, isEarthCircleTerrainApplicable, isElementalAffinityApplicable, type BuilderStepId } from "./builderSteps.js";
import { canChooseSubclass } from "./subclasses.js";
import { getClassFeaturesWithChoices, getOtherFeaturesWithChoices, getSubclassFeaturesWithChoices, isFeatureComplete } from "./features.js";
import { getRedundantSkillChoiceSelections } from "./skillChoiceConflicts.js";
import { getInvalidChosenInvocations } from "./invocations.js";
import { getKnownMetamagicOptions, getMetamagicOptionsKnownCount } from "./metamagic.js";
import { isStartingEquipmentResolved } from "./startingEquipment.js";
import { getAsiLevelAllocatedPoints, getUnlockedAsiLevels, isAsiLevelComplete, ASI_ALLOCATION_CONFIG } from "./asi.js";
import { isAllocationComplete } from "./abilityAllocation.js";

/** Mensagens de perícia redundante (fonte "REORGANIZAR O BUILDER..." §4) — reaproveitadas pelas etapas "class" e "species". */
function getRedundantSkillBlockers(character: Character, sourceTypes: Array<"class" | "subclass" | "species">): string[] {
  return getRedundantSkillChoiceSelections(character)
    .filter((entry) => sourceTypes.includes(entry.sourceType as "class" | "subclass" | "species"))
    .map(
      (entry) =>
        `Perícia "${skills[entry.skill].name}" escolhida em "${entry.featureName}" já é concedida por outra origem — escolha outra perícia em "${entry.featureName}".`,
    );
}

/**
 * Motivos pelos quais a etapa ATUAL não pode avançar — usado por
 * `builderStore.ts#canAdvance` (só olha `length === 0`) e pela Revisão
 * (`getPendingBuilderSteps`, que roda isto para TODAS as etapas
 * visíveis, não só a atual). Único lugar onde essa regra existe —
 * nunca duplicada entre o hint do `BuilderWizard` e a Revisão (§9: "se
 * houver problema, mostrar exatamente o que falta", nunca só desabilitar
 * o botão).
 *
 * Fonte "REORGANIZAR O BUILDER E CORRIGIR VALIDAÇÕES EXISTENTES": Classe
 * e Subclasse (e as seções de Terreno do Círculo da Terra/Afinidade
 * Elemental, antes etapas próprias) agora validam tudo sob `stepId ===
 * "class"` (§2) — nunca exigindo Subclasse antes do nível 3. A
 * DISTRIBUIÇÃO dos Aumentos de Atributo (Antecedente e cada ASI) só é
 * validada em `stepId === "abilities"` (§3) — "class"/"background"
 * nunca bloqueiam por ela, só pela DECISÃO (qual Antecedente; ASI vs
 * Talento).
 */
export function getStepBlockers(stepId: BuilderStepId, character: Character): string[] {
  const blockers: string[] = [];

  if (stepId === "class") {
    if (!character.classId) blockers.push("Escolha uma classe para continuar.");
    for (const feature of getClassFeaturesWithChoices(character)) {
      if (!isFeatureComplete(feature, character)) blockers.push(`Escolha pendente em "${feature.name}".`);
    }
    for (const level of getUnlockedAsiLevels(character)) {
      // Só a DECISÃO (Aumentar Atributos vs Talento) bloqueia aqui — a distribuição em si
      // é validada na etapa Atributos (§3), nunca duplicada aqui.
      if (!character.asiSelections[level]) blockers.push(`Nível ${level}: escolha "Aumentar Atributos" ou "Talento".`);
    }

    if (character.classId && canChooseSubclass(character.level)) {
      if (!character.subclassId) blockers.push("Escolha uma subclasse para continuar.");
      for (const feature of getSubclassFeaturesWithChoices(character)) {
        if (!isFeatureComplete(feature, character)) blockers.push(`Escolha pendente em "${feature.name}".`);
      }
      if (isEarthCircleTerrainApplicable(character)) {
        const selection = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
        if (typeof selection !== "string" || !(EARTH_CIRCLE_TERRAIN_OPTIONS as readonly string[]).includes(selection)) {
          blockers.push("Escolha o Terreno do Círculo da Terra.");
        }
      }
      if (isElementalAffinityApplicable(character)) {
        const selection = character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value;
        if (typeof selection !== "string" || !(ELEMENTAL_AFFINITY_OPTIONS as readonly string[]).includes(selection)) {
          blockers.push("Escolha o tipo de Afinidade Elemental.");
        }
      }
    }

    blockers.push(...getRedundantSkillBlockers(character, ["class", "subclass"]));
  }

  if (stepId === "species") {
    if (!character.speciesId) blockers.push("Escolha uma espécie para continuar.");
    else if (hasSpeciesLineage(character.speciesId) && !isSpeciesLineageResolved(character)) {
      blockers.push(`Escolha a ${getSpeciesLineageLabel(character.speciesId)} para continuar.`);
    }
    blockers.push(...getRedundantSkillBlockers(character, ["species"]));
  }

  if (stepId === "background") {
    if (!character.backgroundId) blockers.push("Escolha um antecedente para continuar.");
  }

  if (stepId === "abilities") {
    // Heurística: os 6 atributos ainda no valor padrão (10) indicam que
    // o jogador nunca gerou/confirmou os atributos nesta etapa — não há
    // como distinguir isso de uma build deliberada com os 6 em 10, mas
    // é o único sinal disponível sem inventar um estado extra no
    // Character (regra de ouro: só inputs/ajustes manuais).
    const untouched = ABILITY_KEYS.every((ability) => character.abilities[ability].score === 10);
    if (untouched) blockers.push("Gere e confirme os 6 atributos antes de continuar.");

    if (character.backgroundId) {
      const config = getBackgroundAbilityAllocationConfig(character.backgroundId);
      if (!isAllocationComplete(config, character.backgroundAbilityBonuses)) {
        blockers.push("Distribua todos os pontos de Aumento de Atributo do Antecedente.");
      }
    }

    for (const level of getUnlockedAsiLevels(character)) {
      const selection = character.asiSelections[level];
      if (selection?.kind === "abilityIncrease" && !isAsiLevelComplete(selection)) {
        const allocated = getAsiLevelAllocatedPoints(selection);
        blockers.push(`Nível ${level}: distribua os ${ASI_ALLOCATION_CONFIG.totalPoints} pontos de atributo (${allocated}/${ASI_ALLOCATION_CONFIG.totalPoints}).`);
      }
    }
  }

  if (stepId === "featuresAndTalents") {
    for (const feature of getOtherFeaturesWithChoices(character)) {
      if (!isFeatureComplete(feature, character)) blockers.push(`Escolha pendente em "${feature.name}".`);
    }
  }

  if (stepId === "invocations" && character.classId === "bruxo") {
    const known = getInvocationsKnown(character) ?? 0;
    const chosenCount = character.chosenInvocations.length;
    if (chosenCount < known) blockers.push(`Escolha mais ${known - chosenCount} Invocação(ões) Místicas (${chosenCount}/${known}).`);
    if (chosenCount > known) blockers.push(`Remova Invocações em excesso (${chosenCount}/${known}).`);
    for (const invalid of getInvalidChosenInvocations(character)) {
      const name = warlockInvocationsById[invalid.chosen.invocationId]?.name ?? invalid.chosen.invocationId;
      blockers.push(`Invocação pendente — ${name}: ${invalid.reason}`);
    }
  }

  if (stepId === "equipment") {
    if (!isStartingEquipmentResolved(character)) blockers.push("Escolha um pacote de Equipamento Inicial.");
  }

  if (stepId === "metamagic") {
    const required = getMetamagicOptionsKnownCount(character.level);
    const known = getKnownMetamagicOptions(character);
    if (known.length !== required) {
      blockers.push(`Escolha exatamente ${required} opções de Metamagia (atualmente ${known.length}/${required}).`);
    }
    for (const id of character.knownMetamagicOptions) {
      if (!metamagicOptionsById[id]) blockers.push(`Opção de Metamagia desconhecida: "${id}".`);
    }
  }

  return blockers;
}

export interface PendingBuilderStep {
  stepId: BuilderStepId;
  label: string;
  blockers: string[];
}

/**
 * Todas as etapas VISÍVEIS para o personagem atual que ainda têm
 * pendência — usado pela Revisão (§15/§16: banner de "Escolha
 * pendente" com acesso direto à etapa, e bloqueio de considerar o
 * personagem finalizado). A etapa "review" nunca aparece aqui (não há
 * nada "pendente" na própria Revisão).
 */
export function getPendingBuilderSteps(character: Character): PendingBuilderStep[] {
  return getVisibleSteps(character)
    .filter((stepId) => stepId !== "review")
    .map((stepId) => ({ stepId, label: BUILDER_STEP_LABELS[stepId], blockers: getStepBlockers(stepId, character) }))
    .filter((entry) => entry.blockers.length > 0);
}
