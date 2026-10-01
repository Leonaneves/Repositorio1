import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getBardSubclassPrintedBlocks } from "./bardSubclassPrintedFeatures.js";
import { getBardPrintedBlocks } from "./bardPrintedFeatures.js";

const SUBCLASSES = {
  bravura: "Colégio da Bravura",
  danca: "Colégio da Dança",
  conhecimento: "Colégio do Conhecimento",
  glamour: "Colégio do Glamour",
} as const;

function bardAt(level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("bard-subclass-print-test");
  character.classId = "bardo";
  character.level = level;
  character.abilities.CAR.score = 14;
  character.subclassId = subclassFullName;
  return character;
}

describe("getBardSubclassPrintedBlocks — sem subclasse escolhida", () => {
  it("devolve [] quando subclassId é null", () => {
    expect(getBardSubclassPrintedBlocks(bardAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/14)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3", (subclass) => {
    expect(getBardSubclassPrintedBlocks(bardAt(2, subclass))).toEqual([]);
  });

  it.each(Object.values(SUBCLASSES))("%s nível 14: já tem blocos dos níveis 3 e 14", (subclass) => {
    const levels = new Set(getBardSubclassPrintedBlocks(bardAt(14, subclass)).map((b) => b.level));
    expect(levels.has(3)).toBe(true);
    expect(levels.has(14)).toBe(true);
  });
});

describe("Colégio da Bravura", () => {
  it("Treinamento Marcial NUNCA aparece no texto impresso (vai para Proficiências/Armas e Armaduras)", () => {
    const joined = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.bravura))
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Treinamento Marcial");
  });

  it("nível 6: Ataque Extra com a explicação da troca por Truque (título só não bastaria aqui)", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(6, SUBCLASSES.bravura)).find((b) => b.text.includes("Ataque Extra"))!.text;
    expect(text).toBe("#Ataque Extra\n1 Atq pode ser trocado por Truque de 1 ação");
  });

  it("nível 14: Magia de Batalha", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.bravura)).find((b) => b.text.includes("Magia de Batalha"))!.text;
    expect(text).toBe("#Magia de Batalha\nApós magia de 1 ação: AB → 1 Atq com arma");
  });
});

describe("Colégio da Dança", () => {
  it("nível 6: Gingado Coordenado e Movimento Inspirador aparecem como 2 blocos distintos", () => {
    const blocks = getBardSubclassPrintedBlocks(bardAt(6, SUBCLASSES.danca)).filter((b) => b.level === 6);
    expect(blocks).toHaveLength(2);
    expect(blocks.some((b) => b.text.startsWith("#Gingado Coordenado"))).toBe(true);
    expect(blocks.some((b) => b.text.startsWith("#Movimento Inspirador"))).toBe(true);
  });

  it("nível 14: Evasão Liderada", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.danca)).find((b) => b.text.includes("Evasão Liderada"))!.text;
    expect(text).toBe("#Evasão Liderada\nSalv DES p/½ dano: sucesso 0, falha ½\nAliados a 1,5m também recebem; não funciona Incapacitado");
  });
});

describe("Colégio do Conhecimento", () => {
  it("Proficiências Bônus e Descobertas Mágicas NUNCA aparecem no texto impresso", () => {
    const joined = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.conhecimento))
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Proficiências Bônus");
    expect(joined).not.toContain("Descobertas Mágicas");
  });

  it("nível 6: nenhum bloco impresso (Descobertas Mágicas é a única feature desse nível, e é omitida)", () => {
    const blocks = getBardSubclassPrintedBlocks(bardAt(6, SUBCLASSES.conhecimento)).filter((b) => b.level === 6);
    expect(blocks).toHaveLength(0);
  });

  it("nível 14: Perícia Inigualável", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.conhecimento)).find((b) => b.text.includes("Perícia Inigualável"))!.text;
    expect(text).toBe("#Perícia Inigualável\nFalha em teste/Atq: use Insp e some dado ao d20\nSe ainda falhar, Insp não é gasta");
  });
});

describe("Colégio do Glamour — checkboxes de uso gratuito (1×/DL)", () => {
  it("nível 3: Magia Fascinante e Manto de Inspiração são 2 blocos distintos; só o primeiro tem checkbox", () => {
    const blocks = getBardSubclassPrintedBlocks(bardAt(3, SUBCLASSES.glamour)).filter((b) => b.level === 3);
    expect(blocks).toHaveLength(2);
    const fascinante = blocks.find((b) => b.text.startsWith("#Magia Fascinante"))!.text;
    const manto = blocks.find((b) => b.text.startsWith("#Manto de Inspiração"))!.text;
    expect(fascinante).toContain("#Magia Fascinante [__]");
    expect(manto).not.toMatch(/\[__\]/);
  });

  it("nível 6: Manto de Majestade com checkbox", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(6, SUBCLASSES.glamour)).find((b) => b.text.includes("Manto de Majestade"))!.text;
    expect(text).toContain("#Manto de Majestade [__]");
  });

  it("nível 14: Majestade Inquebrável com checkbox", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.glamour)).find((b) => b.text.includes("Majestade Inquebrável"))!.text;
    expect(text).toContain("#Majestade Inquebrável [__]");
  });

  it("nomes das magias sempre preparadas de Magia Fascinante (Enfeitiçar Pessoa, Reflexos) NUNCA aparecem no texto impresso", () => {
    const joined = getBardSubclassPrintedBlocks(bardAt(14, SUBCLASSES.glamour))
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Enfeitiçar Pessoa");
    expect(joined).not.toContain("Reflexos");
  });

  it("Manto de Majestade cita 'Comando' só como parte do mecanismo do próprio efeito (conjurar grátis), nunca como lista de magia sempre preparada", () => {
    const text = getBardSubclassPrintedBlocks(bardAt(6, SUBCLASSES.glamour)).find((b) => b.text.includes("Manto de Majestade"))!.text;
    expect(text).toBe(
      "#Manto de Majestade [__]\nAB: Comando grátis + forma por 1 min/Concent\nDurante: AB → Comando grátis; Enfeit por você falham Salv\nDL ou espaço 3º+",
    );
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 14 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 14", (_key, subclass) => {
    expect(getBardPrintedBlocks(bardAt(14, subclass))).toMatchSnapshot();
  });
});
