import type { Character } from "../domain/character.js";
import { canChooseSubclass } from "./subclasses.js";
import { getCharacterFeatures } from "./features.js";
import { getSpellcastingAbility } from "./spellcasting.js";

/**
 * As 11 etapas do Builder (decisão aprovada §10, com a etapa 8 nova
 * justificada na arquitetura §15): 1–2, 4–7, 9, 11 sempre aparecem;
 * 3 (Subclasse), 8 (Características e Talentos) e 10 (Conjuração) são
 * condicionais — ver `isStepVisible`.
 */
export const BUILDER_STEP_ORDER = [
  "basicInfo",
  "class",
  "subclass",
  "species",
  "background",
  "abilities",
  "skills",
  "featuresAndTalents",
  "equipment",
  "spellcasting",
  "review",
] as const;
export type BuilderStepId = (typeof BUILDER_STEP_ORDER)[number];

export const BUILDER_STEP_LABELS: Record<BuilderStepId, string> = {
  basicInfo: "Informações Básicas",
  class: "Classe",
  subclass: "Subclasse",
  species: "Espécie",
  background: "Antecedente",
  abilities: "Atributos",
  skills: "Perícias e Proficiências",
  featuresAndTalents: "Características e Talentos",
  equipment: "Equipamento / Combate",
  spellcasting: "Conjuração",
  review: "Revisão",
};

/**
 * Se a etapa deve aparecer para o personagem atual:
 * - Subclasse: só a partir do nível 3 (regra fixa — `canChooseSubclass`).
 * - Características e Talentos: só se existir ao menos uma feature com
 *   escolha (`FeatureChoice`) pendente de resposta.
 * - Conjuração: só se a classe/antecedente atual conceder um atributo
 *   de conjuração (`getSpellcastingAbility`).
 * - As demais etapas sempre aparecem.
 */
export function isStepVisible(stepId: BuilderStepId, character: Character): boolean {
  if (stepId === "subclass") return canChooseSubclass(character.level);
  if (stepId === "featuresAndTalents") {
    return getCharacterFeatures(character).some((feature) => (feature.choices?.length ?? 0) > 0);
  }
  if (stepId === "spellcasting") return getSpellcastingAbility(character) !== null;
  return true;
}

/** A lista de etapas visíveis, na ordem, para o personagem atual. */
export function getVisibleSteps(character: Character): BuilderStepId[] {
  return BUILDER_STEP_ORDER.filter((stepId) => isStepVisible(stepId, character));
}
