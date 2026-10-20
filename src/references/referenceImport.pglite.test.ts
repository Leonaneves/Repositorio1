// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { buildToTalentChoiceFacts, countTalentChoices } from "../recommendations/countTalentChoices.js";
import { scoreBuildChoices, scoreTalentChoices, type BuildChoiceScoreQuery, type BuildChoiceScoreRow, type TalentChoiceScoreRow } from "../recommendations/scoring.js";
import { latestConfirmedUserBuilds } from "../repositories/inMemory/InMemoryBuildStore.js";
import type { TalentChoiceCountQuery, TalentChoiceCountRow } from "../recommendations/types.js";
import { referenceDatasetsToFacts } from "./referenceFacts.js";
import type { NormalizedReferenceDataset, ReferenceFile } from "./referenceFormat.js";
import { deleteReferenceSourceSql, referenceDatasetToSql } from "./referenceToSql.js";
import { testAbilities, testAcquisition, testBuildId, testCharacter, testFighterAsi4, testReferenceFile, testUserBuild } from "./testFixtures.js";
import { validateReferenceFile } from "./validateReferenceFile.js";

/**
 * Integração com um Postgres REAL (PGlite, em memória) — aplica as
 * migrations 0001→0010 exatamente como estão no repositório, com só o
 * mínimo do Supabase simulado (papéis `anon`/`authenticated` e
 * `auth.uid()`). Cobre: importação/reimportação sem duplicar, transação
 * desfeita em erro, bloqueio de leitura direta das referências e
 * paridade das funções `get_talent_choice_counts` e
 * `get_build_choice_counts` com a contagem em memória do app.
 */

const MIGRATIONS_DIR = fileURLToPath(new URL("../../supabase/migrations/", import.meta.url));

async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    -- Como no Supabase: objetos novos do schema public nascem legíveis/executáveis por anon/authenticated.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
    grant usage on schema public to anon, authenticated;
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
    `insert into character_builds (build_id, character_id, level, class_id, subclass_id, species_id, background_id, for_score, dex_score, con_score, int_score, sab_score, car_score, origin, status, talent_acquisitions, skill_choices, metamagic_options, invocations, maneuvers, species_lineage_id, updated_at, confirmed_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, $18, $19, $20, $21, $22, $22)`,
    [
      build.buildId,
      build.characterId,
      build.level,
      build.classId,
      build.subclassId,
      build.speciesId,
      build.backgroundId,
      s.FOR,
      s.DEX,
      s.CON,
      s.INT,
      s.SAB,
      s.CAR,
      build.origin,
      build.status,
      JSON.stringify(build.talentAcquisitions),
      JSON.stringify(build.skillChoices),
      build.metamagicOptions,
      build.invocationIds,
      build.maneuverIds,
      build.speciesLineageId,
      build.updatedAt,
    ],
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
    null, // p_level: ignorado (o nível nunca influencia)
    query.subclassId,
    query.highestAbility,
    query.excludeCharacterId,
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

