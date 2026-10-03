import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";
import { getDruidSubclassPrintedBlocks } from "./druidSubclassPrintedFeatures.js";
import { getDruidPrintedBlocks } from "./druidPrintedFeatures.js";

const SUBCLASSES = {
  lua: "Círculo da Lua",
  terra: "Círculo da Terra",
  estrelas: "Círculo das Estrelas",
  mar: "Círculo do Mar",
} as const;

function druidAt(level: number, subclassFullName: string | null, wisdom = 14): Character {
  const character = createBlankCharacter("druid-subclass-print-test");
  character.classId = "druida";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

function chooseTerrain(character: Character, terrain: string): void {
  character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: terrain };
}

describe("sem subclasse escolhida", () => {
  it("devolve []", () => {
    expect(getDruidSubclassPrintedBlocks(druidAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/10/14)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3 (exceto Passo Lunar, que começa no 10)", (subclass) => {
    expect(getDruidSubclassPrintedBlocks(druidAt(2, subclass))).toEqual([]);
  });
});

describe("Círculo da Lua", () => {
  it("Passo Lunar (10): checkbox = mod. SAB, mínimo 1", () => {
    const highWis = getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.lua, 18)).find((b) => b.text.includes("Passo Lunar"))!.text; // +4
    expect(highWis).toContain("#Passo Lunar [__][__][__][__]");

    const lowWis = getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.lua, 8)).find((b) => b.text.includes("Passo Lunar"))!.text; // -1
    expect(lowWis).toContain("#Passo Lunar [__]");
  });

  it("Passo Lunar nível 10-13: sem Luar Compartilhado", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.lua)).find((b) => b.text.includes("Passo Lunar"))!.text; // SAB 14 → +2
    expect(text).toBe(["#Passo Lunar [__][__]", "AB: teleporte 9m; Vant no próx Atq deste turno", "Todos/DL; espaço 2o+ -> +1 uso"].join("\n"));
  });

  it("Forma Lunar (14): atualiza Passo Lunar com Luar Compartilhado — nunca um bloco '#Forma Lunar'", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(14, SUBCLASSES.lua));
    const passoLunar = blocks.filter((b) => b.text.includes("Passo Lunar"));
    expect(passoLunar).toHaveLength(1);
    expect(passoLunar[0].text).toContain("Pode levar 1 aliado voluntário a 3m; surge até 3m do destino");
    expect(blocks.some((b) => b.text.includes("Forma Lunar"))).toBe(false);
  });
});

describe("Círculo da Terra", () => {
  it("Auxílio da Terra (3): dano/cura = 2d6 nos níveis 3-9", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(5, SUBCLASSES.terra)).find((b) => b.text.includes("Auxílio da Terra"))!.text;
    expect(text).toBe(["#Auxílio da Terra", "1 FS, Ação, ponto 18m/raio 3m", "Escolhidos Salv CON -> 2d6 Necr, sucesso 1/2; 1 alvo cura 2d6"].join("\n"));
  });

  it("Auxílio da Terra: 3d6 nos níveis 10-13, 4d6 no 14+", () => {
    expect(getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.terra)).find((b) => b.text.includes("Auxílio da Terra"))!.text).toContain("3d6");
    expect(getDruidSubclassPrintedBlocks(druidAt(14, SUBCLASSES.terra)).find((b) => b.text.includes("Auxílio da Terra"))!.text).toContain("4d6");
  });

  it("Recuperação Natural (6): 2 caixas independentes, círculos = ceil(nível/2)", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(6, SUBCLASSES.terra)).find((b) => b.text.includes("Recuperação Natural"))!.text;
    expect(text).toBe(
      ["#Recuperação Natural", "> [__] 1 magia do Círculo 1o+ sem espaço. 1/DL", "> [__] DC: recupere até 3 círculos de espaços, máx 5o. 1/DL"].join("\n"),
    );
  });

  it("Recuperação Natural nível 9: ceil(9/2) = 5 círculos", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(9, SUBCLASSES.terra)).find((b) => b.text.includes("Recuperação Natural"))!.text;
    expect(text).toContain("5 círculos");
  });

  it("Proteção Natural (10): Resistência resolvida por terreno, nunca a chave {ResTerreno}", () => {
    const character = druidAt(10, SUBCLASSES.terra);
    chooseTerrain(character, "Árido");
    const text = getDruidSubclassPrintedBlocks(character).find((b) => b.text.includes("Proteção Natural"))!.text;
    expect(text).toBe("#Proteção Natural - Árido\nImune Enven; Res Ígneo");
  });

  it.each([
    ["Árido", "Ígneo"],
    ["Polar", "Gélido"],
    ["Temperado", "Elétrico"],
    ["Tropical", "Venenoso"],
  ])("Proteção Natural: %s -> Res %s", (terrain, resistance) => {
    const character = druidAt(10, SUBCLASSES.terra);
    chooseTerrain(character, terrain);
    const text = getDruidSubclassPrintedBlocks(character).find((b) => b.text.includes("Proteção Natural"))!.text;
    expect(text).toContain(`Res ${resistance}`);
  });

  it("Proteção Natural sem terreno escolhido: bloco não aparece (nunca resolve com valor inventado)", () => {
    const character = druidAt(10, SUBCLASSES.terra);
    expect(getDruidSubclassPrintedBlocks(character).some((b) => b.text.includes("Proteção Natural"))).toBe(false);
  });

  it("Santuário Natural (14): texto estático", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(14, SUBCLASSES.terra)).find((b) => b.text.includes("Santuário Natural"))!.text;
    expect(text).toBe(
      ["#Santuário Natural", "1 FS, Ação: Cubo 4,5m até 36m por 1 min", "Você/aliados: Cob Parc; aliados ganham sua Res do terreno", "AB -> move Cubo 18m, mantendo até 36m"].join(
        "\n",
      ),
    );
  });
});

