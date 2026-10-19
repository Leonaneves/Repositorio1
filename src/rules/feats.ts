import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { FeatureDefinition } from "../domain/features.js";
import type { BackgroundId } from "../domain/ids.js";
import { classes } from "../data/classes.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import {
  ALERTA_FEAT_ID,
  ARTIFISTA_FEAT_ID,
  ATACANTE_SELVAGEM_FEAT_ID,
  CURANDEIRO_FEAT_ID,
  ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID,
  ESPECIALISTA_BESTA_FEAT_ID,
  generalFeats,
  HABILIDOSO_FEAT_ID,
  IMOBILIZADOR_FEAT_ID,
  INICIADO_EM_MAGIA_FEAT_ID,
  LIDER_INSPIRADOR_FEAT_ID,
  MAGIC_INITIATE_LIST_CHOICE_BASE_ID,
  MAGIC_INITIATE_LISTS,
  MENTE_AGUCADA_FEAT_ID,
  MESTRE_ATIRADOR_FEAT_ID,
  MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID,
  MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID,
  MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID,
  MESTRE_EM_ARMAS_GRANDES_FEAT_ID,
  MESTRE_EM_ESCUDOS_FEAT_ID,
  MUSICO_FEAT_ID,
  originFeats,
  RESILIENTE_FEAT_ID,
  SENTINELA_FEAT_ID,
  SORRATEIRO_FEAT_ID,
  SORTUDO_FEAT_ID,
  TELECINETICO_FEAT_ID,
  VALENTAO_DE_TAVERNA_FEAT_ID,
  VELOCISTA_FEAT_ID,
  VIGOROSO_FEAT_ID,
} from "../data/features/feats.js";
import { getAsiAbilityBonus } from "./asi.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getMartialArtsDie } from "./classResources.js";

/**
 * Motor de aquisição dos 10 Talentos de Origem (fonte "IMPLEMENTAR
 * TALENTOS DE ORIGEM NO BUILDER E NO PDF") — concedidos por TRÊS fontes,
 * nunca uma quarta: o Antecedente atual (`BACKGROUND_ORIGIN_FEAT_ID`, no
 * máximo 1 aquisição ativa por vez), o traço "Versátil" do Humano (fonte
 * "ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE" —
 * `Character.humanOriginFeatId`, também no máximo 1 aquisição ativa por
 * vez, SEGUNDA e independente da do Antecedente) e cada nível de ASI já
 * resolvido para `{ kind: "feat", featId }` (`Character.asiSelections`,
 * 0+ aquisições — inclui tanto os 10 Talentos de Origem quanto os 26
 * Talentos Gerais). A identidade de CADA aquisição (`acquisitionKey`) é
 * `"background"`, `"species"` ou `"asi-{nível}"` — nunca um id gerado à
 * parte: o nível de ASI já distingue naturalmente duas aquisições do
 * MESMO talento repetível (Habilidoso/Iniciado em Magia), sem precisar
 * de um array próprio no `Character` nem de UUID.
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

/**
 * Pré-requisitos dos 26 Talentos Gerais além do nível 4+, universal a
 * todos (fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §1) —
 * `abilityAtLeast13` é satisfeito por QUALQUER um dos atributos listados
 * (nunca todos simultaneamente); `armorTraining` lê diretamente
 * `character.armor.proficiencies` (reflete a proficiência ATUAL,
 * qualquer que seja a origem — classe, subclasse ou outro talento, igual
 * a qualquer checagem RAW de pré-requisito). Os 10 Talentos de Origem
 * nunca aparecem aqui (sem entrada = sem pré-requisito além do nível
 * 4+, que na prática nunca filtra nada para eles: todo nível de ASI já é
 * ≥4 — ver `getUnlockedAsiLevels`).
 */
interface GeneralFeatPrerequisite {
  armorTraining?: "medium" | "heavy" | "shield";
  abilityAtLeast13?: AbilityKey[];
}

