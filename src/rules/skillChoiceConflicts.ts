import type { Character } from "../domain/character.js";
import type { FeatureSourceType } from "../domain/features.js";
import type { SkillKey } from "../domain/ids.js";
import { getCharacterFeatures } from "./features.js";
import {
  getSkillProficiency,
  isSkillGrantedByBackground,
  isSkillGrantedByClassChoice,
  isSkillGrantedBySpeciesChoice,
  isSkillGrantedBySubclassChoice,
} from "./skills.js";

export interface RedundantSkillChoiceEntry {
  /** Id da `FeatureChoice` cuja seleção ficou redundante — usado pela UI para apontar o controle certo. */
  choiceId: string;
  /** Nome da feature dona da escolha (ex.: "Perícias de Classe", "Sentidos Aguçados"). */
  featureName: string;
  sourceType: FeatureSourceType;
  skill: SkillKey;
}

/**
 * Perícias SELECIONADAS numa escolha de `skillProficiency` com
 * `excludeAlreadyProficient` (Perícias de Classe, Conhecimento
 * Primordial do Bárbaro, Especialista do Bardo, Sentidos Aguçados do
 * Elfo) que passaram a ser concedidas por OUTRA origem depois da
 * escolha já ter sido feita — fonte "REORGANIZAR O BUILDER E CORRIGIR
 * VALIDAÇÕES EXISTENTES" §4: "o jogador escolhe uma perícia de Classe e
 * depois seleciona um Antecedente que concede a mesma perícia".
 *
 * `excludeAlreadyProficient` já impede ESCOLHER uma perícia redundante
 * NO MOMENTO da escolha (`ui/builder/FeatureChoiceControl.tsx` filtra as
 * opções) — mas se a OUTRA origem aparecer DEPOIS (ordem inversa), a
 * seleção antiga fica obsoleta sem que nada tenha avisado até agora.
 * Esta função detecta esse caso de forma independente da ordem,
 * reexecutando a cada chamada (nunca um estado guardado) — nunca
 * escolhe uma substituta automaticamente, só sinaliza o `choiceId` para
 * a UI/validação apontar o jogador ao controle certo (ele decide o que
 * marcar no lugar).
 */
export function getRedundantSkillChoiceSelections(character: Character): RedundantSkillChoiceEntry[] {
  const entries: RedundantSkillChoiceEntry[] = [];

  for (const feature of getCharacterFeatures(character)) {
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillProficiency" || !choice.effect.excludeAlreadyProficient) continue;

      const selection = character.featureChoiceSelections[choice.id]?.value;
      const selected = Array.isArray(selection) ? (selection as SkillKey[]) : [];

      for (const skill of selected) {
        const grantedElsewhere =
          (feature.sourceType !== "background" && isSkillGrantedByBackground(character, skill)) ||
          (feature.sourceType !== "species" && isSkillGrantedBySpeciesChoice(character, skill)) ||
          (feature.sourceType !== "class" && isSkillGrantedByClassChoice(character, skill)) ||
          (feature.sourceType !== "subclass" && isSkillGrantedBySubclassChoice(character, skill));

        if (grantedElsewhere) {
          entries.push({ choiceId: choice.id, featureName: feature.name, sourceType: feature.sourceType, skill });
        }
      }
    }
  }

  return entries;
}

export interface InvalidExpertiseSelectionEntry {
  /** Id da `FeatureChoice` (`skillExpertise`) cuja seleção ficou inválida — usado pela UI para apontar o controle certo. */
  choiceId: string;
  featureName: string;
  sourceType: FeatureSourceType;
  skill: SkillKey;
}

/**
 * Perícias SELECIONADAS numa escolha de `skillExpertise` ("Especialista"
 * do Bardo, "Explorador Hábil"/"Especialista" do Patrulheiro) cuja
 * proficiência de origem deixou de existir depois da escolha já ter
 * sido feita (ex.: trocar o Antecedente que concedia aquela perícia) —
 * Especialização exige proficiência vigente
 * (`domain/features.ts#FeatureChoiceEffect`, variante `skillExpertise`:
 * "nunca concede a proficiência em si"). Mesmo princípio de
 * `getRedundantSkillChoiceSelections` acima: detectado de forma
 * independente da ordem, reexecutado a cada chamada, nunca trocando a
 * perícia automaticamente — só sinaliza o `choiceId` para a UI/
 * validação apontar o jogador ao controle certo (fonte "CENTRALIZAR AS
 * ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §4: "revalidar
 * Especializações que dependam das proficiências alteradas").
 */
export function getInvalidExpertiseSelections(character: Character): InvalidExpertiseSelectionEntry[] {
  const entries: InvalidExpertiseSelectionEntry[] = [];

  for (const feature of getCharacterFeatures(character)) {
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillExpertise") continue;

      const selection = character.featureChoiceSelections[choice.id]?.value;
      const selected = Array.isArray(selection) ? (selection as SkillKey[]) : [];
      const options = choice.effect.options;

      for (const skill of selected) {
        if (!getSkillProficiency(character, skill) || (options && !options.includes(skill))) {
          entries.push({ choiceId: choice.id, featureName: feature.name, sourceType: feature.sourceType, skill });
        }
      }
    }
  }

  return entries;
}
