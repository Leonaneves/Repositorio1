import type { Character } from "../domain/character.js";
import type { FeatureChoice, FeatureDefinition, FeatureView } from "../domain/features.js";
import { backgroundFeatFeatures } from "../data/features/backgrounds.js";
import { classFeatures, getEpicBoonChoiceId } from "../data/features/classes.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { PALADIN_FIGHTING_STYLE_CHOICE_ID, PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID } from "../data/features/paladin.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import { speciesFeatures } from "../data/features/species.js";
import {
  subclassFeatures,
  FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
  RANGER_MENTE_DE_FERRO_CHOICE_ID,
  RANGER_MENTE_DE_FERRO_FEATURE_ID,
} from "../data/features/subclasses.js";
import { hasSpeciesLineage } from "../data/speciesLineages.js";
import { getEpicBoonFeatures, getEpicBoonOptions } from "./epicBoons.js";
import { getFeatAcquisitionFeatures, mergeBackgroundFeatWithCatalog } from "./feats.js";
import { getFightingStyleOptions } from "./fightingStyles.js";
import { getSpeciesTraitsPrintedText } from "./speciesLineagePrintedFeatures.js";

/**
 * Os 4 pontos de concessão de Estilo de Luta (fonte "IMPLEMENTAR
 * TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF" §1) — usados por
 * `withFightingStyleChoiceAdjustments` abaixo para (a) recalcular as
 * opções elegíveis de CADA UM deles por personagem, excluindo o Estilo
 * já escolhido pelos outros 3 (cross-exclusão: nunca o mesmo Estilo de
 * Luta duas vezes via origens diferentes), e (b) remover inteiramente a
 * sub-escolha de Estilo de Luta do Patrulheiro/Paladino quando o
 * jogador escolheu a alternativa (Combatente Druídico/Abençoado) —
 * nunca deixá-la como exigência impossível de resolver depois que
 * `optionPick` passou a bloquear o Avançar quando vazia (diferente do
 * antigo `manualText`, que nunca bloqueava).
 */
const FIGHTING_STYLE_SLOT_CHOICE_IDS: ReadonlySet<string> = new Set([
  FIGHTER_FIGHTING_STYLE_CHOICE_ID,
  FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
  RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID,
  PALADIN_FIGHTING_STYLE_CHOICE_ID,
]);

/** Remove `talentChoiceId` de `choices` quando `branchChoiceId` não estiver respondido como "Estilo de Luta" — nunca toca as demais escolhas. */
function removeUnselectedFightingStyleChoice(
  choices: FeatureChoice[],
  character: Character,
  branchChoiceId: string,
  talentChoiceId: string,
): FeatureChoice[] {
  if (character.featureChoiceSelections[branchChoiceId]?.value === "Estilo de Luta") return choices;
  return choices.filter((choice) => choice.id !== talentChoiceId);
}

/**
 * Aplica, nesta ordem, a remoção condicional (Patrulheiro, depois
 * Paladino — cada uma só afeta sua própria sub-escolha) e por fim a
 * cross-exclusão de opções dos 4 pontos de concessão de Estilo de Luta
 * — nenhuma outra `FeatureChoice` é tocada.
 */
function withFightingStyleChoiceAdjustments(choices: FeatureChoice[], character: Character): FeatureChoice[] {
  let next = removeUnselectedFightingStyleChoice(choices, character, RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID);
  next = removeUnselectedFightingStyleChoice(next, character, PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID, PALADIN_FIGHTING_STYLE_CHOICE_ID);
  return next.map((choice) =>
    FIGHTING_STYLE_SLOT_CHOICE_IDS.has(choice.id)
      ? { ...choice, effect: { kind: "optionPick" as const, options: getFightingStyleOptions(character, choice.id) } }
      : choice,
  );
}

/**
 * Narrowing dinâmico da escolha de Dádiva Épica (nível 19, fonte
 * "IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF" §1): exclui
 * Dádiva da Recordação de Magia das opções quando o personagem ainda não
 * possui a característica Conjuração (`rules/epicBoons.ts#getEpicBoonOptions`)
 * — nunca toca as demais escolhas da mesma feature (hoje só essa).
 */
