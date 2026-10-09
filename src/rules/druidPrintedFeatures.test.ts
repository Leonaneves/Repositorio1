import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { FURIA_ELEMENTAL_CHOICE_ID, ORDEM_PRIMAL_CHOICE_ID, XAMA_TRUQUE_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";
import { getDruidPrintedBlocks } from "./druidPrintedFeatures.js";

function druidAt(level: number, wisdom = 14, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("druid-print-test");
  character.classId = "druida";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

function chooseFuriaElemental(character: Character, value: "Ataque Primal" | "Conjuração Poderosa"): void {
  character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value };
}

describe("getDruidPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Druida", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getDruidPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Idioma Druídico — sempre presente a partir do nível 1", () => {
  it("texto exato", () => {
    const block = getDruidPrintedBlocks(druidAt(1)).find((b) => b.startsWith("#Idioma Druídico"))!;
    expect(block).toBe("#Idioma Druídico\nMensagens ocultas; outros detectam com Invest CD15, mas não decifram sem magia");
  });
});

describe("Forma Selvagem — checkboxes conforme tabela, nunca antes do nível 2", () => {
  it("nível 1: nenhum bloco de Forma Selvagem", () => {
    expect(getDruidPrintedBlocks(druidAt(1)).some((b) => b.startsWith("#Forma Selvagem"))).toBe(false);
  });

  it("nível 2: 2 checkboxes (tabela já registrada), sem Ressurgimento Selvagem/Magias Bestiais/Arquidruida", () => {
    const block = getDruidPrintedBlocks(druidAt(2)).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).toBe(
      [
        "#Forma Selvagem [__][__]",
        "AB: Fera conhecida por 1/2 nível h; sair AB",
        "PV Temp = nível; usa bloco Fera, mantém tipo/PV/DV, INT/SAB/CAR, classe, idiomas, talentos e Prof perícias/Salv",
        "Sem conjurar; Concent mantém",
        "DC: +1 uso; DL: todos",
      ].join("\n"),
    );
  });

  it("nível 18: checkboxes = 4 e permite conjurar em FS (exceto Material com custo/consumido)", () => {
    const block = getDruidPrintedBlocks(druidAt(18)).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).toContain("#Forma Selvagem [__][__][__][__]");
    expect(block).toContain("Pode conjurar em FS, exc Material com custo/consumido; Concent mantém");
    expect(block).not.toContain("Sem conjurar");
  });

  it("o texto do bloco nunca depende de 'knownWildShapeForms' — preservado mesmo sem nenhuma Forma Conhecida e sem mudar com Formas preenchidas (fonte \"AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS\" §2: a escolha de animais deixou de existir na criação, mas o texto da característica impressa continua)", () => {
    const semFormas = druidAt(2);
    expect(semFormas.knownWildShapeForms).toEqual([]);
    const blockSemFormas = getDruidPrintedBlocks(semFormas).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(blockSemFormas).toContain("#Forma Selvagem [__][__]");

    const comFormas = druidAt(2);
    comFormas.knownWildShapeForms = [
      { name: "Lobo", challengeRating: "1/4", hasFlySpeed: false },
      { name: "Corvo", challengeRating: "0", hasFlySpeed: true },
    ];
    const blockComFormas = getDruidPrintedBlocks(comFormas).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(blockComFormas).toBe(blockSemFormas);
  });
});

describe("Ressurgimento Selvagem (nível 5) — NUNCA cria bloco separado, atualiza Forma Selvagem", () => {
  it("nível 2-4: nenhuma linha de Ressurgimento Selvagem", () => {
    const block = getDruidPrintedBlocks(druidAt(4)).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).not.toContain("Ressurgimento");
    expect(block).not.toContain("1/turno, 0 FS");
  });

  it("nível 5+: soma as 2 linhas, nunca um bloco '#Ressurgimento Selvagem'", () => {
    const blocks = getDruidPrintedBlocks(druidAt(5));
    const fs = blocks.find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(fs).toContain("> 1/turno, 0 FS: 1 espaço -> +1 FS");
    expect(fs).toContain("> [__] 1 FS -> +1 espaço 1o. 1/DL");
    expect(blocks.some((b) => b.startsWith("#Ressurgimento Selvagem"))).toBe(false);
  });
});

