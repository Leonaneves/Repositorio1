import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSpeed } from "./speed.js";

describe("getSpeed", () => {
  it("usa o deslocamento base da espécie", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "elfo";
    expect(getSpeed(character).auto).toBe(9);
  });

  it("é 0 sem espécie definida", () => {
    const character = createBlankCharacter("speed-test");
    expect(getSpeed(character).auto).toBe(0);
  });

  it("preserva o ajuste manual somado ao automático", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "humano";
    character.speed.manualAdjustment = 3; // ex.: efeito de magia
    expect(getSpeed(character)).toEqual({ auto: 9, manual: 3, total: 12 });
  });

  // ⚠️ Bônus de deslocamento por classe/nível (ex.: Movimento sem Armadura
  // do Monge) ainda não está confirmado — ver `getClassSpeedBonus` e o
  // relatório desta etapa. Este teste documenta o comportamento atual
  // (0 para todas as classes) e deve ser atualizado assim que os
  // valores forem confirmados.
  it("bônus de classe ainda não implementado (pendente de confirmação) — hoje é sempre 0", () => {
    const character = createBlankCharacter("speed-test");
    character.speciesId = "humano";
    character.classId = "monge";
    character.level = 18;
    expect(getSpeed(character).auto).toBe(9);
  });
});
