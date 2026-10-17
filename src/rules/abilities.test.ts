import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_FORTITUDE_FEAT_ID, DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID } from "../data/features/epicBoons.js";
import { ESPECIALISTA_PERICIA_FEAT_ID } from "../data/features/feats.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";

function epicBoonFighterAt19(boonName: string) {
  const character = createBlankCharacter("eff-score-epic-boon-test");
  character.classId = "guerreiro";
  character.level = 19;
  character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: boonName };
  return character;
}

describe("getAbilityModifier", () => {
  it.each([
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [16, 3],
    [20, 5],
    [1, -5],
    [30, 10],
  ])("atributo %i → modificador %i", (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected);
  });
});

describe("getProficiencyBonus", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])("nível %i → proficiência +%i", (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  it("rejeita níveis fora do intervalo 1–20", () => {
    expect(() => getProficiencyBonus(0)).toThrow(RangeError);
    expect(() => getProficiencyBonus(21)).toThrow(RangeError);
  });
});

describe("getEffectiveAbilityScore — Campeão Primitivo (Bárbaro nível 20: FOR+4/CON+4, teto 25)", () => {
  it("classe/nível sem Campeão Primitivo: devolve o valor bruto, sem alteração", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 19;
    character.abilities.FOR.score = 20;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(20);
  });

  it("Bárbaro nível 20: FOR e CON ganham +4", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    character.abilities.CON.score = 16;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(22);
    expect(getEffectiveAbilityScore(character, "CON")).toBe(20);
  });

  it("Bárbaro nível 20: o bônus respeita o teto de 25", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 23;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(25);
  });

  it("Bárbaro nível 20: outros atributos (ex. DEX) não são afetados", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.DEX.score = 14;
    expect(getEffectiveAbilityScore(character, "DEX")).toBe(14);
  });

  it("outra classe no nível 20 não ganha o bônus", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "guerreiro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(18);
  });

  it("nunca sobrescreve o valor bruto armazenado (character.abilities.FOR.score)", () => {
    const character = createBlankCharacter("eff-score-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.FOR.score = 18;
    getEffectiveAbilityScore(character, "FOR");
    expect(character.abilities.FOR.score).toBe(18);
  });
});

describe("getEffectiveAbilityScore — \"+1\" de Dádiva Épica (fonte \"IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF\" §1: teto PRÓPRIO de 30, independente do teto 20 dos Talentos Gerais)", () => {
  it("sem Dádiva Épica ativa: nenhum bônus extra", () => {
    const character = epicBoonFighterAt19("Dádiva da Fortitude");
    character.abilities.CON.score = 18;
    expect(getEffectiveAbilityScore(character, "CON")).toBe(18);
  });

  it("com a escolha de atributo resolvida: soma +1 normalmente", () => {
    const character = epicBoonFighterAt19("Dádiva da Fortitude");
    character.abilities.CON.score = 18;
    character.featureChoiceSelections[`${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "CON")).toBe(19);
  });

  it("teto de 30: nunca ultrapassa, mesmo partindo de um valor já alto", () => {
    const character = epicBoonFighterAt19("Dádiva da Fortitude");
    character.abilities.CON.score = 30;
    character.featureChoiceSelections[`${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "CON")).toBe(30);
  });

  it("teto PRÓPRIO de 30 é independente do teto 20 dos Talentos Gerais — os dois bônus se somam normalmente até 30, nunca travados em 20", () => {
    const character = epicBoonFighterAt19("Dádiva do Ataque Irresistível");
    character.abilities.FOR.score = 19; // já perto do teto 20 dos Talentos Gerais
    character.asiSelections[4] = { kind: "feat", featId: ESPECIALISTA_PERICIA_FEAT_ID };
    character.featureChoiceSelections[`${ESPECIALISTA_PERICIA_FEAT_ID}-atributo-asi-4`] = { value: "FOR" };
    character.featureChoiceSelections[`${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`] = { value: "FOR" };
    // 19 + 1 (Talento Geral, capped em 20) = 20; + 1 (Dádiva Épica, teto próprio 30) = 21 — nunca travado em 20.
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(21);
  });

  it("escolher um atributo diferente do que está sendo lido nunca soma nada", () => {
    const character = epicBoonFighterAt19("Dádiva da Fortitude");
    character.abilities.CON.score = 18;
    character.featureChoiceSelections[`${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "FOR")).toBe(10);
  });
});