describe("Arquidruida (nível 20) — NUNCA cria bloco separado, atualiza Forma Selvagem", () => {
  it("soma as 2 linhas, nunca '#Arquidruida'", () => {
    const blocks = getDruidPrintedBlocks(druidAt(20));
    const fs = blocks.find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(fs).toContain("> Inic com 0 FS -> +1 FS");
    expect(fs).toContain("> [__] Converta FS em 1 espaço: círculo = 2 x FS gastos. 1/DL");
    expect(blocks.some((b) => b.startsWith("#Arquidruida"))).toBe(false);
  });

  it("a ordem das linhas segue a fonte: Ressurgimento Selvagem antes de Arquidruida, recuperação sempre por último", () => {
    const fs = getDruidPrintedBlocks(druidAt(20)).find((b) => b.startsWith("#Forma Selvagem"))!;
    const lines = fs.split("\n");
    expect(lines.at(-1)).toBe("DC: +1 uso; DL: todos");
    expect(lines.indexOf("> 1/turno, 0 FS: 1 espaço -> +1 FS")).toBeLessThan(lines.indexOf("> Inic com 0 FS -> +1 FS"));
  });
});

describe("Fúria Elemental — só a opção escolhida aparece, nunca as duas, nunca título genérico", () => {
  it("antes do nível 7: nenhum bloco aparece mesmo com escolha feita", () => {
    const character = druidAt(6);
    chooseFuriaElemental(character, "Ataque Primal");
    expect(getDruidPrintedBlocks(character).some((b) => b.includes("Ataque Primal") || b.includes("Conjuração Poderosa"))).toBe(false);
  });

  it("nível 7+ sem escolha: nenhum bloco aparece", () => {
    expect(getDruidPrintedBlocks(druidAt(7)).some((b) => b.includes("Ataque Primal") || b.includes("Conjuração Poderosa"))).toBe(false);
  });

  it("Ataque Primal, nível 7-14: +1d8", () => {
    const character = druidAt(10);
    chooseFuriaElemental(character, "Ataque Primal");
    const block = getDruidPrintedBlocks(character).find((b) => b.startsWith("#Ataque Primal"))!;
    expect(block).toBe("#Ataque Primal\n1/turno, Atq arma/Fera em FS -> +1d8 Elétrico/Frio/Fogo/Trovão");
  });

  it("Ataque Primal, nível 15+: a MESMA característica passa a +2d8, nunca 'Fúria Elemental Aprimorada'", () => {
    const character = druidAt(15);
    chooseFuriaElemental(character, "Ataque Primal");
    const blocks = getDruidPrintedBlocks(character);
    const ataquePrimal = blocks.filter((b) => b.startsWith("#Ataque Primal"));
    expect(ataquePrimal).toHaveLength(1);
    expect(ataquePrimal[0]).toBe("#Ataque Primal\n1/turno, Atq arma/Fera em FS -> +2d8 Elétrico/Frio/Fogo/Trovão");
    expect(blocks.some((b) => b.includes("Fúria Elemental Aprimorada"))).toBe(false);
  });

  it("Conjuração Poderosa, nível 7-14: só o bônus de dano", () => {
    const character = druidAt(7);
    chooseFuriaElemental(character, "Conjuração Poderosa");
    const block = getDruidPrintedBlocks(character).find((b) => b.startsWith("#Conjuração Poderosa"))!;
    expect(block).toBe("#Conjuração Poderosa\nTruques Druida +SAB dano");
  });

  it("Conjuração Poderosa, nível 15+: soma a regra de alcance, mesmo bloco, nunca um 2º bloco", () => {
    const character = druidAt(15);
    chooseFuriaElemental(character, "Conjuração Poderosa");
    const blocks = getDruidPrintedBlocks(character);
    const conjuracaoPoderosa = blocks.filter((b) => b.startsWith("#Conjuração Poderosa"));
    expect(conjuracaoPoderosa).toHaveLength(1);
    expect(conjuracaoPoderosa[0]).toBe("#Conjuração Poderosa\nTruques Druida +SAB dano\nAlcance >=3m -> 90m");
  });

  it("nunca as duas opções ao mesmo tempo", () => {
    const character = druidAt(15);
    chooseFuriaElemental(character, "Ataque Primal");
    const joined = getDruidPrintedBlocks(character).join("\n");
    expect(joined).toContain("Ataque Primal");
    expect(joined).not.toContain("Conjuração Poderosa");
  });
});

