import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { metamagicOptions } from "../data/metamagic.js";
import { getKnownMetamagicOptions, getMetamagicOptionsKnownCount, getSelectableMetamagicOptions, isMetamagicSelectionComplete } from "./metamagic.js";

describe("getMetamagicOptionsKnownCount — tabela confirmada (2/4/6), nunca deduzida", () => {
  it.each([
    [1, 0],
    [2, 2],
    [9, 2],
    [10, 4],
    [16, 4],
    [17, 6],
    [20, 6],
  ])("nível %i -> %i", (level, expected) => {
    expect(getMetamagicOptionsKnownCount(level)).toBe(expected);
  });
});

describe("getSelectableMetamagicOptions", () => {
  it("devolve as 10 opções do catálogo", () => {
    expect(getSelectableMetamagicOptions()).toHaveLength(10);
  });
});

function sorcererAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("metamagic-test");
  character.classId = "feiticeiro";
  character.level = level;
  return character;
}

describe("getKnownMetamagicOptions", () => {
  it("resolve as definições na ordem escolhida", () => {
    const character = sorcererAt(2);
    character.knownMetamagicOptions = ["sutil", "distante"];
    const known = getKnownMetamagicOptions(character);
    expect(known.map((o) => o.id)).toEqual(["sutil", "distante"]);
  });

  it("ignora ids desconhecidos sem quebrar (nunca inventa uma opção)", () => {
    const character = sorcererAt(2);
    character.knownMetamagicOptions = ["sutil", "id-inexistente"];
    expect(getKnownMetamagicOptions(character).map((o) => o.id)).toEqual(["sutil"]);
  });
});

describe("isMetamagicSelectionComplete", () => {
  it("outra classe nunca bloqueia", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    expect(isMetamagicSelectionComplete(character)).toBe(true);
  });

  it("Feiticeiro nível 1 nunca bloqueia (Metamagia ainda não concedida)", () => {
    expect(isMetamagicSelectionComplete(sorcererAt(1))).toBe(true);
  });

  it("nível 2 sem nenhuma opção -> incompleto", () => {
    expect(isMetamagicSelectionComplete(sorcererAt(2))).toBe(false);
  });

  it("nível 2 com 2 opções distintas -> completo", () => {
    const character = sorcererAt(2);
    character.knownMetamagicOptions = ["sutil", "distante"];
    expect(isMetamagicSelectionComplete(character)).toBe(true);
  });

  it("nível 2 com 1 opção só -> incompleto (faltam opções)", () => {
    const character = sorcererAt(2);
    character.knownMetamagicOptions = ["sutil"];
    expect(isMetamagicSelectionComplete(character)).toBe(false);
  });

  it("nível 10 exige 4, nunca reaproveita o limite do nível 2", () => {
    const character = sorcererAt(10);
    character.knownMetamagicOptions = ["sutil", "distante"];
    expect(isMetamagicSelectionComplete(character)).toBe(false);
  });

  it("duplicata nunca conta como completo", () => {
    const character = sorcererAt(2);
    character.knownMetamagicOptions = ["sutil", "sutil"];
    expect(isMetamagicSelectionComplete(character)).toBe(false);
  });
});

describe("catálogo de Metamagia — Buscadora e Potencializada combinam com outra Meta (exceção à regra geral)", () => {
  it("texto de Buscadora e Potencializada menciona a combinação", () => {
    const buscadora = metamagicOptions.find((o) => o.id === "buscadora")!;
    const potencializada = metamagicOptions.find((o) => o.id === "potencializada")!;
    expect(buscadora.printedLine).toContain("combina com outra Meta");
    expect(potencializada.printedLine).toContain("combina com outra Meta");
  });

  it("nenhuma outra opção menciona combinação", () => {
    const others = metamagicOptions.filter((o) => o.id !== "buscadora" && o.id !== "potencializada");
    for (const option of others) {
      expect(option.printedLine).not.toContain("combina com outra Meta");
    }
  });
});
