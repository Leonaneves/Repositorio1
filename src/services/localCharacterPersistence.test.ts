import { beforeEach, describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { loadStoredCharacter, saveStoredCharacter } from "./localCharacterPersistence.js";

const STORAGE_KEY = "ficha-dnd:character";

beforeEach(() => {
  localStorage.clear();
});

describe("saveStoredCharacter/loadStoredCharacter — persistência local (fonte §5)", () => {
  it("sem nada salvo ainda: devolve null", () => {
    expect(loadStoredCharacter()).toBeNull();
  });

  it("salvar e recarregar devolve o MESMO personagem (mesmo id) e o snapshot de confirmação", () => {
    const character = createBlankCharacter("meu-personagem");
    character.classId = "mago";
    saveStoredCharacter(character, "snapshot-exemplo");

    const loaded = loadStoredCharacter();
    expect(loaded).not.toBeNull();
    expect(loaded!.character.id).toBe("meu-personagem");
    expect(loaded!.character.classId).toBe("mago");
    expect(loaded!.confirmedBuildSnapshot).toBe("snapshot-exemplo");
  });

  it("confirmedBuildSnapshot null é preservado como null (nunca vira string)", () => {
    const character = createBlankCharacter("x");
    saveStoredCharacter(character, null);
    expect(loadStoredCharacter()!.confirmedBuildSnapshot).toBeNull();
  });

  it("JSON corrompido no localStorage: nunca lança, devolve null", () => {
    localStorage.setItem(STORAGE_KEY, "{ isto não é JSON válido");
    expect(loadStoredCharacter()).toBeNull();
  });

  it("schemaVersion de outra versão é tratado como ausente (nunca migração parcial)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 999, character: createBlankCharacter("x"), confirmedBuildSnapshot: null }),
    );
    expect(loadStoredCharacter()).toBeNull();
  });

  it("personagem com campo essencial faltando (abilities) é rejeitado, nunca quebra a abertura do Builder", () => {
    const broken = { id: "x", level: 1, featureChoiceSelections: {}, asiSelections: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, character: broken, confirmedBuildSnapshot: null }));
    expect(loadStoredCharacter()).toBeNull();
  });

  it("criar um novo personagem (novo id) e salvar sobrescreve o anterior — recarregar restaura o novo, não o antigo", () => {
    saveStoredCharacter(createBlankCharacter("personagem-antigo"), "snapshot-antigo");
    saveStoredCharacter(createBlankCharacter("personagem-novo"), null);

    const loaded = loadStoredCharacter();
    expect(loaded!.character.id).toBe("personagem-novo");
    expect(loaded!.confirmedBuildSnapshot).toBeNull();
  });
});
