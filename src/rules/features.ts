import type { Character } from "../domain/character.js";
import type { FeatureDefinition, FeatureView } from "../domain/features.js";
import { backgroundFeatFeatures } from "../data/features/backgrounds.js";
import { classFeatures } from "../data/features/classes.js";
import { generalFeats } from "../data/features/feats.js";
import { speciesFeatures } from "../data/features/species.js";
import { subclassFeatures } from "../data/features/subclasses.js";

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

/** Traços da espécie escolhida. */
export function getSpeciesFeatures(character: Character): FeatureDefinition[] {
  if (!character.speciesId) return [];
  return speciesFeatures.filter((feature) => feature.speciesId === character.speciesId);
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
