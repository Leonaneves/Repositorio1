import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { ClassId, SkillKey } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { backgrounds } from "../data/backgrounds.js";
import { classes, getClassSkillChoiceId } from "../data/classes.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";

/**
 * IDs de `FeatureChoice` (`skillProficiency`) além da escolha-base de
 * "Perícias de Classe" que também concedem perícia — registrados por
 * classe. Hoje só o Conhecimento Primordial do Bárbaro (nível 3, fonte
 * "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" §6).
 */
const EXTRA_SKILL_CHOICE_IDS_BY_CLASS: Partial<Record<ClassId, string[]>> = {
  barbaro: ["barbaro-conhecimento-primordial-escolha"],
  bardo: ["bardo-conhecimento-proficiencias-bonus-escolha"],
};

/**
 * IDs de `FeatureChoice` (`skillExpertise`) que concedem Especialização
 * (nunca proficiência) — hoje só "Especialista" do Bardo, nos níveis 2
 * e 9 (fonte "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" §4/§10).
 */
const EXPERTISE_CHOICE_IDS_BY_CLASS: Partial<Record<ClassId, string[]>> = {
  bardo: ["bardo-especialista-1-escolha", "bardo-especialista-2-escolha"],
};

import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

/**
 * `true` se o antecedente ATUAL concede proficiência nesta perícia.
 * Puramente derivado de `character.backgroundId` — nunca armazenado em
 * `Character` (mesma razão de sempre: um resultado derivado gravado
 * como input arrisca ficar dessincronizado; aqui ele nem existe como
 * estado, só como cálculo).
 */
export function isSkillGrantedByBackground(character: Character, skill: SkillKey): boolean {
  if (!character.backgroundId) return false;
  return backgrounds[character.backgroundId].grantedSkills.includes(skill);
}

/**
 * `true` se o jogador escolheu esta perícia na feature "Perícias de
 * Classe" (`data/features/classes.ts`) da classe ATUAL — lê a seleção
 * de `character.featureChoiceSelections` pelo mesmo id que a feature
 * usa (`getClassSkillChoiceId`). Classes sem `skillChoice` confirmado
 * (ver `data/classes.ts`) nunca concedem nada por aqui.
 */
export function isSkillGrantedByClassChoice(character: Character, skill: SkillKey): boolean {
  if (!character.classId) return false;

  const choiceIds: string[] = [];
  if (classes[character.classId].skillChoice) choiceIds.push(getClassSkillChoiceId(character.classId));
  choiceIds.push(...(EXTRA_SKILL_CHOICE_IDS_BY_CLASS[character.classId] ?? []));

  return choiceIds.some((choiceId) => {
    const selection = character.featureChoiceSelections[choiceId]?.value;
    const selected = Array.isArray(selection) ? selection : [];
    return selected.includes(skill);
  });
}

/**
 * `true` se alguma escolha de "Especialização" (`skillExpertise`) da
 * classe ATUAL já selecionou esta perícia — nunca concede proficiência,
 * só a Especialização (ex.: "Especialista" do Bardo, níveis 2 e 9).
 */
export function isSkillGrantedExpertiseByClassChoice(character: Character, skill: SkillKey): boolean {
  if (!character.classId) return false;
  const choiceIds = EXPERTISE_CHOICE_IDS_BY_CLASS[character.classId] ?? [];
  return choiceIds.some((choiceId) => {
    const selection = character.featureChoiceSelections[choiceId]?.value;
    const selected = Array.isArray(selection) ? selection : [];
    return selected.includes(skill);
  });
}

/**
 * Especialização final da perícia = toggle manual do jogador OU
 * concedida por uma escolha de "Especialização" da classe atual — a
 * mesma lógica OR do antecedente/escolha de perícias (sem tri-state:
 * `expertise` nunca teve estado "segue o derivado", é só um booleano
 * manual, então aqui basta somar a fonte estrutural por cima).
 */
export function getSkillExpertise(character: Character, skill: SkillKey): boolean {
  return character.skills[skill].expertise || isSkillGrantedExpertiseByClassChoice(character, skill);
}

