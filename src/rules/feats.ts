import type { Character } from "../domain/character.js";
import type { FeatureDefinition } from "../domain/features.js";
import type { BackgroundId } from "../domain/ids.js";
import {
  ALERTA_FEAT_ID,
  ARTIFISTA_FEAT_ID,
  ATACANTE_SELVAGEM_FEAT_ID,
  CURANDEIRO_FEAT_ID,
  generalFeats,
  HABILIDOSO_FEAT_ID,
  INICIADO_EM_MAGIA_FEAT_ID,
  MAGIC_INITIATE_LIST_CHOICE_BASE_ID,
  MAGIC_INITIATE_LISTS,
  MUSICO_FEAT_ID,
  SORTUDO_FEAT_ID,
  VALENTAO_DE_TAVERNA_FEAT_ID,
  VIGOROSO_FEAT_ID,
} from "../data/features/feats.js";
import { getProficiencyBonus } from "./abilities.js";
import { getMartialArtsDie } from "./classResources.js";

/**
 * Motor de aquisição dos 10 Talentos de Origem (fonte "IMPLEMENTAR
 * TALENTOS DE ORIGEM NO BUILDER E NO PDF") — concedidos por DUAS fontes,
 * nunca uma terceira: o Antecedente atual (`BACKGROUND_ORIGIN_FEAT_ID`,
 * no máximo 1 aquisição ativa por vez) e cada nível de ASI já resolvido
 * para `{ kind: "feat", featId }` (`Character.asiSelections`, 0+
 * aquisições). A identidade de CADA aquisição (`acquisitionKey`) é
 * `"background"` ou `"asi-{nível}"` — nunca um id gerado à parte: o
 * nível de ASI já distingue naturalmente duas aquisições do MESMO
 * talento repetível (Habilidoso/Iniciado em Magia), sem precisar de um
 * array próprio no `Character` nem de UUID.
 */

/** Antecedente -> id do Talento de Origem que ele concede automaticamente (enumeração 1:1 confirmada a partir do texto de cada `originFeat` em `data/backgrounds.ts`). */
export const BACKGROUND_ORIGIN_FEAT_ID: Record<BackgroundId, string> = {
  acolito: INICIADO_EM_MAGIA_FEAT_ID,
  andarilho: SORTUDO_FEAT_ID,
  artesao: ARTIFISTA_FEAT_ID,
  artista: MUSICO_FEAT_ID,
  charlatao: HABILIDOSO_FEAT_ID,
  criminoso: ALERTA_FEAT_ID,
  eremita: CURANDEIRO_FEAT_ID,
  escriba: HABILIDOSO_FEAT_ID,
  fazendeiro: VIGOROSO_FEAT_ID,
  guarda: ALERTA_FEAT_ID,
  guia: INICIADO_EM_MAGIA_FEAT_ID,
  marinheiro: VALENTAO_DE_TAVERNA_FEAT_ID,
  mercador: SORTUDO_FEAT_ID,
  nobre: HABILIDOSO_FEAT_ID,
  sabio: INICIADO_EM_MAGIA_FEAT_ID,
  soldado: ATACANTE_SELVAGEM_FEAT_ID,
};

/** Antecedente -> lista FIXA de Iniciado em Magia que ele concede (Acólito/Guia/Sábio) — nunca uma escolha livre nesta aquisição específica (o próprio `originFeat` já especifica a lista). */
const BACKGROUND_MAGIC_INITIATE_LIST: Partial<Record<BackgroundId, (typeof MAGIC_INITIATE_LISTS)[number]>> = {
  acolito: "Clérigo",
  guia: "Druida",
  sabio: "Mago",
};

const REPEATABLE_FEAT_IDS: readonly string[] = [HABILIDOSO_FEAT_ID, INICIADO_EM_MAGIA_FEAT_ID];

