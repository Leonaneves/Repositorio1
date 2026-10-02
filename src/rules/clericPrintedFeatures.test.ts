import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { GOLPES_ABENCOADOS_CHOICE_ID, ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { getClericPrintedBlocks } from "./clericPrintedFeatures.js";

function clericAt(level: number, wisdom = 14, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("cleric-print-test");
  character.classId = "clerigo";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

function chooseGolpesAbencoados(character: Character, value: "Conjuração Poderosa" | "Golpe Divino"): void {
  character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value };
}

describe("getClericPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Clérigo", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getClericPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Canalizar Divindade — recurso único, nunca aparece antes do nível 2", () => {
  it("nível 1: nenhum bloco aparece", () => {
    expect(getClericPrintedBlocks(clericAt(1))).toEqual([]);
  });

  it("nível 2: checkboxes = getChannelDivinityUses (2), Centelha 1d8, Expulsar sem Fulminar", () => {
    const block = getClericPrintedBlocks(clericAt(2)).find((b) => b.startsWith("#Canalizar Divindade"))!;
    expect(block).toBe(
      ["#Canalizar Divindade [__][__]", "DC: +1 uso; DL: todos", "> Centelha: alvo 9m, 1d8+SAB PV ou Salv CON -> Necr/Rad; sucesso 1/2 dano", "> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min; dano encerra"].join(
        "\n",
      ),
    );
  });

  it("nível 18: checkboxes = 4 (tabela já registrada)", () => {
    const block = getClericPrintedBlocks(clericAt(18)).find((b) => b.startsWith("#Canalizar Divindade"))!;
    expect(block).toContain("#Canalizar Divindade [__][__][__][__]");
  });
});

describe("Centelha Divina — progressão de dados por nível (2-6:1d8, 7-12:2d8, 13-17:3d8, 18-20:4d8)", () => {
  it.each([
    [2, "1d8"],
    [6, "1d8"],
    [7, "2d8"],
    [12, "2d8"],
    [13, "3d8"],
    [17, "3d8"],
    [18, "4d8"],
    [20, "4d8"],
  ])("nível %i → %s", (level, dice) => {
    const block = getClericPrintedBlocks(clericAt(level)).find((b) => b.startsWith("#Canalizar Divindade"))!;
    expect(block).toContain(`> Centelha: alvo 9m, ${dice}+SAB PV ou Salv CON -> Necr/Rad; sucesso 1/2 dano`);
  });
});

describe("Fulminar Mortos-Vivos (nível 5) — NUNCA cria bloco separado, atualiza a linha de Expulsar Mortos-Vivos", () => {
  it("nível 2-4: Expulsar termina o efeito ao causar dano (sem Fulminar)", () => {
    const block = getClericPrintedBlocks(clericAt(4)).find((b) => b.startsWith("#Canalizar Divindade"))!;
    expect(block).toContain("> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min; dano encerra");
    expect(block).not.toContain("Fulminar");
    expect(block).not.toContain("#Fulminar Mortos-Vivos");
  });

  it("nível 5+, SAB +3: soma 3d8 Radiante, dano NÃO encerra o efeito — nunca um bloco '#Fulminar Mortos-Vivos'", () => {
    const block = getClericPrintedBlocks(clericAt(5, 16)).find((b) => b.startsWith("#Canalizar Divindade"))!; // SAB 16 → +3
    expect(block).toContain("> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min + 3d8 Rad; este dano não encerra");
    expect(block).not.toContain("#Fulminar Mortos-Vivos");
  });

  it("SAB negativo: mínimo 1d8", () => {
    const block = getClericPrintedBlocks(clericAt(5, 6)).find((b) => b.startsWith("#Canalizar Divindade"))!; // SAB 6 → -2
    expect(block).toContain("+ 1d8 Rad");
  });

  it("nenhum bloco separado de Fulminar Mortos-Vivos aparece em nenhum nível", () => {
    const joined = getClericPrintedBlocks(clericAt(20)).join("\n");
    expect(joined).not.toContain("#Fulminar Mortos-Vivos");
  });
});

