import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ORDEM_DIVINA_CHOICE_ID, TAUMATURGO_TRUQUE_CHOICE_ID } from "../data/features/cleric.js";
import { getClericAutoPreparedSpells } from "./clericAutoPreparedSpells.js";

function clericAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("cleric-auto-spells-test");
  character.classId = "clerigo";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getClericAutoPreparedSpells", () => {
  it("classe diferente de Clérigo — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getClericAutoPreparedSpells(character)).toEqual([]);
  });

  it("Domínio da Guerra nível 3: magias de nível 3, todas sempre preparadas, círculo em branco (não fornecido pela fonte)", () => {
    const entries = getClericAutoPreparedSpells(clericAt(3, "Domínio da Guerra"));
    expect(entries.map((e) => e.name)).toEqual(["Arma Espiritual", "Arma Mágica", "Escudo da Fé", "Raio Guia"]);
    for (const entry of entries) {
      expect(entry.circle).toBe("");
      expect(entry.notes).toContain("Domínio da Guerra");
    }
  });

  it("Domínio da Guerra nível 9: soma as 4 faixas (3/5/7/9)", () => {
    const entries = getClericAutoPreparedSpells(clericAt(9, "Domínio da Guerra"));
    expect(entries).toHaveLength(4 + 2 + 2 + 2);
    expect(entries.map((e) => e.name)).toContain("Golpe de Arço");
    expect(entries.map((e) => e.name)).toContain("Paralisar Monstro");
  });

  it("Domínio da Luz: nível 3/5/7/9 corretos", () => {
    expect(getClericAutoPreparedSpells(clericAt(3, "Domínio da Luz")).map((e) => e.name)).toEqual([
      "Fogo das Fadas",
      "Mãos Ardentes",
      "Raio Ardente",
      "Ver o Invisível",
    ]);
    expect(getClericAutoPreparedSpells(clericAt(9, "Domínio da Luz")).map((e) => e.name)).toContain("Coluna de Chamas");
  });

  it("Domínio da Trapaça: nível 3/5/7/9 corretos", () => {
    expect(getClericAutoPreparedSpells(clericAt(3, "Domínio da Trapaça")).map((e) => e.name)).toEqual([
      "Disfarçar-se",
      "Enfeitiçar Pessoa",
      "Invisibilidade",
      "Passo Sem Rastro",
    ]);
    expect(getClericAutoPreparedSpells(clericAt(9, "Domínio da Trapaça")).map((e) => e.name)).toContain("Modificar Memória");
  });

  it("Domínio da Vida: nível 3/5/7/9 corretos", () => {
    expect(getClericAutoPreparedSpells(clericAt(3, "Domínio da Vida")).map((e) => e.name)).toEqual([
      "Auxílio",
      "Bênção",
      "Curar Ferimentos",
      "Restauração Menor",
    ]);
    expect(getClericAutoPreparedSpells(clericAt(9, "Domínio da Vida")).map((e) => e.name)).toContain("Curar Ferimentos em Massa");
  });

  it("nível abaixo do 3: nenhuma magia de domínio ainda", () => {
    expect(getClericAutoPreparedSpells(clericAt(2, "Domínio da Vida"))).toEqual([]);
  });

  it("sem subclasse escolhida: nenhuma magia de domínio", () => {
    expect(getClericAutoPreparedSpells(clericAt(20, null))).toEqual([]);
  });

  it("Taumaturgo com Truque escolhido: entra como sempre preparado", () => {
    const character = clericAt(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID] = { value: "Chama Sagrada" };
    const entries = getClericAutoPreparedSpells(character);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Chama Sagrada");
    expect(entries[0].notes).toContain("Taumaturgo");
  });

  it("Protetor escolhido: nunca adiciona um Truque extra", () => {
    const character = clericAt(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Protetor" };
    character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID] = { value: "Chama Sagrada" };
    expect(getClericAutoPreparedSpells(character)).toEqual([]);
  });

  it("Taumaturgo escolhido mas Truque ainda em branco: nenhuma entrada inventada", () => {
    const character = clericAt(1, null);
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getClericAutoPreparedSpells(character)).toEqual([]);
  });

  it("Taumaturgo + Magias de Domínio juntos: soma ambos, sem duplicar nada", () => {
    const character = clericAt(5, "Domínio da Vida");
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID] = { value: "Chama Sagrada" };
    const entries = getClericAutoPreparedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Auxílio", "Bênção", "Curar Ferimentos", "Restauração Menor", "Palavra Curativa em Massa", "Revivificar", "Chama Sagrada"]);
  });
});
