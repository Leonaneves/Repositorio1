import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { captureConfirmationSnapshot, isConfirmationStillValid } from "./buildConfirmation.js";

describe("isConfirmationStillValid — nunca presume confirmação (fonte §4)", () => {
  it("sem snapshot nenhum (null): nunca confirmado", () => {
    const character = createBlankCharacter("x");
    expect(isConfirmationStillValid(character, null)).toBe(false);
  });

  it("logo após capturar o snapshot, sem nenhuma mudança: ainda válido", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    const snapshot = captureConfirmationSnapshot(character);
    expect(isConfirmationStillValid(character, snapshot)).toBe(true);
  });

  it("mudar uma escolha relevante (classe) depois de confirmar invalida o snapshot", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    const snapshot = captureConfirmationSnapshot(character);

    character.classId = "guerreiro";
    expect(isConfirmationStillValid(character, snapshot)).toBe(false);
  });

  it("mudar um atributo depois de confirmar invalida o snapshot", () => {
    const character = createBlankCharacter("x");
    const snapshot = captureConfirmationSnapshot(character);

    character.abilities.FOR.score = 16;
    expect(isConfirmationStillValid(character, snapshot)).toBe(false);
  });

  it("trocar de personagem (novo buildId) nunca herda a confirmação do anterior", () => {
    const previous = createBlankCharacter("personagem-antigo");
    const snapshot = captureConfirmationSnapshot(previous);

    const next = createBlankCharacter("personagem-novo");
    expect(isConfirmationStillValid(next, snapshot)).toBe(false);
  });

  it("mudanças NÃO relevantes para o build (ex.: nome) nunca invalidam a confirmação", () => {
    const character = createBlankCharacter("x");
    character.name = "Antigo Nome";
    const snapshot = captureConfirmationSnapshot(character);

    character.name = "Nome Novo";
    expect(isConfirmationStillValid(character, snapshot)).toBe(true);
  });
});
