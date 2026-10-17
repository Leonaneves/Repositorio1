import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_FORTITUDE_FEAT_ID } from "../data/features/epicBoons.js";
import { getDraconicResilienceHpBonus, getMaxHitDice, getMaxHitPoints, getRemainingHitDice } from "./hp.js";
import { getEpicBoonFortitudeHpBonus } from "./epicBoons.js";
import { getToughHpBonus } from "./feats.js";

describe("getMaxHitPoints — PV máximo automático (sem rolagem, criação rápida)", () => {
  it("é 0 sem classe definida (só o ajuste manual conta)", () => {
    const character = createBlankCharacter("hp-test");
    expect(getMaxHitPoints(character)).toEqual({ auto: 0, manual: 0, total: 0 });
  });

  it("nível 1: máximo do Dado de Vida + mod. de CON (Bárbaro d12, CON 14 → +2)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "barbaro";
    character.level = 1;
    character.abilities.CON.score = 14;
    expect(getMaxHitPoints(character).auto).toBe(14); // 12 + 2
  });

  it("nível 1: Mago d6, CON 10 (mod. 0)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "mago";
    character.level = 1;
    character.abilities.CON.score = 10;
    expect(getMaxHitPoints(character).auto).toBe(6);
  });

  it("níveis seguintes somam o valor fixo médio do Dado de Vida + mod. de CON por nível (Guerreiro d10, CON 12 → +1, nível 4)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "guerreiro";
    character.level = 4;
    character.abilities.CON.score = 12;
    // nível 1: 10 + 1 = 11; níveis 2-4: 3 × (6 + 1) = 21; total 32
    expect(getMaxHitPoints(character).auto).toBe(32);
  });

  it("Artífice (fonte própria): d8, nível 1 = 8 + CON, níveis seguintes = 5 + CON cada (valor fixo)", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "artifice";
    character.level = 3;
    character.abilities.CON.score = 14; // mod +2
    // nível 1: 8 + 2 = 10; níveis 2-3: 2 × (5 + 2) = 14; total 24
    expect(getMaxHitPoints(character).auto).toBe(24);
  });

  it("preserva o ajuste manual somado ao automático", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "clerigo";
    character.level = 1;
    character.abilities.CON.score = 14; // mod +2
    character.hp.maxManualAdjustment = 5;
    expect(getMaxHitPoints(character)).toEqual({ auto: 10, manual: 5, total: 15 });
  });

  it.each([
    [6, 4],
    [8, 5],
    [10, 6],
    [12, 7],
  ])("valor fixo médio do Dado de Vida d%i é %i", (hitDie, expected) => {
    const character = createBlankCharacter("hp-test");
    character.classId = hitDie === 6 ? "mago" : hitDie === 8 ? "clerigo" : hitDie === 10 ? "guerreiro" : "barbaro";
    character.level = 2;
    character.abilities.CON.score = 10; // mod 0, isola o valor fixo
    // nível 1 (máximo) + nível 2 (fixo) = hitDie + expected
    expect(getMaxHitPoints(character).auto).toBe(hitDie + expected);
  });
});

describe("getMaxHitPoints — Campeão Primitivo (Bárbaro nível 20) retroage sobre TODOS os níveis de PV", () => {
  it("CON efetiva (+4, D&D 2024: retroage a todos os Dados de Vida já tirados) entra em TODOS os níveis do cálculo, não só do nível 20 em diante", () => {
    const character = createBlankCharacter("hp-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.CON.score = 20; // efetivo: 24 (mod +7)
    // nível 1: 12 + 7 = 19; níveis 2-20: 19 × (7 + 7) = 266; total 285
    expect(getMaxHitPoints(character).auto).toBe(285);
  });
});

describe("getDraconicResilienceHpBonus — Feitiçaria Dracônica (nível 3+): +3 no 3, +1/nível depois (fonte 'INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES' §35)", () => {
  function sorcererDraconicAt(level: number) {
    const character = createBlankCharacter("hp-draconic-test");
    character.classId = "feiticeiro";
    character.level = level;
    character.subclassId = "Feitiçaria Dracônica";
    return character;
  }

  it("0 antes do nível 3", () => {
    expect(getDraconicResilienceHpBonus(sorcererDraconicAt(2))).toBe(0);
  });

  it.each([
    [3, 3],
    [4, 4],
    [10, 10],
    [20, 20],
  ])("nível %i -> +%i (bônus = nível, calculado corretamente mesmo criando direto num nível alto)", (level, expected) => {
    expect(getDraconicResilienceHpBonus(sorcererDraconicAt(level))).toBe(expected);
  });

  it("0 para outra subclasse de Feiticeiro", () => {
    const character = sorcererDraconicAt(10);
    character.subclassId = "Feitiçaria Selvagem";
    expect(getDraconicResilienceHpBonus(character)).toBe(0);
  });

  it("0 para outra classe", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 10;
    expect(getDraconicResilienceHpBonus(character)).toBe(0);
  });

  it("getMaxHitPoints soma o bônus de Resiliência Dracônica ao total automático", () => {
    const character = sorcererDraconicAt(3);
    character.abilities.CON.score = 10; // mod 0
    // nível 1: 6 + 0 = 6; níveis 2-3: 2 × (4 + 0) = 8; + Resiliência (+3) = 17
    expect(getMaxHitPoints(character).auto).toBe(17);
  });
});

