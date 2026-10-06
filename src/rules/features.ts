import type { Character } from "../domain/character.js";
import type { FeatureChoice, FeatureDefinition, FeatureView } from "../domain/features.js";
import { backgroundFeatFeatures } from "../data/features/backgrounds.js";
import { classFeatures } from "../data/features/classes.js";
import { generalFeats } from "../data/features/feats.js";
import { speciesFeatures } from "../data/features/species.js";
import { subclassFeatures } from "../data/features/subclasses.js";
import { hasSpeciesLineage } from "../data/speciesLineages.js";
import { getSpeciesTraitsPrintedText } from "./speciesLineagePrintedFeatures.js";

/** Features de classe já adquiridas (nível de aquisição ≤ nível atual). */
export function getClassFeatures(character: Character): FeatureDefinition[] {
  if (!character.classId) return [];
  return classFeatures.filter(
    (feature) => feature.classId === character.classId && (feature.level === null || feature.level <= character.level),
  );
}

/** Features de subclasse já adquiridas — vazio até existir um catálogo confirmado (ver data/features/subclasses.ts). */
export function getSubclassFeatures(character: Character): FeatureDefinition[] {
  if (!character.subclassId) return [];
  return subclassFeatures.filter(
    (feature) => feature.subclassFullName === character.subclassId && (feature.level === null || feature.level <= character.level),
  );
}

/**
 * Traços da espécie escolhida. Para Draconato/Elfo/Gnomo/Golias/
 * Tiefling (fonte "IMPLEMENTAR LINHAGENS..."), `summary` é sobrescrito
 * com o texto DINÂMICO de `getSpeciesTraitsPrintedText` (resolve
 * nível/linhagem/atributos atuais) — nunca o `traitsText` estático do
 * `FeatureDefinition` base, que para essas 5 fica sem uso (só
 * continua existindo porque o campo é obrigatório no tipo). As outras
 * 5 espécies continuam com o `summary` estático de sempre.
 */
export function getSpeciesFeatures(character: Character): FeatureDefinition[] {
  if (!character.speciesId) return [];
  const features = speciesFeatures.filter((feature) => feature.speciesId === character.speciesId);
  if (!hasSpeciesLineage(character.speciesId)) return features;
  return features.map((feature) => ({ ...feature, summary: getSpeciesTraitsPrintedText(character) }));
}

/** Talento de origem do antecedente escolhido. */
export function getBackgroundFeatures(character: Character): FeatureDefinition[] {
  if (!character.backgroundId) return [];
  return backgroundFeatFeatures.filter((feature) => feature.backgroundId === character.backgroundId);
}

/** Talentos gerais escolhidos pelo jogador (`Character.chosenFeatIds`) — catálogo ainda vazio (ver data/features/feats.ts). */
export function getChosenFeatFeatures(character: Character): FeatureDefinition[] {
  return generalFeats.filter((feature) => character.chosenFeatIds.includes(feature.id));
}

/** Todas as features do personagem, de todas as fontes, sem duplicar. */
export function getCharacterFeatures(character: Character): FeatureDefinition[] {
  return [
    ...getClassFeatures(character),
    ...getSubclassFeatures(character),
    ...getSpeciesFeatures(character),
    ...getBackgroundFeatures(character),
    ...getChosenFeatFeatures(character),
  ];
}

/**
 * Se uma `FeatureChoice` já foi respondida "por completo" — usado para
 * travar o avanço do Builder (decisão §5/§11: "impedir avanço enquanto
 * uma escolha obrigatória estiver incompleta", nunca só "classe já
 * selecionada"). `manualText` nunca bloqueia: não há catálogo para
 * validar contra, então fica sempre como opcional/informativo por ora.
 */
export function isFeatureChoiceComplete(choice: FeatureChoice, character: Character): boolean {
  const selection = character.featureChoiceSelections[choice.id]?.value;

  if (choice.effect.kind === "skillProficiency" || choice.effect.kind === "skillExpertise" || choice.effect.kind === "toolProficiency") {
    const selected = Array.isArray(selection) ? selection : [];
    return selected.length === choice.effect.count;
  }
  if (choice.effect.kind === "weaponPicker") {
    return typeof selection === "string" && selection.trim().length > 0;
  }
  if (choice.effect.kind === "optionPick") {
    return typeof selection === "string" && choice.effect.options.includes(selection);
  }
  return true; // manualText: sem catálogo para validar, nunca bloqueia.
}

/** Se TODAS as escolhas de uma feature já foram respondidas. */
export function isFeatureComplete(feature: FeatureDefinition, character: Character): boolean {
  return (feature.choices ?? []).every((choice) => isFeatureChoiceComplete(choice, character));
}

/**
 * As features do personagem que ainda têm ao menos uma `FeatureChoice`
 * pendente (skillProficiency/toolProficiency/weaponPicker/optionPick sem
 * resposta completa) — é o que faz a etapa "Características e Talentos"
 * do Builder travar o "Avançar" até o jogador resolver.
 */
export function getIncompleteRequiredChoices(character: Character): FeatureDefinition[] {
  return getCharacterFeatures(character).filter((feature) => !isFeatureComplete(feature, character));
}

/** Features com `choices` da CLASSE atual — fonte "REORGANIZAÇÃO DO BUILDER" §1/§2: todas resolvidas dentro da própria etapa Classe, nunca em "Características e Talentos". */
export function getClassFeaturesWithChoices(character: Character): FeatureDefinition[] {
  return getCharacterFeatures(character).filter((feature) => feature.sourceType === "class" && (feature.choices?.length ?? 0) > 0);
}

/** Features com `choices` da SUBCLASSE atual — mesma lógica, resolvidas dentro da etapa Subclasse. */
export function getSubclassFeaturesWithChoices(character: Character): FeatureDefinition[] {
  return getCharacterFeatures(character).filter((feature) => feature.sourceType === "subclass" && (feature.choices?.length ?? 0) > 0);
}

/** Features com `choices` que NÃO vêm de Classe/Subclasse (Espécie/Antecedente/Talento) — o que resta em "Características e Talentos" depois da redistribuição. */
export function getOtherFeaturesWithChoices(character: Character): FeatureDefinition[] {
  return getCharacterFeatures(character).filter(
    (feature) => feature.sourceType !== "class" && feature.sourceType !== "subclass" && (feature.choices?.length ?? 0) > 0,
  );
}

const ORIGIN_LABELS: Record<FeatureDefinition["sourceType"], string> = {
  class: "Classe",
  subclass: "Subclasse",
  species: "Espécie",
  background: "Antecedente",
  feat: "Talento",
};

/** Visão pronta para exibir a feature (nome, origem, resumo, usos, escolhas) — usada pela Ficha Web/Builder/PDF. */
export function getFeatureView(feature: FeatureDefinition): FeatureView {
  return {
    id: feature.id,
    name: feature.name,
    sourceType: feature.sourceType,
    originLabel: ORIGIN_LABELS[feature.sourceType],
    summary: feature.summary,
    uses: feature.uses,
    choices: feature.choices,
  };
}
