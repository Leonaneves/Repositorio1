import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getWarlockAutoPreparedSpells } from "./warlockAutoPreparedSpells.js";

function warlockAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("warlock-auto-spells-test");
  character.classId = "bruxo";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getWarlockAutoPreparedSpells", () => {
  it("classe diferente de Bruxo — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getWarlockAutoPreparedSpells(character)).toEqual([]);
  });

  it("Patrono Celestial nível 3: magias da lista de nível 3, todas marcadas sempre preparadas", () => {
    const entries = getWarlockAutoPreparedSpells(warlockAt(3, "Patrono Celestial"));
    const names = entries.map((e) => e.name);
    expect(names).toEqual(["Auxílio", "Chama Sagrada", "Curar Ferimentos", "Luz", "Raio Guia", "Restauração Menor"]);
    for (const entry of entries) {
      expect(entry.circle).toBe("");
      expect(entry.notes).toContain("Patrono Celestial");
    }
  });

  it("Patrono Celestial nível 9: soma as 4 faixas de magias do patrono (3/5/7/9) + Contato Extraplanar (Contatar Patrono, nível 9)", () => {
    const entries = getWarlockAutoPreparedSpells(warlockAt(9, "Patrono Celestial"));
    expect(entries).toHaveLength(6 + 2 + 2 + 2 + 1);
    expect(entries.filter((e) => e.name === "Contato Extraplanar")).toHaveLength(1);
  });

  it("Patrono Grande Antigo nível 7: inclui Invocar Aberração sem modificação de Criar Servo (nível < 14)", () => {
    const entries = getWarlockAutoPreparedSpells(warlockAt(7, "Patrono Grande Antigo"));
    const invocar = entries.find((e) => e.name === "Invocar Aberração")!;
    expect(invocar.notes).not.toContain("Criar Servo");
  });

  it("Patrono Grande Antigo nível 14: Invocar Aberração ganha a modificação de Criar Servo nas notas", () => {
    const entries = getWarlockAutoPreparedSpells(warlockAt(14, "Patrono Grande Antigo"));
    const invocar = entries.find((e) => e.name === "Invocar Aberração")!;
    expect(invocar.notes).toContain("Criar Servo");
  });

  it("Patrono Grande Antigo nível 10: Danação Mística adiciona 'Danação' sempre preparada (não está na lista padrão)", () => {
    const entries9 = getWarlockAutoPreparedSpells(warlockAt(9, "Patrono Grande Antigo"));
    expect(entries9.some((e) => e.name === "Danação")).toBe(false);

    const entries10 = getWarlockAutoPreparedSpells(warlockAt(10, "Patrono Grande Antigo"));
    const danacao = entries10.find((e) => e.name === "Danação")!;
    expect(danacao).toBeDefined();
    expect(danacao.notes).toContain("Desv");
  });

  it("Contatar Patrono (nível 9+, qualquer subclasse): Contato Extraplanar sempre preparada", () => {
    const below = getWarlockAutoPreparedSpells(warlockAt(8, "Patrono Ínfero"));
    expect(below.some((e) => e.name === "Contato Extraplanar")).toBe(false);

    const at = getWarlockAutoPreparedSpells(warlockAt(9, "Patrono Ínfero"));
    const contato = at.find((e) => e.name === "Contato Extraplanar")!;
    expect(contato.notes).toContain("1×/DL");
    expect(contato.notes).toContain("sucesso automático");
  });

  it("invocações que concedem magia sem espaço aparecem como sempre preparadas", () => {
    const character = warlockAt(5, null);
    character.chosenInvocations.push({ invocationId: "mascara-das-muitas-faces", subChoice: "" }, { invocationId: "pacto-da-corrente", subChoice: "" });
    const entries = getWarlockAutoPreparedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Disfarçar-se", "Convocar Familiar"]);
  });

  it("Vigor Ínfero: nota explica que nunca rola o dado, recebe o máximo", () => {
    const character = warlockAt(2, null);
    character.chosenInvocations.push({ invocationId: "vigor-infero", subChoice: "" });
    const entry = getWarlockAutoPreparedSpells(character).find((e) => e.name === "Vitalidade Vazia")!;
    expect(entry.notes).toContain("nunca rola o dado");
  });

  it("invocações sem concessão de magia (ex.: Mente Mística) não geram entrada", () => {
    const character = warlockAt(5, null);
    character.chosenInvocations.push({ invocationId: "mente-mistica", subChoice: "" });
    expect(getWarlockAutoPreparedSpells(character)).toEqual([]);
  });

  it("Patrono Arquifada/Ínfero/Grande Antigo abaixo do nível 3: nenhuma magia de patrono ainda", () => {
    expect(getWarlockAutoPreparedSpells(warlockAt(2, "Patrono Arquifada"))).toEqual([]);
  });
});
