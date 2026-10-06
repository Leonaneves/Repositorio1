import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSpeciesGrantedSpells } from "./speciesLineageSpells.js";

/** Nenhuma entrada de magia de espécie pode inventar círculo/alcance/tempo de conjuração — sempre "". */
function expectNeverInventedFields(entries: ReturnType<typeof getSpeciesGrantedSpells>) {
  for (const entry of entries) {
    expect(entry.circle).toBe("");
    expect(entry.range).toBe("");
    expect(entry.castingTime).toBe("");
    expect(entry.concentration).toBe(false);
    expect(entry.ritual).toBe(false);
    expect(entry.material).toBe(false);
  }
}

describe("getSpeciesGrantedSpells — Draconato/Golias nunca concedem magia", () => {
  it("[] para Draconato e Golias, com ou sem linhagem escolhida", () => {
    const draconato = createBlankCharacter("t");
    draconato.speciesId = "draconato";
    draconato.speciesLineageId = "draconato-vermelho";
    expect(getSpeciesGrantedSpells(draconato)).toEqual([]);

    const golias = createBlankCharacter("t");
    golias.speciesId = "golias";
    golias.speciesLineageId = "golias-fogo";
    expect(getSpeciesGrantedSpells(golias)).toEqual([]);
  });
});

describe("getSpeciesGrantedSpells — Elfo", () => {
  function elfoAt(level: number, lineageId: string, ability: "INT" | "SAB" | "CAR" | null = "SAB") {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.level = level;
    character.speciesLineageId = lineageId;
    character.elvenLineageSpellcastingAbility = ability;
    return character;
  }

  it("sem linhagem escolhida, nenhuma magia", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    expect(getSpeciesGrantedSpells(character)).toEqual([]);
  });

  it("nível 1: só o truque (Alto Elfo → Prestidigitação; Drow → Luzes Dançantes; Floresta → Druidismo)", () => {
    const altoElfo = elfoAt(1, "elfo-alto-elfo");
    expect(altoElfo.level).toBe(1);
    const names1 = getSpeciesGrantedSpells(altoElfo).map((s) => s.name);
    expect(names1).toEqual(["Prestidigitação"]);

    expect(getSpeciesGrantedSpells(elfoAt(1, "elfo-drow")).map((s) => s.name)).toEqual(["Luzes Dançantes"]);
    expect(getSpeciesGrantedSpells(elfoAt(1, "elfo-floresta")).map((s) => s.name)).toEqual(["Druidismo"]);
  });

  it("nível 3: soma a magia de nível 3 (Alto Elfo → Detectar Magia)", () => {
    const names = getSpeciesGrantedSpells(elfoAt(3, "elfo-alto-elfo")).map((s) => s.name);
    expect(names).toEqual(["Prestidigitação", "Detectar Magia"]);
  });

  it("nível 5: soma também a magia de nível 5 (Alto Elfo → Passo Nebuloso)", () => {
    const names = getSpeciesGrantedSpells(elfoAt(5, "elfo-alto-elfo")).map((s) => s.name);
    expect(names).toEqual(["Prestidigitação", "Detectar Magia", "Passo Nebuloso"]);
  });

  it("Drow nos níveis 3/5 → Fogo das Fadas / Escuridão", () => {
    expect(getSpeciesGrantedSpells(elfoAt(3, "elfo-drow")).map((s) => s.name)).toEqual(["Luzes Dançantes", "Fogo das Fadas"]);
    expect(getSpeciesGrantedSpells(elfoAt(5, "elfo-drow")).map((s) => s.name)).toEqual(["Luzes Dançantes", "Fogo das Fadas", "Escuridão"]);
  });

  it("Elfo da Floresta nos níveis 3/5 → Passos Largos / Passos Sem Pegadas", () => {
    expect(getSpeciesGrantedSpells(elfoAt(3, "elfo-floresta")).map((s) => s.name)).toEqual(["Druidismo", "Passos Largos"]);
    expect(getSpeciesGrantedSpells(elfoAt(5, "elfo-floresta")).map((s) => s.name)).toEqual([
      "Druidismo",
      "Passos Largos",
      "Passos Sem Pegadas",
    ]);
  });

  it("nunca inventa círculo/alcance/tempo de conjuração — tudo em notes", () => {
    const entries = getSpeciesGrantedSpells(elfoAt(5, "elfo-alto-elfo"));
    expectNeverInventedFields(entries);
    expect(entries[0].notes).toContain("Truque conhecido");
    expect(entries[1].notes).toContain("Sempre preparada");
    expect(entries[1].notes).toContain("1x sem gasto de espaço");
  });

  it("atributo de conjuração aparece em notes quando definido, some quando null", () => {
    const comAtributo = getSpeciesGrantedSpells(elfoAt(1, "elfo-drow", "CAR"));
    expect(comAtributo[0].notes).toContain("Atributo: Carisma");

    const semAtributo = getSpeciesGrantedSpells(elfoAt(1, "elfo-drow", null));
    expect(semAtributo[0].notes).not.toContain("Atributo:");
  });

  it("Alto Elfo registra a troca de truque pendente de catálogo, sem inventar as opções", () => {
    const entries = getSpeciesGrantedSpells(elfoAt(1, "elfo-alto-elfo"));
    expect(entries[0].notes).toContain("aguarda catálogo");
  });
});