describe("Golpes Abençoados — só a opção escolhida aparece, nunca as duas, nunca um título genérico", () => {
  it("antes do nível 7: nenhum bloco aparece mesmo com escolha feita", () => {
    const character = clericAt(6);
    chooseGolpesAbencoados(character, "Golpe Divino");
    expect(getClericPrintedBlocks(character).some((b) => b.includes("Golpe Divino") || b.includes("Conjuração Poderosa"))).toBe(false);
  });

  it("nível 7+, sem escolha feita ainda: nenhum bloco aparece", () => {
    expect(getClericPrintedBlocks(clericAt(7)).some((b) => b.includes("Golpe Divino") || b.includes("Conjuração Poderosa"))).toBe(false);
  });

  it("Golpe Divino escolhido, nível 7-13: +1d8", () => {
    const character = clericAt(10);
    chooseGolpesAbencoados(character, "Golpe Divino");
    const block = getClericPrintedBlocks(character).find((b) => b.startsWith("#Golpe Divino"))!;
    expect(block).toBe("#Golpe Divino\n1/turno, acerto com arma -> +1d8 Necr/Rad");
  });

  it("Golpe Divino escolhido, nível 14+: a MESMA característica passa a +2d8, nunca um bloco '#Golpes Abençoados Aprimorado'", () => {
    const character = clericAt(14);
    chooseGolpesAbencoados(character, "Golpe Divino");
    const blocks = getClericPrintedBlocks(character);
    const golpeDivino = blocks.filter((b) => b.startsWith("#Golpe Divino"));
    expect(golpeDivino).toHaveLength(1);
    expect(golpeDivino[0]).toBe("#Golpe Divino\n1/turno, acerto com arma -> +2d8 Necr/Rad");
    expect(blocks.some((b) => b.includes("Golpes Abençoados Aprimorado"))).toBe(false);
  });

  it("Conjuração Poderosa escolhida, nível 7-13: só o bônus de dano no truque", () => {
    const character = clericAt(7);
    chooseGolpesAbencoados(character, "Conjuração Poderosa");
    const block = getClericPrintedBlocks(character).find((b) => b.startsWith("#Conjuração Poderosa"))!;
    expect(block).toBe("#Conjuração Poderosa\nTruques de Clérigo +SAB dano");
  });

  it("Conjuração Poderosa escolhida, nível 14+, SAB +4: soma PV Temp = 2xSAB resolvido (8), mesmo bloco, nunca um 2º bloco", () => {
    const character = clericAt(14, 18); // SAB 18 → +4
    chooseGolpesAbencoados(character, "Conjuração Poderosa");
    const blocks = getClericPrintedBlocks(character);
    const conjuracaoPoderosa = blocks.filter((b) => b.startsWith("#Conjuração Poderosa"));
    expect(conjuracaoPoderosa).toHaveLength(1);
    expect(conjuracaoPoderosa[0]).toBe("#Conjuração Poderosa\nTruques de Clérigo +SAB dano\nAo causar dano -> você/alvo 18m ganha 8 PV Temp");
    expect(conjuracaoPoderosa[0]).not.toContain("{PVTempConjuracao}");
  });

  it("nunca as duas opções ao mesmo tempo", () => {
    const character = clericAt(14, 18);
    chooseGolpesAbencoados(character, "Conjuração Poderosa");
    const joined = getClericPrintedBlocks(character).join("\n");
    expect(joined).toContain("Conjuração Poderosa");
    expect(joined).not.toContain("Golpe Divino");
  });
});

