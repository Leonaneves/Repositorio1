import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { SKILL_KEYS, type ClassId, type SkillKey } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { backgrounds } from "../data/backgrounds.js";
import { classes, getClassSkillChoiceId } from "../data/classes.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { FIGHTER_BATTLE_MASTER_ESTUDIOSO_SKILL_CHOICE_ID, RANGER_GLAMOUR_SKILL_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID, RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID } from "../data/features/ranger.js";
import { ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1, ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6 } from "../data/features/rogue.js";
import { WIZARD_ACADEMIC_CHOICE_ID } from "../data/features/wizard.js";

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
 * (nunca proficiência) — "Especialista" do Bardo, nos níveis 2 e 9
 * (fonte "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" §4/§10); e
 * Explorador Hábil (nível 2, 1 perícia) + Especialista (nível 9, 2
 * perícias) do Patrulheiro, duas escolhas independentes (fonte
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §5).
 */
const EXPERTISE_CHOICE_IDS_BY_CLASS: Partial<Record<ClassId, string[]>> = {
  bardo: ["bardo-especialista-1-escolha", "bardo-especialista-2-escolha"],
  patrulheiro: [RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID, RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID],
  // Especialista do Ladino (nível 1: 2 perícias; nível 6: mais 2) — fonte "IMPLEMENTAR LADINO E
  // SUAS SUBCLASSES NO BUILDER E NO PDF" §4, duas escolhas independentes, mesmo padrão do Patrulheiro.
  ladino: [ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1, ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6],
  // Acadêmico do Mago (nível 2, 1 perícia restrita a Arcanismo/História/Investigação/Medicina/
  // Natureza/Religião) — fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" §5.
  mago: [WIZARD_ACADEMIC_CHOICE_ID],
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
 * `true` se o jogador escolheu esta perícia em "Sentidos Aguçados" do
 * Elfo (traço básico, independente da Linhagem Élfica escolhida —
 * fonte "IMPLEMENTAR LINHAGENS..." §5). Única fonte de proficiência
 * ligada à ESPÉCIE hoje; se outra espécie ganhar uma escolha
 * equivalente no futuro, generalizar para um mapa por `SpeciesId`
 * (mesmo padrão de `EXTRA_SKILL_CHOICE_IDS_BY_CLASS` acima).
 */
export function isSkillGrantedBySpeciesChoice(character: Character, skill: SkillKey): boolean {
  if (character.speciesId !== "elfo") return false;
  const selection = character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID]?.value;
  const selected = Array.isArray(selection) ? selection : [];
  return selected.includes(skill);
}

/**
 * IDs de `FeatureChoice` (`skillProficiency`) ligadas à SUBCLASSE,
 * registradas por `subclassFullName` — generalização do caso único de
 * "Glamour Transcendental" (Andarilho Feérico, nível 3 — fonte
 * "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF" §2) para
 * também cobrir "Estudioso da Guerra" (Mestre de Batalha, nível 3 —
 * fonte "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §6),
 * mesmo padrão de `EXTRA_SKILL_CHOICE_IDS_BY_CLASS` acima, mas por
 * subclasse em vez de classe.
 */
const SUBCLASS_SKILL_CHOICE_ID_BY_SUBCLASS: Partial<Record<string, string>> = {
  "Andarilho Feérico": RANGER_GLAMOUR_SKILL_CHOICE_ID,
  "Mestre da Batalha": FIGHTER_BATTLE_MASTER_ESTUDIOSO_SKILL_CHOICE_ID,
};

/**
 * `true` se o jogador escolheu esta perícia em uma `FeatureChoice`
 * ligada à SUBCLASSE atual (ver mapa acima).
 */
