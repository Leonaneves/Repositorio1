import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getArmorClass, getAvailableArmor } from "./armor.js";

describe("getArmorClass — sem armadura", () => {
  it("classe genérica → 10 + DEX", () => {
    const character = createBlankCharacter("ca-test");
    character.abilities.DEX.score = 14; // +2
    expect(getArmorClass(character).auto).toBe(12);
  });

  it("Bárbaro, DEX +2 e CON +3, sem armadura → CA 15", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "barbaro";
    character.abilities.DEX.score = 14; // +2
    character.abilities.CON.score = 16; // +3
    expect(getArmorClass(character).auto).toBe(15);
  });

  it("Bárbaro nível 20 (Campeão Primitivo): CON efetiva (+4, teto 25) entra na CA sem armadura", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "barbaro";
    character.level = 20;
    character.abilities.DEX.score = 14; // +2
    character.abilities.CON.score = 20; // bruto +5, efetivo 24 → +7
    expect(getArmorClass(character).auto).toBe(19); // 10 + 2 + 7
  });

  it("Bárbaro com escudo soma +2 normalmente", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "barbaro";
    character.abilities.DEX.score = 14; // +2
    character.abilities.CON.score = 16; // +3
    character.armor.shield = true;
    expect(getArmorClass(character).auto).toBe(17);
  });

  it("Monge, DEX +3 e SAB +2, sem armadura e sem escudo → CA 15", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "monge";
    character.abilities.DEX.score = 16; // +3
    character.abilities.SAB.score = 14; // +2
    expect(getArmorClass(character).auto).toBe(15);
  });

  it("Monge com escudo perde a defesa sem armadura (usa CA normal + escudo)", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "monge";
    character.abilities.DEX.score = 16; // +3
    character.abilities.SAB.score = 14; // +2 (não deve entrar na conta)
    character.armor.shield = true;
    expect(getArmorClass(character).auto).toBe(15); // 10 + 3 + 2(escudo), SAB ignorado
  });

  it("Feiticeiro/Feitiçaria Dracônica (Resiliência Dracônica): CA = 10 + DEX + CAR, sem armadura", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "feiticeiro";
    character.subclassId = "Feitiçaria Dracônica";
    character.abilities.DEX.score = 14; // +2
    character.abilities.CAR.score = 18; // +4
    expect(getArmorClass(character).auto).toBe(16);
  });

  it("Feiticeiro/Feitiçaria Dracônica com escudo soma +2 normalmente", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "feiticeiro";
    character.subclassId = "Feitiçaria Dracônica";
    character.abilities.DEX.score = 14; // +2
    character.abilities.CAR.score = 18; // +4
    character.armor.shield = true;
    expect(getArmorClass(character).auto).toBe(18);
  });

  it("Feiticeiro de outra subclasse (ou sem subclasse) usa a fórmula genérica, nunca +CAR", () => {
    const character = createBlankCharacter("ca-test");
    character.classId = "feiticeiro";
    character.subclassId = "Feitiçaria Selvagem";
    character.abilities.DEX.score = 14; // +2
    character.abilities.CAR.score = 18; // +4, não deve contar
    expect(getArmorClass(character).auto).toBe(12);
  });
});

describe("getArmorClass — com armadura", () => {
  it("Placas → CA 18, independente de DEX", () => {
    const character = createBlankCharacter("ca-test");
    character.armor.equipped = "placas";
    character.abilities.DEX.score = 20; // +5, não deve contar
    expect(getArmorClass(character).auto).toBe(18);
  });

  it("Placas + escudo → CA 20", () => {
    const character = createBlankCharacter("ca-test");
    character.armor.equipped = "placas";
    character.armor.shield = true;
    expect(getArmorClass(character).auto).toBe(20);
  });

  it("armadura leve soma o modificador de DEX inteiro", () => {
    const character = createBlankCharacter("ca-test");
    character.armor.equipped = "couroBatido"; // base 12
    character.abilities.DEX.score = 18; // +4
    expect(getArmorClass(character).auto).toBe(16);
  });

  it("armadura média com DEX +4 aplica somente +2", () => {
    const character = createBlankCharacter("ca-test");
    character.armor.equipped = "gibaoDePeles"; // base 12
    character.abilities.DEX.score = 18; // +4, limitado a +2
    expect(getArmorClass(character).auto).toBe(14);
  });

  it("preserva o ajuste manual somado ao valor automático", () => {
    const character = createBlankCharacter("ca-test");
    character.armor.equipped = "placas";
    character.armor.manualAdjustment = 1; // ex.: item mágico +1
    const result = getArmorClass(character);
    expect(result).toEqual({ auto: 18, manual: 1, total: 19 });
  });
});

describe("getAvailableArmor", () => {
  it("retorna somente armaduras leves quando só há proficiência leve", () => {
    const character = createBlankCharacter("armor-list-test");
    character.armor.proficiencies = { light: true, medium: false, heavy: false, shield: false };
    const available = getAvailableArmor(character);
    expect(available).toHaveLength(3);
    expect(available.every((a) => a.category === "light")).toBe(true);
  });

  it("retorna as 12 armaduras quando há proficiência com todas as categorias", () => {
    const character = createBlankCharacter("armor-list-test");
    character.armor.proficiencies = { light: true, medium: true, heavy: true, shield: true };
    expect(getAvailableArmor(character)).toHaveLength(12);
  });

  it("retorna lista vazia sem nenhuma proficiência de armadura", () => {
    const character = createBlankCharacter("armor-list-test");
    expect(getAvailableArmor(character)).toHaveLength(0);
  });
});
