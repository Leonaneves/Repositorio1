/**
 * Importador de referências do recomendador de talentos.
 *
 *   npm run references -- validate reference-data/minha-fonte.json
 *   npm run references -- sql reference-data/minha-fonte.json --out minha-fonte.sql
 *   npm run references -- delete minha-fonte
 *   npm run references -- ids
 *
 * `sql` só gera o arquivo quando NÃO há nenhum problema "inválido"; o
 * SQL gerado é colado no SQL Editor do Supabase (ver reference-data/README.md).
 * Nada aqui fala com o banco nem usa chave alguma.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { BACKGROUND_IDS, CLASS_IDS, SPECIES_IDS } from "../src/domain/ids.js";
import { subclasses } from "../src/data/subclasses.js";
import { TALENT_OPPORTUNITY_KINDS } from "../src/domain/characterBuild.js";
import { TALENT_CATALOG_IDS } from "../src/references/talentOpportunitySlots.js";
import { validateReferenceFile, type ReferenceValidationResult } from "../src/references/validateReferenceFile.js";
import { deleteReferenceSourceSql, referenceDatasetToSql } from "../src/references/referenceToSql.js";

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Não foi possível ler ${path} como JSON: ${(error as Error).message}`);
    process.exit(1);
  }
}

function printReport(result: ReferenceValidationResult): void {
  const invalid = result.issues.filter((issue) => issue.severity === "invalid");
  const insufficient = result.issues.filter((issue) => issue.severity === "insufficient");
  if (invalid.length > 0) {
    console.log(`\n✗ ${invalid.length} problema(s) INVÁLIDO(S) — o arquivo não pode ser importado:`);
    for (const issue of invalid) console.log(`  - ${issue.path}: ${issue.message}`);
  }
  if (insufficient.length > 0) {
    console.log(`\n! ${insufficient.length} aviso(s) de DADOS INSUFICIENTES (o registro entra só nas comparações possíveis, ou é ignorado quando indicado):`);
    for (const issue of insufficient) console.log(`  - ${issue.path}: ${issue.message}`);
  }
  if (result.ok && result.dataset) {
    const { dataset } = result;
    const acquisitions = dataset.characters.reduce((total, character) => total + character.acquisitions.length, 0);
    console.log(
      `\n✓ Válido: fonte "${dataset.source.sourceId}" (${dataset.source.contentType}, grupo "${dataset.source.independenceGroup}") — ` +
        `${dataset.characters.length} personagem(ns), ${acquisitions} escolha(s), ${dataset.citations.length} republicação(ões), ${dataset.mentions.length} menção(ões) parcial(is).`,
    );
  }
}

const [command, ...args] = process.argv.slice(2);

if (command === "validate" || command === "sql") {
  const file = args[0];
  if (!file) {
    console.error(`Uso: ${command} <arquivo.json>${command === "sql" ? " [--out <arquivo.sql>]" : ""}`);
    process.exit(1);
  }
  const result = validateReferenceFile(readJson(file));
  printReport(result);
  if (!result.ok || !result.dataset) process.exit(1);
  if (command === "sql") {
    const sql = referenceDatasetToSql(result.dataset);
    const outIndex = args.indexOf("--out");
    if (outIndex >= 0 && args[outIndex + 1]) {
      writeFileSync(args[outIndex + 1], sql);
      console.log(`SQL gravado em ${args[outIndex + 1]}`);
    } else {
      console.log(`\n${sql}`);
    }
  }
} else if (command === "delete") {
  const sourceId = args[0];
  if (!sourceId) {
    console.error("Uso: delete <source-id>");
    process.exit(1);
  }
  console.log(deleteReferenceSourceSql(sourceId));
} else if (command === "ids") {
  console.log(`Classes: ${CLASS_IDS.join(", ")}`);
  for (const classId of CLASS_IDS) console.log(`  Subclasses de ${classId}: ${(subclasses[classId] ?? []).map((s) => s.fullName).join(", ")}`);
  console.log(`Espécies: ${SPECIES_IDS.join(", ")}`);
  console.log(`Antecedentes: ${BACKGROUND_IDS.join(", ")}`);
  for (const kind of TALENT_OPPORTUNITY_KINDS) console.log(`Talentos (${kind}): ${[...TALENT_CATALOG_IDS[kind]].join(", ")}`);
} else {
  console.error("Comandos: validate <arquivo.json> | sql <arquivo.json> [--out <arquivo.sql>] | delete <source-id> | ids");
  process.exit(1);
}
