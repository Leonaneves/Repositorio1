import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { KnownWildShapeForm } from "../domain/character.js";
import { getWildShapeFormsConfig, isWildShapeFormSelectionComplete, parseChallengeRating, validateKnownWildShapeForm } from "./wildShapeForms.js";

describe("getWildShapeFormsConfig — tabela confirmada (2/4/8), nunca deduzida", () => {
  it.each([
    [1, { count: 0, maxChallengeRating: 0, flyAllowed: false }],
    [2, { count: 4, maxChallengeRating: 0.25, flyAllowed: false }],
    [3, { count: 4, maxChallengeRating: 0.25, flyAllowed: false }],
    [4, { count: 6, maxChallengeRating: 0.5, flyAllowed: false }],
    [7, { count: 6, maxChallengeRating: 0.5, flyAllowed: false }],
    [8, { count: 8, maxChallengeRating: 1, flyAllowed: true }],
    [20, { count: 8, maxChallengeRating: 1, flyAllowed: true }],
  ])("nível %i", (level, expected) => {
    expect(getWildShapeFormsConfig(level)).toEqual(expected);
  });
});

describe("parseChallengeRating", () => {
  it.each([
    ["1/4", 0.25],
    ["1/2", 0.5],
    ["1", 1],
    ["2", 2],
    ["0", 0],
  ])('"%s" -> %s', (text, expected) => {
    expect(parseChallengeRating(text)).toBe(expected);
  });

  it("texto vazio ou inválido -> null, nunca inventa um valor", () => {
    expect(parseChallengeRating("")).toBeNull();
    expect(parseChallengeRating("abc")).toBeNull();
    expect(parseChallengeRating("1/0")).toBeNull();
  });
});

function form(patch: Partial<KnownWildShapeForm>): KnownWildShapeForm {
  return { name: "", challengeRating: "", hasFlySpeed: false, ...patch };
}

describe("validateKnownWildShapeForm", () => {
  it("ND dentro do limite e sem Voo em config que não permite -> tudo ok", () => {
    const config = getWildShapeFormsConfig(2); // ND máx 1/4, sem Voo
    const result = validateKnownWildShapeForm(form({ name: "Lobo", challengeRating: "1/4" }), config);
    expect(result).toEqual({ challengeRatingOk: true, flySpeedOk: true });
  });

  it("ND acima do limite -> challengeRatingOk false", () => {
    const config = getWildShapeFormsConfig(2); // ND máx 1/4
    const result = validateKnownWildShapeForm(form({ challengeRating: "1/2" }), config);
    expect(result.challengeRatingOk).toBe(false);
  });

  it("Voo marcado quando não permitido -> flySpeedOk false", () => {
    const config = getWildShapeFormsConfig(4); // sem Voo
    const result = validateKnownWildShapeForm(form({ challengeRating: "1/2", hasFlySpeed: true }), config);
    expect(result.flySpeedOk).toBe(false);
  });

  it("Voo marcado quando permitido (nível 8+) -> flySpeedOk true", () => {
    const config = getWildShapeFormsConfig(8);
    const result = validateKnownWildShapeForm(form({ challengeRating: "1", hasFlySpeed: true }), config);
    expect(result.flySpeedOk).toBe(true);
  });

  it("ND vazio/inválido -> challengeRatingOk null (não bloqueia, mas não confirma)", () => {
    const config = getWildShapeFormsConfig(2);
    const result = validateKnownWildShapeForm(form({ challengeRating: "" }), config);
    expect(result.challengeRatingOk).toBeNull();
  });
});

function druidAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("wildshape-forms-test");
  character.classId = "druida";
  character.level = level;
  return character;
}

describe("isWildShapeFormSelectionComplete", () => {
  it("outra classe nunca bloqueia", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    expect(isWildShapeFormSelectionComplete(character)).toBe(true);
  });

  it("Druida nível 1 nunca bloqueia (Forma Selvagem ainda não concedida)", () => {
    expect(isWildShapeFormSelectionComplete(druidAt(1))).toBe(true);
  });

  it("Druida nível 2 sem nenhuma forma preenchida -> incompleto", () => {
    expect(isWildShapeFormSelectionComplete(druidAt(2))).toBe(false);
  });

  it("Druida nível 2 com as 4 formas preenchidas -> completo", () => {
    const character = druidAt(2);
    character.knownWildShapeForms = [form({ name: "Lobo" }), form({ name: "Urso" }), form({ name: "Águia" }), form({ name: "Corvo" })];
    expect(isWildShapeFormSelectionComplete(character)).toBe(true);
  });

  it("entradas com nome vazio não contam para a quantidade", () => {
    const character = druidAt(2);
    character.knownWildShapeForms = [form({ name: "Lobo" }), form({ name: "" }), form({ name: "Urso" }), form({ name: "Águia" })];
    expect(isWildShapeFormSelectionComplete(character)).toBe(false);
  });

  it("nível 4 exige 6 formas, nunca reaproveita o limite do nível 2", () => {
    const character = druidAt(4);
    character.knownWildShapeForms = [form({ name: "Lobo" }), form({ name: "Urso" }), form({ name: "Águia" }), form({ name: "Corvo" })];
    expect(isWildShapeFormSelectionComplete(character)).toBe(false);
  });
});