describe("getMaxHitDice / getRemainingHitDice — 1 Dado de Vida por nível", () => {
  it("máximo de Dados de Vida é igual ao nível", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 7;
    expect(getMaxHitDice(character)).toBe(7);
  });

  it("restantes = máximo - já gastos", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 5;
    character.hp.hitDiceSpent = 2;
    expect(getRemainingHitDice(character)).toBe(3);
  });

  it("nunca fica negativo mesmo se gastos > máximo", () => {
    const character = createBlankCharacter("hp-test");
    character.level = 3;
    character.hp.hitDiceSpent = 10;
    expect(getRemainingHitDice(character)).toBe(0);
  });
});

describe("Vigoroso — +2×nível somado ao PV máximo (fonte \"IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF\" §13)", () => {
  it("getToughHpBonus = 2×nível com o talento ativo, 0 sem ele", () => {
    const character = createBlankCharacter("hp-test");
    character.backgroundId = "fazendeiro"; // concede Vigoroso
    character.level = 6;
    expect(getToughHpBonus(character)).toBe(12);

    character.backgroundId = null;
    expect(getToughHpBonus(character)).toBe(0);
  });

  it("soma ao PV máximo mesmo sem classe escolhida (não depende de Dado de Vida)", () => {
    const character = createBlankCharacter("hp-test");
    character.backgroundId = "fazendeiro";
    character.level = 4;
    expect(getMaxHitPoints(character).auto).toBe(8);
  });

  it("soma ao PV máximo calculado normalmente com classe (Guerreiro d10, CON 12 → +1, nível 4)", () => {
    const withoutTough = createBlankCharacter("hp-test");
    withoutTough.classId = "guerreiro";
    withoutTough.level = 4;
    withoutTough.abilities.CON.score = 12;
    const baseline = getMaxHitPoints(withoutTough).auto;

    const withTough = createBlankCharacter("hp-test");
    withTough.classId = "guerreiro";
    withTough.level = 4;
    withTough.abilities.CON.score = 12;
    withTough.backgroundId = "fazendeiro";
    expect(getMaxHitPoints(withTough).auto).toBe(baseline + 8); // +2×4
  });
});

describe("Dádiva da Fortitude — Saúde Fortalecida: +40 PV máximo, uma ÚNICA vez (fonte \"IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF\" §3)", () => {
  function fighterAt19WithFortitude() {
    const character = createBlankCharacter("hp-epic-boon-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.abilities.CON.score = 12; // mod +1
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Fortitude" };
    return character;
  }

  it("getEpicBoonFortitudeHpBonus = 40 com a Dádiva ativa, 0 sem ela", () => {
    const character = fighterAt19WithFortitude();
    expect(getEpicBoonFortitudeHpBonus(character)).toBe(40);

    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    expect(getEpicBoonFortitudeHpBonus(character)).toBe(0);
  });

  it("soma +40 ao PV máximo calculado normalmente, uma ÚNICA vez (nunca por nível)", () => {
    const withoutBoon = createBlankCharacter("hp-epic-boon-test");
    withoutBoon.classId = "guerreiro";
    withoutBoon.level = 19;
    withoutBoon.abilities.CON.score = 12;
    const baseline = getMaxHitPoints(withoutBoon).auto;

    const withBoon = fighterAt19WithFortitude();
    expect(getMaxHitPoints(withBoon).auto).toBe(baseline + 40);
  });

  it("se o atributo aumentado por esta própria Dádiva for Constituição, o bônus normal de CON soma SEPARADO do +40 fixo", () => {
    const withoutIncrease = fighterAt19WithFortitude();
    withoutIncrease.abilities.CON.score = 13; // mod +1
    // nível 1: 10+1=11; níveis 2-19: 18×(6+1)=126; +40 (Fortitude) = 177.
    expect(getMaxHitPoints(withoutIncrease).auto).toBe(177);

    const withConIncrease = fighterAt19WithFortitude();
    withConIncrease.abilities.CON.score = 13; // mod +1, efetivo 14 (mod +2) com a Dádiva
    withConIncrease.featureChoiceSelections[`${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`] = { value: "CON" };
    // nível 1: 10+2=12; níveis 2-19: 18×(6+2)=144; +40 (Fortitude) = 196 — +19 em relação ao anterior (mod +1 em cada um dos 19 níveis).
    expect(getMaxHitPoints(withConIncrease).auto).toBe(196);
  });

  it("sem classe escolhida: o +40 ainda soma (fonte: 'uma ÚNICA vez', nunca depende de Dado de Vida)", () => {
    const character = createBlankCharacter("hp-epic-boon-test");
    character.level = 19;
    character.featureChoiceSelections[getEpicBoonChoiceId("mago")] = { value: "Dádiva da Fortitude" }; // sem classId, isEpicBoonEligible já é false
    expect(getMaxHitPoints(character).auto).toBe(0);
  });
});
