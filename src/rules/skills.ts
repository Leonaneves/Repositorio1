import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { SKILL_KEYS, type ClassId, type SkillKey, type SpeciesId } from "../domain/ids.js";
import { skills } from "../data/skills.js";
import { backgrounds } from "../data/backgrounds.js";
import { classes, getClassSkillChoiceId } from "../data/classes.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID, HUMANO_HABIL_CHOICE_ID } from "../data/features/species.js";
import { FIGHTER_BATTLE_MASTER_ESTUDIOSO_SKILL_CHOICE_ID, RANGER_GLAMOUR_SKILL_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID, RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID } from "../data/features/ranger.js";
import { ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1, ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6 } from "../data/features/rogue.js";
import { WIZARD_ACADEMIC_CHOICE_ID } from "../data/features/wizard.js";
import { hasEpicBoonSkillProficiencyGrant } from "./epicBoons.js";
import { getCharacterFeatures } from "./features.js";

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
 * Escolha de perícia ligada a cada ESPÉCIE (mesmo padrão de
 * `EXTRA_SKILL_CHOICE_IDS_BY_CLASS` acima): "Sentidos Aguçados" do Elfo
 * (traço básico, independente da Linhagem Élfica — fonte "IMPLEMENTAR
 * LINHAGENS..." §5) e "Hábil" do Humano (1 perícia qualquer).
 */
const SPECIES_SKILL_CHOICE_IDS: Partial<Record<SpeciesId, string>> = {
  elfo: ELFO_SENTIDOS_AGUCADOS_CHOICE_ID,
  humano: HUMANO_HABIL_CHOICE_ID,
};

/** `true` se o jogador escolheu esta perícia na escolha de perícia da espécie ATUAL (`SPECIES_SKILL_CHOICE_IDS`). */
export function isSkillGrantedBySpeciesChoice(character: Character, skill: SkillKey): boolean {
  const choiceId = character.speciesId ? SPECIES_SKILL_CHOICE_IDS[character.speciesId] : undefined;
  if (!choiceId) return false;
  const selection = character.featureChoiceSelections[choiceId]?.value;
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
 * Perícias concedidas pela SUBCLASSE atual SEM escolha alguma do
 * jogador — hoje só "Implementos de Misericórdia" (Caminho da
 * Misericórdia do Monge, nível 3 — fonte "IMPLEMENTAR MONGE E SUAS
 * SUBCLASSES NO BUILDER E NO PDF" §10), que concede Intuição e Medicina
 * de forma fixa. Registrada por `subclassFullName` (valor interno
 * preservado), mesmo padrão de `SUBCLASS_SKILL_CHOICE_ID_BY_SUBCLASS`
 * acima, mas sem `FeatureChoice` nenhuma por trás.
 */
const FIXED_SKILL_GRANTS_BY_SUBCLASS: Partial<Record<string, SkillKey[]>> = {
  "Guerreiro da Misericórdia": ["intuicao", "medicina"],
};

/**
 * `true` se a SUBCLASSE atual concede esta perícia de forma fixa, sem
 * nenhuma escolha do jogador (ver mapa acima).
 */
export function isSkillGrantedBySubclassFixed(character: Character, skill: SkillKey): boolean {
  if (!character.subclassId) return false;
  const skillsGranted = FIXED_SKILL_GRANTS_BY_SUBCLASS[character.subclassId];
  if (!skillsGranted) return false;
  return skillsGranted.includes(skill);
}

/**
 * `true` se o jogador escolheu esta perícia numa `FeatureChoice` de
 * ORIGEM Talento — Habilidoso (`skillOrToolProficiency`), ou qualquer
 * futuro talento com `skillProficiency` (fonte "IMPLEMENTAR TALENTOS DE
 * ORIGEM NO BUILDER E NO PDF" §8). Varre TODAS as aquisições de Talento
 * do personagem (`rules/feats.ts` já resolve Antecedente + cada nível de
 * ASI escolhido), nunca uma lista estática de ids por classe — cada
 * aquisição repetível (Habilidoso) tem seus próprios ids de escolha,
 * então uma lista fixa como `EXTRA_SKILL_CHOICE_IDS_BY_CLASS` não
 * serviria aqui.
 */
export function isSkillGrantedByFeatChoice(character: Character, skill: SkillKey): boolean {
  for (const feature of getCharacterFeatures(character)) {
    if (feature.sourceType !== "feat") continue;
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillProficiency" && choice.effect.kind !== "skillOrToolProficiency") continue;
      const selection = character.featureChoiceSelections[choice.id]?.value;
      const selected = Array.isArray(selection) ? selection : [];
      if (selected.includes(skill)) return true;
    }
  }
  return false;
}

/**
 * `true` se Dádiva da Proficiência em Perícia está ativa (fonte
 * "IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF" §5) — ao
 * contrário de `isSkillGrantedByFeatChoice`, concede TODAS as perícias
 * incondicionalmente, nunca uma escolha individual, então `skill` nunca
 * entra na checagem (é a mesma resposta para qualquer uma das 18).
 */
export function isSkillGrantedByEpicBoon(character: Character): boolean {
  return hasEpicBoonSkillProficiencyGrant(character);
}

/**
 * `true` se a escolha de "Mente Aguçada" (fonte "COMPLETAR TALENTOS
 * GERAIS NO BUILDER E NO PDF" §9, `skillProficiencyOrExpertise`)
 * resolveu para esta perícia — concede SEMPRE ao menos Proficiência
 * (nunca condicionada a outra checagem), independente de a perícia já
 * ser proficiente por outra origem; ver `isSkillGrantedExpertiseByMenteAgucadaChoice`
 * abaixo para quando ela também vira Especialização.
 */
export function isSkillGrantedByMenteAgucadaChoice(character: Character, skill: SkillKey): boolean {
  return getProficiencyOrExpertiseChoiceIds(character, skill).length > 0;
}

/** Ids das escolhas `skillProficiencyOrExpertise` (Mente Aguçada, Analítico) que selecionaram `skill`. */
function getProficiencyOrExpertiseChoiceIds(character: Character, skill: SkillKey): string[] {
  const ids: string[] = [];
  for (const feature of getCharacterFeatures(character)) {
    if (feature.sourceType !== "feat") continue;
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillProficiencyOrExpertise") continue;
      if (character.featureChoiceSelections[choice.id]?.value === skill) ids.push(choice.id);
    }
  }
  return ids;
}

/**
 * `true` se Mente Aguçada upgradeia a perícia escolhida para
 * Especialização — só quando ela JÁ é proficiente por alguma fonte
 * QUE NÃO a própria Mente Aguçada (reusa a cadeia original de
 * proficiência, nunca passando por `getSkillProficiency`/
 * `isSkillGrantedByMenteAgucadaChoice`, para nunca virar circular: se
 * incluísse a própria concessão de Mente Aguçada na checagem, o
 * resultado seria sempre "já proficiente" assim que a perícia fosse
 * escolhida, degenerando para Especialização sempre).
 */
export function isSkillGrantedExpertiseByMenteAgucadaChoice(character: Character, skill: SkillKey): boolean {
  const choiceIds = getProficiencyOrExpertiseChoiceIds(character, skill);
  if (choiceIds.length === 0) return false;
  // Duas escolhas desse tipo na MESMA perícia (ex.: Mente Aguçada e Analítico em Investigação): a primeira
  // dá a proficiência, a segunda a Especialização — nunca circular, porque cada uma só "vê" a outra.
  if (choiceIds.length > 1) return true;
  return (
    isSkillGrantedByBackground(character, skill) ||
    isSkillGrantedByClassChoice(character, skill) ||
    isSkillGrantedBySubclassChoice(character, skill) ||
    isSkillGrantedBySubclassFixed(character, skill) ||
    isSkillGrantedBySpeciesChoice(character, skill) ||
    isSkillGrantedByFeatChoice(character, skill)
  );
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
 * `true` se alguma escolha de "Especialização" (`skillExpertise`) de
 * ORIGEM TALENTO (ex.: "Especialista em Perícia", fonte "COMPLETAR
 * TALENTOS GERAIS NO BUILDER E NO PDF" §5) já selecionou esta perícia —
 * mesmo princípio de `isSkillGrantedByFeatChoice` (varre TODAS as
 * aquisições de Talento do personagem via `getCharacterFeatures`), mas
 * nunca por uma lista estática por classe como
 * `isSkillGrantedExpertiseByClassChoice`: um Talento pode ser adquirido
 * em qualquer classe, então não cabe no mapa `EXPERTISE_CHOICE_IDS_BY_CLASS`.
 */
export function isSkillGrantedExpertiseByFeatChoice(character: Character, skill: SkillKey): boolean {
  for (const feature of getCharacterFeatures(character)) {
    if (feature.sourceType !== "feat") continue;
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillExpertise") continue;
      const selection = character.featureChoiceSelections[choice.id]?.value;
      const selected = Array.isArray(selection) ? selection : [];
      if (selected.includes(skill)) return true;
    }
  }
  return false;
}

/**
 * Especialização final da perícia = toggle manual do jogador OU
 * concedida por uma escolha de "Especialização" da classe atual, de um
 * Talento, ou de Mente Aguçada — a mesma lógica OR do antecedente/
 * escolha de perícias (sem tri-state: `expertise` nunca teve estado
 * "segue o derivado", é só um booleano manual, então aqui basta somar a
 * fonte estrutural por cima).
 */
export function getSkillExpertise(character: Character, skill: SkillKey): boolean {
  return (
    character.skills[skill].expertise ||
    isSkillGrantedExpertiseByClassChoice(character, skill) ||
    isSkillGrantedExpertiseByFeatChoice(character, skill) ||
    isSkillGrantedExpertiseByMenteAgucadaChoice(character, skill)
  );
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
  /** Origens SEM escolha alguma que concedem esta perícia — `"background"` (Antecedente), `"subclass"` (concessão fixa de subclasse) ou `"feat"` (Dádiva da Proficiência em Perícia, concede as 18 incondicionalmente — ver comentário da função). */
  origins: Array<"background" | "subclass" | "feat">;
}

/**
 * Perícias concedidas SEM nenhuma escolha do jogador — pelo Antecedente
 * (lista fixa `grantedSkills`), por uma concessão fixa de Subclasse
 * (`isSkillGrantedBySubclassFixed`, ex.: Implementos de Misericórdia do
 * Monge), ou por Dádiva da Proficiência em Perícia (fonte "IMPLEMENTAR
 * TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF" §5 — concede as 18
 * incondicionalmente, nunca uma escolha). Nenhuma Classe/Espécie atual
 * concede perícia automaticamente sem passar por uma `FeatureChoice`
 * (toda concessão delas já aparece como um bloco de escolha na etapa
 * "Perícias" — ver `rules/features.ts#getSkillChoiceFeatures`). Usado
 * pela seção "Perícias concedidas automaticamente" da etapa "Perícias"
 * (fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §2)
 * — nunca inventa uma origem automática de Classe/Espécie que não
 * exista no catálogo atual; se uma vier a existir, basta somar sua
 * própria checagem aqui, sem mudar a forma de uso pela UI. Se uma
 * perícia tiver mais de uma origem automática, aparece uma única vez,
 * com todas as origens listadas.
 */
export function getAutomaticSkillProficiencyGrants(character: Character): AutomaticSkillProficiencyGrant[] {
  const grants: AutomaticSkillProficiencyGrant[] = [];
  const epicBoonGrant = isSkillGrantedByEpicBoon(character);
  for (const skill of SKILL_KEYS) {
    const origins: Array<"background" | "subclass" | "feat"> = [];
    if (isSkillGrantedByBackground(character, skill)) origins.push("background");
    if (isSkillGrantedBySubclassFixed(character, skill)) origins.push("subclass");
    if (epicBoonGrant) origins.push("feat");
    if (origins.length > 0) grants.push({ skill, origins });
  }
  return grants;
}

export type SkillProficiencyOrigin = "manual" | "background" | "class" | "subclass" | "species" | "feat" | null;

/**
 * De onde vem a proficiência final da perícia — usado pela UI (§6/§10)
 * para diferenciar "proficiência automática" (`"background"`/`"class"`/
 * `"subclass"`/`"species"`/`"feat"`), "proficiência manual" (`"manual"`,
 * modo Homebrew) e "nenhuma" (`null`). Mesma prioridade de
 * `getSkillProficiency`: manual > fonte estrutural. Quando duas fontes
 * estruturais concedem a mesma perícia (ex.: Antecedente e Classe dão
 * "História"), prioriza na ordem background > class > subclass >
 * species > feat só para exibição — a proficiência em si já não depende
 * de qual delas "venceu" (§9: a duplicata nunca consome uma escolha
 * adicional de nenhuma das fontes).
 */
export function getSkillProficiencyOrigin(character: Character, skill: SkillKey): SkillProficiencyOrigin {
  const manualOverride = character.skills[skill].manualOverride;
  if (manualOverride !== null) return manualOverride ? "manual" : null;
  if (isSkillGrantedByBackground(character, skill)) return "background";
  if (isSkillGrantedByClassChoice(character, skill)) return "class";
  if (isSkillGrantedBySubclassChoice(character, skill)) return "subclass";
  if (isSkillGrantedBySubclassFixed(character, skill)) return "subclass";
  if (isSkillGrantedBySpeciesChoice(character, skill)) return "species";
  if (isSkillGrantedByFeatChoice(character, skill)) return "feat";
  if (isSkillGrantedByMenteAgucadaChoice(character, skill)) return "feat";
  if (isSkillGrantedByEpicBoon(character)) return "feat";
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
      isSkillGrantedBySubclassFixed(character, skill) ||
      isSkillGrantedBySpeciesChoice(character, skill) ||
      isSkillGrantedByFeatChoice(character, skill) ||
      isSkillGrantedByMenteAgucadaChoice(character, skill) ||
      isSkillGrantedByEpicBoon(character))
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
