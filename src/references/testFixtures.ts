import type { AbilityKey } from "../domain/common.js";
import type { CharacterBuild, TalentAcquisitionRecord, TalentOpportunityKind } from "../domain/characterBuild.js";
import type { ClassId } from "../domain/ids.js";
import type { ReferenceFile, ReferenceFileAcquisition, ReferenceFileCharacter, ReferenceFileMention } from "./referenceFormat.js";

/**
 * ⚠️ SOMENTE PARA TESTES — dados FICTÍCIOS, montados só para exercitar
 * validação, importação e contagem. Nunca importados em produção, nunca
 * usados pelo app (fonte "IMPLEMENTAR RECOMENDAÇÕES DE TALENTOS" §7:
 * "não preencher a base com exemplos fictícios em produção; exemplos
 * para testes devem permanecer separados"). Toda fonte daqui tem id
 * prefixado com `teste-` e título "TESTE — fictício".
 */

export function testAbilities(scores: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10, ...scores };
}

export function testAcquisition(
  opportunityKind: TalentOpportunityKind,
  level: number | null,
  talentId: string,
  abilityScoresBefore: Record<AbilityKey, number> | null = null,
): ReferenceFileAcquisition {
  return { opportunityKind, level, talentId, abilityScoresBefore };
}

export function testCharacter(key: string, fields: Omit<ReferenceFileCharacter, "key">): ReferenceFileCharacter {
  return { key, ...fields };
}

export function testReferenceFile(
  sourceSuffix: string,
  options: {
    independenceGroup?: string;
    contentType?: "extracted" | "synthetic";
    characters?: ReferenceFileCharacter[];
    mentions?: ReferenceFileMention[];
  } = {},
): ReferenceFile {
  const id = `teste-${sourceSuffix}`;
  return {
    formatVersion: 1,
    source: {
      id,
      title: `TESTE — fictício (${sourceSuffix})`,
      kind: "other",
      citation: "fixture de teste automatizado — não é uma fonte real",
      accessedAt: null,
      independenceGroup: options.independenceGroup ?? id,
      contentType: options.contentType ?? "extracted",
    },
    characters: options.characters ?? [],
    mentions: options.mentions ?? [],
  };
}

/** Guerreiro nível 4 que escolheu `talentId` no ASI de nível 4, com os atributos ANTES da escolha (ou desconhecidos). */
export function testFighterAsi4(key: string, talentId: string, abilityScoresBefore: Record<AbilityKey, number> | null, subclassId: string | null = "Campeão"): ReferenceFileCharacter {
  return testCharacter(key, {
    classId: "guerreiro",
    subclassId,
    speciesId: null,
    backgroundId: null,
    level: 4,
    acquisitions: [testAcquisition("generalFeat", 4, talentId, abilityScoresBefore)],
  });
}

/** UUID determinístico para builds de teste (a coluna `build_id` é `uuid`). */
export function testBuildId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export interface TestUserAcquisition {
  kind: TalentOpportunityKind;
  opportunityId: string;
  level: number | null;
  talentId: string;
  subclassId?: string | null | "desconhecido";
  abilityScores?: Record<AbilityKey, number>;
  voluntary?: boolean;
  /** Simula um registro gravado antes do campo `opportunityKind` existir. */
  legacyWithoutKind?: boolean;
}

/** Build REAL de usuário (personagem fictício de teste) com aquisições já no formato gravado em `talent_acquisitions`. */
export function testUserBuild(
  n: number,
  classId: ClassId,
  acquisitions: TestUserAcquisition[],
  overrides: Partial<CharacterBuild> = {},
): CharacterBuild {
  const talentAcquisitions = acquisitions.map((acquisition) => {
    const record: TalentAcquisitionRecord = {
      talentId: acquisition.talentId,
      opportunityId: acquisition.opportunityId,
      opportunityKind: acquisition.kind,
      grantOrigin: acquisition.opportunityId === "species" ? "species" : acquisition.opportunityId === "background" ? "background" : "class",
      acquisitionLevel: acquisition.level,
      voluntary: acquisition.voluntary ?? true,
      internalChoices: {},
      abilityIncreased: null,
      context: {
        abilityScores: acquisition.abilityScores ?? testAbilities(),
        classId,
        subclassId: acquisition.subclassId ?? "desconhecido",
        level: acquisition.level,
      },
    };
    if (acquisition.legacyWithoutKind) delete (record as Partial<TalentAcquisitionRecord>).opportunityKind;
    return record;
  });
  return {
    buildId: testBuildId(n),
    origin: "user",
    status: "confirmed",
    referenceSource: null,
    level: 20,
    classId,
    subclassId: null,
    speciesId: null,
    backgroundId: null,
    abilityScores: testAbilities(),
    skillProficiencies: [],
    skillExpertise: [],
    savingThrowProficiencies: [],
    armorId: null,
    shield: false,
    spellcastingAbility: null,
    talentAcquisitions,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