const GENERAL_FEAT_PREREQUISITES: Partial<Record<string, GeneralFeatPrerequisite>> = {
  [ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID]: { armorTraining: "medium" },
  [ESPECIALISTA_BESTA_FEAT_ID]: { abilityAtLeast13: ["DEX"] },
  [IMOBILIZADOR_FEAT_ID]: { abilityAtLeast13: ["FOR", "DEX"] },
  [LIDER_INSPIRADOR_FEAT_ID]: { abilityAtLeast13: ["SAB", "CAR"] },
  [MENTE_AGUCADA_FEAT_ID]: { abilityAtLeast13: ["INT"] },
  [MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID]: { armorTraining: "medium" },
  [MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID]: { armorTraining: "heavy" },
  [MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID]: { abilityAtLeast13: ["FOR", "DEX"] },
  [MESTRE_EM_ARMAS_GRANDES_FEAT_ID]: { abilityAtLeast13: ["FOR"] },
  [MESTRE_EM_ESCUDOS_FEAT_ID]: { armorTraining: "shield" },
  [MESTRE_ATIRADOR_FEAT_ID]: { abilityAtLeast13: ["DEX"] },
  [SENTINELA_FEAT_ID]: { abilityAtLeast13: ["FOR", "DEX"] },
  [SORRATEIRO_FEAT_ID]: { abilityAtLeast13: ["DEX"] },
  [VELOCISTA_FEAT_ID]: { abilityAtLeast13: ["DEX", "CON"] },
};

/** Id-BASE convencional da `FeatureChoice` de "Aumento de 1 num atributo" de QUALQUER um dos 26 Talentos Gerais — sempre `${featId}-atributo` (ver `data/features/feats.ts`, nunca uma constante nomeada por talento). */
export function getFeatAbilityIncreaseChoiceId(featId: string): string {
  return `${featId}-atributo`;
}

/** Extrai o nível de uma `acquisitionKey` no formato `asi-{nível}` — `null` para `"background"`/`"species"` (sem nível numérico, sempre tratadas como anteriores a qualquer ASI). */
export function getAcquisitionAsiLevel(acquisitionKey: string): number | null {
  const match = /^asi-(\d+)$/.exec(acquisitionKey);
  return match ? Number(match[1]) : null;
}

/**
 * Valor do atributo "efetivo" usado só para checar pré-requisito de
 * Talento — igual a `rules/abilities.ts#getEffectiveAbilityScore`, mas
 * (a) EXCLUINDO a contribuição da PRÓPRIA aquisição sendo validada
 * (fonte "COMPLETAR TALENTOS GERAIS..." §1: "não permitir que o aumento
 * concedido cumpra seu próprio pré-requisito") e (b) EXCLUINDO qualquer
 * contribuição de ASI/Talento de nível POSTERIOR ao desta aquisição
 * (fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS OS
 * ATRIBUTOS" §6: validar usando o estado do personagem NO MOMENTO da
 * aquisição — "um aumento escolhido no nível 8 não pode validar
 * retroativamente a escolha do nível 4"). Aumento do Antecedente conta
 * sempre (concedido na criação, antes de qualquer ASI). Nunca aplica o
 * teto de 25 do Bárbaro/Monge nível 20 — irrelevante para um limiar de
 * 13. Exportada também para `rules/talentAcquisitionHistory.ts` (fonte
 * "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS RECOMENDAÇÕES" §3): o
 * contexto "antes da aquisição" registrado para estatísticas reusa
 * literalmente este mesmo cálculo, nunca uma segunda implementação.
 */
export function getAbilityScoreForPrerequisite(character: Character, ability: AbilityKey, excludeAcquisitionKey: string): number {
  const beforeLevel = getAcquisitionAsiLevel(excludeAcquisitionKey) ?? undefined;
  const base = character.abilities[ability].score;
  const backgroundBonus = character.backgroundAbilityBonuses[ability] ?? 0;
  const asiBonus = getAsiAbilityBonus(character, ability, beforeLevel);
  const featBonus = getFeatAbilityIncreaseBonus(character, ability, excludeAcquisitionKey, beforeLevel);
  return base + backgroundBonus + asiBonus + featBonus;
}

