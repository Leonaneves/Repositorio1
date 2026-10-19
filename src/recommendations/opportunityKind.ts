import type { TalentAcquisitionRecord, TalentOpportunityKind } from "../domain/characterBuild.js";
import { fightingStylesByName } from "../data/fightingStyles.js";
import { epicBoonsByName } from "../data/features/epicBoons.js";

/** Sufixo do id da `FeatureChoice` de Dádiva Épica (`data/features/classes.ts#getEpicBoonChoiceId`: `{classId}-dadiva-epica-escolha`). */
const EPIC_BOON_CHOICE_SUFFIX = "-dadiva-epica-escolha";

/**
 * Tipo de oportunidade de um registro gravado — usa `opportunityKind`
 * quando presente; registros gravados antes deste campo existir têm o
 * tipo derivado de `opportunityId`, que já o determina sem ambiguidade
 * (`"species"`/`"background"` → Talento de Origem, `"asi-{n}"` → Talento
 * Geral, `…-dadiva-epica-escolha` → Dádiva Épica; qualquer outro id
 * gravado por `rules/talentAcquisitionHistory.ts` é de Estilo de Luta).
 * Mesma derivação de `talent_record_opportunity_kind` no SQL (migration 0004).
 */
export function deriveOpportunityKind(record: Pick<TalentAcquisitionRecord, "opportunityId"> & { opportunityKind?: TalentOpportunityKind }): TalentOpportunityKind {
  if (record.opportunityKind) return record.opportunityKind;
  if (record.opportunityId === "species" || record.opportunityId === "background") return "originFeat";
  if (/^asi-\d+$/.test(record.opportunityId)) return "generalFeat";
  if (record.opportunityId.endsWith(EPIC_BOON_CHOICE_SUFFIX)) return "epicBoon";
  return "fightingStyle";
}

/**
 * Se uma escolha `optionPick` é de Estilo de Luta ou de Dádiva Épica,
 * pelo catálogo a que suas opções pertencem — mesmo critério de
 * `rules/talentAcquisitionHistory.ts` (pelo VALOR, nunca pela identidade
 * da `FeatureDefinition`, que varia por classe/subclasse). `null` para
 * qualquer outra escolha (ramo "Estilo de Luta ou Combatente…", truques
 * etc.), que nunca recebe recomendação.
 */
export function classifyTalentOptionPick(options: readonly string[]): Extract<TalentOpportunityKind, "fightingStyle" | "epicBoon"> | null {
  if (options.length === 0) return null;
  if (options.every((option) => option in fightingStylesByName)) return "fightingStyle";
  if (options.every((option) => option in epicBoonsByName)) return "epicBoon";
  return null;
}

/** Id de catálogo de uma opção de Estilo de Luta/Dádiva Épica exibida pelo nome — `null` se não pertencer ao catálogo do tipo. */
export function getOptionPickTalentId(kind: "fightingStyle" | "epicBoon", optionName: string): string | null {
  const entry = kind === "fightingStyle" ? fightingStylesByName[optionName] : epicBoonsByName[optionName];
  return entry ? entry.id : null;
}
