import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { InMemoryBuildStore } from "../repositories/inMemory/InMemoryBuildStore.js";
import { generateBuildVersionId, publishConfirmedCharacter } from "./publishConfirmedCharacter.js";

describe("publishConfirmedCharacter — cada confirmação é uma versão nova e imutável", () => {
  it("grava como confirmado, com id de versão novo e o id do personagem como characterId", async () => {
    const repository = new InMemoryBuildStore();
    const character = createBlankCharacter("personagem-1");
    character.classId = "mago";

    const first = await publishConfirmedCharacter(character, repository);
    const second = await publishConfirmedCharacter({ ...character, level: 2 }, repository);

    expect(first.status).toBe("confirmed");
    expect(first.characterId).toBe("personagem-1");
    expect(second.characterId).toBe("personagem-1");
    expect(first.buildId).not.toBe(second.buildId);
    expect(first.buildId).not.toBe("personagem-1");
    expect(repository.size).toBe(2);
    // As estatísticas contam só a versão mais recente do personagem.
    expect(await repository.countBuilds({ classId: "mago" })).toBe(1);
  });

  it("falha do repositório é propagada (quem chama mostra o erro e não marca como confirmado)", async () => {
    const repository = { insertConfirmed: () => Promise.reject(new Error("offline")) };
    await expect(publishConfirmedCharacter(createBlankCharacter("x"), repository)).rejects.toThrow("offline");
  });

  it("ids de versão são UUID v4", () => {
    expect(generateBuildVersionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