function withEpicBoonChoiceAdjustments(choices: FeatureChoice[], character: Character): FeatureChoice[] {
  const epicBoonChoiceId = character.classId ? getEpicBoonChoiceId(character.classId) : null;
  if (!epicBoonChoiceId) return choices;
  return choices.map((choice) =>
    choice.id === epicBoonChoiceId ? { ...choice, effect: { kind: "optionPick" as const, options: getEpicBoonOptions(character) } } : choice,
  );
}

/**
 * Features de classe já adquiridas (nível de aquisição ≤ nível atual).
 * As features com uma `FeatureChoice` de Estilo de Luta (Guerreiro
 * nível 1, Patrulheiro nível 2) passam por `withFightingStyleChoiceAdjustments`
 * (cross-exclusão + remoção condicional — ver comentário acima); a
 * escolha de Dádiva Épica (nível 19) passa por
 * `withEpicBoonChoiceAdjustments` (narrowing de Conjuração).
 */
export function getClassFeatures(character: Character): FeatureDefinition[] {
  if (!character.classId) return [];
  const features = classFeatures.filter(
    (feature) => feature.classId === character.classId && (feature.level === null || feature.level <= character.level),
  );
  return features.map((feature) => {
    if (!feature.choices) return feature;
    const choices = withEpicBoonChoiceAdjustments(withFightingStyleChoiceAdjustments(feature.choices, character), character);
    return { ...feature, choices };
  });
}

/**
 * Features de subclasse já adquiridas. "Mente de Ferro" (Vigilante das
 * Sombras, nível 7 — fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO
 * BUILDER E NO PDF" §5) recebe uma `FeatureChoice` ANEXADA aqui, nunca
 * armazenada estaticamente em `data/features/subclasses.ts`, porque ela
 * só existe quando `character.savingThrows.SAB.proficient` já é
 * `true` por outra origem (ver `rules/savingThrows.ts#getMenteDeFerroGrantedAbility`)
 * — mesmo padrão de `getSpeciesFeatures` abaixo, que sobrescreve
 * dinamicamente o `summary` das 5 espécies com Linhagem.
 *
 * A característica "Estilo de Luta Adicional" do Campeão (nível 7)
 * também passa por `withFightingStyleChoiceAdjustments`, pela mesma
 * cross-exclusão aplicada em `getClassFeatures` — garante que o Campeão
 * nunca possa escolher o mesmo Estilo de Luta já escolhido na
 * concessão base do Guerreiro nível 1 (ou vice-versa).
 */
