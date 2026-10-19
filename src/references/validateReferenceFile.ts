import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import { createBlankCharacter } from "../domain/character.js";
import { TALENT_OPPORTUNITY_KINDS, type TalentOpportunityKind } from "../domain/characterBuild.js";
import { BACKGROUND_IDS, CLASS_IDS, SPECIES_IDS, type BackgroundId, type ClassId } from "../domain/ids.js";
import { classes } from "../data/classes.js";
import { DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID } from "../data/features/epicBoons.js";
import { ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID } from "../data/features/feats.js";
import { subclasses } from "../data/subclasses.js";
import { hasConjuracaoFeature } from "../rules/epicBoons.js";
import { BACKGROUND_ORIGIN_FEAT_ID, getGeneralFeatPrerequisite, isFeatRepeatable } from "../rules/feats.js";
import {
  APPROVED_SYNTHETIC_GENERATION_RULES,
  REFERENCE_FORMAT_VERSION,
  REFERENCE_SOURCE_KINDS,
  type NormalizedReferenceAcquisition,
  type NormalizedReferenceCharacter,
  type NormalizedReferenceCitation,
  type NormalizedReferenceDataset,
  type NormalizedReferenceMention,
  type ReferenceSourceKind,
} from "./referenceFormat.js";
import { getTalentOpportunitySlots, TALENT_CATALOG_IDS } from "./talentOpportunitySlots.js";

/**
 * Validação de um arquivo de referências (fonte "IMPLEMENTAR
 * RECOMENDAÇÕES DE TALENTOS" §3/§5): distingue o que é INVÁLIDO (id
 * inexistente, incompatibilidade comprovada pelas regras — o arquivo
 * inteiro é rejeitado, nada é gerado) do que é só INSUFICIENTE (a fonte
 * não informa algo — o registro entra, mas só participa das comparações
 * para as quais tem dados; ou, quando nem isso é possível, a aquisição
 * é ignorada com aviso). Nunca completa um dado faltante.
 */

export type ReferenceIssueSeverity = "invalid" | "insufficient";

export interface ReferenceIssue {
  severity: ReferenceIssueSeverity;
  /** Caminho no JSON (ex.: `characters[2].acquisitions[0].talentId`). */
  path: string;
  message: string;
}

export interface ReferenceValidationResult {
  /** `true` quando não há nenhum problema `invalid` — só então `dataset` é preenchido. */
  ok: boolean;
  dataset: NormalizedReferenceDataset | null;
  issues: ReferenceIssue[];
}

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

class IssueCollector {
  readonly issues: ReferenceIssue[] = [];
  invalid(path: string, message: string): void {
    this.issues.push({ severity: "invalid", path, message });
  }
  insufficient(path: string, message: string): void {
    this.issues.push({ severity: "insufficient", path, message });
  }
  /** Rejeita campos desconhecidos — um erro de digitação (ex.: `abilityScoreBefore`) nunca vira silenciosamente "dado ausente". */
  onlyKnownKeys(value: JsonObject, allowed: readonly string[], path: string): void {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) this.invalid(`${path}.${key}`, `Campo desconhecido "${key}". Campos aceitos: ${allowed.join(", ")}.`);
    }
  }
}

function optionalString(value: unknown, path: string, issues: IssueCollector): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    issues.invalid(path, "Deve ser texto ou null.");
    return null;
  }
  return value.trim() || null;
}

