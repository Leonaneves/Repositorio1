import { describe, expect, it } from "vitest";
import { sanitizeForPdf } from "./sanitize.js";

describe("sanitizeForPdf — PADRONIZAÇÃO DE CARACTERES PARA O PDF", () => {
  it("→ se torna ->", () => {
    expect(sanitizeForPdf("Reação → 1 Atq")).toBe("Reação -> 1 Atq");
  });

  it("½ se torna 1/2", () => {
    expect(sanitizeForPdf("mova até ½ Desl")).toBe("mova até 1/2 Desl");
  });

  it("× se torna x", () => {
    expect(sanitizeForPdf("2× dano")).toBe("2x dano");
  });

  it("≥ se torna >=", () => {
    expect(sanitizeForPdf("nível ≥ 5")).toBe("nível >= 5");
  });

  it("≤ se torna <=", () => {
    expect(sanitizeForPdf("CA ≤ 15")).toBe("CA <= 15");
  });

  it("± se torna +/-", () => {
    expect(sanitizeForPdf("±2")).toBe("+/-2");
  });

  it("substitui todas as ocorrências, não só a primeira", () => {
    expect(sanitizeForPdf("→ → →")).toBe("-> -> ->");
  });

  it("substitui múltiplos símbolos diferentes na mesma string", () => {
    expect(sanitizeForPdf("½ dano, 2× bônus, CD ≥ 10 → sucesso")).toBe("1/2 dano, 2x bônus, CD >= 10 -> sucesso");
  });

  it("nunca altera letras acentuadas do português", () => {
    const text = "Ação Bônus: mova até a Árvore; Conjuração não é possível; Força Indomável";
    expect(sanitizeForPdf(text)).toBe(text);
  });

  it("nunca altera checkboxes no formato [__]", () => {
    expect(sanitizeForPdf("#Fúria [__][__][__]")).toBe("#Fúria [__][__][__]");
  });

  it("string sem nenhum símbolo banido permanece idêntica", () => {
    const text = "Ataque Extra: 2 Atq ao usar a ação Atacar.";
    expect(sanitizeForPdf(text)).toBe(text);
  });

  it("string vazia permanece vazia", () => {
    expect(sanitizeForPdf("")).toBe("");
  });
});
