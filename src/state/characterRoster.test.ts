import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Meus personagens" (fonte "CONFIRMAR PERSONAGENS SEM ALTERAR OS
 * ANTERIORES") — mesmo padrão de `characterStorePersistence.test.ts`:
 * `vi.resetModules` + import dinâmico simulam recarregar a página no
 * mesmo navegador.
 */

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function loadStore() {
  return (await import("./characterStore.js")).useCharacterStore;
}

describe("Meus personagens — vários personagens no mesmo navegador", () => {
  it("'Novo personagem' guarda o atual na lista e começa outro, em branco, com id novo", async () => {
    const store = await loadStore();
    store.getState().setClass("mago");
    store.getState().setName("Elara");
    const firstId = store.getState().character.id;

    store.getState().startNewCharacter();

    expect(store.getState().character.id).not.toBe(firstId);
    expect(store.getState().character.classId).toBeNull();
    expect(store.getState().otherCharacters.map((entry) => entry.character.id)).toEqual([firstId]);
  });

  it("personagem ainda em branco nunca entra na lista (Novo personagem repetido não acumula vazios)", async () => {
    const store = await loadStore();
    store.getState().startNewCharacter();
    store.getState().startNewCharacter();
    expect(store.getState().otherCharacters).toEqual([]);
  });

  it("abrir um personagem salvo troca o ativo e guarda o que estava aberto, com a confirmação de cada um", async () => {
    const store = await loadStore();
    store.getState().setClass("mago");
    store.getState().confirmCharacter();
    const magoId = store.getState().character.id;
    const magoSnapshot = store.getState().confirmedBuildSnapshot;

    store.getState().startNewCharacter();
    store.getState().setClass("barbaro");
    const barbaroId = store.getState().character.id;

    store.getState().openCharacter(magoId);

    expect(store.getState().character.id).toBe(magoId);
    expect(store.getState().character.classId).toBe("mago");
    expect(store.getState().confirmedBuildSnapshot).toBe(magoSnapshot);
    expect(store.getState().otherCharacters.map((entry) => entry.character.id)).toEqual([barbaroId]);
  });

  it("excluir o ativo abre o mais recente da lista; excluir o último deixa um personagem em branco", async () => {
    const store = await loadStore();
    store.getState().setClass("mago");
    const magoId = store.getState().character.id;
    store.getState().startNewCharacter();
    store.getState().setClass("barbaro");
    const barbaroId = store.getState().character.id;

    store.getState().deleteCharacter(barbaroId);
    expect(store.getState().character.id).toBe(magoId);
    expect(store.getState().otherCharacters).toEqual([]);

    store.getState().deleteCharacter(magoId);
    expect(store.getState().character.classId).toBeNull();
    expect(store.getState().character.id).not.toBe(magoId);
  });

  it("excluir um personagem que não está aberto só o remove da lista", async () => {
    const store = await loadStore();
    store.getState().setClass("mago");
    const magoId = store.getState().character.id;
    store.getState().startNewCharacter();
    store.getState().setClass("barbaro");
    const barbaroId = store.getState().character.id;

    store.getState().deleteCharacter(magoId);
    expect(store.getState().character.id).toBe(barbaroId);
    expect(store.getState().otherCharacters).toEqual([]);
  });

  it("a lista inteira (e qual está aberto) sobrevive a recarregar a página", async () => {
    const before = await loadStore();
    before.getState().setClass("mago");
    const magoId = before.getState().character.id;
    before.getState().confirmCharacter();
    before.getState().startNewCharacter();
    before.getState().setClass("barbaro");
    const barbaroId = before.getState().character.id;

    vi.resetModules();
    const after = await loadStore();

    expect(after.getState().character.id).toBe(barbaroId);
    expect(after.getState().otherCharacters.map((entry) => entry.character.id)).toEqual([magoId]);
    expect(after.getState().otherCharacters[0].confirmedBuildSnapshot).not.toBeNull();
  });

  it("personagem salvo no formato antigo (um só) vira o primeiro da lista ao abrir a nova versão do site", async () => {
    const legacy = await loadStore();
    legacy.getState().setClass("mago");
    const legacyCharacter = legacy.getState().character;
    localStorage.clear();
    localStorage.setItem("ficha-dnd:character", JSON.stringify({ schemaVersion: 1, character: legacyCharacter, confirmedBuildSnapshot: null }));

    vi.resetModules();
    const store = await loadStore();
    expect(store.getState().character.id).toBe(legacyCharacter.id);
    expect(store.getState().character.classId).toBe("mago");
  });

  it("entrada corrompida é descartada sem derrubar as demais", async () => {
    const before = await loadStore();
    before.getState().setClass("mago");
    const magoId = before.getState().character.id;
    const stored = JSON.parse(localStorage.getItem("ficha-dnd:characters")!);
    stored.entries.push({ character: { id: 42 }, confirmedBuildSnapshot: null, savedAt: "x" });
    localStorage.setItem("ficha-dnd:characters", JSON.stringify(stored));

    vi.resetModules();
    const after = await loadStore();
    expect(after.getState().character.id).toBe(magoId);
    expect(after.getState().otherCharacters).toEqual([]);
  });
});
