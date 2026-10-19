import type { NormalizedReferenceDataset } from "./referenceFormat.js";

/**
 * Gera o SQL de importação de UMA fonte já validada, para colar no SQL
 * Editor do Supabase (roda como `postgres`, que ignora RLS — nenhuma
 * chave privilegiada sai do painel). Idempotente: reimportar o mesmo
 * arquivo atualiza as mesmas linhas pelas chaves determinísticas
 * (`source_id`, `{source_id}/{chave}`, `opportunity_id`, chave da
 * menção/citação) e apaga o que deixou de existir no arquivo — nunca
 * duplica. Tudo numa transação: se qualquer comando falhar (ex.: `sameAs`
 * apontando para um personagem ainda não importado), nada é gravado.
 */

function literal(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${value.replace(/'/g, "''")}'`;
}

function textArray(values: readonly string[]): string {
  return values.length === 0 ? "'{}'::text[]" : `array[${values.map(literal).join(", ")}]::text[]`;
}

function jsonb(value: unknown): string {
  return value === null ? "null" : `${literal(JSON.stringify(value))}::jsonb`;
}

function tuple(values: readonly string[]): string {
  return `(${values.join(", ")})`;
}

export function referenceDatasetToSql(dataset: NormalizedReferenceDataset): string {
  const { source } = dataset;
  const sourceId = literal(source.sourceId);
  const lines: string[] = [];

  lines.push(`-- Importação da fonte de referência ${source.sourceId} (${source.contentType})`);
  lines.push(`-- Gerado por scripts/reference-import.ts — ${dataset.characters.length} personagem(ns), ${dataset.citations.length} citação(ões), ${dataset.mentions.length} menção(ões).`);
  lines.push("begin;");
  lines.push("");

  lines.push(
    `insert into reference_sources (source_id, title, kind, citation, accessed_at, independence_group, content_type, generation_rule_id, derived_from_source_ids, imported_at)`,
    `values (${[
      sourceId,
      literal(source.title),
      literal(source.kind),
      literal(source.citation),
      source.accessedAt === null ? "null" : `${literal(source.accessedAt)}::date`,
      literal(source.independenceGroup),
      literal(source.contentType),
      literal(source.generationRuleId),
      textArray(source.derivedFromSourceIds),
      "now()",
    ].join(", ")})`,
    `on conflict (source_id) do update set title = excluded.title, kind = excluded.kind, citation = excluded.citation, accessed_at = excluded.accessed_at,`,
    `  independence_group = excluded.independence_group, content_type = excluded.content_type, generation_rule_id = excluded.generation_rule_id,`,
    `  derived_from_source_ids = excluded.derived_from_source_ids, imported_at = now();`,
    "",
  );

  // Personagens: remove os que saíram do arquivo (cascata leva as aquisições), depois upsert.
  const characterIds = dataset.characters.map((character) => literal(character.characterId));
  lines.push(
    characterIds.length === 0
      ? `delete from reference_characters where source_id = ${sourceId};`
      : `delete from reference_characters where source_id = ${sourceId} and character_id not in ${tuple(characterIds)};`,
  );
  if (dataset.characters.length > 0) {
    lines.push(
      "insert into reference_characters (character_id, source_id, character_key, class_id, subclass_id, species_id, background_id, level) values",
      dataset.characters
        .map((character) =>
          `  ${tuple([
            literal(character.characterId),
            sourceId,
            literal(character.characterKey),
            literal(character.classId),
            literal(character.subclassId),
            literal(character.speciesId),
            literal(character.backgroundId),
            literal(character.level),
          ])}`,
        )
        .join(",\n"),
      "on conflict (character_id) do update set class_id = excluded.class_id, subclass_id = excluded.subclass_id, species_id = excluded.species_id,",
      "  background_id = excluded.background_id, level = excluded.level;",
    );
  }
  lines.push("");

  // Aquisições: remove as que saíram de personagens que continuam, depois upsert.
  const acquisitionKeys = dataset.characters.flatMap((character) =>
    character.acquisitions.map((acquisition) => tuple([literal(character.characterId), literal(acquisition.opportunityId)])),
  );
  lines.push(
    acquisitionKeys.length === 0
      ? `delete from reference_acquisitions ra using reference_characters c where ra.character_id = c.character_id and c.source_id = ${sourceId};`
      : `delete from reference_acquisitions ra using reference_characters c where ra.character_id = c.character_id and c.source_id = ${sourceId}\n  and (ra.character_id, ra.opportunity_id) not in ${tuple(acquisitionKeys)};`,
  );
  if (acquisitionKeys.length > 0) {
    lines.push(
      "insert into reference_acquisitions (character_id, opportunity_id, opportunity_kind, talent_id, acquisition_level, subclass_id, ability_scores, source_location) values",
      dataset.characters
        .flatMap((character) =>
          character.acquisitions.map(
            (acquisition) =>
              `  ${tuple([
                literal(character.characterId),
                literal(acquisition.opportunityId),
                literal(acquisition.opportunityKind),
                literal(acquisition.talentId),
                literal(acquisition.level),
                literal(acquisition.subclassId),
                jsonb(acquisition.abilityScores),
                literal(acquisition.sourceLocation),
              ])}`,
          ),
        )
        .join(",\n"),
      "on conflict (character_id, opportunity_id) do update set opportunity_kind = excluded.opportunity_kind, talent_id = excluded.talent_id,",
      "  acquisition_level = excluded.acquisition_level, subclass_id = excluded.subclass_id, ability_scores = excluded.ability_scores, source_location = excluded.source_location;",
    );
  }
  lines.push("");

  // Citações (personagens republicados — nunca contados de novo).
  const citationKeys = dataset.citations.map((citation) => literal(citation.characterKey));
  lines.push(
    citationKeys.length === 0
      ? `delete from reference_character_citations where source_id = ${sourceId};`
      : `delete from reference_character_citations where source_id = ${sourceId} and character_key not in ${tuple(citationKeys)};`,
  );
  if (dataset.citations.length > 0) {
    lines.push(
      "insert into reference_character_citations (source_id, character_key, canonical_character_id, source_location) values",
      dataset.citations
        .map((citation) => `  ${tuple([sourceId, literal(citation.characterKey), literal(citation.canonicalCharacterId), literal(citation.sourceLocation)])}`)
        .join(",\n"),
      "on conflict (source_id, character_key) do update set canonical_character_id = excluded.canonical_character_id, source_location = excluded.source_location;",
    );
  }
  lines.push("");

  // Menções parciais (nunca contadas como personagem).
  const mentionKeys = dataset.mentions.map((mention) => literal(mention.mentionKey));
  lines.push(
    mentionKeys.length === 0
      ? `delete from reference_mentions where source_id = ${sourceId};`
      : `delete from reference_mentions where source_id = ${sourceId} and mention_key not in ${tuple(mentionKeys)};`,
  );
  if (dataset.mentions.length > 0) {
    lines.push(
      "insert into reference_mentions (source_id, mention_key, opportunity_kind, class_id, subclass_id, acquisition_level, talent_id, source_location) values",
      dataset.mentions
        .map(
          (mention) =>
            `  ${tuple([
              sourceId,
              literal(mention.mentionKey),
              literal(mention.opportunityKind),
              literal(mention.classId),
              literal(mention.subclassId),
              literal(mention.level),
              literal(mention.talentId),
              literal(mention.sourceLocation),
            ])}`,
        )
        .join(",\n"),
      "on conflict (source_id, mention_key) do update set opportunity_kind = excluded.opportunity_kind, class_id = excluded.class_id, subclass_id = excluded.subclass_id,",
      "  acquisition_level = excluded.acquisition_level, talent_id = excluded.talent_id, source_location = excluded.source_location;",
    );
  }
  lines.push("");
  lines.push("commit;");
  return `${lines.join("\n")}\n`;
}

/** SQL que remove UMA fonte inteira (cascata: personagens, aquisições, citações e menções dela). */
export function deleteReferenceSourceSql(sourceId: string): string {
  return `-- Remove a fonte de referência ${sourceId} e tudo que veio dela\ndelete from reference_sources where source_id = ${literal(sourceId)};\n`;
}
