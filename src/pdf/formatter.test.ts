import { describe, expect, it } from "vitest";
import { formatComputedPlain, formatComputedSigned, formatPlain, formatSigned, truncate } from "./formatter.js";

describe("formatSigned", () => {
  it.each([
    [3, "+3"],
    [0, "+0"],
    [-1, "-1"],
  ])("%i vira %s", (n, expected) => {
    expect(formatSigned(n)).toBe(expected);
  });
});

describe("formatPlain", () => {
  it("nunca adiciona sinal", () => {
    expect(formatPlain(15)).toBe("15");
    expect(formatPlain(0)).toBe("0");
  });
});

describe("formatComputedSigned / formatComputedPlain", () => {
  it("usam sempre o .total, nunca .auto isolado", () => {
    const computed = { auto: 2, manual: 1, total: 3 };
    expect(formatComputedSigned(computed)).toBe("+3");
    expect(formatComputedPlain(computed)).toBe("3");
  });
});

describe("truncate", () => {
  it("não mexe em texto que já cabe", () => {
    expect(truncate("Espada Longa", 30)).toBe("Espada Longa");
  });

  it("corta no limite de espaço mais próximo, com reticências", () => {
    const result = truncate("Trilha do Coração Selvagem Ancestral", 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).not.toMatch(/\s…$/); // não deixa espaço solto antes da reticência
  });

  it("corta cru quando não há espaço razoável no limite", () => {
    const result = truncate("Supercalifragilisticexpialidocious", 10);
    expect(result).toBe("Supercali…");
  });
});
