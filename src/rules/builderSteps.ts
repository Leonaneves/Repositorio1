import type { Character } from "../domain/character.js";
import { canChooseSubclass } from "./subclasses.js";
import { getOtherFeaturesWithChoices } from "./features.js";
import { getSpellcastingAbility } from "./spellcasting.js";
import { getAutoPreparedSpells } from "./effectiveSpellsPrepared.js";

/**
 * As etapas do Builder (fonte "REORGANIZAR O BUILDER E CORRIGIR
 * VALIDAÇÕES EXISTENTES" §2: Classe e Subclasse passam a ocupar um
 * único item — "class" — em vez de dois/quatro itens separados.
 * Terreno do Círculo da Terra e Afinidade Elemental, que antes eram
 * etapas próprias, agora são SEÇÕES dentro da etapa Classe
 * (`ui/builder/steps/Step2Class.tsx`), condicionadas pelas mesmas
 * regras de sempre (`isEarthCircleTerrainApplicable`/
 * `isElementalAffinityApplicable` abaixo) — nunca exigidas fora do
 * momento em que a subclasse dona delas está ativa. "Características e
 * Talentos" continua condicional — ver `isStepVisible`.
 *
 * "skills" (Perícias e Proficiências) NUNCA é etapa lateral (fonte
 * "AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS" §3) — a edição
 * de perícias só é alcançável pelo botão "Editar" da Revisão
 * (`ui/builder/SkillsEditModal.tsx`), nunca pela navegação normal do
 * Builder.
 */
export const BUILDER_STEP_ORDER = [
  "basicInfo",
  "class",
  "metamagic",
  "species",
  "background",
  "abilities",
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
  metamagic: "Metamagia",
  species: "Espécie",
  background: "Antecedente",
  abilities: "Atributos",
  featuresAndTalents: "Características e Talentos",
  invocations: "Invocações Místicas",
  equipment: "Equipamento / Combate",
  spellcasting: "Conjuração",
  review: "Revisão",
};

/**
 * Se a seção de Terreno do Círculo da Terra deve aparecer DENTRO da
 * etapa Classe (Druida/Círculo da Terra a partir do nível 3) — única
 * fonte da regra, reusada pelo render da etapa Classe, pelo bloqueio
 * (`rules/builderProgress.ts`) e pela Revisão, para nunca duplicar a
 * condição em 3 lugares.
 */
export function isEarthCircleTerrainApplicable(character: Character): boolean {
  return character.classId === "druida" && character.subclassId === "Círculo da Terra" && character.level >= 3;
}

/** Mesma ideia, para a seção de Afinidade Elemental (Feiticeiro/Feitiçaria Dracônica a partir do nível 6). */
export function isElementalAffinityApplicable(character: Character): boolean {
  return character.classId === "feiticeiro" && character.subclassId === "Feitiçaria Dracônica" && character.level >= 6;
}

/**
 * Se a etapa deve aparecer para o personagem atual:
 * - Metamagia: só para Feiticeiro a partir do nível 2 (§10) — etapa
 *   própria, fora do mecanismo genérico de `FeatureChoice` (mesma
 *   razão de Invocações Místicas/Formas Conhecidas: quantidade por
 *   nível + nunca duplicar).
 * - Características e Talentos: desde a "REORGANIZAÇÃO DO BUILDER" (§1/§2),
 *   escolhas de Classe/Subclasse moraram para a etapa Classe
 *   (`getClassFeaturesWithChoices`/`getSubclassFeaturesWithChoices`,
 *   ambas renderizadas por `Step2Class`) — esta etapa só continua
 *   visível se existir uma `FeatureChoice` pendente de ESPÉCIE/
 *   ANTECEDENTE/TALENTO (`getOtherFeaturesWithChoices`, hoje sempre
 *   vazio — nenhum catálogo confirmado ainda usa `choices` nessas 3
 *   origens). Nunca mostra etapa vazia.
 * - Invocações Místicas: só para a classe Bruxo (fonte "INTEGRAÇÃO
 *   COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES" §4) — etapa
 *   própria, fora do mecanismo genérico de `FeatureChoice`.
 * - Conjuração: se a classe/antecedente atual conceder um atributo de
 *   conjuração (`getSpellcastingAbility`) OU se a espécie conceder
 *   magias por Linhagem (Elfo/Gnomo/Tiefling — `getAutoPreparedSpells`
 *   inclui `getSpeciesGrantedSpells`, que não depende de classe) —
 *   fonte "IMPLEMENTAR LINHAGENS..." §3: "Isso também deve funcionar
 *   para personagem cuja classe não tenha conjuração".
 * - As demais etapas sempre aparecem (inclusive "class", mesmo antes
 *   do nível 3 — a seção de Subclasse dentro dela é que fica
 *   condicional a `canChooseSubclass`, nunca a etapa toda).
 */
export function isStepVisible(stepId: BuilderStepId, character: Character): boolean {
  if (stepId === "metamagic") return character.classId === "feiticeiro" && character.level >= 2;
  if (stepId === "featuresAndTalents") {
    return getOtherFeaturesWithChoices(character).length > 0;
  }
  if (stepId === "invocations") return character.classId === "bruxo";
  if (stepId === "spellcasting") return getSpellcastingAbility(character) !== null || getAutoPreparedSpells(character).length > 0;
  return true;
}

/** A lista de etapas visíveis, na ordem, para o personagem atual. */
export function getVisibleSteps(character: Character): BuilderStepId[] {
  return BUILDER_STEP_ORDER.filter((stepId) => isStepVisible(stepId, character));
}

/** Reexportado por conveniência — a regra de nível mínimo para a SEÇÃO de Subclasse dentro da etapa Classe. */
export { canChooseSubclass };