describe("Círculo das Estrelas", () => {
  it("Forma Estrelada (3-9): 1d8, sem troca de constelação, sem Resistência", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(5, SUBCLASSES.estrelas)).find((b) => b.text.includes("Forma Estrelada"))!.text;
    expect(text).toBe(
      [
        "#Forma Estrelada",
        "1 FS, AB, 10 min; escolha:",
        "> Arqueiro: ao ativar e AB -> Atq mágico 18m, 1d8+SAB Rad",
        "> Dragão: testes INT/SAB e Salv CON Concent, d20 9 ou menos = 10",
        "> Taça: magia com espaço que cura -> você/alvo 9m cura 1d8+SAB",
      ].join("\n"),
    );
  });

  it("Constelações Cintilantes (10): 2d8, Dragão com Voo/paira, troca de constelação por turno — nunca bloco próprio", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.estrelas));
    const formaEstrelada = blocks.filter((b) => b.text.includes("Forma Estrelada"));
    expect(formaEstrelada).toHaveLength(1);
    expect(formaEstrelada[0].text).toContain("2d8+SAB Rad");
    expect(formaEstrelada[0].text).toContain("Voo 6m, paira");
    expect(formaEstrelada[0].text).toContain("início turno pode trocar");
    expect(blocks.some((b) => b.text.includes("Constelações Cintilantes"))).toBe(false);
  });

  it("Repleto de Estrelas (14): soma '> Res Conc/Cort/Perf' no mesmo bloco — nunca bloco próprio", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(14, SUBCLASSES.estrelas));
    const formaEstrelada = blocks.filter((b) => b.text.includes("Forma Estrelada"));
    expect(formaEstrelada).toHaveLength(1);
    expect(formaEstrelada[0].text).toContain("> Res Conc/Cort/Perf");
    expect(blocks.some((b) => b.text.includes("Repleto de Estrelas"))).toBe(false);
  });

  it("Presságio Cósmico (6): checkbox = mod. SAB, mínimo 1", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(6, SUBCLASSES.estrelas, 18)).find((b) => b.text.includes("Presságio Cósmico"))!.text; // +4
    expect(text).toContain("#Presságio Cósmico [__][__][__][__]");
  });
});

describe("Círculo do Mar", () => {
  it("Ira do Mar (3-5): Emanação 1,5m, dados = mod. SAB (mínimo 1), sem linhas extras", () => {
    const text = getDruidSubclassPrintedBlocks(druidAt(5, SUBCLASSES.mar, 16)).find((b) => b.text.includes("Ira do Mar"))!.text; // SAB +3
    expect(text).toBe(
      ["#Ira do Mar", "1 FS, AB: Emanação 1,5m por 10 min", "Ao ativar e AB: alvo na área Salv CON; falha 3d6 Gel e Grande- empurra 4,5m"].join("\n"),
    );
  });

  it("Afinidade Aquática (6-9): Emanação cresce para 3m, nunca bloco separado", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(6, SUBCLASSES.mar));
    const iraDoMar = blocks.filter((b) => b.text.includes("Ira do Mar"));
    expect(iraDoMar).toHaveLength(1);
    expect(iraDoMar[0].text).toContain("Emanação 3m");
    expect(blocks.some((b) => b.text.includes("Afinidade Aquática"))).toBe(false);
  });

  it("Filho da Tempestade (10-13): soma '> Ativa: Voo = Desl; Res Elet/Gel/Trov', nunca bloco separado", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(10, SUBCLASSES.mar));
    const iraDoMar = blocks.filter((b) => b.text.includes("Ira do Mar"));
    expect(iraDoMar).toHaveLength(1);
    expect(iraDoMar[0].text).toContain("> Ativa: Voo = Desl; Res Elet/Gel/Trov");
    expect(blocks.some((b) => b.text.includes("Filho da Tempestade"))).toBe(false);
  });

  it("Manifestação Oceânica (14+): alvo passa a incluir aliado a 18m, soma linha de 2 FS, nunca bloco separado", () => {
    const blocks = getDruidSubclassPrintedBlocks(druidAt(14, SUBCLASSES.mar));
    const iraDoMar = blocks.filter((b) => b.text.includes("Ira do Mar"));
    expect(iraDoMar).toHaveLength(1);
    expect(iraDoMar[0].text).toContain("em você ou aliado voluntário a 18m");
    expect(iraDoMar[0].text).toContain("> 2 FS: manifeste em você + aliado simultaneamente");
    expect(blocks.some((b) => b.text.includes("Manifestação Oceânica"))).toBe(false);
  });
});

describe("Magias de Círculo NUNCA aparecem em nenhum bloco deste campo (vão para a área de Magias)", () => {
  it.each(Object.values(SUBCLASSES))("%s", (subclass) => {
    const character = druidAt(20, subclass);
    chooseTerrain(character, "Temperado");
    const joined = getDruidSubclassPrintedBlocks(character)
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Magias do Círculo");
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 14 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 14", (_key, subclass) => {
    const character = druidAt(14, subclass, 16);
    if (subclass === "Círculo da Terra") chooseTerrain(character, "Tropical");
    expect(getDruidPrintedBlocks(character)).toMatchSnapshot();
  });
});
