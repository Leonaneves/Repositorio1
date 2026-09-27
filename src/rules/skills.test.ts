import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSkillBonus } from "./skills.js";

function characterAt(level: number) {
  const character = createBlankCharacter("skills-test");
  character.level = level;
  return character;
}

describe("getSkillBonus", () => {
  it("sem proficiência, é apenas o modificador do atributo", () => {
    const character = characterAt(1);
    character.abilities.DEX.score = 14; // +2
    const bonus = getSkillBonus(character, "acrobacia");
    expect(bonus).toEqual({ auto: 2, manual: 0, total: 2 });
  });

  it("com proficiência, soma o bônus de proficiência do nível", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.SAB.score = 14; // +2
    character.skills.percepcao.proficient = true;
    const bonus = getSkillBonus(character, "percepcao");
    expect(bonus.auto).toBe(5); // 2 + 3
  });

  it("com especialização, dobra o bônus de proficiência", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.proficient = true;
    character.skills.furtividade.expertise = true;
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(8); // 2 + 3*2
  });

  it("especialização sem proficiência não tem efeito (não é uma combinação válida)", () => {
    const character = characterAt(5);
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.proficient = false;
    character.skills.furtividade.expertise = true;
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(2); // sem proficiência, expertise é ignorada
  });

  it("preserva o ajuste manual separado do valor automático", () => {
    const character = characterAt(1);
    character.abilities.INT.score = 10; // +0
    character.skills.arcanismo.manualAdjustment = 4;
    const bonus = getSkillBonus(character, "arcanismo");
    expect(bonus).toEqual({ auto: 0, manual: 4, total: 4 });
  });
});
