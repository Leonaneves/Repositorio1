import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getSorcererPrintedBlocks } from "./sorcererPrintedFeatures.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";

function sorcererAt(level: number, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("sorcerer-print-test");
  character.classId = "feiticeiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

function withMetamagic(character: Character, ...ids: string[]): Character {
  character.knownMetamagicOptions = ids;
  return character;
}

describe("getSorcererPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Feiticeiro", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getSorcererPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Feitiçaria Inata — 2 checkboxes fixos, evolui com Feitiçaria Encarnada (7) e Apoteose Arcana (20) no MESMO bloco", () => {
  it("nível 1-6: texto base", () => {
    const block = getSorcererPrintedBlocks(sorcererAt(1)).find((b) => b.startsWith("#Feitiçaria Inata"))!;
    expect(block).toBe(["#Feitiçaria Inata [__][__]", "AB, 1 min: CD magia +1; Vant Atq magia", "Todos/DL"].join("\n"));
  });

  it("nível 7-19: soma as linhas de Feitiçaria Encarnada, nunca um bloco '#Feitiçaria Encarnada'", () => {
    const blocks = getSorcererPrintedBlocks(sorcererAt(7));
    const innate = blocks.filter((b) => b.startsWith("#Feitiçaria Inata"));
    expect(innate).toHaveLength(1);
    expect(innate[0]).toBe(
      ["#Feitiçaria Inata [__][__]", "AB, 1 min: CD magia +1; Vant Atq magia", "Sem usos: 2PF -> ativar", "Ativa: até 2 Meta por magia", "Todos/DL"].join(
        "\n",
      ),
    );
    expect(blocks.some((b) => b.includes("Feitiçaria Encarnada"))).toBe(false);
  });

  it("nível 20: soma também a linha de Apoteose Arcana, nunca um bloco '#Apoteose Arcana'", () => {
    const blocks = getSorcererPrintedBlocks(sorcererAt(20));
    const innate = blocks.filter((b) => b.startsWith("#Feitiçaria Inata"));
    expect(innate).toHaveLength(1);
    expect(innate[0]).toBe(
      [
        "#Feitiçaria Inata [__][__]",
        "AB, 1 min: CD magia +1; Vant Atq magia",
        "Sem usos: 2PF -> ativar",
        "Ativa: até 2 Meta por magia; 1 Meta/turno = 0 PF",
        "Todos/DL",
      ].join("\n"),
    );
    expect(blocks.some((b) => b.includes("Apoteose Arcana"))).toBe(false);
  });
});

describe("Fonte de Magia — PF nunca gera checkbox por ponto, evolui com Restauração Feiticeira (5) no MESMO bloco", () => {
  it("nível 1: nenhum bloco de Fonte de Magia", () => {
    expect(getSorcererPrintedBlocks(sorcererAt(1)).some((b) => b.startsWith("#Fonte de Magia"))).toBe(false);
  });

  it("nível 2: PFMax resolvido (2), sem a linha de recuperação de Restauração Feiticeira", () => {
    const block = getSorcererPrintedBlocks(sorcererAt(2)).find((b) => b.startsWith("#Fonte de Magia"))!;
    expect(block).toBe(
      [
        "#Fonte de Magia",
        "PF: ___/2; todos/DL",
        "Espaço -> PF = círculo",
        "AB, PF -> espaço: 1o=2, 2o=3, 3o=5, 4o=6, 5o=7; conforme Nv",
        "Espaços criados somem/DL",
      ].join("\n"),
    );
    expect(block).not.toContain("[__]"); // nunca checkbox por ponto
  });

  it("nível 5+: soma a linha de Restauração Feiticeira, nunca um bloco '#Restauração Feiticeira'", () => {
    const blocks = getSorcererPrintedBlocks(sorcererAt(5));
    const fontOfMagic = blocks.filter((b) => b.startsWith("#Fonte de Magia"));
    expect(fontOfMagic).toHaveLength(1);
    expect(fontOfMagic[0]).toContain("PF: ___/5");
    expect(fontOfMagic[0]).toContain("> [__] DC: recupere até 2 PF. 1/DL"); // floor(5/2)
    expect(blocks.some((b) => b.includes("Restauração Feiticeira"))).toBe(false);
  });

  it("nenhuma chave {PFMax}/{RecupPF} chega ao texto", () => {
    const block = getSorcererPrintedBlocks(sorcererAt(10)).find((b) => b.startsWith("#Fonte de Magia"))!;
    expect(block).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
    expect(block).toContain("PF: ___/10");
    expect(block).toContain("recupere até 5 PF"); // floor(10/2)
  });
});

