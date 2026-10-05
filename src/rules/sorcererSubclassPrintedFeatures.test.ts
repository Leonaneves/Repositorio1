import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getSorcererSubclassPrintedBlocks } from "./sorcererSubclassPrintedFeatures.js";
import { getSorcererPrintedBlocks } from "./sorcererPrintedFeatures.js";

const SUBCLASSES = {
  aberrante: "Feitiçaria Aberrante",
  draconica: "Feitiçaria Dracônica",
  mecanica: "Feitiçaria Mecânica",
  selvagem: "Feitiçaria Selvagem",
} as const;

function sorcererAt(level: number, subclassFullName: string | null, carisma = 14): Character {
  const character = createBlankCharacter("sorcerer-subclass-print-test");
  character.classId = "feiticeiro";
  character.level = level;
  character.abilities.CAR.score = carisma;
  character.subclassId = subclassFullName;
  return character;
}

describe("sem subclasse escolhida", () => {
  it("devolve []", () => {
    expect(getSorcererSubclassPrintedBlocks(sorcererAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/14/18)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3", (subclass) => {
    expect(getSorcererSubclassPrintedBlocks(sorcererAt(2, subclass))).toEqual([]);
  });
});

describe("Feitiçaria Aberrante", () => {
  it("Fala Telepática (3): alcance e duração resolvidos, CAR +3 -> 4,5km", () => {
    const character = sorcererAt(5, SUBCLASSES.aberrante, 16); // CAR 16 -> +3
    const text = getSorcererSubclassPrintedBlocks(character).find((b) => b.text.includes("Fala Telepática"))!.text;
    expect(text).toBe("#Fala Telepática\nAB, alvo 9m: telepatia 4,5km por 5min; idioma comum");
    expect(text).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
  });

  it("Fala Telepática: CAR +0 ou negativo -> mínimo 1,5km", () => {
    const character = sorcererAt(3, SUBCLASSES.aberrante, 8); // CAR 8 -> -1
    const text = getSorcererSubclassPrintedBlocks(character).find((b) => b.text.includes("Fala Telepática"))!.text;
    expect(text).toContain("telepatia 1,5km");
  });

  it("Defesas Psíquicas (6) e Implosão de Distorção (18, com checkbox)", () => {
    const blocks = getSorcererSubclassPrintedBlocks(sorcererAt(18, SUBCLASSES.aberrante));
    expect(blocks.some((b) => b.text === "#Defesas Psíquicas\nRes Psíquico; Vant Salv vs Amed/Enfeit")).toBe(true);
    expect(blocks.some((b) => b.text.startsWith("#Implosão de Distorção [__]"))).toBe(true);
  });

  it("Revelação em Carne (14): texto estático completo", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(14, SUBCLASSES.aberrante)).find((b) => b.text.includes("Revelação em Carne"))!.text;
    expect(text).toBe(
      [
        "#Revelação em Carne",
        "AB, 10 min; 1 PF por benefício:",
        "> Aquática: Natação = 2x Desl; respira água",
        "> Vermiforme: passa por 2,5cm; 1,5m mov -> escapa restrição não mágica/Imobilizado",
        "> Invisível: vê Invisíveis 18m, exc Cob Total",
        "> Voo: Voo = Desl; paira",
      ].join("\n"),
    );
  });

  it("Magias Psiônicas e Feitiçaria Psiônica nunca aparecem neste campo", () => {
    const joined = getSorcererSubclassPrintedBlocks(sorcererAt(18, SUBCLASSES.aberrante))
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Magias Psiônicas");
    expect(joined).not.toContain("Feitiçaria Psiônica");
  });
});

describe("Feitiçaria Dracônica", () => {
  it("Afinidade Elemental (6): sem escolha -> bloco não aparece (nunca resolve com valor inventado)", () => {
    expect(getSorcererSubclassPrintedBlocks(sorcererAt(6, SUBCLASSES.draconica)).some((b) => b.text.includes("Afinidade Elemental"))).toBe(false);
  });

  it.each(["Ácido", "Elétrico", "Fogo", "Gelo", "Venenoso"])("Afinidade Elemental: %s resolvido no cabeçalho e no corpo", (type) => {
    const character = sorcererAt(6, SUBCLASSES.draconica);
    character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: type };
    const text = getSorcererSubclassPrintedBlocks(character).find((b) => b.text.includes("Afinidade Elemental"))!.text;
    expect(text).toBe(`#Afinidade Elemental - ${type}\nRes ${type}; magia com dano de ${type} -> +CAR em 1 rolagem dano`);
  });

  it("Asas de Dragão (14): checkbox único", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(14, SUBCLASSES.draconica)).find((b) => b.text.includes("Asas de Dragão"))!.text;
    expect(text).toBe("#Asas de Dragão [__]\nAB: Voo 18m por 1h\nDL ou 3PF");
  });

  it("Resiliência Dracônica, Magias Dracônicas e Companheiro Dracônico nunca aparecem neste campo", () => {
    const character = sorcererAt(18, SUBCLASSES.draconica);
    character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Fogo" };
    const joined = getSorcererSubclassPrintedBlocks(character)
      .map((b) => b.text)
      .join("\n");
    expect(joined).not.toContain("Resiliência Dracônica");
    expect(joined).not.toContain("Magias Dracônicas");
    expect(joined).not.toContain("Companheiro Dracônico");
  });
});