describe("getSpeciesGrantedSpells — Gnomo", () => {
  it("Gnomo da Floresta: Ilusão Menor (truque) + Falar com Animais com usos = Bônus de Proficiência", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.level = 5; // Prof +3
    character.speciesLineageId = "gnomo-floresta";
    const entries = getSpeciesGrantedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Ilusão Menor", "Falar com Animais"]);
    expect(entries[1].notes).toContain("3x sem gasto de espaço");
  });

  it("Gnomo da Rocha: Remendo + Prestidigitação (2 truques, sem usos limitados)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.speciesLineageId = "gnomo-rocha";
    const entries = getSpeciesGrantedSpells(character);
    expect(entries.map((e) => e.name)).toEqual(["Remendo", "Prestidigitação"]);
    for (const entry of entries) expect(entry.notes).toContain("Truque conhecido");
  });

  it("sem linhagem escolhida, nenhuma magia", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    expect(getSpeciesGrantedSpells(character)).toEqual([]);
  });

  it("usa a mesma regra de atributo de Gnomo/Tiefling (classe primeiro, senão maior entre INT/SAB/CAR)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.speciesLineageId = "gnomo-rocha";
    character.classId = "clerigo"; // SAB
    const entries = getSpeciesGrantedSpells(character);
    expect(entries[0].notes).toContain("Atributo: Sabedoria");
  });
});

describe("getSpeciesGrantedSpells — Tiefling", () => {
  function tieflingAt(level: number, lineageId: string) {
    const character = createBlankCharacter("t");
    character.speciesId = "tiefling";
    character.level = level;
    character.speciesLineageId = lineageId;
    return character;
  }

  it("sem linhagem escolhida, nenhuma magia (nem Taumaturgia)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "tiefling";
    expect(getSpeciesGrantedSpells(character)).toEqual([]);
  });

  it("nível 1: Taumaturgia + truque da linhagem (Abissal → Rajada de Veneno)", () => {
    const names = getSpeciesGrantedSpells(tieflingAt(1, "tiefling-abissal")).map((s) => s.name);
    expect(names).toEqual(["Taumaturgia", "Rajada de Veneno"]);
  });

  it("nível 3: soma a magia de nível 3 (Abissal → Raio Nauseante)", () => {
    const names = getSpeciesGrantedSpells(tieflingAt(3, "tiefling-abissal")).map((s) => s.name);
    expect(names).toEqual(["Taumaturgia", "Rajada de Veneno", "Raio Nauseante"]);
  });

  it("nível 5: soma a magia de nível 5 (Abissal → Imobilizar Pessoa)", () => {
    const names = getSpeciesGrantedSpells(tieflingAt(5, "tiefling-abissal")).map((s) => s.name);
    expect(names).toEqual(["Taumaturgia", "Rajada de Veneno", "Raio Nauseante", "Imobilizar Pessoa"]);
  });

  it("Ctônico → Toque Arrepiante / Vitalidade Falsa / Raio do Enfraquecimento", () => {
    expect(getSpeciesGrantedSpells(tieflingAt(5, "tiefling-ctonico")).map((s) => s.name)).toEqual([
      "Taumaturgia",
      "Toque Arrepiante",
      "Vitalidade Falsa",
      "Raio do Enfraquecimento",
    ]);
  });

  it("Infernal → Raio de Fogo / Repreensão Infernal / Escuridão", () => {
    expect(getSpeciesGrantedSpells(tieflingAt(5, "tiefling-infernal")).map((s) => s.name)).toEqual([
      "Taumaturgia",
      "Raio de Fogo",
      "Repreensão Infernal",
      "Escuridão",
    ]);
  });

  it("Taumaturgia e as magias da linhagem usam o MESMO atributo resolvido", () => {
    const character = tieflingAt(1, "tiefling-infernal");
    character.classId = "bruxo"; // CAR
    const entries = getSpeciesGrantedSpells(character);
    for (const entry of entries) expect(entry.notes).toContain("Atributo: Carisma");
  });

  it("nunca inventa círculo/alcance/tempo de conjuração", () => {
    expectNeverInventedFields(getSpeciesGrantedSpells(tieflingAt(5, "tiefling-abissal")));
  });
});