function validateSource(raw: unknown, issues: IssueCollector): NormalizedReferenceDataset["source"] | null {
  if (!isObject(raw)) {
    issues.invalid("source", "Obrigatório: objeto com os dados da fonte.");
    return null;
  }
  issues.onlyKnownKeys(raw, ["id", "title", "kind", "citation", "accessedAt", "independenceGroup", "contentType", "synthetic"], "source");

  const sourceId = typeof raw.id === "string" && SLUG.test(raw.id) ? raw.id : null;
  if (!sourceId) issues.invalid("source.id", "Obrigatório: identificador estável com minúsculas, números e hífens (ex.: \"guia-guerreiro-2025\").");
  if (!isNonEmptyString(raw.title)) issues.invalid("source.title", "Obrigatório: título da fonte.");
  if (!REFERENCE_SOURCE_KINDS.includes(raw.kind as ReferenceSourceKind)) {
    issues.invalid("source.kind", `Obrigatório: um de ${REFERENCE_SOURCE_KINDS.join(", ")}.`);
  }
  if (!isNonEmptyString(raw.citation)) issues.invalid("source.citation", "Obrigatório: URL ou referência de onde o conteúdo foi extraído.");
  const accessedAt = optionalString(raw.accessedAt, "source.accessedAt", issues);
  if (accessedAt !== null && !ISO_DATE.test(accessedAt)) issues.invalid("source.accessedAt", "Use o formato AAAA-MM-DD.");
  if (!isNonEmptyString(raw.independenceGroup)) {
    issues.invalid("source.independenceGroup", "Obrigatório: grupo de independência (fontes que copiam/republicam o mesmo conteúdo usam o mesmo grupo).");
  }

  let generationRuleId: string | null = null;
  let derivedFromSourceIds: string[] = [];
  if (raw.contentType === "extracted") {
    if (raw.synthetic !== undefined && raw.synthetic !== null) issues.invalid("source.synthetic", "Só existe para contentType \"synthetic\".");
  } else if (raw.contentType === "synthetic") {
    const synthetic = raw.synthetic;
    if (!isObject(synthetic)) {
      issues.invalid("source.synthetic", "Obrigatório para conteúdo sintético: { generationRuleId, derivedFromSourceIds }.");
    } else {
      issues.onlyKnownKeys(synthetic, ["generationRuleId", "derivedFromSourceIds"], "source.synthetic");
      generationRuleId = typeof synthetic.generationRuleId === "string" ? synthetic.generationRuleId : null;
      if (!generationRuleId || !APPROVED_SYNTHETIC_GENERATION_RULES.includes(generationRuleId)) {
        issues.invalid(
          "source.synthetic.generationRuleId",
          APPROVED_SYNTHETIC_GENERATION_RULES.length === 0
            ? "Nenhuma regra de geração sintética foi aprovada ainda — conteúdo sintético não pode ser importado nesta etapa."
            : `Regra de geração não aprovada. Aprovadas: ${APPROVED_SYNTHETIC_GENERATION_RULES.join(", ")}.`,
        );
      }
      const derived = synthetic.derivedFromSourceIds;
      if (!Array.isArray(derived) || derived.length === 0 || !derived.every((id) => typeof id === "string" && SLUG.test(id))) {
        issues.invalid("source.synthetic.derivedFromSourceIds", "Obrigatório: lista não vazia de ids das fontes extraídas de que o conteúdo deriva.");
      } else {
        derivedFromSourceIds = derived as string[];
      }
    }
  } else {
    issues.invalid("source.contentType", "Obrigatório: \"extracted\" ou \"synthetic\".");
  }

  if (!sourceId) return null;
  return {
    sourceId,
    title: String(raw.title ?? "").trim(),
    kind: raw.kind as ReferenceSourceKind,
    citation: String(raw.citation ?? "").trim(),
    accessedAt,
    independenceGroup: String(raw.independenceGroup ?? "").trim(),
    contentType: raw.contentType as "extracted" | "synthetic",
    generationRuleId,
    derivedFromSourceIds,
  };
}