/**
 * Treinamento com `category` de armadura, para fins de pré-requisito,
 * NO MOMENTO de `acquisitionLevel` (mesma ordem histórica de
 * `getAbilityScoreForPrerequisite` acima) — só "heavy" tem alguma
 * ambiguidade de ordem: é a ÚNICA categoria concedida por um Talento
 * (Especialista em Armaduras Pesadas), e esse Talento é, ele mesmo, uma
 * aquisição de ASI com nível próprio; "medium"/"shield" nunca vêm de
 * Talento (só classe, sempre desde o nível 1, ou subclasse, sempre
 * disponível a partir do nível 3 — e todo nível de ASI já é ≥4, então
 * nunca ficam ambíguas aqui). Quando o treinamento ATUAL de "heavy" é
 * explicado SÓ por uma aquisição de Especialista em Armaduras Pesadas
 * de nível POSTERIOR a `acquisitionLevel`, essa concessão ainda não
 * "existia" neste ponto da linha do tempo — devolve o que classe/subclasse
 * já explicam independentemente, nunca o Talento futuro. Um ajuste
 * manual do jogador (`setArmorProficiency`, sem origem/nível registrado)
 * nunca é invalidado por esta checagem quando não houver nenhuma
 * aquisição de Especialista em Armaduras Pesadas mais recente para
 * "disputar" a origem do `true` atual.
 */
function getArmorTrainingForPrerequisite(
  character: Character,
  category: "medium" | "heavy" | "shield",
  acquisitionLevel: number | null,
  excludeAcquisitionKey: string,
): boolean {
  const current = character.armor.proficiencies[category];
  if (!current || category !== "heavy" || acquisitionLevel === null) return current;

  const heavyFeatAcquisition = getFeatAcquisitions(character).find(
    (acquisition) => acquisition.featId === ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID && acquisition.acquisitionKey !== excludeAcquisitionKey,
  );
  if (!heavyFeatAcquisition) return current;
  const grantedLevel = getAcquisitionAsiLevel(heavyFeatAcquisition.acquisitionKey);
  if (grantedLevel === null || grantedLevel <= acquisitionLevel) return current;

  const baseHeavy = character.classId ? classes[character.classId].armorProficiencies.heavy : false;
  const clericProtectorHeavy = character.classId === "clerigo" && character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID]?.value === "Protetor";
  return baseHeavy || clericProtectorHeavy;
}

/** Nomes dos 6 atributos, só para compor `formatFeatIneligibilityReason` abaixo. */
const PREREQUISITE_ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

const ARMOR_TRAINING_NAMES: Record<"medium" | "heavy" | "shield", string> = {
  medium: "Armadura Média",
  heavy: "Armadura Pesada",
  shield: "Escudo",
};

/**
 * Motivo ESPECÍFICO pelo qual uma aquisição não está disponível para um
 * Talento — fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS
 * OS ATRIBUTOS" §7: "Mostrar talentos indisponíveis" precisa do motivo
 * exato, nunca um "indisponível" genérico. Só os 3 casos abaixo têm
 * alguma entrada real no catálogo atual (`GENERAL_FEAT_PREREQUISITES`/
 * `isFeatRepeatable`) — nunca inventa um 4º caso (ex.: "requer Estilo de
 * Luta" ou "requer nível 19") sem um Talento cadastrado que realmente
 * dependa disso.
 */
export type FeatIneligibilityReason =
  | { kind: "abilityBelowThreshold"; required: number; abilities: { ability: AbilityKey; available: number }[] }
  | { kind: "missingArmorTraining"; category: "medium" | "heavy" | "shield" }
  | { kind: "nonRepeatableAlreadyAcquired" };

/**
 * Texto pronto para exibir um `FeatIneligibilityReason` na UI (toggle
 * "Mostrar talentos indisponíveis") — `abilityBelowThreshold` cobre tanto
 * um único atributo exigido ("Requer Destreza 13; disponível nesta
 * aquisição: 12.") quanto um requisito "A OU B" (`GENERAL_FEAT_PREREQUISITES`
 * com 2 atributos — fonte §7: "'FOR ou DEX 13' deve ser avaliado como
 * 'ao menos um destes', nunca os dois"), reportando o valor disponível
 * de CADA atributo avaliado, nunca só o primeiro.
 */
