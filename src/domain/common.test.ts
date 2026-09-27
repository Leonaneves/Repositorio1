import { describe, expect, it } from "vitest";
import { computedChoice, computedValue } from "./common.js";

describe("computedValue", () => {
  it("soma auto + manual em total, sem sobrescrever o auto", () => {
    const result = computedValue(3, 2);
    expect(result).toEqual({ auto: 3, manual: 2, total: 5 });
  });

  it("assume manual = 0 por padrão", () => {
    const result = computedValue(7);
    expect(result).toEqual({ auto: 7, manual: 0, total: 7 });
  });

  it("aceita ajuste manual negativo", () => {
    const result = computedValue(10, -3);
    expect(result.total).toBe(7);
  });
});

describe("computedChoice", () => {
  it("total usa auto quando não há override manual", () => {
    const result = computedChoice("Médio", null);
    expect(result).toEqual({ auto: "Médio", manual: null, total: "Médio" });
  });

  it("total usa o override manual quando presente, sem apagar o auto", () => {
    const result = computedChoice("Médio", "Pequeno");
    expect(result).toEqual({ auto: "Médio", manual: "Pequeno", total: "Pequeno" });
  });
});