/** Só Habilidoso e Iniciado em Magia são repetíveis neste catálogo (fonte §1). */
export function isFeatRepeatable(featId: string): boolean {
  return REPEATABLE_FEAT_IDS.includes(featId);
}

/** Id real de uma `FeatureChoice` de uma aquisição específica — ex.: `getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "asi-4")`, usado por `rules/featTalentEntries.ts` para ler a seleção já parametrizada. */
export function getFeatChoiceId(baseId: string, acquisitionKey: string): string {
  return `${baseId}-${acquisitionKey}`;
}
const suffixChoiceId = getFeatChoiceId;

/**
 * Copia uma `FeatureDefinition` do catálogo, parametrizando o id da
 * feature e de cada `FeatureChoice` interna com `acquisitionKey` — nunca
 * reaproveita os ids-base diretamente, para que duas aquisições do
 * MESMO talento repetível nunca compartilhem `featureChoiceSelections`.
 */
export function instantiateFeatAcquisition(base: FeatureDefinition, acquisitionKey: string): FeatureDefinition {
  return {
    ...base,
    id: `${base.id}-${acquisitionKey}`,
    choices: base.choices?.map((choice) => ({ ...choice, id: suffixChoiceId(choice.id, acquisitionKey) })),
  };
}

export interface FeatAcquisition {
  /** `"background"` (no máximo 1 por personagem) ou `"asi-{nível}"`. */
  acquisitionKey: string;
  featId: string;
}

/** Todas as aquisições de Talento ATIVAS do personagem — a do Antecedente atual (se mapear para um dos 10) + uma por nível de ASI já resolvido para "feat". */
export function getFeatAcquisitions(character: Character): FeatAcquisition[] {
  const acquisitions: FeatAcquisition[] = [];

  if (character.backgroundId) {
    const featId = BACKGROUND_ORIGIN_FEAT_ID[character.backgroundId];
    if (featId) acquisitions.push({ acquisitionKey: "background", featId });
  }

  for (const [levelKey, selection] of Object.entries(character.asiSelections)) {
    if (selection.kind === "feat" && selection.featId) {
      acquisitions.push({ acquisitionKey: `asi-${levelKey}`, featId: selection.featId });
    }
  }

  return acquisitions;
}

export function isFeatActive(character: Character, featId: string): boolean {
  return getFeatAcquisitions(character).some((acquisition) => acquisition.featId === featId);
}

/** Lista plana dos ids de talento de TODAS as aquisições ativas (pode repetir um id para Habilidoso/Iniciado em Magia). */
export function getActiveFeatIds(character: Character): string[] {
  return getFeatAcquisitions(character).map((acquisition) => acquisition.featId);
}

/** Quantas aquisições ATIVAS existem de um talento (só > 1 é possível para Habilidoso/Iniciado em Magia — ver `isFeatRepeatable`). */
export function getFeatAcquisitionCount(character: Character, featId: string): number {
  return getFeatAcquisitions(character).filter((acquisition) => acquisition.featId === featId).length;
}

/**
 * Talentos elegíveis para UM nível de ASI específico — exclui um
 * talento NÃO-repetível já ativo em OUTRA aquisição (Antecedente ou
 * outro nível de ASI), mas NUNCA exclui o próprio talento já escolhido
 * para ESTE nível (senão o seletor perderia a opção atualmente
 * selecionada ao reabrir).
 */
export function getAvailableFeatsForAsiLevel(character: Character, level: number): FeatureDefinition[] {
  const currentSelection = character.asiSelections[level];
  const currentFeatId = currentSelection?.kind === "feat" ? currentSelection.featId : null;
  const thisAcquisitionKey = `asi-${level}`;

  const activeElsewhere = new Set(
    getFeatAcquisitions(character)
      .filter((acquisition) => acquisition.acquisitionKey !== thisAcquisitionKey)
      .map((acquisition) => acquisition.featId),
  );

  return generalFeats.filter((feat) => isFeatRepeatable(feat.id) || feat.id === currentFeatId || !activeElsewhere.has(feat.id));
}

