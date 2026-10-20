import { highestAbilityOrNull } from "../recommendations/countTalentChoices.js";
import type { TalentChoiceFact } from "../recommendations/types.js";
import type { NormalizedReferenceDataset } from "./referenceFormat.js";

/**
 * Converte fontes já validadas no formato comum de contagem — o mesmo
 * que a função SQL monta a partir das tabelas `reference_*`. Usado pela
 * implementação em memória (`InMemoryBuildStore.setReferenceFacts`) e
 * pelos testes de paridade com o SQL. Citações (`sameAs`) e menções
 * parciais nunca viram fatos: não são personagens contáveis. A mesma
 * fonte passada duas vezes vale uma só (a última), como numa reimportação.
 */
export function referenceDatasetsToFacts(datasets: readonly NormalizedReferenceDataset[]): TalentChoiceFact[] {
  const latestBySource = new Map(datasets.map((dataset) => [dataset.source.sourceId, dataset]));
  return [...latestBySource.values()].flatMap((dataset) =>
    dataset.characters.flatMap((character) =>
      character.acquisitions.map((acquisition) => ({
        pool: dataset.source.contentType === "extracted" ? ("reference_extracted" as const) : ("reference_synthetic" as const),
        characterKey: character.characterId,
        groupKey: dataset.source.independenceGroup,
        opportunityKind: acquisition.opportunityKind,
        classId: character.classId,
        subclassId: acquisition.subclassId,
        highestAbility: highestAbilityOrNull(acquisition.abilityScores),
        talentId: acquisition.talentId,
      })),
    ),
  );
}