describe("Feitiçaria Mecânica", () => {
  it("Restaurar Equilíbrio (3): checkbox = mod. CAR, mínimo 1", () => {
    const highCar = getSorcererSubclassPrintedBlocks(sorcererAt(3, SUBCLASSES.mecanica, 18)).find((b) => b.text.includes("Restaurar Equilíbrio"))!.text; // +4
    expect(highCar).toContain("#Restaurar Equilíbrio [__][__][__][__]");

    const lowCar = getSorcererSubclassPrintedBlocks(sorcererAt(3, SUBCLASSES.mecanica, 8)).find((b) => b.text.includes("Restaurar Equilíbrio"))!.text; // -1
    expect(lowCar).toContain("#Restaurar Equilíbrio [__]");
  });

  it("Bastião da Lei (6): sem checkbox", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(6, SUBCLASSES.mecanica)).find((b) => b.text.includes("Bastião da Lei"))!.text;
    expect(text).toBe(
      ["#Bastião da Lei", "Ação, 1-5PF: você/alvo 9m ganha mesmo no. de d8", "Ao sofrer dano, gaste dados -> reduza dano pelo total", "Até DL ou novo uso"].join(
        "\n",
      ),
    );
  });

  it("Transe da Ordem (14) e Cavalgada Mecânica (18)", () => {
    const blocks = getSorcererSubclassPrintedBlocks(sorcererAt(18, SUBCLASSES.mecanica));
    expect(blocks.some((b) => b.text.startsWith("#Transe da Ordem [__]"))).toBe(true);
    const cavalgada = blocks.find((b) => b.text.includes("Cavalgada Mecânica"))!.text;
    expect(cavalgada).toBe(
      ["#Cavalgada Mecânica [__]", "Ação, Cubo 9m:", "> distribua até 100 PV", "> encerre magias 6o- em criaturas/objetos escolhidos", "> repare objetos danificados", "DL ou 7PF"].join(
        "\n",
      ),
    );
  });
});

describe("Feitiçaria Selvagem", () => {
  it("Marés do Caos (3): checkbox único", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(3, SUBCLASSES.selvagem)).find((b) => b.text.includes("Marés do Caos"))!.text;
    expect(text).toBe(
      [
        "#Marés do Caos [__]",
        "Antes Teste d20 -> Vant",
        "Recupere ao conjurar magia Feiticeiro com espaço ou DL",
        "Se conjurar com espaço após usar -> Surto automático + recarrega",
      ].join("\n"),
    );
  });

  it("Surto de Magia Selvagem (3-13): texto base, sem rolagem dupla nem caixa de Surto Controlado", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(13, SUBCLASSES.selvagem)).find((b) => b.text.includes("Surto de Magia Selvagem"))!.text;
    expect(text).toBe(["#Surto de Magia Selvagem", "1/turno após magia Feiticeiro com espaço: pode d20", "20 -> tabela Surto; magia do Surto não recebe Meta"].join("\n"));
  });

  it("Caos Controlado (14): atualiza a MESMA linha (rola 2x e escolhe), nunca um bloco separado", () => {
    const blocks = getSorcererSubclassPrintedBlocks(sorcererAt(14, SUBCLASSES.selvagem));
    const surto = blocks.filter((b) => b.text.includes("Surto de Magia Selvagem"));
    expect(surto).toHaveLength(1);
    expect(surto[0].text).toContain("20 -> role 2x na tabela Surto e escolha; magia do Surto não recebe Meta");
    expect(blocks.some((b) => b.text.includes("Caos Controlado"))).toBe(false);
  });

  it("Surto Controlado (18): soma a linha com checkbox própria, mantendo a de Caos Controlado — nunca bloco separado", () => {
    const blocks = getSorcererSubclassPrintedBlocks(sorcererAt(18, SUBCLASSES.selvagem));
    const surto = blocks.filter((b) => b.text.includes("Surto de Magia Selvagem"));
    expect(surto).toHaveLength(1);
    expect(surto[0].text).toBe(
      [
        "#Surto de Magia Selvagem",
        "1/turno após magia Feiticeiro com espaço: pode d20",
        "20 -> role 2x na tabela Surto e escolha; magia do Surto não recebe Meta",
        "> [__] Após magia com espaço: escolha efeito da tabela exc última linha. 1/DL",
      ].join("\n"),
    );
    expect(blocks.some((b) => b.text.includes("Surto Controlado"))).toBe(false);
  });

  it("Distorcer a Sorte (6): sem checkbox", () => {
    const text = getSorcererSubclassPrintedBlocks(sorcererAt(6, SUBCLASSES.selvagem)).find((b) => b.text.includes("Distorcer a Sorte"))!.text;
    expect(text).toBe("#Distorcer a Sorte\nReação +1PF: após criatura visível Teste d20 -> + ou -1d4");
  });

  it("a tabela de Surto de Magia Selvagem nunca é inventada — nenhum resultado concreto de tabela aparece no texto", () => {
    const joined = getSorcererSubclassPrintedBlocks(sorcererAt(18, SUBCLASSES.selvagem))
      .map((b) => b.text)
      .join("\n");
    expect(joined).toContain("tabela Surto");
    expect(joined).not.toMatch(/\d+d\d+ .*Surto/); // nenhum efeito numérico de resultado de tabela
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 18 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 18", (_key, subclass) => {
    const character = sorcererAt(18, subclass, 16);
    character.knownMetamagicOptions = ["sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada"];
    if (subclass === "Feitiçaria Dracônica") character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Fogo" };
    expect(getSorcererPrintedBlocks(character)).toMatchSnapshot();
  });
});
