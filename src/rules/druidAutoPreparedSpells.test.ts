import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ORDEM_PRIMAL_CHOICE_ID, XAMA_TRUQUE_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";
import { getDruidAutoPreparedSpells } from "./druidAutoPreparedSpells.js";

function druidAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("druid-auto-spells-test");
  character.classId = "druida";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

describe("getDruidAutoPreparedSpells", () => {
  it("classe diferente de Druida — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 20;
    expect(getDruidAutoPreparedSpells(character)).toEqual([]);
  });

  it("nível 1, sem subclasse: só Falar com Animais (Idioma Druídico)", () => {
    const entries = getDruidAutoPreparedSpells(druidAt(1, null));
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Falar com Animais");
    expect(entries[0].circle).toBe("");
    expect(entries[0].notes).toContain("Idioma Druídico");
  });

  it("nível 2+: soma Convocar Familiar (Companheiro Selvagem)", () => {
    const entries = getDruidAutoPreparedSpells(druidAt(2, null));
    const convocar = entries.find((e) => e.name === "Convocar Familiar")!;
    expect(convocar).toBeDefined();
    expect(convocar.notes).toContain("1 espaço OU 1 FS");
    expect(convocar.notes).toContain("Feérico");
  });

  it("Círculo da Lua nível 3: magias de nível 3, sempre preparadas e marcadas como conjuráveis em FS", () => {
    const entries = getDruidAutoPreparedSpells(druidAt(3, "Círculo da Lua"));
    const names = entries.map((e) => e.name);
    expect(names).toContain("Curar Ferimentos");
    expect(names).toContain("Fagulha Estelar");
    expect(names).toContain("Raio Lunar");
    const raioLunar = entries.find((e) => e.name === "Raio Lunar")!;
    expect(raioLunar.notes).toContain("Círculo da Lua");
    expect(raioLunar.notes).toContain("pode conjurar em FS");
  });

  it("Círculo da Lua nível 9: soma as 4 faixas (3/5/7/9)", () => {
    const entries = getDruidAutoPreparedSpells(druidAt(9, "Círculo da Lua"));
    const moonSpellCount = entries.filter((e) => e.notes.includes("Círculo da Lua")).length;
    expect(moonSpellCount).toBe(3 + 1 + 1 + 1);
  });

  it("Círculo da Terra sem terreno escolhido: nenhuma magia de DOMÍNIO ainda (nunca inventa um terreno padrão) — só Falar com Animais/Convocar Familiar, da classe base", () => {
    const names = getDruidAutoPreparedSpells(druidAt(5, "Círculo da Terra")).map((e) => e.name);
    expect(names).toEqual(["Falar com Animais", "Convocar Familiar"]);
  });

  it("Círculo da Terra com terreno Árido: lista correta de Árido, não de outro terreno", () => {
    const character = druidAt(3, "Círculo da Terra");
    character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Árido" };
    const names = getDruidAutoPreparedSpells(character).map((e) => e.name);
    expect(names).toEqual(["Falar com Animais", "Convocar Familiar", "Mãos Flamejantes", "Raio de Fogo", "Turvar"]);
  });

  it("trocar de terreno troca a lista efetiva (Polar em vez de Árido)", () => {
    const character = druidAt(3, "Círculo da Terra");
    character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Árido" };
    expect(getDruidAutoPreparedSpells(character).map((e) => e.name)).toContain("Mãos Flamejantes");

    character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Polar" };
    const names = getDruidAutoPreparedSpells(character).map((e) => e.name);
    expect(names).toContain("Paralisar Pessoa");
    expect(names).not.toContain("Mãos Flamejantes");
  });

  it("Círculo do Mar nível 3/5/7/9: listas corretas por nível", () => {
    expect(getDruidAutoPreparedSpells(druidAt(3, "Círculo do Mar")).map((e) => e.name)).toEqual([
      "Falar com Animais",
      "Convocar Familiar",
      "Despedaçar",
      "Lufada de Vento",
      "Névoa Obscurecente",
      "Onda Trovejante",
      "Raio de Gelo",
    ]);
    const names9 = getDruidAutoPreparedSpells(druidAt(9, "Círculo do Mar")).map((e) => e.name);
    expect(names9).toContain("Invocar Elemental");
    expect(names9).toContain("Paralisar Monstro");
  });

  it("Círculo das Estrelas nível 3+: Mapa Estelar concede Orientação + Raio Guia com usos gratuitos = SAB mínimo 1", () => {
    const character = druidAt(3, "Círculo das Estrelas");
    character.abilities.SAB.score = 8; // -1 → mínimo 1
    const entries = getDruidAutoPreparedSpells(character);
    expect(entries.some((e) => e.name === "Orientação")).toBe(true);
    const raioGuia = entries.find((e) => e.name === "Raio Guia")!;
    expect(raioGuia.notes).toContain("1x/DL");
  });

  it("Círculo das Estrelas: nunca tem lista de 'Magias do Círculo' por nível (não existe nesta subclasse)", () => {
    const entries = getDruidAutoPreparedSpells(druidAt(9, "Círculo das Estrelas"));
    expect(entries.map((e) => e.name)).toEqual(["Falar com Animais", "Convocar Familiar", "Orientação", "Raio Guia"]);
  });

  it("Xamã com Truque escolhido: entra como sempre preparado", () => {
    const character = druidAt(1, null);
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    character.featureChoiceSelections[XAMA_TRUQUE_CHOICE_ID] = { value: "Produzir Chama" };
    const entries = getDruidAutoPreparedSpells(character);
    const truque = entries.find((e) => e.name === "Produzir Chama")!;
    expect(truque).toBeDefined();
    expect(truque.notes).toContain("Xamã");
  });

  it("Protetor escolhido: nunca adiciona um Truque extra", () => {
    const character = druidAt(1, null);
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Protetor" };
    character.featureChoiceSelections[XAMA_TRUQUE_CHOICE_ID] = { value: "Produzir Chama" };
    expect(getDruidAutoPreparedSpells(character).some((e) => e.name === "Produzir Chama")).toBe(false);
  });
});