export function isSkillGrantedBySubclassChoice(character: Character, skill: SkillKey): boolean {
  if (!character.subclassId) return false;
  const choiceId = SUBCLASS_SKILL_CHOICE_ID_BY_SUBCLASS[character.subclassId];
  if (!choiceId) return false;
  const selection = character.featureChoiceSelections[choiceId]?.value;
  const selected = Array.isArray(selection) ? selection : [];
  return selected.includes(skill);
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
 * Bônus de "Xamã" (Ordem Primal do Druida, nível 1 — fonte "INTEGRAÇÃO
 * COMPLETA — DRUIDA E SUBCLASSES" §4): modificador de Sabedoria, mínimo
 * +1, aplicado SOMENTE em Arcanismo e Natureza — mesma mecânica
 * INCONDICIONAL de "Taumaturgo" (getThaumaturgeSkillBonus), só com
 * outra classe/perícias; nunca concede proficiência.
 */
export function getShamanSkillBonus(character: Character, skill: SkillKey): number {
  if (character.classId !== "druida") return 0;
  if (skill !== "arcanismo" && skill !== "natureza") return 0;
  const selection = character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID]?.value;
  if (selection !== "Xamã") return 0;

  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  return Math.max(1, wisdomMod);
}

/**
 * Bônus de "Glamour Transcendental" (Andarilho Feérico, nível 3 — fonte
 * "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF" §2):
 * modificador de Sabedoria, mínimo +1, somado a TODAS as perícias de
 * Carisma — mesma mecânica INCONDICIONAL de `getThaumaturgeSkillBonus`/
 * `getShamanSkillBonus` (soma mesmo sem proficiência, nunca concede a
 * proficiência em si, nunca é dobrado por Especialização porque entra
 * fora do termo `proficiencyBonus * multiplier` em `getSkillBonus`). O
 * bônus também vale para testes de Carisma SEM perícia associada — sem
 * campo próprio para isso no PDF, por isso o texto impresso
 * (`rules/rangerSubclassPrintedFeatures.ts`) mantém um lembrete, nunca
 * duplicando o valor já somado aqui.
 */
export function getGlamourTranscendentalBonus(character: Character, skill: SkillKey): number {
  if (character.classId !== "patrulheiro" || character.subclassId !== "Andarilho Feérico") return 0;
  if (skills[skill].ability !== "CAR") return 0;

  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  return Math.max(1, wisdomMod);
}

export interface AutomaticSkillProficiencyGrant {
  skill: SkillKey;
  /** Origens SEM escolha alguma que concedem esta perícia — hoje só `"background"` pode aparecer aqui (ver comentário da função). */
  origins: Array<"background">;
}

/**
 * Perícias concedidas SEM nenhuma escolha do jogador — hoje só pelo
 * Antecedente (lista fixa `grantedSkills`). Nenhuma Classe/Subclasse/
 * Espécie atual concede perícia automaticamente sem passar por uma
 * `FeatureChoice` (toda concessão delas já aparece como um bloco de
 * escolha na etapa "Perícias" — ver `rules/features.ts#getSkillChoiceFeatures`);
 * por isso a única origem possível aqui é `"background"`. Usado pela
 * seção "Perícias concedidas automaticamente" da etapa "Perícias"
 * (fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA"
 * §2) — nunca inventa uma origem automática de Classe/Subclasse/
 * Espécie/Talento que não exista no catálogo atual; se uma vier a
 * existir, basta somar sua própria checagem aqui, sem mudar a forma
 * de uso pela UI. Se uma perícia tiver mais de uma origem automática,
 * aparece uma única vez, com todas as origens listadas.
 */
export function getAutomaticSkillProficiencyGrants(character: Character): AutomaticSkillProficiencyGrant[] {
  const grants: AutomaticSkillProficiencyGrant[] = [];
  for (const skill of SKILL_KEYS) {
    const origins: Array<"background"> = [];
    if (isSkillGrantedByBackground(character, skill)) origins.push("background");
    if (origins.length > 0) grants.push({ skill, origins });
  }
  return grants;
}

export type SkillProficiencyOrigin = "manual" | "background" | "class" | "subclass" | "species" | null;

/**
 * De onde vem a proficiência final da perícia — usado pela UI (§6/§10)
 * para diferenciar "proficiência automática" (`"background"`/`"class"`/
 * `"subclass"`/`"species"`), "proficiência manual" (`"manual"`, modo
 * Homebrew) e "nenhuma" (`null`). Mesma prioridade de
 * `getSkillProficiency`: manual > fonte estrutural. Quando duas fontes
 * estruturais concedem a mesma perícia (ex.: Antecedente e Classe dão
 * "História"), prioriza na ordem background > class > subclass >
 * species só para exibição — a proficiência em si já não depende de
 * qual delas "venceu" (§9: a duplicata nunca consome uma escolha
 * adicional de nenhuma das fontes).
 */
export function getSkillProficiencyOrigin(character: Character, skill: SkillKey): SkillProficiencyOrigin {
  const manualOverride = character.skills[skill].manualOverride;
  if (manualOverride !== null) return manualOverride ? "manual" : null;
  if (isSkillGrantedByBackground(character, skill)) return "background";
  if (isSkillGrantedByClassChoice(character, skill)) return "class";
  if (isSkillGrantedBySubclassChoice(character, skill)) return "subclass";
  if (isSkillGrantedBySpeciesChoice(character, skill)) return "species";
  return null;
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
  return (
    state.manualOverride ??
    (isSkillGrantedByBackground(character, skill) ||
      isSkillGrantedByClassChoice(character, skill) ||
      isSkillGrantedBySubclassChoice(character, skill) ||
      isSkillGrantedBySpeciesChoice(character, skill))
  );
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
  const shamanBonus = getShamanSkillBonus(character, skill);
  const glamourBonus = getGlamourTranscendentalBonus(character, skill);
  const auto = abilityMod + proficiencyBonus * multiplier + jackOfAllTradesBonus + thaumaturgeBonus + shamanBonus + glamourBonus;

  return computedValue(auto, state.manualAdjustment);
}
