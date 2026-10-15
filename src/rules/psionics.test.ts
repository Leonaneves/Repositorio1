import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getEnergyBastionTargetCount, getKineticThrustCd, getPsionicDieWithIntText, getPsionicLeapFlySpeed } from "./psionics.js";

function psiWarriorOf(level: number) {
  const character = createBlankCharacter("psionics-test");
  character.classId = "guerreiro";
  character.subclassId = "Guerreiro Psiônico";
  character.level = level;
  return character;
}

describe("getKineticThrustCd", () => {
  it("null antes do nível 7 (Estocada Telecinética ainda não concedida)", () => {
    expect(getKineticThrustCd(psiWarriorOf(3))).toBeNull();
  });

  it("= 8 + BP + mod INT a partir do nível 7", () => {
    const character = psiWarriorOf(7); // BP 3
    character.abilities.INT.score = 16; // mod +3
    expect(getKineticThrustCd(character)).toBe(14); // 8 + 3 + 3
  });

  it("outra subclasse — null", () => {
    const character = createBlankCharacter("psionics-test-2");
    character.classId = "guerreiro";
    character.subclassId = "Campeão";
    character.level = 10;
    expect(getKineticThrustCd(character)).toBeNull();
  });
});

describe("getPsionicDieWithIntText", () => {
  it("resolve como texto de dado+modificador com sinal, nunca fórmula literal", () => {
    const character = psiWarriorOf(3); // d6
    character.abilities.INT.score = 16; // mod +3
    expect(getPsionicDieWithIntText(character)).toBe("1d6+3");
  });

  it("formata modificador negativo corretamente", () => {
    const character = psiWarriorOf(5); // d8
    character.abilities.INT.score = 8; // mod -1
    expect(getPsionicDieWithIntText(character)).toBe("1d8-1");
  });

  it("escala o dado por nível (d8 no 5, d10 no 11, d12 no 17)", () => {
    expect(getPsionicDieWithIntText(psiWarriorOf(5))).toMatch(/^1d8/);
    expect(getPsionicDieWithIntText(psiWarriorOf(11))).toMatch(/^1d10/);
    expect(getPsionicDieWithIntText(psiWarriorOf(17))).toMatch(/^1d12/);
  });

  it("outra classe/subclasse — null", () => {
    const mago = createBlankCharacter("psionics-test-3");
    mago.classId = "mago";
    expect(getPsionicDieWithIntText(mago)).toBeNull();
  });
});

describe("getPsionicLeapFlySpeed", () => {
  it("null antes do nível 7", () => {
    expect(getPsionicLeapFlySpeed(psiWarriorOf(3))).toBeNull();
  });

  it("= dobro do deslocamento efetivo a partir do nível 7", () => {
    const character = psiWarriorOf(7);
    character.speciesId = "humano";
    // Deslocamento base do Humano (9m) * 2 — nunca dobra um bônus temporário, só o total efetivo.
    expect(getPsionicLeapFlySpeed(character)).toBe(18);
  });
});

describe("getEnergyBastionTargetCount", () => {
  it("null antes do nível 15", () => {
    expect(getEnergyBastionTargetCount(psiWarriorOf(10))).toBeNull();
  });

  it("= max(1, mod INT) a partir do nível 15", () => {
    const character = psiWarriorOf(15);
    character.abilities.INT.score = 8; // mod -1 -> mínimo 1
    expect(getEnergyBastionTargetCount(character)).toBe(1);

    character.abilities.INT.score = 18; // mod +4
    expect(getEnergyBastionTargetCount(character)).toBe(4);
  });
});
