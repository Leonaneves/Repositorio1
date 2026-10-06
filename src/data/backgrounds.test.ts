import { describe, expect, it } from "vitest";
import { BACKGROUND_IDS } from "../domain/ids.js";
import { backgrounds, getBackgroundAbilityAllocationConfig } from "./backgrounds.js";

describe("backgrounds — Aumentos de Atributo (PHB 2024: 3 pontos, máximo +2)", () => {
  it("todos os 16 antecedentes têm exatamente 3 habilidades elegíveis, sem repetição", () => {
    for (const id of BACKGROUND_IDS) {
      const options = backgrounds[id].abilityScoreOptions;
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
    }
  });

  it("getBackgroundAbilityAllocationConfig usa a regra universal (3 pontos, máximo +2) com as 3 habilidades do antecedente", () => {
    const config = getBackgroundAbilityAllocationConfig("acolito");
    expect(config).toEqual({ eligibleAbilities: ["INT", "SAB", "CAR"], totalPoints: 3, maxPerAbility: 2 });
  });
});
