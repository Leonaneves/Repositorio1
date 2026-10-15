import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { getFighterFightingStyleTalentEntries, getFighterManeuverTalentEntries } from "./fighterTalentEntries.js";

function fighterAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("fighter-talent-entries-test");
  character.classId = "guerreiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getFighterFightingStyleTalentEntries — Estilo de Luta BASE (nível 1) e ADICIONAL do Campeão (nível 7) são origens SEPARADAS", () => {
  it("classe diferente de Guerreiro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "paladino";
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defesa" };
    expect(getFighterFightingStyleTalentEntries(character)).toEqual([]);
  });

  it("sem nenhuma escolha preenchida — []", () => {
    expect(getFighterFightingStyleTalentEntries(fighterAt(1))).toEqual([]);
  });

  it("Estilo de Luta base preenchido, sem subclasse: só a entrada base", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Combate com Duas Armas" };
    const entries = getFighterFightingStyleTalentEntries(character);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Estilo de Luta: Combate com Duas Armas");
  });

  it("Campeão nível 7 com só o adicional preenchido: só a entrada adicional (base continua vazia)", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelista" };
    const entries = getFighterFightingStyleTalentEntries(character);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Estilo de Luta Adicional: Duelista");
  });

  it("Campeão nível 7 com AMBOS preenchidos: as duas entradas, base primeiro, nunca uma concedendo a outra", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defesa" };
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelista" };
    const entries = getFighterFightingStyleTalentEntries(character);
    expect(entries.map((e) => e.text)).toEqual(["Estilo de Luta: Defesa", "Estilo de Luta Adicional: Duelista"]);
  });

  it("outra subclasse (não Campeão) nunca lê a escolha adicional do Campeão, mesmo que esteja preenchida por engano", () => {
    const character = fighterAt(7, "Mestre da Batalha");
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelista" };
    expect(getFighterFightingStyleTalentEntries(character)).toEqual([]);
  });

  it("texto em branco (só espaços) nunca entra como entrada vazia", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "   " };
    expect(getFighterFightingStyleTalentEntries(character)).toEqual([]);
  });

  it("nunca grava a escolha de volta em nenhum campo do personagem", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defesa" };
    const before = JSON.stringify(character.featureChoiceSelections);
    getFighterFightingStyleTalentEntries(character);
    expect(JSON.stringify(character.featureChoiceSelections)).toBe(before);
  });
});

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
