import type { AbilityKey } from "../domain/common.js";
import type { TalentOpportunityKind } from "../domain/characterBuild.js";

/**
 * Modelo DEFINITIVO do arquivo JSON de referências (fonte "IMPLEMENTAR
 * RECOMENDAÇÕES DE TALENTOS" §3/§5/§6). Um arquivo = UMA fonte. Ver
 * `reference-data/README.md` para o passo a passo e um exemplo comentado.
 *
 * Princípios:
 * - Só ids do catálogo do projeto (classe, subclasse pelo nome completo,
 *   espécie, antecedente, talento) — nunca nomes livres.
 * - O que a fonte não informa fica `null`/ausente — nunca zero, valor
 *   final ou subclasse posterior.
 * - Personagem (com aquisições) ≠ menção parcial ("o guia recomenda X
 *   para a classe Y"): menções ficam em `mentions` e nunca contam como
 *   personagem.
 * - Republicação de um personagem já importado de outra fonte entra
 *   como `sameAs`, nunca como um segundo personagem.
 */

export const REFERENCE_FORMAT_VERSION = 1;

export const REFERENCE_SOURCE_KINDS = ["guide", "article", "video", "forum", "book", "spreadsheet", "other"] as const;
export type ReferenceSourceKind = (typeof REFERENCE_SOURCE_KINDS)[number];

/**
 * Regras de geração SINTÉTICA aprovadas pelo usuário. Vazio nesta etapa
 * (fonte §6: "não gerar agora; aguardar as fontes e a aprovação das
 * regras de geração") — por isso todo arquivo `contentType: "synthetic"`
 * é rejeitado pela validação até uma regra ser aprovada e listada aqui.
 */
export const APPROVED_SYNTHETIC_GENERATION_RULES: readonly string[] = [];

export interface ReferenceFile {
  formatVersion: typeof REFERENCE_FORMAT_VERSION;
  source: ReferenceFileSource;
  characters?: ReferenceFileCharacter[];
  mentions?: ReferenceFileMention[];
}

export interface ReferenceFileSource {
  /** Identificador estável (minúsculas, números e hífens). Reimportar com o mesmo id ATUALIZA a fonte, nunca duplica. */
  id: string;
  title: string;
  kind: ReferenceSourceKind;
  /** URL ou referência bibliográfica de onde o conteúdo foi extraído. */
  citation: string;
  /** Data de acesso (AAAA-MM-DD), quando conhecida. */
  accessedAt?: string | null;
  /** Fontes que copiam/republicam o mesmo conteúdo usam o MESMO grupo — contam como uma só fonte independente. */
  independenceGroup: string;
  /** "extracted" = extraído de fonte real; "synthetic" = gerado por regra aprovada (nunca misturados). */
  contentType: "extracted" | "synthetic";
  /** Obrigatório só quando `contentType` é "synthetic". */
  synthetic?: { generationRuleId: string; derivedFromSourceIds: string[] } | null;
}

export interface ReferenceFileCharacter {
  /** Identificador estável DENTRO da fonte (minúsculas, números e hífens). */
  key: string;
  /** Personagem idêntico a um já importado de OUTRA fonte (cópia/republicação) — só `key`, `sameAs` e `sourceLocation` são aceitos nesse caso. */
  sameAs?: { sourceId: string; characterKey: string } | null;
  sourceLocation?: string | null;
  classId?: string;
  /** Nome completo da subclasse como no catálogo (ex.: "Campeão", "Caminho do Berserker") — `null` se a fonte não informar. */
  subclassId?: string | null;
  speciesId?: string | null;
  backgroundId?: string | null;
  /** Nível do personagem como apresentado na fonte. */
  level?: number;
  acquisitions?: ReferenceFileAcquisition[];
}

export interface ReferenceFileAcquisition {
  opportunityKind: TalentOpportunityKind;
  /** Nível em que a escolha foi feita — `null` para Talento de Origem (criação). */
  level: number | null;
  talentId: string;
  /** Os 6 atributos IMEDIATAMENTE ANTES desta escolha, exatamente como a fonte informa — `null` se a fonte não informar. */
  abilityScoresBefore?: Record<AbilityKey, number> | null;
  /** Onde, na fonte, esta escolha aparece (seção, minuto do vídeo, página). */
  sourceLocation?: string | null;
}

export interface ReferenceFileMention {
  key: string;
  opportunityKind: TalentOpportunityKind;
  talentId: string;
  classId?: string | null;
  subclassId?: string | null;
  level?: number | null;
  sourceLocation?: string | null;
}

/** Resultado normalizado de um arquivo válido — o que vira SQL (`referenceToSql.ts`) e fatos de contagem (`referenceFacts.ts`). */
export interface NormalizedReferenceDataset {
  source: {
    sourceId: string;
    title: string;
    kind: ReferenceSourceKind;
    citation: string;
    accessedAt: string | null;
    independenceGroup: string;
    contentType: "extracted" | "synthetic";
    generationRuleId: string | null;
    derivedFromSourceIds: string[];
  };
  characters: NormalizedReferenceCharacter[];
  citations: NormalizedReferenceCitation[];
  mentions: NormalizedReferenceMention[];
}

export interface NormalizedReferenceCharacter {
  /** `{sourceId}/{key}` — determinístico, chave primária no banco. */
  characterId: string;
  characterKey: string;
  classId: string;
  subclassId: string | null;
  speciesId: string | null;
  backgroundId: string | null;
  level: number;
  acquisitions: NormalizedReferenceAcquisition[];
}

export interface NormalizedReferenceAcquisition {
  /** Mesma identidade de oportunidade dos registros reais (`asi-4`, `species`, id da escolha de Estilo de Luta/Dádiva Épica). */
  opportunityId: string;
  opportunityKind: TalentOpportunityKind;
  talentId: string;
  level: number | null;
  /** Subclasse NO MOMENTO da aquisição — só a partir do nível 3, e só se a fonte a informar. */
  subclassId: string | null;
  abilityScores: Record<AbilityKey, number> | null;
  sourceLocation: string | null;
}

export interface NormalizedReferenceCitation {
  characterKey: string;
  canonicalCharacterId: string;
  sourceLocation: string | null;
}

export interface NormalizedReferenceMention {
  mentionKey: string;
  opportunityKind: TalentOpportunityKind;
  talentId: string;
  classId: string | null;
  subclassId: string | null;
  level: number | null;
  sourceLocation: string | null;
}
