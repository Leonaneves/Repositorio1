import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBardPrintedBlocks } from "./bardPrintedFeatures.js";

function bardAt(level: number, charisma = 14, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("bard-print-test");
  character.classId = "bardo";
  character.level = level;
  character.abilities.CAR.score = charisma;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBardPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Bardo", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getBardPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Inspiração de Bardo — dado por nível e checkboxes por CAR", () => {
  it("nível 1: d6", () => {
    const text = getBardPrintedBlocks(bardAt(1)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("#Inspiração de Bardo d6");
  });

  it("nível 5: d8", () => {
    const text = getBardPrintedBlocks(bardAt(5)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("#Inspiração de Bardo d8");
  });

  it("nível 10: d10", () => {
    const text = getBardPrintedBlocks(bardAt(10)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("#Inspiração de Bardo d10");
  });

  it("nível 15: d12", () => {
    const text = getBardPrintedBlocks(bardAt(15)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("#Inspiração de Bardo d12");
  });

  it("quantidade de caixas = modificador de CAR", () => {
    const text = getBardPrintedBlocks(bardAt(5, 16)).find((b) => b.startsWith("#Inspiração de Bardo"))!; // CAR 16 → +3
    expect(text).toContain("d8 [__][__][__]\n");
  });

  it("mínimo de 1 caixa mesmo com CAR 10 ou menor", () => {
    const text = getBardPrintedBlocks(bardAt(5, 10)).find((b) => b.startsWith("#Inspiração de Bardo"))!; // CAR 10 → +0
    expect(text).toContain("d8 [__]\n");
    expect(text).not.toContain("[__][__]");
  });
});

describe("Fonte de Inspiração (nível 5) — atualiza o mesmo bloco, nunca um separado", () => {
  it("nível 4: ainda recuperação só por Descanso Longo", () => {
    const text = getBardPrintedBlocks(bardAt(4)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("Todos/DL");
    expect(text).not.toContain("DC/DL");
  });

  it("nível 5: recuperação por Descanso Curto OU Longo, e 1 espaço = +1 uso", () => {
    const text = getBardPrintedBlocks(bardAt(5)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("Todos/DC/DL; 1 espaço = +1 uso");
  });

  it("nunca existe um bloco separado '#Fonte de Inspiração'", () => {
    const blocks = getBardPrintedBlocks(bardAt(5));
    expect(blocks.some((b) => b.startsWith("#Fonte de Inspiração"))).toBe(false);
    expect(blocks.filter((b) => b.includes("Inspiração de Bardo"))).toHaveLength(1);
  });
});

describe("Inspiração Superior (nível 18) — atualiza o mesmo bloco, nunca um separado", () => {
  it("nível 17: sem a linha de recuperação por Iniciativa", () => {
    const text = getBardPrintedBlocks(bardAt(17)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).not.toContain("Inic:");
  });

  it("nível 18: acrescenta a linha de recuperação por Iniciativa", () => {
    const text = getBardPrintedBlocks(bardAt(18)).find((b) => b.startsWith("#Inspiração de Bardo"))!;
    expect(text).toContain("> Inic: se tiver <2 usos, recupere até 2");
  });

  it("nunca existe um bloco separado '#Inspiração Superior'", () => {
    const blocks = getBardPrintedBlocks(bardAt(18));
    expect(blocks.some((b) => b.startsWith("#Inspiração Superior"))).toBe(false);
    expect(blocks.filter((b) => b.includes("Inspiração de Bardo"))).toHaveLength(1);
  });
});

describe("Contra-Encantamento (nível 7)", () => {
  it("abaixo do nível 7: não aparece", () => {
    expect(getBardPrintedBlocks(bardAt(6)).some((b) => b.includes("Contra-Encantamento"))).toBe(false);
  });

  it("nível 7+: texto exato", () => {
    const text = getBardPrintedBlocks(bardAt(7)).find((b) => b.startsWith("#Contra-Encantamento"))!;
    expect(text).toBe("#Contra-Encantamento\nReação: você/aliado a 9m falha Salv contra Amed/Enfeit -> refaz com Vant");
  });
});

describe("Palavras de Criação (nível 20)", () => {
  it("abaixo do nível 20: não aparece", () => {
    expect(getBardPrintedBlocks(bardAt(19)).some((b) => b.includes("Palavras de Criação"))).toBe(false);
  });

  it("nível 20: texto exato", () => {
    const text = getBardPrintedBlocks(bardAt(20)).find((b) => b.startsWith("#Palavras de Criação"))!;
    expect(text).toBe("#Palavras de Criação\nPalavra de Poder: Matar/Salvar pode afetar 2º alvo a 3m do 1º");
  });
});

describe("Características que nunca aparecem neste campo", () => {
  const joined = getBardPrintedBlocks(bardAt(20)).join("\n");

  it("Conjuração nunca é impressa aqui", () => {
    expect(joined).not.toContain("#Conjuração");
  });

  it("Especialista nunca é impresso aqui", () => {
    expect(joined).not.toContain("Especialista");
  });

  it("Pau pra Toda Obra nunca é impresso aqui", () => {
    expect(joined).not.toContain("Pau pra Toda Obra");
  });

  it("Subclasse de Bardo nunca é impressa aqui", () => {
    expect(joined).not.toContain("Subclasse de Bardo");
  });

  it("Segredos Mágicos nunca é impresso aqui", () => {
    expect(joined).not.toContain("Segredos Mágicos");
  });

  it("Dádiva Épica nunca é impressa aqui", () => {
    expect(joined).not.toContain("Dádiva Épica");
  });
});

describe("nenhuma variável entre chaves chega literalmente ao PDF", () => {
  it.each([1, 5, 10, 15, 18, 20])("nível %i", (level) => {
    const joined = getBardPrintedBlocks(bardAt(level)).join("\n");
    expect(joined).not.toContain("{DadoInsp}");
    expect(joined).not.toContain("{UsosInsp}");
    expect(joined).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });
});

describe("snapshots do texto impresso por nível (Bardo puro, sem subclasse, CAR 14)", () => {
  it.each([1, 5, 10, 18])("nível %i", (level) => {
    expect(getBardPrintedBlocks(bardAt(level))).toMatchSnapshot();
  });
});
