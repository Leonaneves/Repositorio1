import { describe, expect, it } from "vitest";
import { formatProportionOfTen, formatRecommendationReason } from "./recommendationReason.js";

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

describe("formatRecommendationReason", () => {
  it("jogadores reais: escolhido por X de 10 {classe no plural}", () => {
    expect(formatRecommendationReason({ characters: 4, sampleCharacters: 10, source: "user" }, "guerreiro")).toBe("escolhido por 4 de 10 guerreiros");
    expect(formatRecommendationReason({ characters: 12, sampleCharacters: 20, source: "user" }, "clerigo")).toBe("escolhido por 6 de cada 10 clérigos");
  });

  it("verbo próprio (atributos)", () => {
    expect(formatRecommendationReason({ characters: 7, sampleCharacters: 10, source: "user" }, "mago", "o maior atributo de")).toBe("o maior atributo de 7 de 10 magos");
  });

  it("referências nunca aparecem como escolha de jogadores", () => {
    expect(formatRecommendationReason({ characters: 2, sampleCharacters: 4, source: "reference" }, "bardo")).toBe(
      "escolhido por 5 de cada 10 bardos de referência (guias e fontes externas)",
    );
  });
});