export function getSubclassFeatures(character: Character): FeatureDefinition[] {
  if (!character.subclassId) return [];
  const features = subclassFeatures.filter(
    (feature) => feature.subclassFullName === character.subclassId && (feature.level === null || feature.level <= character.level),
  );
  return features.map((feature) => {
    const withMenteDeFerro =
      feature.id === RANGER_MENTE_DE_FERRO_FEATURE_ID && character.savingThrows.SAB.proficient
        ? {
            ...feature,
            choices: [
              {
                id: RANGER_MENTE_DE_FERRO_CHOICE_ID,
                prompt: "Mente de Ferro: já proficiente em Salvaguarda de Sabedoria — escolha Carisma ou Inteligência no lugar",
                effect: { kind: "optionPick" as const, options: ["Carisma", "Inteligência"] },
              },
            ],
          }
        : feature;
    return withMenteDeFerro.choices
      ? { ...withMenteDeFerro, choices: withFightingStyleChoiceAdjustments(withMenteDeFerro.choices, character) }
      : withMenteDeFerro;
  });
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

/**
 * Talento de origem do antecedente escolhido — mesclado com a aquisição
 * MECÂNICA real do talento (`rules/feats.ts#mergeBackgroundFeatWithCatalog`),
 * nunca só o texto literal do `originFeat` (fonte "IMPLEMENTAR TALENTOS
 * DE ORIGEM NO BUILDER E NO PDF" §2/§8).
 */
export function getBackgroundFeatures(character: Character): FeatureDefinition[] {
  if (!character.backgroundId) return [];
  return backgroundFeatFeatures
    .filter((feature) => feature.backgroundId === character.backgroundId)
    .map((feature) => mergeBackgroundFeatWithCatalog(feature, character));
}

/**
 * Talentos gerais escolhidos pelo jogador em níveis de ASI
 * (`Character.asiSelections[nível].featId`) — cada aquisição já vem
 * parametrizada por `rules/feats.ts#getFeatAcquisitionFeatures`, nunca
 * inclui a aquisição do Antecedente (coberta por `getBackgroundFeatures`
 * acima, para nunca aparecer duplicada).
 */
export function getChosenFeatFeatures(character: Character): FeatureDefinition[] {
  return getFeatAcquisitionFeatures(character);
}

/**
 * A Dádiva Épica escolhida pelo personagem (fonte "IMPLEMENTAR TALENTOS
 * DE DÁDIVA ÉPICA NO BUILDER E NO PDF"), exposta com suas PRÓPRIAS
 * `choices` (sempre o aumento de atributo, mais Especialização de
 * perícia só para Dádiva da Proficiência em Perícia) — nunca duplicada
 * com `getClassFeatures` (que só expõe a escolha de QUAL dádiva, nível
 * 19). `[]` sem nenhuma Dádiva ativa.
 */
export function getChosenEpicBoonFeatures(character: Character): FeatureDefinition[] {
  return getEpicBoonFeatures(character);
}

/** Todas as features do personagem, de todas as fontes, sem duplicar. */
export function getCharacterFeatures(character: Character): FeatureDefinition[] {
  return [
    ...getClassFeatures(character),
    ...getSubclassFeatures(character),
    ...getSpeciesFeatures(character),
    ...getBackgroundFeatures(character),
    ...getChosenFeatFeatures(character),
    ...getChosenEpicBoonFeatures(character),
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
  if (choice.effect.kind === "abilityScoreIncrease" || choice.effect.kind === "skillProficiencyOrExpertise") {
    return typeof selection === "string" && (choice.effect.options as string[]).includes(selection);
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

/**
 * `true` para `skillProficiency`/`skillExpertise`/`skillProficiencyOrExpertise`
 * — usado para separar escolhas de perícia (centralizadas na etapa
 * "Perícias", fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA
 * PRÓPRIA") das demais escolhas de uma mesma feature.
 * `skillProficiencyOrExpertise` ("Mente Aguçada", fonte "COMPLETAR
 * TALENTOS GERAIS NO BUILDER E NO PDF" §9) entra aqui pelo mesmo motivo:
 * é sempre uma escolha DE PERÍCIA, mesmo concedendo Proficiência OU
 * Especialização dependendo do estado atual.
 */
export function isSkillKindChoice(choice: FeatureChoice): boolean {
  return choice.effect.kind === "skillProficiency" || choice.effect.kind === "skillExpertise" || choice.effect.kind === "skillProficiencyOrExpertise";
}

/**
 * Mesmo filtro de `getOtherFeaturesWithChoices` (Espécie/Antecedente/
 * Talento), mas só as features com ao menos UMA escolha que NÃO seja
 * de perícia — essas saíram para a etapa "Perícias" (ver
 * `getSkillChoiceFeatures` acima), então "Características e Talentos"
 * só continua visível/renderizando quando resta outro tipo de escolha
 * dessas 3 origens. Hoje nenhum catálogo confirmado tem uma escolha
 * assim (só a perícia de Sentidos Aguçados do Elfo existe), então esta
 * lista fica vazia na prática — preparada para quando um catálogo
 * futuro de Antecedente/Espécie/Talento vier a ter outra escolha,
 * nunca inventada agora.
 */
export function getOtherFeaturesWithNonSkillChoices(character: Character): FeatureDefinition[] {
  return getOtherFeaturesWithChoices(character).filter((feature) => (feature.choices ?? []).some((choice) => !isSkillKindChoice(choice)));
}

/**
 * Todas as features do personagem, de QUALQUER origem, com ao menos
 * uma escolha de perícia (proficiência ou Especialização) — usado pela
 * etapa "Perícias", que reúne essas escolhas independentemente de
 * vir de Classe, Subclasse, Espécie, Antecedente ou Talento. Uma
 * mesma feature pode ter TAMBÉM outras escolhas (ex.: a Ferramenta de
 * Artesão de "Estudioso da Guerra", ao lado da perícia) — essas
 * continuam nas etapas de origem; só os `choices` de perícia saem de
 * lá, filtrados individualmente com `isSkillKindChoice`, nunca a
 * feature inteira.
 */
export function getSkillChoiceFeatures(character: Character): FeatureDefinition[] {
  return getCharacterFeatures(character).filter((feature) => (feature.choices ?? []).some(isSkillKindChoice));
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
