import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBarbarianWeaponMasteryChoiceId } from "../data/features/barbarian.js";
import { getBarbarianWeaponMasteryEntries } from "./barbarianWeaponMastery.js";

function barbarianWithMasteries(selections: Partial<Record<1 | 2 | 3 | 4, string>>): Character {
  const character = createBlankCharacter("barb-mastery-test");
  character.classId = "barbaro";
  character.level = 10;
  for (const [slot, weaponId] of Object.entries(selections)) {
    character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(Number(slot) as 1 | 2 | 3 | 4)] = { value: weaponId! };
  }
  return character;
}

describe("getBarbarianWeaponMasteryEntries", () => {
  it("classe diferente de Bárbaro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    expect(getBarbarianWeaponMasteryEntries(character)).toEqual([]);
  });

  it("nenhuma maestria escolhida ainda — []", () => {
    expect(getBarbarianWeaponMasteryEntries(barbarianWithMasteries({}))).toEqual([]);
  });

  it("usa o nome da arma e a maestria real do catálogo — nunca texto inventado", () => {
    const character = barbarianWithMasteries({ 1: "machadoGrande", 2: "azagaia", 3: "clava" });
    const [entry] = getBarbarianWeaponMasteryEntries(character);
    expect(entry.text).toBe("Maestrias: Machado Grande — Trespassar; Azagaia — Lentidão; Clava — Lentidão");
    expect(entry.source).toBe("class");
  });

  it("ignora slots sem seleção, mantendo a ordem dos slots preenchidos", () => {
    const character = barbarianWithMasteries({ 1: "machadoGrande", 3: "clava" });
    const [entry] = getBarbarianWeaponMasteryEntries(character);
    expect(entry.text).toBe("Maestrias: Machado Grande — Trespassar; Clava — Lentidão");
  });

  it("id de arma desconhecido é ignorado silenciosamente (nunca quebra)", () => {
    const character = barbarianWithMasteries({ 1: "arma-inexistente" });
    expect(getBarbarianWeaponMasteryEntries(character)).toEqual([]);
  });
});
