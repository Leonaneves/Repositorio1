import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { TalentAcquisitionContext, TalentAcquisitionRecord, TalentGrantOrigin } from "../domain/characterBuild.js";
import { fightingStylesByName } from "../data/fightingStyles.js";
import { epicBoonsByName } from "../data/features/epicBoons.js";
import { getEpicBoonAbilityIncreaseChoice, getEpicBoonFeatures } from "./epicBoons.js";
import {
  buildFeatAcquisitionFeature,
  getAbilityScoreForPrerequisite,
  getAcquisitionAsiLevel,
  getFeatAbilityIncreaseChoice,
  getFeatAbilityIncreaseChoiceId,
  getFeatAcquisitions,
  getFeatChoiceId,
  type FeatAcquisition,
} from "./feats.js";
import { getTalentOpportunityFeatures } from "./features.js";

/**
 * Histórico ESTRUTURADO de aquisições de Talento (Gerais + de Origem),
 * Estilo de Luta e Dádiva Épica — fonte "IMPLEMENTAR A BASE DE DADOS
 * PARA FUTURAS RECOMENDAÇÕES" §3. Cada registro preserva a identidade
 * da OPORTUNIDADE (`opportunityId`), nunca só o talento em si — por
 * isso duas aquisições de um mesmo talento REPETÍVEL (Habilidoso/
 * Iniciado em Magia, cada uma num `acquisitionKey` diferente) nunca se
 * fundem num só registro, mesmo caso `rules/features.ts#getCharacterFeatures`.
 *
 * O contexto "antes da aquisição" de cada registro reutiliza o MESMO
 * cálculo histórico já usado para validar pré-requisitos em ordem de
 * aquisição (`rules/feats.ts#getAbilityScoreForPrerequisite`, fonte
 * "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS OS ATRIBUTOS"
 * §6) — nunca uma segunda implementação do mesmo corte histórico, e
 * nunca usa o aumento concedido pela própria aquisição nem o de uma
 * aquisição de nível posterior para compor esse contexto.
 */

/** Chave sintética aceita por `getAbilityScoreForPrerequisite` para "estado antes do nível X" — `asi-0` (nenhum ASI real existe nesse nível) cobre Antecedente/Humano, concedidos na criação, antes de qualquer progressão numerada. */
function excludeKeyForLevel(acquisitionLevel: number | null): string {
  return `asi-${acquisitionLevel ?? 0}`;
}

/**
 * Contexto do personagem imediatamente antes de `acquisitionLevel` —
 * `subclassId` só é preenchido a partir do nível 3 (única regra que
 * permite escolher subclasse); antes disso, ou sem nível numérico
 * (Antecedente/Humano), fica "desconhecido" — nunca presume a
 * subclasse ATUAL como se já valesse nesse ponto.
 */
function buildContext(character: Character, acquisitionLevel: number | null): TalentAcquisitionContext {
  const excludeKey = excludeKeyForLevel(acquisitionLevel);
  const abilityScores = Object.fromEntries(
    ABILITY_KEYS.map((ability) => [ability, getAbilityScoreForPrerequisite(character, ability, excludeKey)]),
  ) as Record<AbilityKey, number>;
  const subclassId: TalentAcquisitionContext["subclassId"] = acquisitionLevel !== null && acquisitionLevel >= 3 ? character.subclassId : "desconhecido";
  return { abilityScores, classId: character.classId, subclassId, level: acquisitionLevel };
}

function getGeneralFeatGrantOrigin(acquisitionKey: string): TalentGrantOrigin {
  if (acquisitionKey === "background") return "background";
  if (acquisitionKey === "species") return "species";
  return "class"; // "asi-{nível}" — a oportunidade de ASI é concedida pela classe (ASI_LEVELS_BY_CLASS).
}