function validateAbilityScores(raw: unknown, path: string, issues: IssueCollector): Record<AbilityKey, number> | null {
  if (raw === undefined || raw === null) return null;
  if (!isObject(raw)) {
    issues.invalid(path, "Deve ser um objeto com FOR, DEX, CON, INT, SAB e CAR, ou null se a fonte não informar.");
    return null;
  }
  issues.onlyKnownKeys(raw, ABILITY_KEYS, path);
  const missing = ABILITY_KEYS.filter((key) => !isIntegerInRange(raw[key], 1, 30));
  if (missing.length > 0) {
    issues.invalid(path, `Informe os 6 atributos como inteiros de 1 a 30 (problema em: ${missing.join(", ")}). Se a fonte não trouxer todos, use null.`);
    return null;
  }
  return Object.fromEntries(ABILITY_KEYS.map((key) => [key, raw[key] as number])) as Record<AbilityKey, number>;
}

function isSubclassOf(classId: ClassId, subclassId: string): boolean {
  return (subclasses[classId] ?? []).some((subclass) => subclass.fullName === subclassId);
}

/** Se a classe/subclasse possui a característica Conjuração em algum nível ≤ `level` — mesma regra de `rules/epicBoons.ts#hasConjuracaoFeature`. */
function hasConjuracao(classId: ClassId, subclassId: string | null, level: number): boolean {
  return hasConjuracaoFeature({ ...createBlankCharacter("reference-validation-probe"), classId, subclassId, level });
}

interface CharacterContext {
  path: string;
  classId: ClassId;
  subclassId: string | null;
  speciesId: string | null;
  level: number;
}

function validateAcquisition(raw: unknown, path: string, character: CharacterContext, issues: IssueCollector): NormalizedReferenceAcquisition | null {
  if (!isObject(raw)) {
    issues.invalid(path, "Cada aquisição deve ser um objeto.");
    return null;
  }
  issues.onlyKnownKeys(raw, ["opportunityKind", "level", "talentId", "abilityScoresBefore", "sourceLocation"], path);

  const kind = TALENT_OPPORTUNITY_KINDS.includes(raw.opportunityKind as TalentOpportunityKind) ? (raw.opportunityKind as TalentOpportunityKind) : null;
  if (!kind) {
    issues.invalid(`${path}.opportunityKind`, `Obrigatório: um de ${TALENT_OPPORTUNITY_KINDS.join(", ")}.`);
    return null;
  }
  const talentId = typeof raw.talentId === "string" ? raw.talentId : "";
  const talentKnown = TALENT_CATALOG_IDS[kind].has(talentId);
  if (!talentKnown) issues.invalid(`${path}.talentId`, `"${talentId}" não existe no catálogo de ${kind}.`);

  const abilityScores = validateAbilityScores(raw.abilityScoresBefore, `${path}.abilityScoresBefore`, issues);
  const sourceLocation = optionalString(raw.sourceLocation, `${path}.sourceLocation`, issues);

  let level: number | null;
  if (kind === "originFeat") {
    if (raw.level !== null && raw.level !== undefined) issues.invalid(`${path}.level`, "Talento de Origem é escolhido na criação: use level null.");
    level = null;
  } else {
    if (!isIntegerInRange(raw.level, 1, 20)) {
      issues.invalid(`${path}.level`, "Obrigatório: nível inteiro de 1 a 20 em que a escolha foi feita.");
      return null;
    }
    level = raw.level;
    if (level > character.level) issues.invalid(`${path}.level`, `Escolha no nível ${level}, mas o personagem é de nível ${character.level}.`);
  }

  // Oportunidade existe para esta classe/subclasse/espécie?
  const slots = getTalentOpportunitySlots(character.classId).filter((slot) => slot.kind === kind && slot.level === level);
  if (slots.length === 0) {
    issues.invalid(`${path}.level`, `A classe ${character.classId} não tem oportunidade de ${kind} no nível ${level ?? "de criação"}.`);
    return null;
  }
  if (kind === "originFeat") {
    if (character.speciesId === null) {
      issues.insufficient(path, "Espécie não informada: não dá para confirmar que foi a escolha voluntária do Humano — aquisição ignorada.");
      return null;
    }
    if (character.speciesId !== "humano") {
      issues.invalid(path, `Só o Humano escolhe um Talento de Origem na espécie (espécie informada: ${character.speciesId}).`);
      return null;
    }
  }
  const classSlot = slots.find((slot) => slot.requiredSubclassId === null);
  let slot = classSlot;
  if (!slot) {
    if (character.subclassId !== null) {
      slot = slots.find((candidate) => candidate.requiredSubclassId === character.subclassId);
      if (!slot) {
        issues.invalid(path, `Esta oportunidade só existe para ${slots.map((s) => s.requiredSubclassId).join("/")}, não para ${character.subclassId}.`);
        return null;
      }
    } else {
      slot = slots[0];
      issues.insufficient(path, `Subclasse não informada (esta oportunidade só existe para ${slots.map((s) => s.requiredSubclassId).join("/")}).`);
    }
  }

  // Pré-requisitos — só rejeita o que é COMPROVADAMENTE incompatível.
  if (talentKnown && kind === "generalFeat") {
    const prerequisite = getGeneralFeatPrerequisite(talentId);
    if (prerequisite?.abilityAtLeast13) {
      if (abilityScores === null) {
        issues.insufficient(path, `Pré-requisito de atributo de "${talentId}" não verificável (atributos não informados).`);
      } else if (!prerequisite.abilityAtLeast13.some((ability) => abilityScores[ability] >= 13)) {
        issues.invalid(path, `"${talentId}" exige ${prerequisite.abilityAtLeast13.join(" ou ")} 13+ antes da escolha, e os atributos informados não atendem.`);
      }
    }
  }
  if (talentKnown && kind === "epicBoon" && talentId === DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID && level !== null) {
    if (!hasConjuracao(character.classId, character.subclassId, level)) {
      const anySubclassHasIt = (subclasses[character.classId] ?? []).some((subclass) => hasConjuracao(character.classId, subclass.fullName, level));
      if (character.subclassId !== null || !anySubclassHasIt) {
        issues.invalid(path, "Dádiva da Recordação de Magia exige a característica Conjuração, que esta classe/subclasse não tem.");
      } else {
        issues.insufficient(path, "Dádiva da Recordação de Magia: Conjuração depende da subclasse, que não foi informada.");
      }
    }
  }

  return {
    opportunityId: slot.opportunityId,
    opportunityKind: kind,
    talentId,
    level,
    subclassId: level !== null && level >= 3 ? character.subclassId : null,
    abilityScores,
    sourceLocation,
  };
}

