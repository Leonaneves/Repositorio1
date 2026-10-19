// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { buildToTalentChoiceFacts, countTalentChoices } from "../recommendations/countTalentChoices.js";
import type { TalentChoiceCountQuery, TalentChoiceCountRow } from "../recommendations/types.js";
import { referenceDatasetsToFacts } from "./referenceFacts.js";
import type { NormalizedReferenceDataset, ReferenceFile } from "./referenceFormat.js";
import { deleteReferenceSourceSql, referenceDatasetToSql } from "./referenceToSql.js";
import { testAbilities, testAcquisition, testBuildId, testCharacter, testFighterAsi4, testReferenceFile, testUserBuild } from "./testFixtures.js";
import { validateReferenceFile } from "./validateReferenceFile.js";

/**
 * Integração com um Postgres REAL (PGlite, em memória) — aplica as
 * migrations 0001→0004 exatamente como estão no repositório, com só o
 * mínimo do Supabase simulado (papéis `anon`/`authenticated` e
 * `auth.uid()`). Cobre: importação/reimportação sem duplicar, transação
 * desfeita em erro, bloqueio de leitura direta das referências e
 * paridade da função `get_talent_choice_counts` com a contagem em
 * memória do app.
 */

const MIGRATIONS_DIR = fileURLToPath(new URL("../../supabase/migrations/", import.meta.url));

async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`${MIGRATIONS_DIR}${file}`, "utf8"));
  }
  return db;
}

function dataset(file: ReferenceFile): NormalizedReferenceDataset {
  const result = validateReferenceFile(file);
  if (!result.ok || !result.dataset) throw new Error(JSON.stringify(result.issues, null, 2));
  return result.dataset;
}

async function count(db: PGlite, table: string): Promise<number> {
  const result = await db.query<{ n: number }>(`select count(*)::int as n from ${table}`);
  return result.rows[0].n;
}

