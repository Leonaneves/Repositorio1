import { describe, expect, it } from "vitest";
import {
  getPointBuyCost,
  getPointBuyRemaining,
  getPointBuySpent,
  getStandardArrayRemainingValues,
  isAbilityGenerationValid,
  isManualScoresValid,
  isPointBuyValid,
  isStandardArrayValid,
} from "./abilityGeneration.js";

const ALL_ABILITIES_SCORES = { FOR: 10, DEX: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 };

describe("Point Buy", () => {
  it.each([
    [8, 0],
    [9, 1],
    [10, 2],
    [11, 3],
    [12, 4],
    [13, 5],
    [14, 7],
    [15, 9],
  ])("custo de %i é %i pontos", (score, cost) => {
    expect(getPointBuyCost(score)).toBe(cost);
  });

  it("lança erro para valores fora de 8–15", () => {
    expect(() => getPointBuyCost(16)).toThrow(RangeError);
    expect(() => getPointBuyCost(7)).toThrow(RangeError);
  });

  it("gasto total soma o custo de cada atributo já preenchido", () => {
    expect(getPointBuySpent({ FOR: 15, DEX: 8 })).toBe(9); // só 2 preenchidos: 9 + 0
  });

  it("orçamento de 27: todos em 10 (custo 2 cada) deixa 15 restantes", () => {
    expect(getPointBuyRemaining(ALL_ABILITIES_SCORES)).toBe(15);
  });

  it("nunca esconde orçamento negativo — 6 atributos em 15 (custo 9 cada = 54) fica bem abaixo de zero", () => {
    const allFifteen = { FOR: 15, DEX: 15, CON: 15, INT: 15, SAB: 15, CAR: 15 };
    expect(getPointBuyRemaining(allFifteen)).toBe(27 - 54);
    expect(isPointBuyValid(allFifteen)).toBe(false);
  });

  it("válido só com os 6 preenchidos, dentro do orçamento", () => {
    expect(isPointBuyValid({ FOR: 10, DEX: 10 })).toBe(false); // faltam 4
    expect(isPointBuyValid({ FOR: 15, DEX: 15, CON: 15, INT: 8, SAB: 8, CAR: 8 })).toBe(true); // 9+9+9+0+0+0=27
  });
});

describe("Array Padrão (15,14,13,12,10,8)", () => {
  it("válido quando cada atributo recebe exatamente um dos 6 valores fixos, sem repetir", () => {
    expect(isStandardArrayValid({ FOR: 15, DEX: 14, CON: 13, INT: 12, SAB: 10, CAR: 8 })).toBe(true);
  });

  it("inválido se repetir um valor (mesmo que a soma dê igual)", () => {
    expect(isStandardArrayValid({ FOR: 15, DEX: 15, CON: 13, INT: 12, SAB: 10, CAR: 8 })).toBe(false);
  });

  it("inválido enquanto faltar preencher algum atributo", () => {
    expect(isStandardArrayValid({ FOR: 15, DEX: 14, CON: 13, INT: 12, SAB: 10 })).toBe(false);
  });

  it("lista os valores ainda disponíveis conforme o jogador for escolhendo", () => {
    expect(getStandardArrayRemainingValues({})).toEqual([15, 14, 13, 12, 10, 8]);
    expect(getStandardArrayRemainingValues({ FOR: 15, DEX: 8 })).toEqual([14, 13, 12, 10]);
  });
});

describe("Manual/Rolado", () => {
  it("válido só quando os 6 atributos foram digitados, sem tabela de validação", () => {
    expect(isManualScoresValid({ FOR: 20, DEX: 3, CON: 18, INT: 1, SAB: 30, CAR: 9 })).toBe(true);
    expect(isManualScoresValid({ FOR: 20 })).toBe(false);
  });
});

describe("isAbilityGenerationValid — despacha para a regra do modo ativo", () => {
  it("usa a validação do Array Padrão no modo standardArray", () => {
    expect(isAbilityGenerationValid("standardArray", ALL_ABILITIES_SCORES)).toBe(false); // não são os 6 valores fixos
  });

  it("usa a validação de Point Buy no modo pointBuy", () => {
    expect(isAbilityGenerationValid("pointBuy", ALL_ABILITIES_SCORES)).toBe(true); // 6×custo(10)=12 ≤ 27
  });

  it("usa a validação manual no modo manual", () => {
    expect(isAbilityGenerationValid("manual", ALL_ABILITIES_SCORES)).toBe(true);
  });
});
