import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getRecommendedAttackAbility, getWeaponAttackBonus, getWeaponDamageDice, getWeaponsByCategory } from "./weapons.js";
import { weaponsById } from "../data/weapons.js";

describe("getWeaponsByCategory", () => {
  it("simples tem 14 armas (10 corpo a corpo + 4 à distância)", () => {
    expect(getWeaponsByCategory("simples")).toHaveLength(14);
  });

  it("marcial tem 24 armas (18 corpo a corpo + 6 à distância)", () => {
    expect(getWeaponsByCategory("marcial")).toHaveLength(24);
  });
});

describe("getRecommendedAttackAbility", () => {
  it("arma à distância recomenda DEX (Arco Curto)", () => {
    expect(getRecommendedAttackAbility(weaponsById.arcoCurto)).toBe("DEX");
  });

  it("arma com Acuidade recomenda DEX mesmo sendo corpo a corpo (Rapieira)", () => {
    expect(getRecommendedAttackAbility(weaponsById.rapieira)).toBe("DEX");
  });

  it("arma corpo a corpo comum recomenda FOR (Machado Grande)", () => {
    expect(getRecommendedAttackAbility(weaponsById.machadoGrande)).toBe("FOR");
  });
});

describe("getWeaponDamageDice", () => {
  it("usa o dado versátil quando empunhada com duas mãos (Espada Longa 1d8 → 1d10)", () => {
    expect(getWeaponDamageDice(weaponsById.espadaLonga, true)).toBe("1d10");
    expect(getWeaponDamageDice(weaponsById.espadaLonga, false)).toBe("1d8");
  });

  it("sem Versátil, o dado nunca muda (Maça)", () => {
    expect(getWeaponDamageDice(weaponsById.maca, true)).toBe("1d6");
  });
});

describe("getWeaponAttackBonus — reaproveita a fórmula genérica de rules/attack.ts", () => {
  it("Rapieira proficiente, DEX 16 (mod +3), nível 5 (proficiência +3) = +6", () => {
    const character = createBlankCharacter("weapon-attack-test");
    character.level = 5;
    character.abilities.DEX.score = 16;
    expect(getWeaponAttackBonus(character, "rapieira", { proficient: true }).total).toBe(6);
  });

  it("permite sobrescrever o atributo recomendado", () => {
    const character = createBlankCharacter("weapon-attack-test");
    character.abilities.FOR.score = 14; // mod +2
    character.abilities.DEX.score = 20; // mod +5
    const withForced = getWeaponAttackBonus(character, "adaga", { proficient: false, ability: "FOR" });
    expect(withForced.auto).toBe(2);
  });
});
