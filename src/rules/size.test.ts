import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSize } from "./size.js";

describe("getSize", () => {
  it("deriva o tamanho automaticamente da espécie", () => {
    const character = createBlankCharacter("size-test");
    character.speciesId = "halfling";
    expect(getSize(character)).toEqual({ auto: "Pequeno", manual: null, total: "Pequeno" });
  });

  it("é sobrescrito automaticamente ao trocar de espécie", () => {
    const character = createBlankCharacter("size-test");
    character.speciesId = "halfling";
    expect(getSize(character).total).toBe("Pequeno");

    character.speciesId = "golias";
    expect(getSize(character).total).toBe("Médio");
  });

  it("continua editável manualmente, mesmo com espécie definida", () => {
    const character = createBlankCharacter("size-test");
    character.speciesId = "humano"; // auto = Médio
    character.size.manualOverride = "Grande"; // ex.: efeito de magia/forma grande
    expect(getSize(character)).toEqual({ auto: "Médio", manual: "Grande", total: "Grande" });
  });
});
