import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Simula "recarregar a página" reimportando `characterStore.ts` do zero
 * (`vi.resetModules` + `import()` dinâmico) — o módulo lê
 * `localStorage` na inicialização (`loadStoredCharacter`), então um
 * import novo é o equivalente, em teste, a abrir o Builder de novo no
 * mesmo navegador (fonte "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS
 * RECOMENDAÇÕES" §5). Único arquivo que usa esse padrão — os demais
 * testes de `characterStore` usam o import estático normal, que nunca
 * precisa reexecutar o módulo.
 */

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("useCharacterStore — sobrevive a um 'recarregamento' (fonte §5)", () => {
  it("sem nada salvo ainda: abre com um personagem novo, em branco", async () => {
    const { useCharacterStore } = await import("./characterStore.js");
    expect(useCharacterStore.getState().character.classId).toBeNull();
    expect(useCharacterStore.getState().confirmedBuildSnapshot).toBeNull();
  });

  it("editar o personagem e 'recarregar' restaura o MESMO personagem (mesmo id e escolhas)", async () => {
    const { useCharacterStore: beforeReload } = await import("./characterStore.js");
    beforeReload.getState().setClass("mago");
    beforeReload.getState().setLevel(7);
    const originalId = beforeReload.getState().character.id;

    vi.resetModules();
    const { useCharacterStore: afterReload } = await import("./characterStore.js");

    expect(afterReload.getState().character.id).toBe(originalId);
    expect(afterReload.getState().character.classId).toBe("mago");
    expect(afterReload.getState().character.level).toBe(7);
  });

  it("criar um personagem novo (resetCharacter) e 'recarregar' restaura o NOVO, nunca o anterior", async () => {
    const { useCharacterStore: beforeReset } = await import("./characterStore.js");
    beforeReset.getState().setClass("mago");
    const oldId = beforeReset.getState().character.id;

    beforeReset.getState().resetCharacter();
    const newId = beforeReset.getState().character.id;
    expect(newId).not.toBe(oldId);

    vi.resetModules();
    const { useCharacterStore: afterReload } = await import("./characterStore.js");
    expect(afterReload.getState().character.id).toBe(newId);
    expect(afterReload.getState().character.classId).toBeNull();
  });

  it("confirmar o personagem e 'recarregar' preserva a confirmação (nenhuma mudança real desde então)", async () => {
    const { useCharacterStore: beforeReload } = await import("./characterStore.js");
    beforeReload.getState().setClass("mago");
    beforeReload.getState().confirmCharacter();

    vi.resetModules();
    const { useCharacterStore: afterReload } = await import("./characterStore.js");
    const { isConfirmationStillValid } = await import("../services/buildConfirmation.js");

    expect(afterReload.getState().confirmedBuildSnapshot).not.toBeNull();
    expect(isConfirmationStillValid(afterReload.getState().character, afterReload.getState().confirmedBuildSnapshot)).toBe(true);
  });

  it("dado local corrompido no armazenamento nunca quebra a abertura do Builder — abre em branco", async () => {
    localStorage.setItem("ficha-dnd:character", "{ não é JSON válido");
    const { useCharacterStore } = await import("./characterStore.js");
    expect(useCharacterStore.getState().character.classId).toBeNull();
  });
});
