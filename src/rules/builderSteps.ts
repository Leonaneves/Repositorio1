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
  "wildShapeForms",
  "earthCircleTerrain",
  "elementalAffinity",
  "metamagic",
  "species",
  "background",
  "abilities",
  "skills",
  "featuresAndTalents",
  "invocations",
  "equipment",
  "spellcasting",
  "review",
] as const;
export type BuilderStepId = (typeof BUILDER_STEP_ORDER)[number];

export const BUILDER_STEP_LABELS: Record<BuilderStepId, string> = {
  basicInfo: "Informações Básicas",
  class: "Classe",
  subclass: "Subclasse",
  wildShapeForms: "Formas Conhecidas",
  earthCircleTerrain: "Terreno do Círculo da Terra",
  elementalAffinity: "Afinidade Elemental",
  metamagic: "Metamagia",
  species: "Espécie",
  background: "Antecedente",
  abilities: "Atributos",
  skills: "Perícias e Proficiências",
  featuresAndTalents: "Características e Talentos",
  invocations: "Invocações Místicas",
  equipment: "Equipamento / Combate",
  spellcasting: "Conjuração",
  review: "Revisão",
};

/**
 * Se a etapa deve aparecer para o personagem atual:
 * - Subclasse: só a partir do nível 3 (regra fixa — `canChooseSubclass`).
 * - Formas Conhecidas: só para Druida a partir do nível 2 (fonte
 *   "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" §8) — etapa própria,
 *   fora do mecanismo genérico de `FeatureChoice` (mesma razão de
 *   Invocações Místicas: validação cruzada quantidade/ND/Voo).
 * - Terreno do Círculo da Terra: só para Druida/Círculo da Terra a
 *   partir do nível 3 (§27) — primeira aplicação da regra arquitetural
 *   do §21 (escolha de subclasse duradoura com efeito amplo ganha
 *   etapa condicional própria).
 * - Afinidade Elemental: só para Feiticeiro/Feitiçaria Dracônica a
 *   partir do nível 6 (fonte "INTEGRAÇÃO COMPLETA — FEITICEIRO,
 *   METAMAGIA E SUBCLASSES" §36) — mesma regra arquitetural do Terreno
 *   do Círculo da Terra.
 * - Metamagia: só para Feiticeiro a partir do nível 2 (§10) — etapa
 *   própria, fora do mecanismo genérico de `FeatureChoice` (mesma
 *   razão de Invocações Místicas/Formas Conhecidas: quantidade por
 *   nível + nunca duplicar).
 * - Características e Talentos: só se existir ao menos uma feature com
 *   escolha (`FeatureChoice`) pendente de resposta.
 * - Invocações Místicas: só para a classe Bruxo (fonte "INTEGRAÇÃO
 *   COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES" §4) — etapa
 *   própria, fora do mecanismo genérico de `FeatureChoice`.
 * - Conjuração: só se a classe/antecedente atual conceder um atributo
 *   de conjuração (`getSpellcastingAbility`).
 * - As demais etapas sempre aparecem.
 */
export function isStepVisible(stepId: BuilderStepId, character: Character): boolean {
  if (stepId === "subclass") return canChooseSubclass(character.level);
  if (stepId === "wildShapeForms") return character.classId === "druida" && character.level >= 2;
  if (stepId === "earthCircleTerrain") return character.classId === "druida" && character.subclassId === "Círculo da Terra" && character.level >= 3;
  if (stepId === "elementalAffinity") return character.classId === "feiticeiro" && character.subclassId === "Feitiçaria Dracônica" && character.level >= 6;
  if (stepId === "metamagic") return character.classId === "feiticeiro" && character.level >= 2;
  if (stepId === "featuresAndTalents") {
    return getCharacterFeatures(character).some((feature) => (feature.choices?.length ?? 0) > 0);
  }
  if (stepId === "invocations") return character.classId === "bruxo";
  if (stepId === "spellcasting") return getSpellcastingAbility(character) !== null;
  return true;
}

/** A lista de etapas visíveis, na ordem, para o personagem atual. */
export function getVisibleSteps(character: Character): BuilderStepId[] {
  return BUILDER_STEP_ORDER.filter((stepId) => isStepVisible(stepId, character));
}
