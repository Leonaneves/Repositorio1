import { describe, expect, it } from "vitest";
import {
  CONTEXT_TIERS,
  levelBand,
  MAX_RECOMMENDATIONS_PER_SELECTOR,
  meetsMinimumSample,
  REAL_RECORDS_ENABLED,
  selectTalentRecommendations,
} from "./policy.js";
import type { ContextTier, RecommendationPool, TalentChoiceCountRow } from "./types.js";

function row(pool: RecommendationPool, tier: ContextTier, talentId: string, characters: number, sample: { characters: number; groups: number }, independentGroups = Math.min(characters, sample.groups)): TalentChoiceCountRow {
  return { pool, tier, talentId, characters, independentGroups, sampleCharacters: sample.characters, sampleGroups: sample.groups };
}

const REFS_OK = { characters: 6, groups: 3 };
const ELIGIBLE = ["alerta", "sentinela", "resistente", "mestre-atirador", "velocista"];

describe("policy — constantes aprovadas", () => {
  it("dados reais ficam fora do recomendador até a verificação em produção", () => {
    expect(REAL_RECORDS_ENABLED).toBe(false);
  });

  it("no máximo 3 recomendações por seletor", () => {
    expect(MAX_RECOMMENDATIONS_PER_SELECTOR).toBe(3);
  });

  it("faixas da mais específica para a mais ampla, sempre com nível (exato ou mesma faixa)", () => {
    expect(CONTEXT_TIERS.map((tier) => tier.tier)).toEqual(["level_subclass_ability", "level_subclass", "level_ability", "level", "level_band"]);
  });

  it("faixas de nível: criação, 1–4, 5–10, 11–16, 17–20", () => {
    expect([null, 1, 4, 5, 10, 11, 16, 17, 20].map(levelBand)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("policy — amostra mínima", () => {
  it("reais: 20 personagens distintos", () => {
    expect(meetsMinimumSample("user", 19, 19)).toBe(false);
    expect(meetsMinimumSample("user", 20, 20)).toBe(true);
  });

  it("referências: 3 personagens de pelo menos 2 fontes independentes", () => {
    expect(meetsMinimumSample("reference_extracted", 2, 2)).toBe(false);
    expect(meetsMinimumSample("reference_extracted", 3, 1)).toBe(false);
    expect(meetsMinimumSample("reference_extracted", 3, 2)).toBe(true);
    expect(meetsMinimumSample("reference_synthetic", 3, 1)).toBe(false);
  });
});

describe("selectTalentRecommendations", () => {
  it("sem dados: nenhuma recomendação", () => {
    expect(selectTalentRecommendations([], ELIGIBLE, { includeUserRecords: false })).toBeNull();
  });

  it("limita a 3 no total, ordenando por personagens distintos", () => {
    const rows = [
      row("reference_extracted", "level", "alerta", 1, REFS_OK),
      row("reference_extracted", "level", "sentinela", 4, REFS_OK),
      row("reference_extracted", "level", "resistente", 3, REFS_OK),
      row("reference_extracted", "level", "mestre-atirador", 2, REFS_OK),
    ];
    const result = selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false });
    expect(result?.talentIds).toEqual(["sentinela", "resistente", "mestre-atirador"]);
    expect(result?.pool).toBe("reference_extracted");
    expect(result?.tier).toBe("level");
  });

  it("elegibilidade obrigatória: um talento fora da lista elegível nunca é recomendado, por mais escolhido que seja", () => {
    const rows = [row("reference_extracted", "level", "imobilizador", 6, REFS_OK), row("reference_extracted", "level", "alerta", 1, REFS_OK)];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false })?.talentIds).toEqual(["alerta"]);
    expect(selectTalentRecommendations(rows, ["sentinela"], { includeUserRecords: false })).toBeNull();
  });

  it("desempate estável: personagens → fontes independentes → ordem do seletor", () => {
    const rows = [
      row("reference_extracted", "level", "velocista", 2, REFS_OK, 2),
      row("reference_extracted", "level", "resistente", 2, REFS_OK, 1),
      row("reference_extracted", "level", "alerta", 2, REFS_OK, 1),
    ];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false })?.talentIds).toEqual(["velocista", "alerta", "resistente"]);
    // Mesma entrada em outra ordem → mesmo resultado.
    expect(selectTalentRecommendations([...rows].reverse(), ELIGIBLE, { includeUserRecords: false })?.talentIds).toEqual(["velocista", "alerta", "resistente"]);
  });

  it("faixa mais específica com amostra suficiente vence; sem amostra, cai para a próxima", () => {
    const rows = [
      row("reference_extracted", "level_subclass", "alerta", 2, { characters: 2, groups: 2 }),
      row("reference_extracted", "level_ability", "resistente", 3, { characters: 3, groups: 2 }),
      row("reference_extracted", "level", "sentinela", 5, REFS_OK),
    ];
    const result = selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false });
    expect(result?.tier).toBe("level_ability");
    expect(result?.talentIds).toEqual(["resistente"]);
  });

  it("reais desligados: linhas de usuários são ignoradas mesmo com 20+", () => {
    const rows = [row("user", "level", "alerta", 20, { characters: 25, groups: 25 }), row("reference_extracted", "level", "sentinela", 3, REFS_OK)];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false })).toMatchObject({ pool: "reference_extracted", talentIds: ["sentinela"] });
  });

  it("reais ligados e com 20+: usa SÓ o ranking real (nunca mistura com referências)", () => {
    const rows = [
      row("user", "level_band", "alerta", 12, { characters: 20, groups: 20 }),
      row("reference_extracted", "level_subclass_ability", "sentinela", 3, REFS_OK),
      row("reference_extracted", "level_subclass_ability", "resistente", 3, REFS_OK),
    ];
    const result = selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: true });
    expect(result).toMatchObject({ pool: "user", tier: "level_band", talentIds: ["alerta"] });
  });

  it("reais abaixo de 20: usa referências extraídas", () => {
    const rows = [row("user", "level", "alerta", 10, { characters: 19, groups: 19 }), row("reference_extracted", "level", "sentinela", 3, REFS_OK)];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: true })?.pool).toBe("reference_extracted");
  });

  it("sintéticas só quando as extraídas não atingem a amostra — e nunca completam a lista das extraídas", () => {
    const syntheticOnly = [
      row("reference_extracted", "level", "alerta", 2, { characters: 2, groups: 2 }),
      row("reference_synthetic", "level", "sentinela", 3, REFS_OK),
    ];
    expect(selectTalentRecommendations(syntheticOnly, ELIGIBLE, { includeUserRecords: false })).toMatchObject({ pool: "reference_synthetic", talentIds: ["sentinela"] });

    const extractedWithOne = [
      row("reference_extracted", "level", "alerta", 3, REFS_OK),
      row("reference_synthetic", "level", "sentinela", 5, REFS_OK),
      row("reference_synthetic", "level", "resistente", 4, REFS_OK),
    ];
    expect(selectTalentRecommendations(extractedWithOne, ELIGIBLE, { includeUserRecords: false })).toMatchObject({
      pool: "reference_extracted",
      talentIds: ["alerta"],
    });
  });

  it("guarda internamente a origem dos dados usada (conjunto, faixa e amostra)", () => {
    const rows = [row("reference_extracted", "level", "alerta", 3, { characters: 4, groups: 2 })];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false })).toEqual({
      talentIds: ["alerta"],
      pool: "reference_extracted",
      tier: "level",
      sampleCharacters: 4,
      sampleGroups: 2,
    });
  });
});
