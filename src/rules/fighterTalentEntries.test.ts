import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getFighterManeuverTalentEntries } from "./fighterTalentEntries.js";

function fighterAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fighter-talent-entries-test");
  character.classId = "guerreiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getFighterManeuverTalentEntries (regressão rápida — cobertura detalhada em fighterSubclassPrintedFeatures.test.ts)", () => {
  it("classe diferente de Guerreiro ou subclasse diferente de Mestre da Batalha — []", () => {
    expect(getFighterManeuverTalentEntries(fighterAt(18, "Campeão"))).toEqual([]);
    const other = createBlankCharacter("x");
    other.classId = "patrulheiro";
    expect(getFighterManeuverTalentEntries(other)).toEqual([]);
  });

  it("Mestre da Batalha sem manobras escolhidas ainda — []", () => {
    expect(getFighterManeuverTalentEntries(fighterAt(3, "Mestre da Batalha"))).toEqual([]);
  });
});