describe("Metamagia — só opções conhecidas, nunca inventadas", () => {
  it("sem nenhuma opção conhecida: bloco não aparece", () => {
    expect(getSorcererPrintedBlocks(sorcererAt(2)).some((b) => b.startsWith("#Metamagia"))).toBe(false);
  });

  it("imprime 1 linha por opção conhecida, num único bloco", () => {
    const character = withMetamagic(sorcererAt(2), "sutil", "distante");
    const block = getSorcererPrintedBlocks(character).find((b) => b.startsWith("#Metamagia"))!;
    expect(block).toBe(
      ["#Metamagia", "> Sutil 1PF: sem V/S/M, exc M consumido/com custo", "> Distante 1PF: alcance >=1,5m x2; Toque -> 9m"].join("\n"),
    );
  });

  it("nunca duplica o bloco mesmo com várias opções", () => {
    const character = withMetamagic(sorcererAt(17), "sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada");
    const blocks = getSorcererPrintedBlocks(character).filter((b) => b.startsWith("#Metamagia"));
    expect(blocks).toHaveLength(1);
  });
});

describe("Exemplo integral — Feiticeiro nível 7, sem subclasse, com Sutil+Distante conhecidas", () => {
  it("reproduz exatamente os 3 blocos esperados, na ordem da fonte (item 55)", () => {
    const character = withMetamagic(sorcererAt(7), "sutil", "distante");
    expect(getSorcererPrintedBlocks(character)).toEqual([
      ["#Feitiçaria Inata [__][__]", "AB, 1 min: CD magia +1; Vant Atq magia", "Sem usos: 2PF -> ativar", "Ativa: até 2 Meta por magia", "Todos/DL"].join(
        "\n",
      ),
      ["#Fonte de Magia", "PF: ___/7; todos/DL", "Espaço -> PF = círculo", "AB, PF -> espaço: 1o=2, 2o=3, 3o=5, 4o=6, 5o=7; conforme Nv", "Espaços criados somem/DL", "> [__] DC: recupere até 3 PF. 1/DL"].join("\n"),
      ["#Metamagia", "> Sutil 1PF: sem V/S/M, exc M consumido/com custo", "> Distante 1PF: alcance >=1,5m x2; Toque -> 9m"].join("\n"),
    ]);
  });
});

describe("Características que nunca aparecem neste campo", () => {
  it("Conjuração, Subclasse de Feiticeiro, ASI, Dádiva Épica, Resiliência Dracônica, Feitiçaria Psiônica e Companheiro Dracônico nunca aparecem", () => {
    const character = withMetamagic(sorcererAt(20, "Feitiçaria Dracônica"), "sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada");
    const joined = getSorcererPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("Conjuração");
    expect(joined).not.toContain("Subclasse de Feiticeiro");
    expect(joined).not.toContain("Aumento no Valor de Atributo");
    expect(joined).not.toContain("Dádiva Épica");
    expect(joined).not.toContain("Resiliência Dracônica");
    expect(joined).not.toContain("Feitiçaria Psiônica");
    expect(joined).not.toContain("Companheiro Dracônico");
  });
});

describe("Nomenclatura de tipos de dano (item 63) — só Conc/Cort/Perf abreviados, demais por extenso, nunca Ígneo/Gélido", () => {
  const BANNED_TOKENS = new Set(["Ígneo", "Gélido", "Ig", "Gel", "Elet", "Trov", "Ven", "Necr", "Rad", "Psiq", "Energ"]);

  it("em nenhum bloco testado aparecem as abreviações banidas (tokenizado por letra Unicode, nunca falso positivo de \\b em acento)", () => {
    for (const subclass of ["Feitiçaria Aberrante", "Feitiçaria Dracônica", "Feitiçaria Mecânica", "Feitiçaria Selvagem"]) {
      const character = withMetamagic(sorcererAt(18, subclass), "sutil", "distante");
      character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Fogo" };
      const joined = getSorcererPrintedBlocks(character).join("\n");
      const tokens = joined.split(/[^\p{L}]+/u).filter(Boolean);
      for (const token of tokens) {
        expect(BANNED_TOKENS.has(token)).toBe(false);
      }
    }
  });
});

describe("nenhuma variável entre chaves chega ao PDF, nenhum símbolo Unicode banido", () => {
  it("em nenhum nível/combinação testada aparece {Variavel} ou →/½/×/≥/≤/±", () => {
    for (const subclass of ["Feitiçaria Aberrante", "Feitiçaria Dracônica", "Feitiçaria Mecânica", "Feitiçaria Selvagem"]) {
      const character = withMetamagic(sorcererAt(18, subclass), "sutil", "distante", "cautelosa", "potencializada");
      character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Gelo" };
      const joined = getSorcererPrintedBlocks(character).join("\n");
      expect(joined).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
      expect(joined).not.toMatch(/→|½|×|≥|≤|±/);
    }
  });
});

describe("snapshots do texto impresso por nível (Feiticeiro puro, sem subclasse)", () => {
  it.each([1, 2, 5, 7, 10, 17, 20])("nível %i, com Sutil+Distante (+mais conforme o nível)", (level) => {
    const ids = ["sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada"];
    const character = withMetamagic(sorcererAt(level), ...ids.slice(0, Math.min(ids.length, level >= 17 ? 6 : level >= 10 ? 4 : level >= 2 ? 2 : 0)));
    expect(getSorcererPrintedBlocks(character)).toMatchSnapshot();
  });
});