describe("Intervenção Divina (10) — Maior (20) atualiza o mesmo bloco, nunca separado", () => {
  it("antes do nível 10: não aparece", () => {
    expect(getClericPrintedBlocks(clericAt(9)).some((b) => b.includes("Intervenção Divina"))).toBe(false);
  });

  it("nível 10-19", () => {
    const block = getClericPrintedBlocks(clericAt(15)).find((b) => b.startsWith("#Intervenção Divina"))!;
    expect(block).toBe("#Intervenção Divina [__]\nAção: conjure magia Clérigo até 5º, exc Reação, sem espaço/Material. 1/DL");
  });

  it("nível 20: soma a opção de Desejo no MESMO bloco, nunca '#Intervenção Divina Maior'", () => {
    const blocks = getClericPrintedBlocks(clericAt(20));
    const intervencao = blocks.filter((b) => b.startsWith("#Intervenção Divina"));
    expect(intervencao).toHaveLength(1);
    expect(intervencao[0]).toBe(
      ["#Intervenção Divina [__]", "Ação: conjure magia Clérigo até 5º, exc Reação, sem espaço/Material. 1/DL", "> Pode escolher Desejo; se usar, recarga após 2d4 DL"].join(
        "\n",
      ),
    );
    expect(blocks.some((b) => b.includes("Intervenção Divina Maior"))).toBe(false);
  });
});

describe("Características que nunca aparecem neste campo", () => {
  it("Conjuração, Ordem Divina, Protetor, Taumaturgo, Subclasse de Clérigo, ASI e Dádiva Épica nunca aparecem", () => {
    const character = clericAt(20, 16, "Domínio da Vida");
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    chooseGolpesAbencoados(character, "Golpe Divino");
    const joined = getClericPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("Conjuração");
    expect(joined).not.toContain("Ordem Divina");
    expect(joined).not.toContain("Protetor");
    expect(joined).not.toContain("Taumaturgo");
    expect(joined).not.toContain("Subclasse de Clérigo");
    expect(joined).not.toContain("Aumento no Valor de Atributo");
    expect(joined).not.toContain("Dádiva Épica");
  });
});

describe("nenhuma variável entre chaves chega literalmente ao PDF, nenhum símbolo Unicode banido", () => {
  it("em nenhum nível/combinação testada aparece algo como {Variavel} ou →/½/×/≥/≤/±", () => {
    for (const subclass of ["Domínio da Guerra", "Domínio da Luz", "Domínio da Trapaça", "Domínio da Vida"]) {
      const character = clericAt(20, 16, subclass);
      chooseGolpesAbencoados(character, "Conjuração Poderosa");
      const joined = getClericPrintedBlocks(character).join("\n");
      expect(joined).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
      expect(joined).not.toMatch(/→|½|×|≥|≤|±/);
    }
  });
});

describe("Exemplo integral da fonte — Clérigo nível 7, sem subclasse, SAB +3, Golpe Divino escolhido (item 46)", () => {
  it("reproduz exatamente os dois blocos esperados", () => {
    const character = clericAt(7, 16); // SAB 16 → +3
    chooseGolpesAbencoados(character, "Golpe Divino");
    expect(getClericPrintedBlocks(character)).toEqual([
      [
        "#Canalizar Divindade [__][__][__]",
        "DC: +1 uso; DL: todos",
        "> Centelha: alvo 9m, 2d8+SAB PV ou Salv CON -> Necr/Rad; sucesso 1/2 dano",
        "> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min + 3d8 Rad; este dano não encerra",
      ].join("\n"),
      "#Golpe Divino\n1/turno, acerto com arma -> +1d8 Necr/Rad",
    ]);
  });
});

describe("snapshots do texto impresso por nível (Clérigo puro, sem subclasse, SAB 16)", () => {
  it.each([1, 2, 5, 7, 14, 20])("nível %i, sem escolha de Golpes Abençoados", (level) => {
    expect(getClericPrintedBlocks(clericAt(level, 16))).toMatchSnapshot();
  });

  it("nível 7 com Golpe Divino escolhido", () => {
    const character = clericAt(7, 16); // SAB 16 → +3
    chooseGolpesAbencoados(character, "Golpe Divino");
    expect(getClericPrintedBlocks(character)).toMatchSnapshot();
  });
});