export function formatFeatIneligibilityReason(reason: FeatIneligibilityReason): string {
  if (reason.kind === "abilityBelowThreshold") {
    const names = reason.abilities.map((entry) => PREREQUISITE_ABILITY_NAMES[entry.ability]).join(" ou ");
    const available =
      reason.abilities.length === 1
        ? String(reason.abilities[0].available)
        : reason.abilities.map((entry) => `${PREREQUISITE_ABILITY_NAMES[entry.ability]} ${entry.available}`).join(", ");
    return `Requer ${names} ${reason.required}; disponível nesta aquisição: ${available}.`;
  }
  if (reason.kind === "missingArmorTraining") {
    return `Requer treinamento com ${ARMOR_TRAINING_NAMES[reason.category]}.`;
  }
  return "Talento já adquirido e não repetível.";
}

/**
 * Os pré-requisitos de `GENERAL_FEAT_PREREQUISITES` ainda não satisfeitos
 * por esta aquisição específica, JÁ na ordem histórica correta (ver
 * `getAbilityScoreForPrerequisite`/`getArmorTrainingForPrerequisite`
 * acima) — `[]` quando elegível. Nunca inclui a checagem de nível 4+
 * nem de repetibilidade (ambas fora do mapa de pré-requisitos, tratadas
 * à parte por `meetsFeatPrerequisites`/`getFeatCatalogForAsiLevel`).
 */
function getFeatPrerequisiteReasons(character: Character, featId: string, acquisitionKey: string): FeatIneligibilityReason[] {
  const prerequisite = GENERAL_FEAT_PREREQUISITES[featId];
  if (!prerequisite) return [];
  const reasons: FeatIneligibilityReason[] = [];
  const acquisitionLevel = getAcquisitionAsiLevel(acquisitionKey);

  if (prerequisite.armorTraining && !getArmorTrainingForPrerequisite(character, prerequisite.armorTraining, acquisitionLevel, acquisitionKey)) {
    reasons.push({ kind: "missingArmorTraining", category: prerequisite.armorTraining });
  }
  if (prerequisite.abilityAtLeast13) {
    const evaluated = prerequisite.abilityAtLeast13.map((ability) => ({ ability, available: getAbilityScoreForPrerequisite(character, ability, acquisitionKey) }));
    if (!evaluated.some((entry) => entry.available >= 13)) {
      reasons.push({ kind: "abilityBelowThreshold", required: 13, abilities: evaluated });
    }
  }
  return reasons;
}

/**
 * Se uma aquisição específica (`acquisitionKey`) de `featId` satisfaz
 * seus pré-requisitos — nível 4+ sempre (lido do PRÓPRIO `acquisitionKey`,
 * formato `asi-{nível}`, nunca de `character.level`: todo nível de ASI já
 * é ≥4 por definição — ver `ASI_LEVELS_BY_CLASS` — então isto nunca
 * filtra nada na prática, só documenta/protege a regra; usar
 * `character.level` quebraria em qualquer cenário onde ele ainda não
 * reflita o nível desta aquisição específica), mais o que
 * `getFeatPrerequisiteReasons` acima encontrar (já na ordem histórica
 * correta). Sem entrada no mapa = só o nível 4+ (cobre os 10 Talentos
 * de Origem e os Talentos Gerais sem pré-requisito extra).
 */
export function meetsFeatPrerequisites(character: Character, featId: string, acquisitionKey: string): boolean {
  const asiLevelMatch = /^asi-(\d+)$/.exec(acquisitionKey);
  if (asiLevelMatch && Number(asiLevelMatch[1]) < 4) return false;
  return getFeatPrerequisiteReasons(character, featId, acquisitionKey).length === 0;
}

/**
 * Motivos de inelegibilidade de um Talento JÁ ESCOLHIDO num nível de ASI
 * — `[]` quando nada está escolhido ou quando continua elegível. Fonte
 * "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS OS ATRIBUTOS" §9:
 * uma mudança posterior (ex.: reduzir um atributo distribuído num nível
 * anterior) pode tornar uma escolha já feita incompatível — "nunca
 * substituir/apagar silenciosamente", só sinalizar (ver
 * `rules/builderProgress.ts`/`ui/builder/AsiControl.tsx`).
 */