/** Treinamento em armadura exigido por um Talento Geral — comprovado pela classe ou por uma aquisição ANTERIOR do próprio registro; caso contrário, não verificável (pode vir da subclasse). */
function checkArmorPrerequisites(character: CharacterContext, acquisitions: NormalizedReferenceAcquisition[], issues: IssueCollector): void {
  acquisitions.forEach((acquisition, index) => {
    if (acquisition.opportunityKind !== "generalFeat") return;
    const category = getGeneralFeatPrerequisite(acquisition.talentId)?.armorTraining;
    if (!category) return;
    if (classes[character.classId].armorProficiencies[category]) return;
    const earlierHeavy =
      category === "heavy" &&
      acquisitions.some((other) => other.talentId === ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID && other.level !== null && acquisition.level !== null && other.level < acquisition.level);
    if (earlierHeavy) return;
    issues.insufficient(
      `${character.path}.acquisitions[${index}]`,
      `Pré-requisito de treinamento em armadura (${category}) de "${acquisition.talentId}" não verificável pela classe — pode vir da subclasse.`,
    );
  });
}

/** Repetições comprovadamente ilegais dentro de UM personagem: mesma oportunidade duas vezes, talento não repetível duas vezes (inclusive o do Antecedente), mesmo Estilo de Luta duas vezes. */
function checkRepetitions(
  character: CharacterContext,
  backgroundId: BackgroundId | null,
  acquisitions: NormalizedReferenceAcquisition[],
  issues: IssueCollector,
): void {
  const opportunities = new Set<string>();
  for (const acquisition of acquisitions) {
    if (opportunities.has(acquisition.opportunityId)) {
      issues.invalid(character.path, `Duas escolhas para a mesma oportunidade (${acquisition.opportunityId}).`);
    }
    opportunities.add(acquisition.opportunityId);
  }

  const feats = acquisitions.filter((a) => a.opportunityKind === "originFeat" || a.opportunityKind === "generalFeat").map((a) => a.talentId);
  if (backgroundId) feats.push(BACKGROUND_ORIGIN_FEAT_ID[backgroundId]);
  const seenFeats = new Set<string>();
  for (const featId of feats) {
    if (seenFeats.has(featId) && !isFeatRepeatable(featId)) {
      issues.invalid(character.path, `"${featId}" não é repetível e aparece mais de uma vez (contando o talento do Antecedente).`);
    }
    seenFeats.add(featId);
  }

  const styles = acquisitions.filter((a) => a.opportunityKind === "fightingStyle").map((a) => a.talentId);
  if (new Set(styles).size !== styles.length) issues.invalid(character.path, "O mesmo Estilo de Luta aparece mais de uma vez.");
}

