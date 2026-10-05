import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getSorcererAutoPreparedSpells } from "./sorcererAutoPreparedSpells.js";

function sorcererAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("sorcerer-auto-spells-test");
  character.classId = "feiticeiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getSorcererAutoPreparedSpells", () => {
  it("classe diferente de Feiticeiro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getSorcererAutoPreparedSpells(character)).toEqual([]);
  });

  it("sem subclasse — []", () => {
    expect(getSorcererAutoPreparedSpells(sorcererAt(20, null))).toEqual([]);
  });

  it("Feitiçaria Selvagem nunca concede magia (sem lista de Magias nesta subclasse)", () => {
    expect(getSorcererAutoPreparedSpells(sorcererAt(20, "Feitiçaria Selvagem"))).toEqual([]);
  });

  it("Feitiçaria Aberrante nível 3: magias de nível 3, todas sempre preparadas, círculo em branco", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(3, "Feitiçaria Aberrante"));
    expect(entries.map((e) => e.name)).toEqual(["Acalmar Emoções", "Braços de Hadar", "Detectar Pensamentos", "Sussurros Dissonantes", "Talho Mental"]);
    for (const entry of entries) {
      expect(entry.circle).toBe("");
      expect(entry.notes).toContain("Feitiçaria Aberrante");
    }
  });

  it("Feitiçaria Aberrante nível 9: soma as 4 faixas (3/5/7/9)", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(9, "Feitiçaria Aberrante"));
    expect(entries).toHaveLength(5 + 2 + 2 + 2);
  });

  it("Feitiçaria Aberrante abaixo do nível 6: notas sem menção a Feitiçaria Psiônica", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(3, "Feitiçaria Aberrante"));
    for (const entry of entries) expect(entry.notes).not.toContain("Feitiçaria Psiônica");
  });

  it("Feitiçaria Aberrante nível 6+: notas de todas as Magias Psiônicas ganham a modificação de Feitiçaria Psiônica", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(6, "Feitiçaria Aberrante"));
    for (const entry of entries) expect(entry.notes).toContain("Feitiçaria Psiônica: pode conjurar com PF = círculo, sem V/S, M só custo/consumido");
  });

  it("Feitiçaria Dracônica nível 9: inclui Invocar Dragão sem modificação de Companheiro Dracônico (nível < 18)", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(9, "Feitiçaria Dracônica"));
    const invocar = entries.find((e) => e.name === "Invocar Dragão")!;
    expect(invocar.notes).not.toContain("Companheiro Dracônico");
  });

  it("Feitiçaria Dracônica nível 18: Invocar Dragão ganha a modificação de Companheiro Dracônico nas notas", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(18, "Feitiçaria Dracônica"));
    const invocar = entries.find((e) => e.name === "Invocar Dragão")!;
    expect(invocar.notes).toContain("Companheiro Dracônico");
    expect(invocar.notes).toContain("sem Material");
  });

  it("Feitiçaria Dracônica: outras magias nunca recebem a nota de Companheiro Dracônico", () => {
    const entries = getSorcererAutoPreparedSpells(sorcererAt(18, "Feitiçaria Dracônica"));
    const others = entries.filter((e) => e.name !== "Invocar Dragão");
    for (const entry of others) expect(entry.notes).not.toContain("Companheiro Dracônico");
  });

  it("Feitiçaria Mecânica nível 3/5/7/9: listas corretas por nível", () => {
    expect(getSorcererAutoPreparedSpells(sorcererAt(3, "Feitiçaria Mecânica")).map((e) => e.name)).toEqual([
      "Alarme",
      "Auxílio",
      "Proteção Contra o Bem e o Mal",
      "Restauração Menor",
    ]);
    const names9 = getSorcererAutoPreparedSpells(sorcererAt(9, "Feitiçaria Mecânica")).map((e) => e.name);
    expect(names9).toContain("Muralha de Energia");
    expect(names9).toContain("Restauração Maior");
  });

  it("nível abaixo do 3: nenhuma magia de subclasse ainda", () => {
    expect(getSorcererAutoPreparedSpells(sorcererAt(2, "Feitiçaria Mecânica"))).toEqual([]);
  });
});