export function getChosenAsiFeatIneligibilityReasons(character: Character, level: number): FeatIneligibilityReason[] {
  const selection = character.asiSelections[level];
  if (selection?.kind !== "feat" || !selection.featId) return [];
  return getFeatPrerequisiteReasons(character, selection.featId, `asi-${level}`);
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

/** Todas as aquisições de Talento ATIVAS do personagem — a do Antecedente atual (se mapear para um dos 10), a do Humano (Versátil, se escolhida) + uma por nível de ASI já resolvido para "feat". */
export function getFeatAcquisitions(character: Character): FeatAcquisition[] {
  const acquisitions: FeatAcquisition[] = [];

  if (character.backgroundId) {
    const featId = BACKGROUND_ORIGIN_FEAT_ID[character.backgroundId];
    if (featId) acquisitions.push({ acquisitionKey: "background", featId });
  }

  if (character.speciesId === "humano" && character.humanOriginFeatId) {
    acquisitions.push({ acquisitionKey: "species", featId: character.humanOriginFeatId });
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

/** Atributo escolhido na `FeatureChoice` "Aumento de 1" de UMA aquisição específica (ver `getFeatAbilityIncreaseChoiceId`) — `null` enquanto não resolvida. */
export function getFeatAbilityIncreaseChoice(character: Character, acquisition: FeatAcquisition): AbilityKey | null {
  const choiceId = suffixChoiceId(getFeatAbilityIncreaseChoiceId(acquisition.featId), acquisition.acquisitionKey);
  const value = character.featureChoiceSelections[choiceId]?.value;
  return typeof value === "string" && (ABILITY_KEYS as readonly string[]).includes(value) ? (value as AbilityKey) : null;
}

/**
 * Soma de +1 por aquisição de Talento cuja escolha "Aumento de 1" já
 * resolveu para este atributo — consumida por
 * `rules/abilities.ts#getEffectiveAbilityScore` (soma ao valor efetivo,
 * com teto de 20 aplicado lá) e por `getAbilityScoreForPrerequisite`
 * acima (pré-requisito de OUTRO talento, nunca o dele mesmo —
 * `excludeAcquisitionKey`). Mais de uma aquisição pode mirar o MESMO
 * atributo (ex.: Resiliente + Resistente ambos em Constituição) — soma
 * todas, nunca só a primeira. Com `beforeLevel`, ignora também qualquer
 * aquisição de ASI de nível ≥ `beforeLevel` (mesma ordem histórica de
 * `getAbilityScoreForPrerequisite` — aquisições de Antecedente/Humano,
 * sem nível numérico, nunca são ignoradas por este filtro).
 */
export function getFeatAbilityIncreaseBonus(character: Character, ability: AbilityKey, excludeAcquisitionKey?: string, beforeLevel?: number): number {
  let total = 0;
  for (const acquisition of getFeatAcquisitions(character)) {
    if (acquisition.acquisitionKey === excludeAcquisitionKey) continue;
    if (beforeLevel !== undefined) {
      const acquisitionLevel = getAcquisitionAsiLevel(acquisition.acquisitionKey);
      if (acquisitionLevel !== null && acquisitionLevel >= beforeLevel) continue;
    }
    if (getFeatAbilityIncreaseChoice(character, acquisition) === ability) total += 1;
  }
  return total;
}

/** Atributo escolhido por Resiliente (nunca repetível, no máximo 1 aquisição ativa) — `null` se o talento não estiver ativo ou a escolha ainda não foi resolvida. Consumido por `rules/savingThrows.ts#getSavingThrow` para somar a proficiência concedida pela MESMA escolha que dá o +1 de atributo. */
export function getResilientGrantedAbility(character: Character): AbilityKey | null {
  const acquisition = getFeatAcquisitions(character).find((acquisition) => acquisition.featId === RESILIENTE_FEAT_ID);
  if (!acquisition) return null;
  return getFeatAbilityIncreaseChoice(character, acquisition);
}

/**
 * Talentos de Origem elegíveis para a escolha do Humano (traço
 * "Versátil", fonte "ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO HUMANO NA
 * ETAPA ESPÉCIE" §1/§3) — catálogo restrito aos 10 Talentos de Origem
 * (nunca os 26 Talentos Gerais, que exigem nível de ASI), sem nenhum
 * pré-requisito (os Talentos de Origem não têm pré-requisito de
 * atributo — `meetsFeatPrerequisites` nunca é chamado aqui). Mesmo
 * padrão de cross-exclusão de `getAvailableFeatsForAsiLevel`: exclui um
 * talento NÃO-repetível já ativo em OUTRA aquisição (Antecedente ou
 * ASI), mas NUNCA exclui o próprio talento já escolhido pelo Humano
 * (senão o seletor perderia a opção atualmente selecionada ao reabrir).
 * Nunca filtra pelo Antecedente retroativamente se ele mudar DEPOIS —
 * esse caso vira conflito explícito, ver `hasHumanOriginFeatConflictWithBackground`.
 */
export function getAvailableOriginFeatsForHumanSpecies(character: Character): FeatureDefinition[] {
  const currentFeatId = character.speciesId === "humano" ? character.humanOriginFeatId : null;

  const activeElsewhere = new Set(
    getFeatAcquisitions(character)
      .filter((acquisition) => acquisition.acquisitionKey !== "species")
      .map((acquisition) => acquisition.featId),
  );

  return originFeats.filter((feat) => isFeatRepeatable(feat.id) || feat.id === currentFeatId || !activeElsewhere.has(feat.id));
}

/**
 * Se o Talento de Origem escolhido pelo Humano é o MESMO concedido pelo
 * Antecedente atual, e esse talento não é repetível (fonte §3: "Se o
 * antecedente conceder o mesmo talento e a repetição não for permitida
 * ... impedir a conclusão enquanto houver conflito") — `false` sem as
 * duas origens resolvidas, ou para talentos repetíveis (Habilidoso/
 * Iniciado em Magia: duas aquisições independentes são válidas). Nunca
 * decide SOZINHO qual lado deve mudar — a fonte pede explicitamente que
 * o talento do HUMANO seja trocado, nunca o Antecedente.
 */
export function hasHumanOriginFeatConflictWithBackground(character: Character): boolean {
  if (character.speciesId !== "humano" || !character.humanOriginFeatId) return false;
  if (!character.backgroundId) return false;
  const backgroundFeatId = BACKGROUND_ORIGIN_FEAT_ID[character.backgroundId];
  if (!backgroundFeatId || backgroundFeatId !== character.humanOriginFeatId) return false;
  return !isFeatRepeatable(character.humanOriginFeatId);
}

export interface FeatCatalogEntry {
  feat: FeatureDefinition;
  eligible: boolean;
  /** `[]` quando `eligible` — motivos específicos (fonte §7), nunca um "indisponível" genérico. */
  reasons: FeatIneligibilityReason[];
}

/**
 * Catálogo COMPLETO dos 26 Talentos Gerais para UM nível de ASI
 * específico, cada um com sua elegibilidade e o(s) motivo(s) exatos
 * quando não elegível — fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA
 * OCORRER APÓS OS ATRIBUTOS" §7: por padrão a UI mostra só os elegíveis
 * (`getAvailableFeatsForAsiLevel` abaixo, que filtra este catálogo);
 * com o toggle "Mostrar talentos indisponíveis" ativo, mostra todos,
 * desabilitados com o motivo. O próprio talento já escolhido para ESTE
 * nível é SEMPRE elegível aqui (nunca reavaliado contra si mesmo — senão
 * o seletor perderia a opção atualmente selecionada ao reabrir); um
 * talento NÃO-repetível já ativo em OUTRA aquisição (Antecedente, Humano
 * ou outro nível de ASI) entra com `nonRepeatableAlreadyAcquired`.
 */
export function getFeatCatalogForAsiLevel(character: Character, level: number): FeatCatalogEntry[] {
  const currentSelection = character.asiSelections[level];
  const currentFeatId = currentSelection?.kind === "feat" ? currentSelection.featId : null;
  const thisAcquisitionKey = `asi-${level}`;

  const activeElsewhere = new Set(
    getFeatAcquisitions(character)
      .filter((acquisition) => acquisition.acquisitionKey !== thisAcquisitionKey)
      .map((acquisition) => acquisition.featId),
  );

  return generalFeats.map((feat) => {
    if (feat.id === currentFeatId) return { feat, eligible: true, reasons: [] };
    const reasons: FeatIneligibilityReason[] = [];
    if (!isFeatRepeatable(feat.id) && activeElsewhere.has(feat.id)) reasons.push({ kind: "nonRepeatableAlreadyAcquired" });
    reasons.push(...getFeatPrerequisiteReasons(character, feat.id, thisAcquisitionKey));
    return { feat, eligible: reasons.length === 0, reasons };
  });
}

/**
 * Talentos elegíveis para UM nível de ASI específico — a parte
 * `eligible` de `getFeatCatalogForAsiLevel` acima (comportamento padrão
 * da UI, toggle "Mostrar talentos indisponíveis" desligado).
 */
export function getAvailableFeatsForAsiLevel(character: Character, level: number): FeatureDefinition[] {
  return getFeatCatalogForAsiLevel(character, level)
    .filter((entry) => entry.eligible)
    .map((entry) => entry.feat);
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
 * Marca a `FeatureDefinition` de uma aquisição "species" com
 * `speciesId: "humano"` — reaproveita o campo já existente em
 * `FeatureDefinition` (opcional, usado hoje só por `sourceType: "species"`)
 * para identificar, sem ambiguidade, QUAL feature "feat" veio do Humano
 * (nunca do Antecedente/ASI) — usado por `rules/features.ts#getFeaturesAndTalentsStepFeatures`
 * e pela UI (`ui/builder/steps/Step8FeaturesAndTalents.tsx`) para exibir
 * "Origem: Humano" + atalho para a etapa Espécie, em vez do rótulo
 * genérico "Talento". Nunca colide com a própria feature de traços da
 * espécie (`especie-humano-tracos`, `sourceType: "species"`) — quem lê
 * este marcador sempre filtra por `sourceType === "feat"` também.
 */
function withHumanSpeciesMarker(feature: FeatureDefinition, acquisitionKey: string): FeatureDefinition {
  return acquisitionKey === "species" ? { ...feature, speciesId: "humano" } : feature;
}

/**
 * Constrói a `FeatureDefinition` de UMA aquisição (Antecedente, Humano ou
 * ASI), já com os ids de `FeatureChoice` parametrizados — e, só para
 * Iniciado em Magia, com a lista fixa (Antecedente) ou as opções de
 * lista já restritas às ainda não usadas por outra aquisição (Humano ou
 * ASI). `null` se `featId` não existir no catálogo (nunca inventa um
 * talento).
 */
export function buildFeatAcquisitionFeature(character: Character, acquisition: FeatAcquisition): FeatureDefinition | null {
  const base = generalFeats.find((feature) => feature.id === acquisition.featId);
  if (!base) return null;

  if (acquisition.featId === RESILIENTE_FEAT_ID) {
    const instantiated = instantiateFeatAcquisition(base, acquisition.acquisitionKey);
    const abilityChoiceId = suffixChoiceId(getFeatAbilityIncreaseChoiceId(RESILIENTE_FEAT_ID), acquisition.acquisitionKey);
    // Só atributos AINDA sem proficiência em Salvaguarda (flag armazenada diretamente — fonte §18:
    // "atributo no qual ainda não tenha proficiência em Salv"). Recalculado por personagem, nunca uma
    // lista estática (mesmo princípio da lista de Iniciado em Magia abaixo).
    const options = ABILITY_KEYS.filter((ability) => !character.savingThrows[ability].proficient);
    return withHumanSpeciesMarker(
      {
        ...instantiated,
        choices: instantiated.choices?.map((choice) =>
          choice.id === abilityChoiceId && choice.effect.kind === "abilityScoreIncrease" ? { ...choice, effect: { ...choice.effect, options } } : choice,
        ),
      },
      acquisition.acquisitionKey,
    );
  }

  if (acquisition.featId === INICIADO_EM_MAGIA_FEAT_ID) {
    if (acquisition.acquisitionKey === "background") return instantiateBackgroundMagicInitiate(acquisition.acquisitionKey);

    const instantiated = instantiateFeatAcquisition(base, acquisition.acquisitionKey);
    const usedLists = getUsedMagicInitiateLists(character, acquisition.acquisitionKey);
    const listChoiceId = suffixChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, acquisition.acquisitionKey);
    return withHumanSpeciesMarker(
      {
        ...instantiated,
        choices: instantiated.choices?.map((choice) =>
          choice.id === listChoiceId && choice.effect.kind === "optionPick"
            ? { ...choice, effect: { ...choice.effect, options: choice.effect.options.filter((option) => !usedLists.includes(option)) } }
            : choice,
        ),
      },
      acquisition.acquisitionKey,
    );
  }

  return withHumanSpeciesMarker(instantiateFeatAcquisition(base, acquisition.acquisitionKey), acquisition.acquisitionKey);
}

/** Aquisições de Talento vindas de ASI ou do Humano (nunca a do Antecedente — essa é mesclada separadamente por `rules/features.ts#getBackgroundFeatures`, para nunca aparecer duplicada). */
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

/** Redução de dano Cont/Cort/Perf de ataques de Mestre em Armaduras Pesadas (fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §12): Bônus de Proficiência — `null` quando o talento não está ativo. */
export function getHeavyArmorMasterReduction(character: Character): number | null {
  if (!isFeatActive(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID)) return null;
  return getProficiencyBonus(character.level);
}

/** Bônus de dano de Maestria em Armas Pesadas de Mestre em Armas Grandes (fonte §14): Bônus de Proficiência — `null` quando o talento não está ativo. */
export function getGreatWeaponMasterDamageBonus(character: Character): number | null {
  if (!isFeatActive(character, MESTRE_EM_ARMAS_GRANDES_FEAT_ID)) return null;
  return getProficiencyBonus(character.level);
}

/** CD de Golpe de Escudo de Mestre em Escudos (fonte §15): `8 + mod FOR + BP` — `null` quando o talento não está ativo. */
export function getShieldMasterCd(character: Character): number | null {
  if (!isFeatActive(character, MESTRE_EM_ESCUDOS_FEAT_ID)) return null;
  const strengthMod = getAbilityModifier(getEffectiveAbilityScore(character, "FOR"));
  return 8 + strengthMod + getProficiencyBonus(character.level);
}

/**
 * CD de Empurrão Telecinético de Telecinético (fonte §23): `8 + mod do
 * atributo ESCOLHIDO NESTA AQUISIÇÃO + BP` — nunca o atributo de
 * conjuração da classe (este talento nunca depende de conjuração de
 * classe). `null` sem o talento ativo ou com a escolha de atributo ainda
 * não resolvida.
 */
export function getTelekineticCd(character: Character): number | null {
  const acquisition = getFeatAcquisitions(character).find((acquisition) => acquisition.featId === TELECINETICO_FEAT_ID);
  if (!acquisition) return null;
  const ability = getFeatAbilityIncreaseChoice(character, acquisition);
  if (!ability) return null;
  return 8 + getAbilityModifier(getEffectiveAbilityScore(character, ability)) + getProficiencyBonus(character.level);
}

/**
 * PV Temporários da atuação de Líder Inspirador (fonte §8): nível total
 * do personagem + mod do atributo ESCOLHIDO NESTA AQUISIÇÃO (SAB ou
 * CAR, nunca o maior automaticamente). `null` sem o talento ativo ou com
 * a escolha de atributo ainda não resolvida.
 */
export function getInspiringLeaderTempHp(character: Character): number | null {
  const acquisition = getFeatAcquisitions(character).find((acquisition) => acquisition.featId === LIDER_INSPIRADOR_FEAT_ID);
  if (!acquisition) return null;
  const ability = getFeatAbilityIncreaseChoice(character, acquisition);
  if (!ability) return null;
  return character.level + getAbilityModifier(getEffectiveAbilityScore(character, ability));
}

/** Bônus de Deslocamento de Velocista (fonte §28): +3m fixo — `0` quando o talento não está ativo (soma direta em `rules/speed.ts#getSpeed`, mesmo padrão de `getToughHpBonus`/`getAlertInitiativeBonus`). */
export function getFeatSpeedBonus(character: Character): number {
  return isFeatActive(character, VELOCISTA_FEAT_ID) ? 3 : 0;
}