function validateCharacter(
  raw: unknown,
  path: string,
  sourceId: string,
  issues: IssueCollector,
): { character: NormalizedReferenceCharacter | null; citation: NormalizedReferenceCitation | null } {
  const none = { character: null, citation: null };
  if (!isObject(raw)) {
    issues.invalid(path, "Cada personagem deve ser um objeto.");
    return none;
  }
  const key = typeof raw.key === "string" && SLUG.test(raw.key) ? raw.key : null;
  if (!key) issues.invalid(`${path}.key`, "Obrigatório: chave estável dentro da fonte (minúsculas, números e hífens).");

  if (raw.sameAs !== undefined && raw.sameAs !== null) {
    issues.onlyKnownKeys(raw, ["key", "sameAs", "sourceLocation"], path);
    const sameAs = raw.sameAs;
    if (!isObject(sameAs) || typeof sameAs.sourceId !== "string" || !SLUG.test(sameAs.sourceId) || typeof sameAs.characterKey !== "string" || !SLUG.test(sameAs.characterKey)) {
      issues.invalid(`${path}.sameAs`, "Use { \"sourceId\": \"…\", \"characterKey\": \"…\" } do personagem original já importado.");
      return none;
    }
    issues.onlyKnownKeys(sameAs, ["sourceId", "characterKey"], `${path}.sameAs`);
    if (sameAs.sourceId === sourceId) {
      issues.invalid(`${path}.sameAs`, "Repetição dentro da MESMA fonte: remova a duplicata em vez de usar sameAs.");
      return none;
    }
    if (!key) return none;
    return {
      character: null,
      citation: {
        characterKey: key,
        canonicalCharacterId: `${sameAs.sourceId}/${sameAs.characterKey}`,
        sourceLocation: optionalString(raw.sourceLocation, `${path}.sourceLocation`, issues),
      },
    };
  }

  issues.onlyKnownKeys(raw, ["key", "sameAs", "sourceLocation", "classId", "subclassId", "speciesId", "backgroundId", "level", "acquisitions"], path);
  const classId = CLASS_IDS.includes(raw.classId as ClassId) ? (raw.classId as ClassId) : null;
  if (!classId) issues.invalid(`${path}.classId`, `Obrigatório: id de classe do catálogo (${CLASS_IDS.join(", ")}).`);
  const level = isIntegerInRange(raw.level, 1, 20) ? raw.level : null;
  if (level === null) issues.invalid(`${path}.level`, "Obrigatório: nível do personagem (1 a 20).");

  const subclassId = optionalString(raw.subclassId, `${path}.subclassId`, issues);
  if (classId && subclassId !== null && !isSubclassOf(classId, subclassId)) {
    issues.invalid(`${path}.subclassId`, `"${subclassId}" não é subclasse de ${classId}. Aceitas: ${(subclasses[classId] ?? []).map((s) => s.fullName).join(", ")}.`);
  }
  if (subclassId !== null && level !== null && level < 3) issues.invalid(`${path}.subclassId`, "Subclasse só existe a partir do nível 3.");

  const speciesId = optionalString(raw.speciesId, `${path}.speciesId`, issues);
  if (speciesId !== null && !(SPECIES_IDS as readonly string[]).includes(speciesId)) {
    issues.invalid(`${path}.speciesId`, `Espécie inexistente. Aceitas: ${SPECIES_IDS.join(", ")}.`);
  }
  const backgroundId = optionalString(raw.backgroundId, `${path}.backgroundId`, issues);
  if (backgroundId !== null && !(BACKGROUND_IDS as readonly string[]).includes(backgroundId)) {
    issues.invalid(`${path}.backgroundId`, `Antecedente inexistente. Aceitos: ${BACKGROUND_IDS.join(", ")}.`);
  }
  optionalString(raw.sourceLocation, `${path}.sourceLocation`, issues);

  if (!Array.isArray(raw.acquisitions)) {
    issues.invalid(`${path}.acquisitions`, "Obrigatório: lista de escolhas de talento do personagem.");
    return none;
  }
  if (!key || !classId || level === null) return none;

  const context: CharacterContext = { path, classId, subclassId, speciesId, level };
  const acquisitions = raw.acquisitions
    .map((acquisition, index) => validateAcquisition(acquisition, `${path}.acquisitions[${index}]`, context, issues))
    .filter((acquisition): acquisition is NormalizedReferenceAcquisition => acquisition !== null);

  checkRepetitions(context, (backgroundId as BackgroundId | null) ?? null, acquisitions, issues);
  checkArmorPrerequisites(context, acquisitions, issues);
  if (acquisitions.length === 0) issues.insufficient(path, "Nenhuma escolha de talento utilizável — o personagem não contribui para nenhuma contagem.");
  if (subclassId === null && acquisitions.some((acquisition) => acquisition.level !== null && acquisition.level >= 3)) {
    issues.insufficient(path, "Subclasse não informada: as escolhas a partir do nível 3 só entram em comparações sem subclasse.");
  }

  return {
    character: {
      characterId: `${sourceId}/${key}`,
      characterKey: key,
      classId,
      subclassId,
      speciesId,
      backgroundId,
      level,
      acquisitions,
    },
    citation: null,
  };
}

