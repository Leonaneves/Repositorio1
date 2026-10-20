import { describe, expect, it } from "vitest";
import { formatBlendBasis, formatProportionOfTen, formatProportionReason, withRecommendedLabel } from "./recommendationReason.js";

describe("formatProportionOfTen", () => {
  it("exatamente 10 comparados: X de 10", () => {
    expect(formatProportionOfTen(7, 10)).toBe("7 de 10");
    expect(formatProportionOfTen(10, 10)).toBe("10 de 10");
  });

  it("mais de 10: a proporção equivalente de cada 10, exata quando possível", () => {
    expect(formatProportionOfTen(14, 20)).toBe("7 de cada 10");
    expect(formatProportionOfTen(30, 30)).toBe("10 de cada 10");
  });

  it("arredondada: 'cerca de', nunca 10 se alguém escolheu outra coisa, nunca 0 para quem escolheu", () => {
    expect(formatProportionOfTen(8, 13)).toBe("cerca de 6 de cada 10");
    expect(formatProportionOfTen(19, 20)).toBe("cerca de 9 de cada 10");
    expect(formatProportionOfTen(1, 23)).toBe("menos de 1 de cada 10");
  });
});

describe("formatProportionReason (Subclasse)", () => {
  it("jogadores reais: escolhido por X de 10 {classe no plural}", () => {
    expect(formatProportionReason(4, 10, "user", "guerreiros")).toBe("escolhido por 4 de 10 guerreiros");
    expect(formatProportionReason(12, 20, "user", "clérigos")).toBe("escolhido por 6 de cada 10 clérigos");
  });

  it("referências nunca aparecem como escolha de jogadores", () => {
    expect(formatProportionReason(2, 4, "reference", "bardos")).toBe("escolhido por 5 de cada 10 bardos de referência (guias e fontes externas)");
  });
});

describe("recomendações de vários fatores", () => {
  it("rótulo com ★ e uma linha com os fatores usados", () => {
    expect(withRecommendedLabel("Anão", { mode: "blend", source: "user" })).toBe("Anão (★ Recomendado)");
    expect(withRecommendedLabel("Dracônica", { mode: "proportion", characters: 7, sampleCharacters: 10, source: "user", group: "feiticeiros" })).toBe("Dracônica (Recomendado)");
    expect(withRecommendedLabel("Orc", undefined)).toBe("Orc");
    expect(formatBlendBasis(["sua classe", "sua subclasse"], "user")).toBe("★ Recomendações com base em sua classe e sua subclasse.");
    expect(formatBlendBasis(["sua classe", "sua subclasse", "os atributos que ela mais usa"], "user")).toBe(
      "★ Recomendações com base em sua classe, sua subclasse e os atributos que ela mais usa.",
    );
    expect(formatBlendBasis(["sua classe e nível"], "reference")).toBe(
      "★ Recomendações de personagens de referência (guias e fontes externas) com base em sua classe e nível.",
    );
  });
});