describe("Círculo da Lua — modifica Forma Selvagem, nunca bloco separado", () => {
  it("nível 3-5: ND resolvido, CA/PV Temp substituídos, sem linhas de Lua ainda", () => {
    const block = getDruidPrintedBlocks(druidAt(3, 14, "Círculo da Lua")).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).toContain("PV Temp = 3 x nível; ND máx 1; CA 13+SAB se maior");
    expect(block).toContain("Usa bloco Fera, mantém tipo/PV/DV, INT/SAB/CAR, classe, idiomas, talentos e Prof perícias/Salv");
    expect(block).not.toContain("> Lua:");
    expect(block).not.toContain("PV Temp = nível;"); // nunca o texto base junto
  });

  it("nível 6+: soma a linha '> Lua: Atq Fera normal/Radiante; +SAB Salv CON'", () => {
    const block = getDruidPrintedBlocks(druidAt(6, 14, "Círculo da Lua")).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).toContain("> Lua: Atq Fera normal/Radiante; +SAB Salv CON");
    expect(block).toContain("ND máx 2"); // 6/3
  });

  it("nível 14+: soma também '> Lua: 1/turno, Atq Fera -> +2d10 Radiante', mantendo a linha do nível 6", () => {
    const block = getDruidPrintedBlocks(druidAt(14, 14, "Círculo da Lua")).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(block).toContain("> Lua: Atq Fera normal/Radiante; +SAB Salv CON");
    expect(block).toContain("> Lua: 1/turno, Atq Fera -> +2d10 Radiante");
    expect(block).toContain("ND máx 4"); // 14/3 arredondado para baixo
  });

  it("nunca cria '#Formas Animais Aprimorada' ou '#Forma Lunar' como blocos próprios", () => {
    const joined = getDruidPrintedBlocks(druidAt(20, 14, "Círculo da Lua")).join("\n");
    expect(joined).not.toContain("#Formas Animais Aprimorada");
    expect(joined).not.toContain("#Forma Lunar");
  });
});

describe("Exemplo integral da fonte — Círculo da Lua nível 6 (item 47)", () => {
  it("reproduz o bloco de Forma Selvagem esperado, com {NDLua} resolvido", () => {
    const character = druidAt(6, 14, "Círculo da Lua"); // SAB 14 → +2, nível 6 → ND 2
    const fs = getDruidPrintedBlocks(character).find((b) => b.startsWith("#Forma Selvagem"))!;
    expect(fs).toBe(
      [
        "#Forma Selvagem [__][__][__]",
        "AB: Fera conhecida por 1/2 nível h; sair AB",
        "PV Temp = 3 x nível; ND máx 2; CA 13+SAB se maior",
        "Usa bloco Fera, mantém tipo/PV/DV, INT/SAB/CAR, classe, idiomas, talentos e Prof perícias/Salv",
        "Sem conjurar; Concent mantém",
        "> Lua: Atq Fera normal/Radiante; +SAB Salv CON",
        "> 1/turno, 0 FS: 1 espaço -> +1 FS",
        "> [__] 1 FS -> +1 espaço 1o. 1/DL",
        "DC: +1 uso; DL: todos",
      ].join("\n"),
    );
    expect(fs).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });
});

describe("Características que nunca aparecem neste campo", () => {
  it("Conjuração, Ordem Primal, Protetor, Xamã, Subclasse de Druida, ASI, Dádiva Épica, Companheiro Selvagem, Mapa Estelar e listas de Magias de Círculo nunca aparecem", () => {
    const character = druidAt(20, 16, "Círculo da Terra");
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    character.featureChoiceSelections[XAMA_TRUQUE_CHOICE_ID] = { value: "Produzir Chama" };
    character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Árido" };
    chooseFuriaElemental(character, "Ataque Primal");
    const joined = getDruidPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("Ordem Primal");
    expect(joined).not.toContain("Protetor");
    expect(joined).not.toContain("Xamã");
    expect(joined).not.toContain("Subclasse de Druida");
    expect(joined).not.toContain("Aumento no Valor de Atributo");
    expect(joined).not.toContain("Dádiva Épica");
    expect(joined).not.toContain("Companheiro Selvagem");
    expect(joined).not.toContain("Mapa Estelar");
    expect(joined).not.toContain("Magias do Círculo");
  });
});

describe("nenhuma variável entre chaves chega ao PDF, nenhum símbolo Unicode banido", () => {
  it("em nenhum nível/combinação testada aparece {Variavel} ou →/½/×/≥/≤/±", () => {
    for (const subclass of ["Círculo da Lua", "Círculo da Terra", "Círculo das Estrelas", "Círculo do Mar"]) {
      const character = druidAt(20, 16, subclass);
      character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Polar" };
      chooseFuriaElemental(character, "Conjuração Poderosa");
      const joined = getDruidPrintedBlocks(character).join("\n");
      expect(joined).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
      expect(joined).not.toMatch(/→|½|×|≥|≤|±/);
    }
  });
});

describe("snapshots do texto impresso por nível (Druida puro, sem subclasse, SAB 16)", () => {
  it.each([1, 2, 5, 7, 18, 20])("nível %i, sem escolha de Fúria Elemental", (level) => {
    expect(getDruidPrintedBlocks(druidAt(level, 16))).toMatchSnapshot();
  });

  it("nível 7 com Ataque Primal escolhido", () => {
    const character = druidAt(7, 16);
    chooseFuriaElemental(character, "Ataque Primal");
    expect(getDruidPrintedBlocks(character)).toMatchSnapshot();
  });
});