describe("migrations 0001→0009", () => {
  it("aplicam numa base limpa, não inserem nenhum dado de referência e a 0006–0009 podem ser reaplicadas", { timeout: 60_000 }, async () => {
    const fresh = await createDatabase();
    for (const table of ["reference_sources", "reference_characters", "reference_acquisitions", "reference_character_citations", "reference_mentions"]) {
      expect(await count(fresh, table)).toBe(0);
    }
    await fresh.exec(readFileSync(`${MIGRATIONS_DIR}0006_build_choice_recommendations.sql`, "utf8"));
    await fresh.exec(readFileSync(`${MIGRATIONS_DIR}0007_subclass_metamagic_recommendations.sql`, "utf8"));
    await fresh.exec(readFileSync(`${MIGRATIONS_DIR}0008_recommendation_scores.sql`, "utf8"));
    await fresh.exec(readFileSync(`${MIGRATIONS_DIR}0009_lineage_second_ability_min5.sql`, "utf8"));
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
    const rows = await rpcCounts(db, { opportunityKind: "generalFeat", classId: "guerreiro", subclassId: null, highestAbility: null, excludeCharacterId: null, includeUserRecords: false });
    expect(rows.find((row) => row.tier === "class")!.sampleCharacters).toBe(2);
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

describe("versões confirmadas (migration 0005)", () => {
  const OWNER = "11111111-1111-4111-8111-111111111111";
  const OTHER = "22222222-2222-4222-8222-222222222222";
  const v = (n: number, characterN: number, classId: "mago" | "barbaro", updatedAt: string) =>
    testUserBuild(n, classId, [], { characterId: testBuildId(characterN), updatedAt });

  async function asSession(userId: string, run: () => Promise<unknown>): Promise<unknown> {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
    try {
      return await run();
    } finally {
      await db.exec("reset role");
    }
  }

  async function insertAs(userId: string, build: CharacterBuild, status = "confirmed") {
    return asSession(userId, () =>
      db.query(
        `insert into character_builds (build_id, character_id, owner_id, level, class_id, for_score, dex_score, con_score, int_score, sab_score, car_score, origin, status)
         values ($1, $2, $3, 1, $4, 10, 10, 10, 10, 10, 10, 'user', $5)`,
        [build.buildId, build.characterId, OWNER === userId ? OWNER : userId, build.classId, status],
      ),
    );
  }

  it("estatísticas contam só a versão mais recente de cada personagem; personagens diferentes contam separado", async () => {
    await insertBuild(db, v(1, 1, "mago", "2026-01-01T00:00:00.000Z"));
    await insertBuild(db, v(2, 1, "barbaro", "2026-02-01T00:00:00.000Z")); // nova versão do personagem 1
    await insertBuild(db, v(3, 3, "mago", "2026-01-15T00:00:00.000Z")); // outro personagem
    const count = async (classId: string) => Number((await db.query<{ n: number }>("select count_builds($1) as n", [classId])).rows[0].n);
    expect(await count("barbaro")).toBe(1);
    expect(await count("mago")).toBe(1);
    expect(await db.query("select * from character_builds")).toMatchObject({ rows: { length: 3 } });
  });

  it("a sessão só INSERE versões confirmadas suas — nunca rascunho, nunca em nome de outra sessão", async () => {
    await insertAs(OWNER, v(1, 1, "mago", "2026-01-01T00:00:00.000Z"));
    await expect(insertAs(OWNER, v(2, 2, "mago", "2026-01-01T00:00:00.000Z"), "draft")).rejects.toThrow(/row-level security/);
    await expect(
      asSession(OWNER, () =>
        db.query(
          `insert into character_builds (build_id, character_id, owner_id, level, class_id, for_score, dex_score, con_score, int_score, sab_score, car_score, origin, status)
           values ($1, 'x', $2, 1, 'mago', 10, 10, 10, 10, 10, 10, 'user', 'confirmed')`,
          [testBuildId(3), OTHER],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    expect((await db.query("select * from character_builds")).rows).toHaveLength(1);
  });

  it("nada gravado pode ser alterado nem lido individualmente pela API pública", async () => {
    await insertAs(OWNER, v(1, 1, "mago", "2026-01-01T00:00:00.000Z"));
    const updated = (await asSession(OWNER, () => db.query("update character_builds set class_id = 'barbaro'"))) as { affectedRows?: number };
    expect(updated.affectedRows ?? 0).toBe(0);
    const visible = (await asSession(OWNER, () => db.query("select * from character_builds"))) as { rows: unknown[] };
    expect(visible.rows).toHaveLength(0);
    await expect(asSession(OWNER, () => db.query("select * from latest_confirmed_character_builds"))).rejects.toThrow(/permission denied/);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from latest_confirmed_character_builds")).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
    expect((await db.query<{ class_id: string }>("select class_id from character_builds")).rows).toEqual([{ class_id: "mago" }]);
  });
});

describe("acesso pela API pública", () => {
  it("anon/authenticated não leem as tabelas de referência diretamente, mas executam a função de contagem", async () => {
    await db.exec(referenceDatasetToSql(dataset(testReferenceFile("acesso", { characters: [testFighterAsi4("c1", "alerta", null)] }))));
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from reference_characters")).rejects.toThrow(/permission denied/);
      const rows = await rpcCounts(db, { opportunityKind: "generalFeat", classId: "guerreiro", subclassId: null, highestAbility: null, excludeCharacterId: null, includeUserRecords: false });
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
    subclassId: "Campeão",
    highestAbility: "FOR",
    excludeCharacterId: null,
    includeUserRecords: true,
  };
  const queries: TalentChoiceCountQuery[] = [
    base,
    { ...base, includeUserRecords: false },
    { ...base, excludeCharacterId: testBuildId(1) },
    { ...base, excludeCharacterId: testBuildId(2) },
    { ...base, highestAbility: null, subclassId: null },
    { ...base, highestAbility: "DEX" },
    { ...base, subclassId: null, highestAbility: "DEX" },
    { ...base, highestAbility: null },
    { ...base, opportunityKind: "fightingStyle", subclassId: null, highestAbility: null },
    { ...base, opportunityKind: "originFeat", subclassId: null, highestAbility: null },
    { ...base, classId: "mago" },
  ];

  it.each(queries.map((query, index) => [index, query] as const))("consulta %i: mesmas linhas no banco e no app", async (_index, query) => {
    for (const reference of references) await db.exec(referenceDatasetToSql(reference));
    for (const build of userBuilds) await insertBuild(db, build);
    expect(sorted(await rpcCounts(db, query))).toEqual(sorted(countTalentChoices(facts, query)));
  });

  it("dados reais: só com p_include_user e só faixas com 10+ personagens", async () => {
    for (const build of userBuilds) await insertBuild(db, build);
    expect(await rpcCounts(db, { ...base, includeUserRecords: false })).toEqual([]);
    const rows = await rpcCounts(db, base);
    expect(rows.every((row) => row.pool === "user" && row.sampleCharacters >= 10)).toBe(true);
    expect(rows.find((row) => row.tier === "class" && row.talentId === "sentinela")!.characters).toBe(14);
    // Excluir o próprio personagem derruba a amostra para 22 (inclui quem escolheu Talento Geral em outro nível) — ainda >= 10.
    expect((await rpcCounts(db, { ...base, excludeCharacterId: testBuildId(1) })).find((row) => row.tier === "class")!.sampleCharacters).toBe(22);
  });

  it("dados reais: 10 personagens bastam, 9 não", async () => {
    for (const build of userBuilds.slice(0, 9)) await insertBuild(db, build);
    expect(await rpcCounts(db, base)).toEqual([]);
    await insertBuild(db, userBuilds[9]);
    expect((await rpcCounts(db, base)).find((row) => row.tier === "class")!.sampleCharacters).toBe(10);
  });
});

describe("get_build_choice_scores × scoreBuildChoices (paridade SQL/app)", () => {
  const SPECIES = ["humano", "anao", "elfo"] as const;
  const BACKGROUNDS = ["soldado", "guarda"] as const;
  const SKILL_CHOICE = "classe-guerreiro-pericias";
  const SKILLS = [["atletismo", "percepcao"], ["intimidacao", "atletismo"], ["sobrevivencia", "percepcao"]] as const;
  const ABILITIES = [testAbilities({ FOR: 15, CAR: 8 }), testAbilities({ DEX: 15, INT: 8 }), testAbilities({ FOR: 15, DEX: 15 })];

  const userBuilds: CharacterBuild[] = [
    ...Array.from({ length: 14 }, (_, i) =>
      testUserBuild(i + 1, "guerreiro", [], {
        subclassId: i < 11 ? "Campeão" : "Mestre de Batalha",
        speciesId: SPECIES[i % 3],
        backgroundId: i % 4 === 0 ? null : BACKGROUNDS[i % 2],
        abilityScores: ABILITIES[i % 3],
        skillChoices: i % 5 === 0 ? {} : { [SKILL_CHOICE]: [...SKILLS[i % 3]] },
        metamagicOptions: i % 7 === 0 ? [] : i % 2 === 0 ? ["acelerada", "duplicada"] : ["acelerada", "sutil"],
        invocationIds: i % 3 === 0 ? ["explosao-agonizante", "lanca-mistica", "lanca-mistica"] : ["mente-mistica"],
        maneuverIds: i < 11 ? [] : ["ataque-preciso", i === 11 ? "derrubar" : "desarmar"],
        speciesLineageId: SPECIES[i % 3] === "elfo" ? (i < 6 ? "elfo-alto-elfo" : "elfo-drow") : null,
      }),
    ),
    // Versão antiga do personagem 1 (deve ser ignorada) + rascunho + outra classe.
    testUserBuild(40, "guerreiro", [], { characterId: testBuildId(1), speciesId: "orc", updatedAt: "2025-01-01T00:00:00.000Z" }),
    testUserBuild(41, "guerreiro", [], { speciesId: "orc", status: "draft" }),
    testUserBuild(42, "mago", [], { speciesId: "orc" }),
    // Elfos de outra classe: contam para a Linhagem e para Perícias de qualquer classe.
    ...Array.from({ length: 3 }, (_, i) =>
      testUserBuild(50 + i, "mago", [], { speciesId: "elfo", speciesLineageId: "elfo-floresta", skillChoices: { [SKILL_CHOICE]: ["arcanismo"] } }),
    ),
  ];

  const base: BuildChoiceScoreQuery = {
    kind: "species",
    classId: "guerreiro",
    speciesId: null,
    subclassId: "Campeão",
    choiceId: null,
    highestAbility: null,
    withValues: [],
    excludeCharacterId: null,
  };
  const queries: BuildChoiceScoreQuery[] = [
    base,
    { ...base, subclassId: null },
    { ...base, subclassId: "Mestre de Batalha" },
    { ...base, subclassId: "Ninguém" },
    { ...base, excludeCharacterId: testBuildId(1) },
    { ...base, kind: "background" },
    { ...base, kind: "highestAbility" },
    { ...base, kind: "dumpAbility" },
    { ...base, kind: "skillChoice", choiceId: SKILL_CHOICE, subclassId: null },
    { ...base, kind: "skillChoice", choiceId: SKILL_CHOICE, subclassId: null, highestAbility: "DEX" },
    { ...base, kind: "skillChoice", choiceId: "outra-escolha", subclassId: null },
    { ...base, kind: "subclass", subclassId: null },
    { ...base, kind: "metamagic", subclassId: null },
    { ...base, kind: "metamagic", subclassId: null, withValues: ["acelerada"] },
    { ...base, kind: "metamagic", subclassId: null, withValues: ["sutil", "nunca-escolhida"] },
    { ...base, kind: "invocation", withValues: ["explosao-agonizante"] },
    { ...base, kind: "invocation", subclassId: null },
    { ...base, kind: "maneuver", subclassId: "Mestre de Batalha", withValues: ["ataque-preciso"] },
    { ...base, classId: "mago" },
    { ...base, kind: "secondAbility" },
    { ...base, kind: "secondAbility", subclassId: null },
    { ...base, kind: "lineage", classId: null, speciesId: "elfo", subclassId: null },
    { ...base, kind: "skillChoice", classId: null, choiceId: SKILL_CHOICE, subclassId: null, highestAbility: "FOR" },
  ];

  async function rpcBuildChoiceScores(query: BuildChoiceScoreQuery): Promise<BuildChoiceScoreRow[]> {
    const result = await db.query<{ value: string; score: number; class_characters: number; class_sample: number }>(
      "select * from get_build_choice_scores($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        query.kind,
        query.classId,
        query.subclassId,
        query.choiceId,
        query.highestAbility,
        query.withValues.length > 0 ? query.withValues : null,
        query.excludeCharacterId,
        query.speciesId,
      ],
    );
    return result.rows.map((row) => ({
      value: row.value,
      score: Number(row.score),
      classCharacters: Number(row.class_characters),
      classSample: Number(row.class_sample),
    }));
  }
  const byValue = (rows: BuildChoiceScoreRow[]) => [...rows].sort((a, b) => a.value.localeCompare(b.value));

  it.each(queries.map((query, index) => [index, query] as const))("consulta %i: mesmas pontuações no banco e no app", async (_index, query) => {
    for (const build of userBuilds) await insertBuild(db, build);
    const sql = byValue(await rpcBuildChoiceScores(query));
    const app = byValue(scoreBuildChoices(latestConfirmedUserBuilds(userBuilds), query));
    expect(sql.map(({ score: _score, ...rest }) => rest)).toEqual(app.map(({ score: _score, ...rest }) => rest));
    sql.forEach((row, index) => expect(row.score).toBeCloseTo(app[index].score, 10));
  });

  it("menos de 5 personagens da classe: nada sai do banco", async () => {
    for (const build of userBuilds.slice(0, 4)) await insertBuild(db, build);
    expect(await rpcBuildChoiceScores(base)).toEqual([]);
  });

  it("a subclasse refina a classe, e as escolhas já feitas nunca voltam como recomendação", async () => {
    for (const build of userBuilds) await insertBuild(db, build);
    const classOnly = await rpcBuildChoiceScores({ ...base, kind: "dumpAbility", subclassId: null });
    const champion = await rpcBuildChoiceScores({ ...base, kind: "dumpAbility" });
    expect(classOnly.find((row) => row.value === "CAR")!.score).not.toBeCloseTo(champion.find((row) => row.value === "CAR")!.score, 6);
    const withQuickened = await rpcBuildChoiceScores({ ...base, kind: "metamagic", subclassId: null, withValues: ["acelerada"] });
    expect(withQuickened.some((row) => row.value === "acelerada")).toBe(false);
  });

  it("anon/authenticated executam a função, mas não leem a view diretamente", async () => {
    for (const build of userBuilds) await insertBuild(db, build);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      expect((await rpcBuildChoiceScores(base)).length).toBeGreaterThan(0);
      await expect(db.query("select invocations from latest_confirmed_character_builds")).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
  });
});

describe("get_talent_choice_scores × scoreTalentChoices (paridade SQL/app)", () => {
  const asi4 = (talentId: string, subclassId: string, abilityScores = testAbilities({ FOR: 16 })) => ({
    kind: "generalFeat" as const,
    opportunityId: "asi-4",
    level: 4,
    talentId,
    subclassId,
    abilityScores,
  });
  const userBuilds: CharacterBuild[] = [
    ...Array.from({ length: 12 }, (_, i) => testUserBuild(i + 1, "guerreiro", [asi4(i % 3 === 0 ? "alerta" : "sentinela", "Campeão")])),
    ...Array.from({ length: 3 }, (_, i) => testUserBuild(20 + i, "guerreiro", [asi4("alerta", "Mestre de Batalha", testAbilities({ DEX: 16 }))])),
    testUserBuild(30, "guerreiro", [{ kind: "generalFeat", opportunityId: "asi-6", level: 6, talentId: "habilidoso", subclassId: "Campeão" }]),
  ];
  const references = [
    dataset(
      testReferenceFile("s-a", {
        independenceGroup: "grupo-a",
        characters: [testFighterAsi4("a1", "sentinela", testAbilities({ FOR: 16 })), testFighterAsi4("a2", "resistente", testAbilities({ DEX: 16 }))],
      }),
    ),
    dataset(testReferenceFile("s-b", { independenceGroup: "grupo-b", characters: [testFighterAsi4("b1", "sentinela", testAbilities({ FOR: 16 }))] })),
  ];
  const facts = [...referenceDatasetsToFacts(references), ...userBuilds.flatMap(buildToTalentChoiceFacts)];

  const base: TalentChoiceCountQuery = {
    opportunityKind: "generalFeat",
    classId: "guerreiro",
    subclassId: null,
    highestAbility: null,
    excludeCharacterId: null,
    includeUserRecords: true,
  };
  const queries: TalentChoiceCountQuery[] = [
    base,
    { ...base, includeUserRecords: false },
    { ...base, subclassId: "Mestre de Batalha" },
    { ...base, highestAbility: "DEX" },
    { ...base, subclassId: "Mestre de Batalha", highestAbility: "DEX" },
    { ...base, subclassId: "Campeão", highestAbility: "FOR", excludeCharacterId: testBuildId(1) },
    { ...base, subclassId: "Campeão" },
    { ...base, classId: "mago" },
  ];

  async function rpcTalentScores(query: TalentChoiceCountQuery): Promise<TalentChoiceScoreRow[]> {
    const result = await db.query<{ pool: TalentChoiceScoreRow["pool"]; talent_id: string; score: number; base_characters: number; base_groups: number; base_sample: number }>(
      "select * from get_talent_choice_scores($1, $2, $3, $4, $5, $6, $7)",
      [query.opportunityKind, query.classId, null, query.subclassId, query.highestAbility, query.excludeCharacterId, query.includeUserRecords],
    );
    return result.rows.map((row) => ({
      pool: row.pool,
      talentId: row.talent_id,
      score: Number(row.score),
      baseCharacters: Number(row.base_characters),
      baseGroups: Number(row.base_groups),
      baseSample: Number(row.base_sample),
    }));
  }
  const byKey = (rows: TalentChoiceScoreRow[]) => [...rows].sort((a, b) => `${a.pool}|${a.talentId}`.localeCompare(`${b.pool}|${b.talentId}`));

  it.each(queries.map((query, index) => [index, query] as const))("consulta %i: mesmas pontuações no banco e no app", async (_index, query) => {
    for (const reference of references) await db.exec(referenceDatasetToSql(reference));
    for (const build of userBuilds) await insertBuild(db, build);
    const sql = byKey(await rpcTalentScores(query));
    const app = byKey(scoreTalentChoices(facts, query));
    expect(sql.map(({ score: _score, ...rest }) => rest)).toEqual(app.map(({ score: _score, ...rest }) => rest));
    sql.forEach((row, index) => expect(row.score).toBeCloseTo(app[index].score, 10));
  });
});