/** Lista de Iniciado em Magia desta aquisição — fixa (Antecedente) ou a `optionPick` escolhida (ASI). `null` enquanto não resolvida. */
export function getMagicInitiateList(character: Character, acquisitionKey: string): string | null {
  if (acquisitionKey === "background") {
    return character.backgroundId ? (BACKGROUND_MAGIC_INITIATE_LIST[character.backgroundId] ?? null) : null;
  }
  const selection = character.featureChoiceSelections[suffixChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, acquisitionKey)]?.value;
  return typeof selection === "string" && selection.trim() ? selection : null;
}

/** Listas de Iniciado em Magia já usadas por OUTRAS aquisições do personagem — nunca conta a própria `excludeAcquisitionKey` (fonte §9: "cada aquisição deve usar uma lista diferente"). */
function getUsedMagicInitiateLists(character: Character, excludeAcquisitionKey: string): string[] {
  const used: string[] = [];
  for (const acquisition of getFeatAcquisitions(character)) {
    if (acquisition.featId !== INICIADO_EM_MAGIA_FEAT_ID || acquisition.acquisitionKey === excludeAcquisitionKey) continue;
    const list = getMagicInitiateList(character, acquisition.acquisitionKey);
    if (list) used.push(list);
  }
  return used;
}

/** Variante da aquisição de Iniciado em Magia pelo Antecedente — a lista vem FIXA (nunca uma `FeatureChoice` de lista), só truques/magia/atributo continuam escolhas do jogador. */
function instantiateBackgroundMagicInitiate(acquisitionKey: string): FeatureDefinition {
  const base = generalFeats.find((feature) => feature.id === INICIADO_EM_MAGIA_FEAT_ID)!;
  const withoutListChoice: FeatureDefinition = {
    ...base,
    choices: base.choices?.filter((choice) => choice.id !== MAGIC_INITIATE_LIST_CHOICE_BASE_ID),
  };
  return instantiateFeatAcquisition(withoutListChoice, acquisitionKey);
}

/**
 * Constrói a `FeatureDefinition` de UMA aquisição (Antecedente ou ASI),
 * já com os ids de `FeatureChoice` parametrizados — e, só para Iniciado
 * em Magia, com a lista fixa (Antecedente) ou as opções de lista já
 * restritas às ainda não usadas por outra aquisição (ASI). `null` se
 * `featId` não existir no catálogo (nunca inventa um talento).
 */
export function buildFeatAcquisitionFeature(character: Character, acquisition: FeatAcquisition): FeatureDefinition | null {
  const base = generalFeats.find((feature) => feature.id === acquisition.featId);
  if (!base) return null;

  if (acquisition.featId === INICIADO_EM_MAGIA_FEAT_ID) {
    if (acquisition.acquisitionKey === "background") return instantiateBackgroundMagicInitiate(acquisition.acquisitionKey);

    const instantiated = instantiateFeatAcquisition(base, acquisition.acquisitionKey);
    const usedLists = getUsedMagicInitiateLists(character, acquisition.acquisitionKey);
    const listChoiceId = suffixChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, acquisition.acquisitionKey);
    return {
      ...instantiated,
      choices: instantiated.choices?.map((choice) =>
        choice.id === listChoiceId && choice.effect.kind === "optionPick"
          ? { ...choice, effect: { ...choice.effect, options: choice.effect.options.filter((option) => !usedLists.includes(option)) } }
          : choice,
      ),
    };
  }

  return instantiateFeatAcquisition(base, acquisition.acquisitionKey);
}

/** Aquisições de Talento vindas de ASI (nunca a do Antecedente — essa é mesclada separadamente por `rules/features.ts#getBackgroundFeatures`, para nunca aparecer duplicada). */
export function getFeatAcquisitionFeatures(character: Character): FeatureDefinition[] {
  return getFeatAcquisitions(character)
    .filter((acquisition) => acquisition.acquisitionKey !== "background")
    .map((acquisition) => buildFeatAcquisitionFeature(character, acquisition))
    .filter((feature): feature is FeatureDefinition => feature !== null);
}

