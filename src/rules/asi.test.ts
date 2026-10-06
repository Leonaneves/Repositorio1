import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getAsiAbilityBonus, getUnlockedAsiLevels, isAsiLevelComplete, isAsiSelectionResolved } from "./asi.js";
import { getEffectiveAbilityScore } from "./abilities.js";

describe("getUnlockedAsiLevels", () => {
  it("[] sem classe", () => {
    expect(getUnlockedAsiLevels(createBlankCharacter("asi-test"))).toEqual([]);
  });

  it("Mago nível 10: só os níveis de ASI <= 10 (4 e 8)", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 10;
    expect(getUnlockedAsiLevels(character)).toEqual([4, 8]);
  });

  it("Guerreiro nível 20: todos os 6 níveis (mais do que as outras classes)", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "guerreiro";
    character.level = 20;
    expect(getUnlockedAsiLevels(character)).toEqual([4, 6, 8, 12, 14, 16]);
  });
});

describe("isAsiLevelComplete", () => {
  it("undefined (nenhum modo escolhido) nunca é completo", () => {
    expect(isAsiLevelComplete(undefined)).toBe(false);
  });

  it("'feat' já é completo (catálogo pendente, nada mais a validar)", () => {
    expect(isAsiLevelComplete({ kind: "feat" })).toBe(true);
  });

  it("'abilityIncrease' só completo com os 2 pontos todos distribuídos", () => {
    expect(isAsiLevelComplete({ kind: "abilityIncrease", allocations: { FOR: 1 } })).toBe(false);
    expect(isAsiLevelComplete({ kind: "abilityIncrease", allocations: { FOR: 2 } })).toBe(true);
    expect(isAsiLevelComplete({ kind: "abilityIncrease", allocations: { FOR: 1, DEX: 1 } })).toBe(true);
  });
});

describe("isAsiSelectionResolved", () => {
  it("true quando não há níveis desbloqueados ainda", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 3;
    expect(isAsiSelectionResolved(character)).toBe(true);
  });

  it("false enquanto um nível desbloqueado não tiver escolha", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 4;
    expect(isAsiSelectionResolved(character)).toBe(false);
  });

  it("true quando todos os níveis desbloqueados estão resolvidos", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "abilityIncrease", allocations: { FOR: 2 } },
      8: { kind: "feat" },
    };
    expect(isAsiSelectionResolved(character)).toBe(true);
  });
});

describe("getAsiAbilityBonus / getEffectiveAbilityScore — cada ASI é independente, soma tudo, nunca duplica", () => {
  it("soma o bônus de múltiplos níveis de ASI na mesma habilidade", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "abilityIncrease", allocations: { FOR: 2 } },
      8: { kind: "abilityIncrease", allocations: { FOR: 1, DEX: 1 } },
    };
    expect(getAsiAbilityBonus(character, "FOR")).toBe(3);
    expect(getAsiAbilityBonus(character, "DEX")).toBe(1);
  });

  it("'feat' nunca contribui bônus de atributo", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat" } };
    expect(getAsiAbilityBonus(character, "FOR")).toBe(0);
  });

  it("getEffectiveAbilityScore recalcula automaticamente a partir dos asiSelections", () => {
    const character = createBlankCharacter("asi-test");
    character.classId = "mago";
    character.level = 4;
    character.abilities.FOR.score = 15;
    character.asiSelections = { 4: { kind: "abilityIncrease", allocations: { FOR: 2 } } };
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(17);
  });
});
