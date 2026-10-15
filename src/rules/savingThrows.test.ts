import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { RANGER_MENTE_DE_FERRO_CHOICE_ID } from "../data/features/subclasses.js";
import { getMenteDeFerroGrantedAbility, getSavingThrow } from "./savingThrows.js";

function gloomStalkerAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("mente-de-ferro-test");
  character.classId = "patrulheiro";
  character.subclassId = "Vigilante das Sombras";
  character.level = level;
  return character;
}

describe("getSavingThrow", () => {
  it("sem proficiência, é apenas o modificador do atributo", () => {
    const character = createBlankCharacter("save-test");
    character.abilities.CON.score = 16; // +3
    const save = getSavingThrow(character, "CON");
    expect(save).toEqual({ auto: 3, manual: 0, total: 3 });
  });

  it("com proficiência, soma o bônus de proficiência do nível", () => {
    const character = createBlankCharacter("save-test");
    character.level = 9; // proficiência +4
    character.abilities.FOR.score = 14; // +2
    character.savingThrows.FOR.proficient = true;
    const save = getSavingThrow(character, "FOR");
    expect(save.auto).toBe(6); // 2 + 4
  });

  it("preserva o ajuste manual separado do valor automático", () => {
    const character = createBlankCharacter("save-test");
    character.abilities.SAB.score = 10; // +0
    character.savingThrows.SAB.manualAdjustment = -2;
    const save = getSavingThrow(character, "SAB");
    expect(save).toEqual({ auto: 0, manual: -2, total: -2 });
  });
});

describe("getMenteDeFerroGrantedAbility — Vigilante das Sombras, nível 7 (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §5)", () => {
  it("null para qualquer outra subclasse, ou antes do nível 7", () => {
    expect(getMenteDeFerroGrantedAbility(createBlankCharacter("x"))).toBeNull();
    const notYet = gloomStalkerAt(6);
    expect(getMenteDeFerroGrantedAbility(notYet)).toBeNull();
    const otherSubclass = gloomStalkerAt(10);
    otherSubclass.subclassId = "Caçador";
    expect(getMenteDeFerroGrantedAbility(otherSubclass)).toBeNull();
  });

  it("sem SAB proficiente por outra origem: concede SAB automaticamente, sem exigir escolha", () => {
    const character = gloomStalkerAt(7);
    expect(character.savingThrows.SAB.proficient).toBe(false);
    expect(getMenteDeFerroGrantedAbility(character)).toBe("SAB");

    character.abilities.SAB.score = 16; // +3
    character.level = 9; // proficiência +4
    const save = getSavingThrow(character, "SAB");
    expect(save.auto).toBe(7); // 3 + 4 — concedida por Mente de Ferro, mesmo sem marcar o campo
  });

  it("com SAB já proficiente por outra origem (classe/manual): exige escolha entre Carisma e Inteligência, nunca soma os dois", () => {
    const character = gloomStalkerAt(7);
    character.savingThrows.SAB.proficient = true; // ex.: marcado manualmente, fora desta característica
    expect(getMenteDeFerroGrantedAbility(character)).toBeNull(); // ainda não escolhido — nenhuma concessão extra

    character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID] = { value: "Carisma" };
    expect(getMenteDeFerroGrantedAbility(character)).toBe("CAR");
    expect(getMenteDeFerroGrantedAbility(character)).not.toBe("INT");

    character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID] = { value: "Inteligência" };
    expect(getMenteDeFerroGrantedAbility(character)).toBe("INT");
  });

  it("a verificação de 'já proficiente' nunca considera a própria característica — ela nunca escreve em character.savingThrows", () => {
    const character = gloomStalkerAt(7);
    character.abilities.SAB.score = 16; // +3
    character.level = 9; // proficiência +4
    getSavingThrow(character, "SAB"); // soma a proficiência concedida por Mente de Ferro ao calcular
    // mas o campo armazenado continua intocado — nunca "promovido" a true pela própria característica.
    expect(character.savingThrows.SAB.proficient).toBe(false);
  });

  it("nunca duplica a proficiência: quando concede Carisma/Inteligência, Sabedoria não ganha nada extra por Mente de Ferro", () => {
    const character = gloomStalkerAt(7);
    character.savingThrows.SAB.proficient = true;
    character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID] = { value: "Carisma" };
    character.abilities.SAB.score = 16; // +3
    character.abilities.CAR.score = 12; // +1
    character.level = 9; // proficiência +4

    const sabSave = getSavingThrow(character, "SAB");
    expect(sabSave.auto).toBe(7); // 3 + 4 — vem só da proficiência "de outra origem" marcada, não dobrada
    const carSave = getSavingThrow(character, "CAR");
    expect(carSave.auto).toBe(5); // 1 + 4 — concedida só por Mente de Ferro
  });
});