function validateMention(raw: unknown, path: string, issues: IssueCollector): NormalizedReferenceMention | null {
  if (!isObject(raw)) {
    issues.invalid(path, "Cada menção deve ser um objeto.");
    return null;
  }
  issues.onlyKnownKeys(raw, ["key", "opportunityKind", "talentId", "classId", "subclassId", "level", "sourceLocation"], path);
  const key = typeof raw.key === "string" && SLUG.test(raw.key) ? raw.key : null;
  if (!key) issues.invalid(`${path}.key`, "Obrigatório: chave estável dentro da fonte (minúsculas, números e hífens).");
  const kind = TALENT_OPPORTUNITY_KINDS.includes(raw.opportunityKind as TalentOpportunityKind) ? (raw.opportunityKind as TalentOpportunityKind) : null;
  if (!kind) issues.invalid(`${path}.opportunityKind`, `Obrigatório: um de ${TALENT_OPPORTUNITY_KINDS.join(", ")}.`);
  const talentId = typeof raw.talentId === "string" ? raw.talentId : "";
  if (kind && !TALENT_CATALOG_IDS[kind].has(talentId)) issues.invalid(`${path}.talentId`, `"${talentId}" não existe no catálogo de ${kind}.`);

  const classIdRaw = optionalString(raw.classId, `${path}.classId`, issues);
  const classId = classIdRaw !== null && CLASS_IDS.includes(classIdRaw as ClassId) ? (classIdRaw as ClassId) : null;
  if (classIdRaw !== null && !classId) issues.invalid(`${path}.classId`, "Classe inexistente.");
  const subclassId = optionalString(raw.subclassId, `${path}.subclassId`, issues);
  if (subclassId !== null && (!classId || !isSubclassOf(classId, subclassId))) issues.invalid(`${path}.subclassId`, "Subclasse inexistente para a classe informada.");
  let level: number | null = null;
  if (raw.level !== undefined && raw.level !== null) {
    if (!isIntegerInRange(raw.level, 1, 20) || kind === "originFeat") issues.invalid(`${path}.level`, "Nível inteiro de 1 a 20 (ou null; sempre null para Talento de Origem).");
    else level = raw.level;
  }
  if (classId && kind && kind !== "originFeat" && level !== null && !getTalentOpportunitySlots(classId).some((slot) => slot.kind === kind && slot.level === level)) {
    issues.invalid(`${path}.level`, `A classe ${classId} não tem oportunidade de ${kind} no nível ${level}.`);
  }
  if (!key || !kind) return null;
  return { mentionKey: key, opportunityKind: kind, talentId, classId, subclassId, level, sourceLocation: optionalString(raw.sourceLocation, `${path}.sourceLocation`, issues) };
}

