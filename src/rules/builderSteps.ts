import type { Character } from "../domain/character.js";
import { canChooseSubclass } from "./subclasses.js";
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
 * momento em que a subclasse dona delas está ativa.
 *
 * "featuresAndTalents" (rótulo "Talentos") passa a ser SEMPRE visível
 * (fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS OS
 * ATRIBUTOS" §1/§5) — já posicionada depois de "abilities" e antes de
 * "skills" na ordem abaixo, a posição exigida pela fonte para a nova
 * etapa Talentos nunca precisou mudar. Reúne: as concessões automáticas
 * de Espécie/Antecedente/Talento já resolvidas (como antes), as
 * oportunidades de Estilo de Luta/Dádiva Épica (movidas de
 * Classe/Subclasse) e a decisão + distribuição de cada ASI (movida de
 * Classe/Atributos) — por isso NUNCA fica vazia como no desenho antigo
 * (`isStepVisible` não trata mais este caso especialmente).
 *
 * "skills" (Perícias) é uma etapa própria do Builder (fonte
 * "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" —
 * substitui a decisão anterior de nunca ter etapa lateral e manter a
 * edição só pelo botão "Editar" da Revisão). Fica POSICIONADA depois
 * de Classe/Subclasse, Espécie, Antecedente e Características e
 * Talentos (todas as etapas que definem fontes de perícia) e antes de
 * Equipamento/Conjuração/Revisão — sempre visível, pois toda classe
 * tem ao menos "Perícias de Classe".
 */
export const BUILDER_STEP_ORDER = [
  "basicInfo",
  "class",
  "metamagic",
  "maneuvers",
  "species",
  "background",
  "abilities",
  "featuresAndTalents",
  "invocations",
  "skills",
  "equipment",
  "spellcasting",
  "review",
] as const;
export type BuilderStepId = (typeof BUILDER_STEP_ORDER)[number];

export const BUILDER_STEP_LABELS: Record<BuilderStepId, string> = {
  basicInfo: "Informações Básicas",
  class: "Classe",
  metamagic: "Metamagia",
  maneuvers: "Manobras",
  species: "Espécie",
  background: "Antecedente",
  abilities: "Atributos",
  featuresAndTalents: "Talentos",
  invocations: "Invocações Místicas",
  skills: "Perícias",
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
 * - Manobras: só para Guerreiro/Mestre de Batalha a partir do nível 3
 *   (fonte "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF"
 *   §1/§6: "as escolhas de Subclasse ficam dentro de Classe, exceto
 *   Manobras, que terão uma subetapa própria condicional") — mesma
 *   arquitetura de Metamagia/Invocações Místicas.
 * - Talentos ("featuresAndTalents"): sempre visível (ver comentário
 *   acima) — nunca condicional, mesmo padrão de "species"/"background"/
 *   "abilities".
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
  if (stepId === "maneuvers") return character.classId === "guerreiro" && character.subclassId === "Mestre da Batalha" && character.level >= 3;
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
