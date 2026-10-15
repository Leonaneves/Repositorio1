import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, getRangerDruidicWarriorCantripChoiceId } from "../data/features/ranger.js";
import { getRangerAutoPreparedSpells } from "./rangerAutoPreparedSpells.js";

function rangerAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("ranger-auto-spells-test");
  character.classId = "patrulheiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getRangerAutoPreparedSpells", () => {
  it("classe diferente de Patrulheiro — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getRangerAutoPreparedSpells(character)).toEqual([]);
  });

  it("qualquer Patrulheiro, mesmo sem subclasse escolhida: Marca do Predador sempre preparada (Inimigo Favorito, nível 1)", () => {
    const entries = getRangerAutoPreparedSpells(rangerAt(1, null));
    expect(entries.map((e) => e.name)).toEqual(["Marca do Predador"]);
    expect(entries[0].notes).toContain("Inimigo Favorito");
    expect(entries[0].notes).toContain("nível 1");
  });

  it("Caçador e Senhor das Feras não têm magia sempre preparada PRÓPRIA de subclasse — só a Marca do Predador da classe base", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(20, "Caçador")).map((e) => e.name)).toEqual(["Marca do Predador"]);
    expect(getRangerAutoPreparedSpells(rangerAt(20, "Senhor das Feras")).map((e) => e.name)).toEqual(["Marca do Predador"]);
  });

  it("Andarilho Feérico nível 3: Marca do Predador + Enfeitiçar Pessoa, círculo em branco (não fornecido pela fonte)", () => {
    const entries = getRangerAutoPreparedSpells(rangerAt(3, "Andarilho Feérico"));
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("Marca do Predador");
    expect(entries[1].name).toBe("Enfeitiçar Pessoa");
    expect(entries[1].circle).toBe("");
    expect(entries[1].castingTime).toBe("");
    expect(entries[1].range).toBe("");
    expect(entries[1].notes).toContain("Andarilho Feérico");
    expect(entries[1].notes).toContain("nível 3");
  });

  it("Andarilho Feérico: soma uma magia por faixa de nível alcançada, nunca uma à frente (Marca do Predador sempre primeiro)", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(4, "Andarilho Feérico")).map((e) => e.name)).toEqual(["Marca do Predador", "Enfeitiçar Pessoa"]);
    expect(getRangerAutoPreparedSpells(rangerAt(5, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Marca do Predador",
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
    ]);
    expect(getRangerAutoPreparedSpells(rangerAt(9, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Marca do Predador",
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
    ]);
    expect(getRangerAutoPreparedSpells(rangerAt(13, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Marca do Predador",
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
      "Porta Dimensional",
    ]);
    expect(getRangerAutoPreparedSpells(rangerAt(17, "Andarilho Feérico")).map((e) => e.name)).toEqual([
      "Marca do Predador",
      "Enfeitiçar Pessoa",
      "Passo Nebuloso",
      "Convocar Feérico",
      "Porta Dimensional",
      "Despistar",
    ]);
  });

  it("nível abaixo de 3: só Marca do Predador, nenhuma magia de subclasse ainda", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(2, "Andarilho Feérico")).map((e) => e.name)).toEqual(["Marca do Predador"]);
  });

  it("Vigilante das Sombras: soma uma magia por faixa de nível, nos nomes exatos da fonte (Marca do Predador sempre primeiro)", () => {
    expect(getRangerAutoPreparedSpells(rangerAt(3, "Vigilante das Sombras")).map((e) => e.name)).toEqual(["Marca do Predador", "Disfarçar-se"]);
    expect(getRangerAutoPreparedSpells(rangerAt(17, "Vigilante das Sombras")).map((e) => e.name)).toEqual([
      "Marca do Predador",
      "Disfarçar-se",
      "Corda Extradimensional",
      "Medo",
      "Invisibilidade Maior",
      "Similaridade",
    ]);
  });

  it("nunca mistura as listas das duas subclasses", () => {
    const feerico = getRangerAutoPreparedSpells(rangerAt(17, "Andarilho Feérico")).map((e) => e.name);
    const sombras = getRangerAutoPreparedSpells(rangerAt(17, "Vigilante das Sombras")).map((e) => e.name);
    expect(feerico).not.toContain("Disfarçar-se");
    expect(sombras).not.toContain("Enfeitiçar Pessoa");
  });

  it("nunca grava as magias automáticas de volta em character.spellsPrepared", () => {
    const character = rangerAt(17, "Andarilho Feérico");
    getRangerAutoPreparedSpells(character);
    expect(character.spellsPrepared).toEqual([]);
  });

  it("nunca duplica uma magia gratuita — um único contador/entrada por nível, nunca repetida ao consultar de novo", () => {
    const character = rangerAt(17, "Andarilho Feérico");
    const first = getRangerAutoPreparedSpells(character);
    const second = getRangerAutoPreparedSpells(character);
    expect(first).toEqual(second);
    expect(new Set(first.map((e) => e.name)).size).toBe(first.length);
  });

  describe("Combatente Druídico (nível 2, fonte \"COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF\" §4)", () => {
    it("sem a escolha 'Combatente Druídico': só Marca do Predador, nunca trata nomes de truque vazios como escolhas", () => {
      const character = rangerAt(2, null);
      expect(getRangerAutoPreparedSpells(character).map((e) => e.name)).toEqual(["Marca do Predador"]);
    });

    it("com 'Combatente Druídico' escolhido e os 2 truques nomeados: entram na área de Magias, contam como magias de Patrulheiro", () => {
      const character = rangerAt(2, null);
      character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
      character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(1)] = { value: "Raio de Gelo" };
      character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(2)] = { value: "Toque Chocante" };

      const entries = getRangerAutoPreparedSpells(character);
      expect(entries.map((e) => e.name)).toEqual(["Marca do Predador", "Raio de Gelo", "Toque Chocante"]);
      expect(entries[1].notes).toContain("Combatente Druídico");
    });

    it("se escolher 'Estilo de Luta' em vez de 'Combatente Druídico', os truques nunca aparecem mesmo que estejam preenchidos", () => {
      const character = rangerAt(2, null);
      character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Estilo de Luta" };
      character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(1)] = { value: "Raio de Gelo" };

      expect(getRangerAutoPreparedSpells(character).map((e) => e.name)).toEqual(["Marca do Predador"]);
    });

    it("truque em branco (só espaços) nunca entra como entrada vazia", () => {
      const character = rangerAt(2, null);
      character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
      character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(1)] = { value: "   " };
      character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(2)] = { value: "Orientação" };

      expect(getRangerAutoPreparedSpells(character).map((e) => e.name)).toEqual(["Marca do Predador", "Orientação"]);
    });
  });
});