/** Valida e normaliza o conteúdo (já parseado) de um arquivo de referências. */
export function validateReferenceFile(raw: unknown): ReferenceValidationResult {
  const issues = new IssueCollector();
  if (!isObject(raw)) {
    issues.invalid("$", "O arquivo deve conter um objeto JSON.");
    return { ok: false, dataset: null, issues: issues.issues };
  }
  issues.onlyKnownKeys(raw, ["formatVersion", "source", "characters", "mentions"], "$");
  if (raw.formatVersion !== REFERENCE_FORMAT_VERSION) issues.invalid("formatVersion", `Use ${REFERENCE_FORMAT_VERSION}.`);

  const source = validateSource(raw.source, issues);
  const characters: NormalizedReferenceCharacter[] = [];
  const citations: NormalizedReferenceCitation[] = [];
  const mentions: NormalizedReferenceMention[] = [];

  if (raw.characters !== undefined && !Array.isArray(raw.characters)) issues.invalid("characters", "Deve ser uma lista.");
  if (raw.mentions !== undefined && !Array.isArray(raw.mentions)) issues.invalid("mentions", "Deve ser uma lista.");
  const rawCharacters = Array.isArray(raw.characters) ? raw.characters : [];
  const rawMentions = Array.isArray(raw.mentions) ? raw.mentions : [];
  if (rawCharacters.length === 0 && rawMentions.length === 0) issues.insufficient("$", "A fonte não traz nenhum personagem nem menção.");

  const characterKeys = new Set<string>();
  rawCharacters.forEach((rawCharacter, index) => {
    const path = `characters[${index}]`;
    const { character, citation } = validateCharacter(rawCharacter, path, source?.sourceId ?? "", issues);
    const key = character?.characterKey ?? citation?.characterKey;
    if (key) {
      if (characterKeys.has(key)) issues.invalid(`${path}.key`, `Chave "${key}" repetida nesta fonte.`);
      characterKeys.add(key);
    }
    if (character) characters.push(character);
    if (citation) citations.push(citation);
  });

  const mentionKeys = new Set<string>();
  rawMentions.forEach((rawMention, index) => {
    const mention = validateMention(rawMention, `mentions[${index}]`, issues);
    if (!mention) return;
    if (mentionKeys.has(mention.mentionKey)) issues.invalid(`mentions[${index}].key`, `Chave "${mention.mentionKey}" repetida nesta fonte.`);
    mentionKeys.add(mention.mentionKey);
    mentions.push(mention);
  });

  const ok = source !== null && !issues.issues.some((issue) => issue.severity === "invalid");
  return { ok, dataset: ok ? { source: source!, characters, citations, mentions } : null, issues: issues.issues };
}