async function insertBuild(db: PGlite, build: CharacterBuild): Promise<void> {
  const s = build.abilityScores;
  await db.query(
    `insert into character_builds (build_id, level, class_id, subclass_id, for_score, dex_score, con_score, int_score, sab_score, car_score, origin, status, talent_acquisitions)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
    [build.buildId, build.level, build.classId, build.subclassId, s.FOR, s.DEX, s.CON, s.INT, s.SAB, s.CAR, build.origin, build.status, JSON.stringify(build.talentAcquisitions)],
  );
}

interface RpcRow {
  pool: TalentChoiceCountRow["pool"];
  tier: TalentChoiceCountRow["tier"];
  talent_id: string;
  characters: number;
  independent_groups: number;
  sample_characters: number;
  sample_groups: number;
}

async function rpcCounts(db: PGlite, query: TalentChoiceCountQuery): Promise<TalentChoiceCountRow[]> {
  const result = await db.query<RpcRow>(`select * from get_talent_choice_counts($1, $2, $3, $4, $5, $6, $7)`, [
    query.opportunityKind,
    query.classId,
    query.level,
    query.subclassId,
    query.highestAbility,
    query.excludeBuildId,
    query.includeUserRecords,
  ]);
  return result.rows.map((row) => ({
    pool: row.pool,
    tier: row.tier,
    talentId: row.talent_id,
    characters: Number(row.characters),
    independentGroups: Number(row.independent_groups),
    sampleCharacters: Number(row.sample_characters),
    sampleGroups: Number(row.sample_groups),
  }));
}

function sorted(rows: TalentChoiceCountRow[]): TalentChoiceCountRow[] {
  return [...rows].sort((a, b) => `${a.pool}|${a.tier}|${a.talentId}`.localeCompare(`${b.pool}|${b.tier}|${b.talentId}`));
}

let db: PGlite;

// Um único banco (criar + migrar leva segundos); cada teste começa com as tabelas vazias.
beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

beforeEach(async () => {
  await db.exec("reset role; delete from reference_sources; delete from character_builds;");
});

describe("migrations 0001→0004", () => {
  it("aplicam numa base limpa, não inserem nenhum dado de referência e a 0004 pode ser reaplicada", { timeout: 60_000 }, async () => {
    const fresh = await createDatabase();
    for (const table of ["reference_sources", "reference_characters", "reference_acquisitions", "reference_character_citations", "reference_mentions"]) {
      expect(await count(fresh, table)).toBe(0);
    }
    await fresh.exec(readFileSync(`${MIGRATIONS_DIR}0004_talent_recommendations.sql`, "utf8"));
    expect(await count(fresh, "reference_sources")).toBe(0);
    await fresh.close();
  });
});

describe("importação de referências (SQL gerado)", () => {
  const file = () =>
    testReferenceFile("import", {
      independenceGroup: "grupo-import",
      characters: [
        testFighterAsi4("c1", "sentinela", testAbilities({ FOR: 16 })),
        testCharacter("c2", {
          classId: "guerreiro",
          subclassId: "Campeão",
          speciesId: "humano",
          level: 7,
          acquisitions: [
            testAcquisition("originFeat", null, "vigoroso"),
            testAcquisition("fightingStyle", 1, "defensivo"),
            testAcquisition("generalFeat", 4, "alerta"),
            testAcquisition("fightingStyle", 7, "arquearia"),
          ],
        }),
      ],
      mentions: [{ key: "m1", opportunityKind: "generalFeat", talentId: "resistente", classId: "guerreiro", level: null }],
    });

  it("importar o MESMO arquivo duas vezes não duplica nada", async () => {
    const sql = referenceDatasetToSql(dataset(file()));
    await db.exec(sql);
    await db.exec(sql);
    expect(await count(db, "reference_sources")).toBe(1);
    expect(await count(db, "reference_characters")).toBe(2);
    expect(await count(db, "reference_acquisitions")).toBe(5);
    expect(await count(db, "reference_mentions")).toBe(1);
  });

  it("reimportar o arquivo alterado atualiza os registros e remove o que saiu", async () => {
    await db.exec(referenceDatasetToSql(dataset(file())));
    const changed = file();
    changed.characters = [testFighterAsi4("c1", "resistente", testAbilities({ FOR: 16 }))];
    changed.mentions = [];
    await db.exec(referenceDatasetToSql(dataset(changed)));

    expect(await count(db, "reference_characters")).toBe(1);
    expect(await count(db, "reference_mentions")).toBe(0);
    const acquisitions = await db.query<{ talent_id: string }>("select talent_id from reference_acquisitions");
    expect(acquisitions.rows).toEqual([{ talent_id: "resistente" }]);
  });

  it("menção parcial e republicação (sameAs) nunca viram personagem contável", async () => {
    await db.exec(referenceDatasetToSql(dataset(file())));
    const copy = testReferenceFile("copia", { independenceGroup: "grupo-import", characters: [{ key: "c1", sameAs: { sourceId: "teste-import", characterKey: "c1" } }] });
    await db.exec(referenceDatasetToSql(dataset(copy)));
    expect(await count(db, "reference_characters")).toBe(2);
    expect(await count(db, "reference_character_citations")).toBe(1);
    const rows = await rpcCounts(db, { opportunityKind: "generalFeat", classId: "guerreiro", level: 4, subclassId: null, highestAbility: null, excludeBuildId: null, includeUserRecords: false });
    expect(rows.find((row) => row.tier === "level")!.sampleCharacters).toBe(2);
  });

  it("sameAs apontando para personagem não importado: transação inteira desfeita", async () => {
    const orphan = testReferenceFile("orfa", { characters: [testFighterAsi4("ok", "alerta", null), { key: "x", sameAs: { sourceId: "teste-inexistente", characterKey: "y" } }] });
    await expect(db.exec(referenceDatasetToSql(dataset(orphan)))).rejects.toThrow();
    await db.exec("rollback");
    expect(await count(db, "reference_sources")).toBe(0);
    expect(await count(db, "reference_characters")).toBe(0);
  });

  it("remover uma fonte apaga tudo que veio dela (cascata)", async () => {
    await db.exec(referenceDatasetToSql(dataset(file())));
    await db.exec(deleteReferenceSourceSql("teste-import"));
    for (const table of ["reference_sources", "reference_characters", "reference_acquisitions", "reference_mentions"]) {
      expect(await count(db, table)).toBe(0);
    }
  });
});

describe("acesso pela API pública", () => {
  it("anon/authenticated não leem as tabelas de referência diretamente, mas executam a função de contagem", async () => {
    await db.exec(referenceDatasetToSql(dataset(testReferenceFile("acesso", { characters: [testFighterAsi4("c1", "alerta", null)] }))));
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from reference_characters")).rejects.toThrow(/permission denied/);
      const rows = await rpcCounts(db, { opportunityKind: "generalFeat", classId: "guerreiro", level: 4, subclassId: null, highestAbility: null, excludeBuildId: null, includeUserRecords: false });
      expect(rows.length).toBeGreaterThan(0);
      await db.exec("reset role");
    }
  });
});

describe("get_talent_choice_counts × countTalentChoices (paridade SQL/app)", () => {
  const references = [
    dataset(
      testReferenceFile("p-a", {
        independenceGroup: "grupo-a",
        characters: [
          testFighterAsi4("a1", "sentinela", testAbilities({ FOR: 16 })),
          testFighterAsi4("a2", "mestre-em-armas-grandes", testAbilities({ FOR: 16 })),
          testFighterAsi4("a3", "alerta", null, null),
          testCharacter("a4", {
            classId: "guerreiro",
            subclassId: "Campeão",
            level: 8,
            acquisitions: [testAcquisition("generalFeat", 6, "habilidoso", testAbilities({ DEX: 16 })), testAcquisition("generalFeat", 8, "habilidoso", testAbilities({ DEX: 17 }))],
          }),
        ],
      }),
    ),
    dataset(testReferenceFile("p-a-copia", { independenceGroup: "grupo-a", characters: [testFighterAsi4("c1", "sentinela", testAbilities({ FOR: 16 }))] })),
    dataset(
      testReferenceFile("p-b", {
        independenceGroup: "grupo-b",
        characters: [
          testFighterAsi4("b1", "sentinela", testAbilities({ DEX: 16 })),
          testFighterAsi4("b2", "resistente", null),
          testCharacter("b3", { classId: "guerreiro", level: 1, acquisitions: [testAcquisition("fightingStyle", 1, "defensivo")] }),
        ],
      }),
    ),
  ];

  const asi4 = (talentId: string, abilities = testAbilities({ FOR: 16 })) => ({
    kind: "generalFeat" as const,
    opportunityId: "asi-4",
    level: 4,
    talentId,
    subclassId: "Campeão",
    abilityScores: abilities,
  });
  const userBuilds: CharacterBuild[] = [
    ...Array.from({ length: 22 }, (_, i) => testUserBuild(i + 1, "guerreiro", [asi4(i % 3 === 0 ? "alerta" : "sentinela")])),
    // Mesmo personagem com duas escolhas na faixa 5–10 + registro antigo sem opportunityKind.
    testUserBuild(30, "guerreiro", [
      { kind: "generalFeat", opportunityId: "asi-6", level: 6, talentId: "habilidoso", subclassId: "Campeão", legacyWithoutKind: true },
      { kind: "generalFeat", opportunityId: "asi-8", level: 8, talentId: "habilidoso", subclassId: "Campeão" },
    ]),
    testUserBuild(31, "guerreiro", [asi4("velocista")], { status: "draft" }),
    testUserBuild(32, "guerreiro", [{ kind: "originFeat", opportunityId: "background", level: null, talentId: "alerta", voluntary: false }]),
    testUserBuild(33, "guerreiro", [{ kind: "fightingStyle", opportunityId: "guerreiro-estilo-de-luta-escolha", level: 1, talentId: "arquearia", legacyWithoutKind: true }]),
  ];

  const facts = [...referenceDatasetsToFacts(references), ...userBuilds.flatMap(buildToTalentChoiceFacts)];

  const base: TalentChoiceCountQuery = {
    opportunityKind: "generalFeat",
    classId: "guerreiro",
    level: 4,
    subclassId: "Campeão",
    highestAbility: "FOR",
    excludeBuildId: null,
    includeUserRecords: true,
  };
  const queries: TalentChoiceCountQuery[] = [
    base,
    { ...base, includeUserRecords: false },
    { ...base, excludeBuildId: testBuildId(1) },
    { ...base, excludeBuildId: testBuildId(2) },
    { ...base, highestAbility: null, subclassId: null },
    { ...base, highestAbility: "DEX" },
    { ...base, level: 6, highestAbility: "DEX" },
    { ...base, level: 8, highestAbility: null },
    { ...base, opportunityKind: "fightingStyle", level: 1, subclassId: null, highestAbility: null },
    { ...base, opportunityKind: "originFeat", level: null, subclassId: null, highestAbility: null },
    { ...base, classId: "mago" },
  ];

  it.each(queries.map((query, index) => [index, query] as const))("consulta %i: mesmas linhas no banco e no app", async (_index, query) => {
    for (const reference of references) await db.exec(referenceDatasetToSql(reference));
    for (const build of userBuilds) await insertBuild(db, build);
    expect(sorted(await rpcCounts(db, query))).toEqual(sorted(countTalentChoices(facts, query)));
  });

  it("dados reais: só com p_include_user e só faixas com 20+ personagens", async () => {
    for (const build of userBuilds) await insertBuild(db, build);
    expect(await rpcCounts(db, { ...base, includeUserRecords: false })).toEqual([]);
    const rows = await rpcCounts(db, base);
    expect(rows.every((row) => row.pool === "user" && row.sampleCharacters >= 20)).toBe(true);
    expect(rows.find((row) => row.tier === "level" && row.talentId === "sentinela")!.characters).toBe(14);
    // Excluir o próprio personagem derruba a amostra para 21 — ainda >= 20.
    expect((await rpcCounts(db, { ...base, excludeBuildId: testBuildId(1) })).find((row) => row.tier === "level")!.sampleCharacters).toBe(21);
  });
});