/**
 * Funde a `FeatureDefinition` estática de `data/features/backgrounds.ts`
 * (id/nome/`backgroundId` preservados — nunca muda, por compatibilidade)
 * com a aquisição REAL do talento mecânico que esse Antecedente concede
 * — nunca mais só o texto literal do `originFeat` como `summary`.
 */
export function mergeBackgroundFeatWithCatalog(feature: FeatureDefinition, character: Character): FeatureDefinition {
  if (!feature.backgroundId) return feature;
  const featId = BACKGROUND_ORIGIN_FEAT_ID[feature.backgroundId];
  if (!featId) return feature;
  const acquisition = buildFeatAcquisitionFeature(character, { acquisitionKey: "background", featId });
  if (!acquisition) return feature;
  return { ...feature, summary: acquisition.summary, choices: acquisition.choices, uses: acquisition.uses };
}

/**
 * Pontos de Sorte máximos de Sortudo (nível 1+, fonte §11): Bônus de
 * Proficiência, recupera em DL — reserva representada no PDF como
 * `[__]` por ponto (`rules/featTalentEntries.ts`), nunca um saldo
 * numérico solto.
 */
export function getLuckyPointsMax(character: Character): number | null {
  if (!isFeatActive(character, SORTUDO_FEAT_ID)) return null;
  return getProficiencyBonus(character.level);
}

/** Quantidade máxima de aliados beneficiados por Canção Encorajadora de Músico (fonte §10): Bônus de Proficiência — nunca uma reserva de usos. */
export function getMusicianAllyCount(character: Character): number | null {
  if (!isFeatActive(character, MUSICO_FEAT_ID)) return null;
  return getProficiencyBonus(character.level);
}

/** Bônus somado ao Dado de Vida da criatura curada por Médico de Combate de Curandeiro (fonte §7): Bônus de Proficiência de quem tem o talento. */
export function getHealerKitHealingBonus(character: Character): number | null {
  if (!isFeatActive(character, CURANDEIRO_FEAT_ID)) return null;
  return getProficiencyBonus(character.level);
}

/** Bônus de PV máximos de Vigoroso (fonte §13): `2 × nível total do personagem` — `0` quando o talento não está ativo (soma direta em `rules/hp.ts#getMaxHitPoints`). */
export function getToughHpBonus(character: Character): number {
  if (!isFeatActive(character, VIGOROSO_FEAT_ID)) return 0;
  return 2 * character.level;
}

/** Bônus de Alerta à Iniciativa (fonte §4): Bônus de Proficiência — `0` quando o talento não está ativo (soma direta em `rules/derived.ts#getInitiative`). */
export function getAlertInitiativeBonus(character: Character): number {
  if (!isFeatActive(character, ALERTA_FEAT_ID)) return 0;
  return getProficiencyBonus(character.level);
}

/**
 * Tamanho do dado de dano do Ataque Desarmado Aprimorado de Valentão de
 * Taverna (fonte §12): 1d4, ou o dado de Artes Marciais do Monge quando
 * maior — nunca os dois somados, preservando a interação já cadastrada
 * do Monge (`rules/classResources.ts#getMartialArtsDie`). Devolve o
 * NÚMERO de faces (nunca o tipo `HitDie` — 4 não é um Dado de Vida
 * válido no projeto, só o tamanho do dado de dano desta característica).
 * `null` quando o talento não está ativo.
 */
export function getUnarmedStrikeDamageDie(character: Character): number | null {
  if (!isFeatActive(character, VALENTAO_DE_TAVERNA_FEAT_ID)) return null;
  const monkDie = getMartialArtsDie(character);
  return monkDie && monkDie > 4 ? monkDie : 4;
}