/** Um registro de Talento Geral/de Origem (26+10, `rules/feats.ts`) — `null` só se `buildFeatAcquisitionFeature` não reconhecer o `featId` (nunca deveria ocorrer com dados consistentes). */
function buildGeneralFeatRecord(character: Character, acquisition: FeatAcquisition): TalentAcquisitionRecord | null {
  const feature = buildFeatAcquisitionFeature(character, acquisition);
  if (!feature) return null;

  const acquisitionLevel = getAcquisitionAsiLevel(acquisition.acquisitionKey);
  const abilityChoiceId = getFeatChoiceId(getFeatAbilityIncreaseChoiceId(acquisition.featId), acquisition.acquisitionKey);
  const suffix = `-${acquisition.acquisitionKey}`;

  const internalChoices: Record<string, string | string[]> = {};
  for (const choice of feature.choices ?? []) {
    if (choice.id === abilityChoiceId) continue; // já coberto por `abilityIncreased`, nunca duplicado aqui.
    const value = character.featureChoiceSelections[choice.id]?.value;
    if (value === undefined) continue;
    const key = choice.id.endsWith(suffix) ? choice.id.slice(0, -suffix.length) : choice.id;
    internalChoices[key] = value;
  }

  return {
    talentId: acquisition.featId,
    opportunityId: acquisition.acquisitionKey,
    grantOrigin: getGeneralFeatGrantOrigin(acquisition.acquisitionKey),
    acquisitionLevel,
    voluntary: acquisition.acquisitionKey !== "background",
    internalChoices,
    abilityIncreased: getFeatAbilityIncreaseChoice(character, acquisition),
    context: buildContext(character, acquisitionLevel),
  };
}

/** Escolhas internas da Dádiva Épica ATIVA (ex.: Especialização de perícia de Dádiva da Proficiência em Perícia) — exclui a própria escolha de atributo, já coberta por `abilityIncreased`. Ids já são os REAIS usados em `featureChoiceSelections` (Dádiva Épica nunca é repetível, sem parametrização por `acquisitionKey` — ver `data/features/epicBoons.ts`). */
function getEpicBoonInternalChoices(character: Character, boonId: string): Record<string, string | string[]> {
  const feature = getEpicBoonFeatures(character).find((boon) => boon.id === boonId);
  if (!feature) return {};
  const abilityChoiceId = `${boonId}-atributo`;
  const internalChoices: Record<string, string | string[]> = {};
  for (const choice of feature.choices ?? []) {
    if (choice.id === abilityChoiceId) continue;
    const value = character.featureChoiceSelections[choice.id]?.value;
    if (value !== undefined) internalChoices[choice.id] = value;
  }
  return internalChoices;
}

/**
 * Registros de Estilo de Luta e Dádiva Épica — ambos resolvidos a
 * partir de `getTalentOpportunityFeatures` (fonte "REESTRUTURAR A
 * ESCOLHA DE TALENTOS..." §2/§5, já restrita às oportunidades
 * efetivamente desbloqueadas, com `sourceType`/`level` corretos).
 * Identifica o TIPO da escolha pelo catálogo a que o valor selecionado
 * pertence (nome de Estilo de Luta vs. nome de Dádiva Épica) — nunca
 * pela identidade da `FeatureDefinition`, que já varia por classe/
 * subclasse.
 */
function buildFightingStyleAndEpicBoonRecords(character: Character): TalentAcquisitionRecord[] {
  const records: TalentAcquisitionRecord[] = [];

  for (const feature of getTalentOpportunityFeatures(character)) {
    const grantOrigin: TalentGrantOrigin = feature.sourceType === "subclass" ? "subclass" : "class";

    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "optionPick") continue;
      const selection = character.featureChoiceSelections[choice.id]?.value;
      if (typeof selection !== "string") continue;

      const style = fightingStylesByName[selection];
      if (style) {
        records.push({
          talentId: style.id,
          opportunityId: choice.id,
          grantOrigin,
          acquisitionLevel: feature.level,
          voluntary: true,
          internalChoices: {},
          abilityIncreased: null,
          context: buildContext(character, feature.level),
        });
        continue;
      }

      const boon = epicBoonsByName[selection];
      if (boon) {
        records.push({
          talentId: boon.id,
          opportunityId: choice.id,
          grantOrigin,
          acquisitionLevel: feature.level,
          voluntary: true,
          internalChoices: getEpicBoonInternalChoices(character, boon.id),
          abilityIncreased: getEpicBoonAbilityIncreaseChoice(character),
          context: buildContext(character, feature.level),
        });
      }
    }
  }

  return records;
}

/**
 * Todas as aquisições de Talento do personagem, estruturadas para
 * estatísticas — Talentos Gerais/de Origem primeiro (ordem de
 * `getFeatAcquisitions`), depois Estilo de Luta/Dádiva Épica. Nunca
 * inclui texto livre/pessoal (ver `services/mapCharacterToBuild.ts`).
 */
export function getRecordedTalentAcquisitions(character: Character): TalentAcquisitionRecord[] {
  const generalFeatRecords = getFeatAcquisitions(character)
    .map((acquisition) => buildGeneralFeatRecord(character, acquisition))
    .filter((record): record is TalentAcquisitionRecord => record !== null);

  return [...generalFeatRecords, ...buildFightingStyleAndEpicBoonRecords(character)];
}
