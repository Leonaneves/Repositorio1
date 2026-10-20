import { describe, expect, it } from "vitest";
import {
  CONTEXT_TIERS,
  levelBand,
  MAX_RECOMMENDATIONS_PER_SELECTOR,
  meetsMinimumSample,
  MIN_REAL_CHARACTERS,
  REAL_RECORDS_ENABLED,
  selectTalentRecommendations,
} from "./policy.js";
import type { RecommendationPool } from "./types.js";
import type { TalentChoiceScoreRow } from "./scoring.js";

const ELIGIBLE = ["alerta", "sentinela", "resistente", "mestre-atirador", "velocista"];

describe("policy — constantes aprovadas", () => {
  it("dados reais liberados no recomendador após a verificação em produção (sempre sujeitos à amostra mínima de 5)", () => {
    expect(REAL_RECORDS_ENABLED).toBe(true);
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
  it("reais: 5 personagens distintos", () => {
    expect(MIN_REAL_CHARACTERS).toBe(5);
    expect(meetsMinimumSample("user", 4, 4)).toBe(false);
    expect(meetsMinimumSample("user", 5, 5)).toBe(true);
  });

  it("referências: 3 personagens de pelo menos 2 fontes independentes", () => {
    expect(meetsMinimumSample("reference_extracted", 2, 2)).toBe(false);
    expect(meetsMinimumSample("reference_extracted", 3, 1)).toBe(false);
    expect(meetsMinimumSample("reference_extracted", 3, 2)).toBe(true);
    expect(meetsMinimumSample("reference_synthetic", 3, 1)).toBe(false);
  });
});

describe("selectTalentRecommendations (pontuações)", () => {
  const row = (pool: RecommendationPool, talentId: string, score: number, baseCharacters = 2, baseGroups = 1): TalentChoiceScoreRow => ({
    pool,
    talentId,
    score,
    baseCharacters,
    baseGroups,
    baseSample: 12,
  });

  it("sem dados: nenhuma recomendação", () => {
    expect(selectTalentRecommendations([], ELIGIBLE, { includeUserRecords: true })).toBeNull();
  });

  it("limita a 3, pela pontuação; empate → personagens na base → fontes → ordem do seletor", () => {
    const rows = [
      row("user", "alerta", 0.1),
      row("user", "sentinela", 0.4),
      row("user", "resistente", 0.3, 3),
      row("user", "mestre-atirador", 0.3, 2),
      row("user", "velocista", 0.3, 2),
    ];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: true })).toEqual({
      talentIds: ["sentinela", "resistente", "mestre-atirador"],
      characters: { sentinela: 2, resistente: 3, "mestre-atirador": 2 },
      pool: "user",
      sampleCharacters: 12,
    });
  });

  it("elegibilidade obrigatória", () => {
    const rows = [row("user", "imobilizador", 0.9), row("user", "alerta", 0.1)];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: true })?.talentIds).toEqual(["alerta"]);
    expect(selectTalentRecommendations(rows, ["sentinela"], { includeUserRecords: true })).toBeNull();
  });

  it("reais primeiro, sem nunca misturar com referências; reais desligados → referências", () => {
    const rows = [row("user", "alerta", 0.2), row("reference_extracted", "sentinela", 0.9), row("reference_synthetic", "resistente", 0.9)];
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: true })).toMatchObject({ pool: "user", talentIds: ["alerta"] });
    expect(selectTalentRecommendations(rows, ELIGIBLE, { includeUserRecords: false })).toMatchObject({ pool: "reference_extracted", talentIds: ["sentinela"] });
    expect(selectTalentRecommendations(rows.slice(2), ELIGIBLE, { includeUserRecords: true })).toMatchObject({ pool: "reference_synthetic" });
  });
});
