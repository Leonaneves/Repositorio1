import { describe, expect, it } from "vitest";
import {
  canDecreaseAbility,
  canIncreaseAbility,
  decreaseAbility,
  getAllocatedPoints,
  getRemainingPoints,
  increaseAbility,
  isAllocationComplete,
  type AbilityAllocationConfig,
} from "./abilityAllocation.js";

const CONFIG: AbilityAllocationConfig = { eligibleAbilities: ["FOR", "DEX", "INT"], totalPoints: 3, maxPerAbility: 2 };

describe("abilityAllocation — pool de 3 pontos, máximo +2", () => {
  it("começa com 3 pontos restantes e nada alocado", () => {
    expect(getRemainingPoints(CONFIG, {})).toBe(3);
    expect(getAllocatedPoints({})).toBe(0);
  });

  it("+2 FOR bloqueia novo aumento em FOR, mas 1 ponto continua disponível para outro atributo", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "FOR");
    expect(allocations.FOR).toBe(2);
    expect(canIncreaseAbility(CONFIG, allocations, "FOR")).toBe(false);
    expect(getRemainingPoints(CONFIG, allocations)).toBe(1);
    expect(canIncreaseAbility(CONFIG, allocations, "DEX")).toBe(true);
    expect(canIncreaseAbility(CONFIG, allocations, "INT")).toBe(true);
  });

  it("+1/+1/+1 funciona (3 habilidades elegíveis, 1 ponto cada)", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "DEX");
    allocations = increaseAbility(CONFIG, allocations, "INT");
    expect(allocations).toEqual({ FOR: 1, DEX: 1, INT: 1 });
    expect(isAllocationComplete(CONFIG, allocations)).toBe(true);
  });

  it("+3 no mesmo atributo não funciona (para no máximo +2)", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "FOR"); // 3ª tentativa — sem efeito
    expect(allocations.FOR).toBe(2);
  });

  it("diminuir devolve ponto ao pool", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "FOR");
    expect(getRemainingPoints(CONFIG, allocations)).toBe(1);
    allocations = decreaseAbility(allocations, "FOR");
    expect(allocations.FOR).toBe(1);
    expect(getRemainingPoints(CONFIG, allocations)).toBe(2);
    expect(canIncreaseAbility(CONFIG, allocations, "FOR")).toBe(true);
  });

  it("não pode diminuir abaixo de 0 desta origem", () => {
    expect(canDecreaseAbility({}, "FOR")).toBe(false);
    expect(decreaseAbility({}, "FOR")).toEqual({});
    const allocations = increaseAbility(CONFIG, {}, "FOR");
    const decreasedTwice = decreaseAbility(decreaseAbility(allocations, "FOR"), "FOR");
    expect(decreasedTwice.FOR).toBeUndefined();
  });

  it("pool 0 bloqueia todos os aumentos, mas diminuir continua disponível onde houver bônus", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "DEX");
    allocations = increaseAbility(CONFIG, allocations, "INT");
    expect(getRemainingPoints(CONFIG, allocations)).toBe(0);
    expect(canIncreaseAbility(CONFIG, allocations, "FOR")).toBe(false);
    expect(canIncreaseAbility(CONFIG, allocations, "DEX")).toBe(false);
    expect(canIncreaseAbility(CONFIG, allocations, "INT")).toBe(false);
    expect(canDecreaseAbility(allocations, "FOR")).toBe(true);
  });

  it("editar a distribuição (diminuir uma e aumentar outra) não duplica bônus — total nunca excede o pool", () => {
    let allocations = increaseAbility(CONFIG, {}, "FOR");
    allocations = increaseAbility(CONFIG, allocations, "FOR"); // +2 FOR, pool em 1
    allocations = decreaseAbility(allocations, "FOR"); // +1 FOR, pool em 2
    allocations = increaseAbility(CONFIG, allocations, "DEX"); // +1 FOR +1 DES, pool em 1
    expect(allocations).toEqual({ FOR: 1, DEX: 1 });
    expect(getAllocatedPoints(allocations)).toBe(2);
    expect(getRemainingPoints(CONFIG, allocations)).toBe(1);
  });

  it("habilidade fora de eligibleAbilities nunca pode ser aumentada", () => {
    expect(canIncreaseAbility(CONFIG, {}, "CON")).toBe(false);
    expect(increaseAbility(CONFIG, {}, "CON")).toEqual({});
  });
});
