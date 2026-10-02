import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getWarlockPrintedBlocks } from "./warlockPrintedFeatures.js";

function warlockAt(level: number, charisma = 14, subclassFullName: string | null = null): Character {
  const character = createBlankCharacter("warlock-print-test");
  character.classId = "bruxo";
  character.level = level;
  character.abilities.CAR.score = charisma;
  character.subclassId = subclassFullName;
  return character;
}

function choose(character: Character, invocationId: string, subChoice = ""): void {
  character.chosenInvocations.push({ invocationId, subChoice });
}

describe("getWarlockPrintedBlocks — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Bruxo", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getWarlockPrintedBlocks(mago)).toEqual([]);
  });
});

describe("Astúcia Mágica — recuperação por nível, evoluindo para Mestre Místico no 20", () => {
  it("abaixo do nível 2: não aparece", () => {
    expect(getWarlockPrintedBlocks(warlockAt(1)).some((b) => b.includes("Astúcia Mágica"))).toBe(false);
  });

  it("nível 2 (máximo 1 espaço de Pacto): recupera 1 (metade de 1, arredondado para cima)", () => {
    const text = getWarlockPrintedBlocks(warlockAt(2)).find((b) => b.startsWith("#Astúcia Mágica"))!;
    expect(text).toBe("#Astúcia Mágica [__]\nRito 1 min: recupere 1 espaços de Pacto gastos. 1/DL");
  });

  it("nível 5 (máximo 2 espaços): recupera 1", () => {
    const text = getWarlockPrintedBlocks(warlockAt(5)).find((b) => b.startsWith("#Astúcia Mágica"))!;
    expect(text).toContain("recupere 1 espaços");
  });

  it("nível 11 (máximo 3 espaços): recupera 2 (arredondado para cima)", () => {
    const text = getWarlockPrintedBlocks(warlockAt(11)).find((b) => b.startsWith("#Astúcia Mágica"))!;
    expect(text).toContain("recupere 2 espaços");
  });

  it("nível 20 (Mestre Místico): recupera TODOS, nunca cria um bloco '#Mestre Místico' separado", () => {
    const blocks = getWarlockPrintedBlocks(warlockAt(20));
    const astucia = blocks.filter((b) => b.startsWith("#Astúcia Mágica"));
    expect(astucia).toHaveLength(1);
    expect(astucia[0]).toBe("#Astúcia Mágica [__]\nRito 1 min: recupere todos espaços de Pacto gastos. 1/DL");
    expect(blocks.some((b) => b.includes("Mestre Místico"))).toBe(false);
  });
});

describe("Invocações Místicas — bloco único com '>' por invocação, nunca 1 cabeçalho por invocação", () => {
  it("sem nenhuma invocação com texto necessário: bloco não aparece", () => {
    const character = warlockAt(2);
    choose(character, "armadura-de-sombras"); // só magia, sem texto impresso
    expect(getWarlockPrintedBlocks(character).some((b) => b.includes("Invocações Místicas"))).toBe(false);
  });

  it("2 invocações com texto necessário entram no MESMO bloco", () => {
    const character = warlockAt(5);
    choose(character, "mente-mistica");
    choose(character, "pacto-da-lamina");
    const block = getWarlockPrintedBlocks(character).find((b) => b.startsWith("#Invocações Místicas"))!;
    expect(block.split("\n").filter((l) => l.startsWith("#"))).toHaveLength(1);
    expect(block).toContain("> Mente Mística: Vant Salv CON p/Concent");
    expect(block).toContain("> Pacto da Lâmina: AB arma corpo a corpo");
  });

  it("invocações só-mágicas/só-talento nunca geram linha (Armadura de Sombras, Lições dos Grandes Antigos, Pacto do Tomo)", () => {
    const character = warlockAt(5);
    choose(character, "armadura-de-sombras");
    choose(character, "licoes-dos-grandes-antigos", "Afortunado");
    choose(character, "pacto-do-tomo");
    choose(character, "mente-mistica"); // só esta deve gerar linha
    const block = getWarlockPrintedBlocks(character).find((b) => b.startsWith("#Invocações Místicas"))!;
    expect(block.split("\n")).toHaveLength(2); // cabeçalho + 1 linha
  });
});

