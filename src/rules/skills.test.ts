import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSkillBonus, getSkillProficiency, isSkillGrantedByBackground } from "./skills.js";

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

  it("com proficiência (override manual), soma o bônus de proficiência do nível", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.SAB.score = 14; // +2
    character.skills.percepcao.manualOverride = true;
    const bonus = getSkillBonus(character, "percepcao");
    expect(bonus.auto).toBe(5); // 2 + 3
  });

  it("com especialização, dobra o bônus de proficiência", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.manualOverride = true;
    character.skills.furtividade.expertise = true;
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(8); // 2 + 3*2
  });

  it("especialização sem proficiência não tem efeito (não é uma combinação válida)", () => {
    const character = characterAt(5);
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.manualOverride = false;
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

describe("isSkillGrantedByBackground / getSkillProficiency (§1.1 — fontes de proficiência)", () => {
  it("perícia concedida pelo antecedente atual conta como proficiente sem nenhum override", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "sabio"; // Arcanismo, História
    expect(isSkillGrantedByBackground(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "medicina")).toBe(false);
  });

  it("trocar de antecedente remove a proficiência concedida pelo antecedente anterior", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre"; // História, Persuasão
    expect(getSkillProficiency(character, "historia")).toBe(true);

    character.backgroundId = "soldado"; // Atletismo, Intimidação
    expect(getSkillProficiency(character, "historia")).toBe(false);
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
  });

  it("override manual sobrevive à troca de antecedente (nunca é apagado silenciosamente)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre";
    character.skills.furtividade.manualOverride = true; // escolha manual, sem relação com o antecedente

    character.backgroundId = "soldado";
    character.backgroundId = "sabio";

    expect(getSkillProficiency(character, "furtividade")).toBe(true);
  });

  it("perícia concedida pelo antecedente E também confirmada manualmente continua proficiente quando a fonte do antecedente desaparece", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "guarda"; // Atletismo, Percepção
    character.skills.percepcao.manualOverride = true; // jogador também fixa manualmente

    character.backgroundId = "sabio"; // não concede mais Percepção

    // A fonte "antecedente" desapareceu, mas a fonte "manual" continua.
    expect(isSkillGrantedByBackground(character, "percepcao")).toBe(false);
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
  });

  it("override manual também consegue REMOVER uma proficiência concedida pelo antecedente (editável, como no PDF original)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre"; // História, Persuasão
    character.skills.historia.manualOverride = false; // jogador desmarca deliberadamente

    expect(isSkillGrantedByBackground(character, "historia")).toBe(true);
    expect(getSkillProficiency(character, "historia")).toBe(false);
  });

  it("sem antecedente escolhido, nenhuma perícia é concedida automaticamente", () => {
    const character = createBlankCharacter("t");
    expect(isSkillGrantedByBackground(character, "arcanismo")).toBe(false);
  });
});