/**
 * Bônus de "Pau pra Toda Obra" do Bardo (nível 2+, fonte "INTEGRAÇÃO
 * COMPLETA — BARDO E SUBCLASSES" §5): metade do Bônus de Proficiência,
 * arredondado para baixo. Só entra em `getSkillBonus` quando a perícia
 * NÃO é proficiente — nunca em Iniciativa/Salvaguardas/Ataques/CDs,
 * que usam suas próprias fórmulas e nunca chamam esta função.
 */
export function getJackOfAllTradesBonus(character: Character): number {
  if (character.classId !== "bardo" || character.level < 2) return 0;
  return Math.floor(getProficiencyBonus(character.level) / 2);
}

/**
 * Bônus de "Taumaturgo" (Ordem Divina do Clérigo, nível 1 — fonte
 * "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES" §Ordem Divina): modificador
 * de Sabedoria, mínimo +1, aplicado SOMENTE em Arcanismo e Religião.
 * Diferente de "Pau pra Toda Obra" (getJackOfAllTradesBonus), este bônus
 * é INCONDICIONAL — soma mesmo quando a perícia já é proficiente, porque
 * a fonte nunca condiciona o bônus à ausência de proficiência, e nunca
 * concede a proficiência em si.
 */
export function getThaumaturgeSkillBonus(character: Character, skill: SkillKey): number {
  if (character.classId !== "clerigo") return 0;
  if (skill !== "arcanismo" && skill !== "religiao") return 0;
  const selection = character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID]?.value;
  if (selection !== "Taumaturgo") return 0;

  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  return Math.max(1, wisdomMod);
}

/**
 * Proficiência final da perícia = override manual do jogador, se
 * houver; senão, concedida pelo antecedente atual OU pela escolha de
 * perícias de classe atual (qualquer uma das duas basta).
 *
 * É isto que resolve a troca de antecedente/classe sem diff de string e
 * sem apagar escolhas manuais (ver `state/characterStore.ts#setBackground`/
 * `setClass`, que só gravam o id — nenhuma perícia precisa ser
 * "desmarcada" na troca, porque as duas funções acima já mudam
 * sozinhas, e qualquer `manualOverride` explícito do jogador continua
 * intocado, tenha ele sido definido por qualquer motivo).
 */
export function getSkillProficiency(character: Character, skill: SkillKey): boolean {
  const state = character.skills[skill];
  return state.manualOverride ?? (isSkillGrantedByBackground(character, skill) || isSkillGrantedByClassChoice(character, skill));
}

/**
 * Bônus de perícia = modificador do atributo + bônus de proficiência
 * (dobrado se houver especialização) + ajuste manual.
 *
 * Especialização (expertise) só é aplicada se a proficiência final
 * também for `true` — não é possível ter especialização sem
 * proficiência. Perícias NÃO proficientes ainda podem ganhar o bônus
 * de "Pau pra Toda Obra" do Bardo (`getJackOfAllTradesBonus`) — os dois
 * bônus (proficiência×especialização e Pau pra Toda Obra) são mutuamente
 * exclusivos pela própria definição (um exige proficiência, o outro a
 * exige ausente).
 */
export function getSkillBonus(character: Character, skill: SkillKey): ComputedValue {
  const definition = skills[skill];
  const state = character.skills[skill];

  const abilityMod = getAbilityModifier(getEffectiveAbilityScore(character, definition.ability));
  const proficiencyBonus = character.level ? getProficiencyBonus(character.level) : 0;

  const proficient = getSkillProficiency(character, skill);
  const expertise = getSkillExpertise(character, skill);
  const multiplier = proficient ? (expertise ? 2 : 1) : 0;
  const jackOfAllTradesBonus = proficient ? 0 : getJackOfAllTradesBonus(character);
  const thaumaturgeBonus = getThaumaturgeSkillBonus(character, skill);
  const auto = abilityMod + proficiencyBonus * multiplier + jackOfAllTradesBonus + thaumaturgeBonus;

  return computedValue(auto, state.manualAdjustment);
}