describe("Explosão Agonizante/Repulsiva/Lança Mística — Truque resolvido, nunca {Truque} literal", () => {
  it("Explosão Agonizante resolve o nome do Truque escolhido", () => {
    const character = warlockAt(2);
    choose(character, "explosao-agonizante", "Raio de Fogo");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Explosão Agonizante: Raio de Fogo +CAR no dano");
    expect(block).not.toContain("{Truque}");
  });

  it("Explosão Repulsiva resolve o nome do Truque escolhido", () => {
    const character = warlockAt(2);
    choose(character, "explosao-repulsiva", "Mãos Flamejantes");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Explosão Repulsiva: Mãos Flamejantes, acerto → empurra 3m alvo Grande-");
  });

  it("Lança Mística resolve Truque e {AlcanceExtra} = 9m × nível de Bruxo", () => {
    const character = warlockAt(10);
    choose(character, "lanca-mistica", "Raio de Fogo");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Lança Mística: Raio de Fogo alcance +90m"); // 9 * 10
    expect(block).not.toContain("{AlcanceExtra}");
  });

  it("duas cópias de Explosão Agonizante com Truques diferentes geram 2 linhas distintas", () => {
    const character = warlockAt(2);
    choose(character, "explosao-agonizante", "Raio de Fogo");
    choose(character, "explosao-agonizante", "Mãos Flamejantes");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("Raio de Fogo +CAR no dano");
    expect(block).toContain("Mãos Flamejantes +CAR no dano");
  });
});

describe("Lâmina Sedenta × Lâmina Devoradora — mesma evolução, nunca as duas linhas ao mesmo tempo", () => {
  it("só Lâmina Sedenta: imprime '2 Atq'", () => {
    const character = warlockAt(5);
    choose(character, "pacto-da-lamina");
    choose(character, "lamina-sedenta");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Lâmina Sedenta: arma de pacto 2 Atq");
    expect(block).not.toContain("Lâmina Devoradora");
  });

  it("as duas escolhidas (Devoradora exige Sedenta): imprime SÓ '3 Atq', nunca as duas linhas", () => {
    const character = warlockAt(12);
    choose(character, "pacto-da-lamina");
    choose(character, "lamina-sedenta");
    choose(character, "lamina-devoradora");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Lâmina Devoradora: arma de pacto 3 Atq");
    expect(block).not.toContain("Lâmina Sedenta: arma de pacto 2 Atq");
    expect(block.match(/Atq$/gm)?.length).toBeLessThanOrEqual(1);
  });
});

describe("Punição Mística — dados resolvidos pelo círculo ATUAL de Magia de Pacto", () => {
  it("nível 5 (círculo 3 de Pacto): +4d8 (1 + 1 por círculo = 1+3)", () => {
    const character = warlockAt(5);
    choose(character, "pacto-da-lamina");
    choose(character, "punicao-mistica");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("+4d8 Energ");
    expect(block).not.toContain("{DadosPunição}");
  });

  it("nível 9 (círculo 5 de Pacto): +6d8", () => {
    const character = warlockAt(9);
    choose(character, "pacto-da-lamina");
    choose(character, "punicao-mistica");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("+6d8 Energ");
  });
});

describe("Presente dos Protetores — CAR resolvido numericamente, com checkbox", () => {
  it("CAR +3: 'até 3 nomes'", () => {
    const character = warlockAt(9, 16); // CAR 16 → +3
    choose(character, "pacto-do-tomo");
    choose(character, "presente-dos-protetores");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("> Presente dos Protetores [__]: até 3 nomes; 0 PV → 1 PV; 1/DL");
  });

  it("CAR +0 ou negativo: mínimo 1 nome", () => {
    const character = warlockAt(9, 10); // CAR 10 → +0
    choose(character, "pacto-do-tomo");
    choose(character, "presente-dos-protetores");
    const block = getWarlockPrintedBlocks(character).find((b) => b.includes("Invocações"))!;
    expect(block).toContain("até 1 nomes");
  });
});

describe("nenhuma variável entre chaves chega literalmente ao PDF", () => {
  it("em nenhum nível/combinação testada aparece algo como {Variavel}", () => {
    const character = warlockAt(17, 16, "Patrono Ínfero");
    choose(character, "pacto-da-lamina", "Espada Longa");
    choose(character, "lamina-sedenta");
    choose(character, "lamina-devoradora");
    choose(character, "lanca-mistica", "Raio de Fogo");
    choose(character, "punicao-mistica");
    choose(character, "pacto-do-tomo");
    choose(character, "presente-dos-protetores");
    const joined = getWarlockPrintedBlocks(character).join("\n");
    expect(joined).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });
});

describe("Características que nunca aparecem neste campo", () => {
  it("Magia de Pacto, Subclasse de Bruxo, ASI, Contatar Patrono, Arcana Mística e Dádiva Épica nunca aparecem", () => {
    const character = warlockAt(20, 14, "Patrono Celestial");
    const joined = getWarlockPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("Magia de Pacto");
    expect(joined).not.toContain("Subclasse de Bruxo");
    expect(joined).not.toContain("Contatar Patrono");
    expect(joined).not.toContain("Arcana Mística");
    expect(joined).not.toContain("Dádiva Épica");
  });
});

describe("snapshots do texto impresso por nível (Bruxo puro, sem subclasse, CAR 14)", () => {
  it.each([1, 5, 11, 17, 20])("nível %i", (level) => {
    expect(getWarlockPrintedBlocks(warlockAt(level))).toMatchSnapshot();
  });
});
