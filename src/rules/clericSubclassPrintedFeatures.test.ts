import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getClericChannelDivinityOptionLines, getClericSubclassPrintedBlocks } from "./clericSubclassPrintedFeatures.js";
import { getClericPrintedBlocks } from "./clericPrintedFeatures.js";

const SUBCLASSES = {
  guerra: "Domínio da Guerra",
  luz: "Domínio da Luz",
  trapaca: "Domínio da Trapaça",
  vida: "Domínio da Vida",
} as const;

function clericAt(level: number, subclassFullName: string | null, wisdom = 14): Character {
  const character = createBlankCharacter("cleric-subclass-print-test");
  character.classId = "clerigo";
  character.level = level;
  character.abilities.SAB.score = wisdom;
  character.subclassId = subclassFullName;
  return character;
}

describe("sem subclasse escolhida", () => {
  it("getClericChannelDivinityOptionLines e getClericSubclassPrintedBlocks devolvem [] quando subclassId é null", () => {
    expect(getClericChannelDivinityOptionLines(clericAt(10, null))).toEqual([]);
    expect(getClericSubclassPrintedBlocks(clericAt(10, null))).toEqual([]);
  });
});

describe("cada subclasse só aparece em seu nível de aquisição (3/6/17 — nunca 3/6/10/14)", () => {
  it.each(Object.values(SUBCLASSES))("%s: nada antes do nível 3", (subclass) => {
    expect(getClericChannelDivinityOptionLines(clericAt(2, subclass))).toEqual([]);
    expect(getClericSubclassPrintedBlocks(clericAt(2, subclass))).toEqual([]);
  });
});

describe("Domínio da Guerra", () => {
  it("nível 3: Ataque Direcionado entra como linha de Canalizar Divindade (nunca checkbox próprio)", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(3, SUBCLASSES.guerra));
    expect(lines).toEqual(["> Atq Direcionado: você/aliado 9m erra Atq -> +10; Reação se for aliado"]);
  });

  it("nível 6: soma a linha de Bênção do Deus da Guerra, mantendo Ataque Direcionado", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(6, SUBCLASSES.guerra));
    expect(lines).toEqual([
      "> Atq Direcionado: você/aliado 9m erra Atq -> +10; Reação se for aliado",
      "> Bênção Guerra: 1 uso -> Arma Espiritual/Escudo da Fé sem espaço/Concent, 1 min",
    ]);
  });

  it("Sacerdote da Guerra (3): checkbox próprio = mod. SAB, mínimo 1", () => {
    const highWis = getClericSubclassPrintedBlocks(clericAt(3, SUBCLASSES.guerra, 18)).find((b) => b.text.includes("Sacerdote da Guerra"))!.text; // +4
    expect(highWis).toContain("#Sacerdote da Guerra [__][__][__][__]");

    const lowWis = getClericSubclassPrintedBlocks(clericAt(3, SUBCLASSES.guerra, 8)).find((b) => b.text.includes("Sacerdote da Guerra"))!.text; // -1
    expect(lowWis).toContain("#Sacerdote da Guerra [__]");
  });

  it("Avatar da Guerra (17): bloco próprio, sem checkbox", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.guerra));
    expect(blocks.some((b) => b.text === "#Avatar da Guerra\nRes Conc/Cort/Perf")).toBe(true);
  });

  it("Bênção do Deus da Guerra e Ataque Direcionado NUNCA aparecem como bloco próprio (só como linha de Canalizar Divindade)", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.guerra));
    expect(blocks.some((b) => b.text.includes("Bênção"))).toBe(false);
    expect(blocks.some((b) => b.text.includes("Direcionado"))).toBe(false);
  });

  it("Exemplo integral da fonte — Domínio da Guerra nível 6 (item 47)", () => {
    const character = clericAt(6, SUBCLASSES.guerra, 14); // SAB 14 → +2
    expect(getClericPrintedBlocks(character)).toEqual([
      [
        "#Canalizar Divindade [__][__][__]",
        "DC: +1 uso; DL: todos",
        "> Centelha: alvo 9m, 1d8+SAB PV ou Salv CON -> Necrótico/Radiante; sucesso 1/2 dano",
        "> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min + 2d8 Radiante; este dano não encerra",
        "> Atq Direcionado: você/aliado 9m erra Atq -> +10; Reação se for aliado",
        "> Bênção Guerra: 1 uso -> Arma Espiritual/Escudo da Fé sem espaço/Concent, 1 min",
      ].join("\n"),
      ["#Sacerdote da Guerra [__][__]", "AB -> 1 Atq arma/Desarmado", "Todos/DC/DL"].join("\n"),
    ]);
  });
});

describe("Domínio da Luz", () => {
  it("Brilho do Amanhecer (3): linha de Canalizar Divindade com {NivelClerigo} resolvido numericamente", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(9, SUBCLASSES.luz));
    expect(lines).toEqual(["> Brilho Amanhecer: Emanação 9m, dissipa Escuridão mágica; escolhidos Salv CON -> 2d10+9 Radiante, sucesso 1/2"]);
  });

  it("Labareda Protetora (3-5): checkbox = mod. SAB, recupera só DL, sem PV Temp ainda", () => {
    const text = getClericSubclassPrintedBlocks(clericAt(5, SUBCLASSES.luz, 16)).find((b) => b.text.includes("Labareda Protetora"))!.text; // +3
    expect(text).toBe(["#Labareda Protetora [__][__][__]", "Reação: Atq visível a 9m recebe Desv", "Todos/DL"].join("\n"));
  });

  it("Labareda Protetora Aprimorada (6+): MESMO bloco, soma PV Temp e recuperação DC/DL — nunca um bloco separado", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(6, SUBCLASSES.luz, 16));
    const labareda = blocks.filter((b) => b.text.includes("Labareda Protetora"));
    expect(labareda).toHaveLength(1);
    expect(labareda[0].text).toBe(
      ["#Labareda Protetora [__][__][__]", "Reação: Atq visível a 9m recebe Desv", "Alvo do Atq ganha 2d6+SAB PV Temp", "Todos/DC/DL"].join("\n"),
    );
    expect(blocks.some((b) => b.text.includes("Labareda Protetora Aprimorada"))).toBe(false);
  });

  it("Coroa de Luz (17): checkbox próprio = mod. SAB, mínimo 1", () => {
    const text = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.luz, 8)).find((b) => b.text.includes("Coroa de Luz"))!.text; // -1 → mínimo 1
    expect(text).toBe(
      [
        "#Coroa de Luz [__]",
        "Ação: aura 1 min, Luz 18m + Meia-luz 9m",
        "Inimigos na Luz têm Desv Salv vs Brilho e magias Fogo/Radiante",
        "Todos/DL",
      ].join("\n"),
    );
  });
});

describe("Domínio da Trapaça", () => {
  it("Bênção do Trapaceiro (3): bloco próprio, NUNCA opção de Canalizar Divindade", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(3, SUBCLASSES.trapaca));
    expect(lines.some((l) => l.includes("Trapaceiro"))).toBe(false);

    const blocks = getClericSubclassPrintedBlocks(clericAt(3, SUBCLASSES.trapaca));
    expect(blocks.some((b) => b.text === ["#Bênção do Trapaceiro", "Ação: você/alvo voluntário 9m ganha Vant em Furt", "Até DL ou novo uso"].join("\n"))).toBe(
      true,
    );
  });

  it("Invocar Duplicidade (3-5): linha única de Canalizar Divindade, sem trocar de lugar", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(5, SUBCLASSES.trapaca));
    expect(lines).toEqual([
      "> Invocar Duplicidade: AB, ilusão a 9m por 1 min; conjure do espaço dela; se ambos a 1,5m do alvo, Vant Atq; AB move 9m, até 36m",
    ]);
  });

  it("Transposição do Trapaceiro (6-16): atualiza a MESMA linha — soma 'pode trocar de lugar', nunca uma 2ª linha", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(6, SUBCLASSES.trapaca));
    expect(lines).toEqual([
      "> Invocar Duplicidade: AB, ilusão a 9m por 1 min; conjure do espaço dela; se ambos a 1,5m do alvo, Vant Atq; AB move 9m, até 36m, e pode trocar de lugar",
    ]);
  });

  it("Duplicidade Aprimorada (17+): atualiza a MESMA linha com Distração Compartilhada + soma a linha de cura com {CuraDuplicidade} resolvido", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(17, SUBCLASSES.trapaca));
    expect(lines).toEqual([
      [
        "> Invocar Duplicidade: AB, ilusão a 9m por 1 min; conjure do espaço dela; Atq contra alvo a 1,5m dela têm Vant; AB move 9m, até 36m, e pode trocar de lugar",
        "> Ao terminar: você/alvo a 1,5m cura 17 PV",
      ].join("\n"),
    ]);
  });

  it("Invocar Duplicidade NUNCA aparece como bloco próprio/checkbox — só como linha de Canalizar Divindade", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.trapaca));
    expect(blocks.some((b) => b.text.includes("Duplicidade"))).toBe(false);
  });
});

describe("Domínio da Vida", () => {
  it("Preservar a Vida (3): linha de Canalizar Divindade com {ReservaPreservar} = 5x nível resolvido", () => {
    const lines = getClericChannelDivinityOptionLines(clericAt(4, SUBCLASSES.vida));
    expect(lines).toEqual(["> Preservar Vida: distribua 20 PV entre criaturas Sangrando a 9m; máx 1/2 PV de cada"]);
  });

  it("Discípulo da Vida (3-5): bloco próprio, sem checkbox, sem a linha de Curandeiro Abençoado ainda", () => {
    const text = getClericSubclassPrintedBlocks(clericAt(5, SUBCLASSES.vida)).find((b) => b.text.includes("Discípulo da Vida"))!.text;
    expect(text).toBe(["#Discípulo da Vida", "Magia com espaço que cura -> alvo +2+círculo PV"].join("\n"));
  });

  it("Curandeiro Abençoado (6+): funde-se no MESMO bloco de Discípulo da Vida, nunca um bloco separado", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(6, SUBCLASSES.vida));
    const discipulo = blocks.filter((b) => b.text.includes("Discípulo da Vida"));
    expect(discipulo).toHaveLength(1);
    expect(discipulo[0].text).toBe(["#Discípulo da Vida", "Magia com espaço que cura -> alvo +2+círculo PV", "> Se curar outro -> você cura 2+círculo"].join("\n"));
    expect(blocks.some((b) => b.text.includes("Curandeiro Abençoado"))).toBe(false);
  });

  it("Cura Suprema (17): bloco próprio, sem checkbox", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.vida));
    expect(blocks.some((b) => b.text === "#Cura Suprema\nCura por magia/Canalizar -> dados usam resultado máx")).toBe(true);
  });

  it("Preservar a Vida NUNCA aparece como bloco próprio/checkbox — só como linha de Canalizar Divindade", () => {
    const blocks = getClericSubclassPrintedBlocks(clericAt(17, SUBCLASSES.vida));
    expect(blocks.some((b) => b.text.includes("Preservar"))).toBe(false);
  });
});

describe("Magias de Domínio NUNCA aparecem em nenhum bloco deste campo (vão para a área de Magias)", () => {
  it.each(Object.values(SUBCLASSES))("%s", (subclass) => {
    const character = clericAt(20, subclass);
    const joined = [...getClericChannelDivinityOptionLines(character), ...getClericSubclassPrintedBlocks(character).map((b) => b.text)].join("\n");
    expect(joined).not.toContain("Magias de Domínio");
  });
});

describe("snapshots do texto impresso composto (classe + subclasse entrelaçados) — nível 17 de cada subclasse", () => {
  it.each(Object.entries(SUBCLASSES))("%s nível 17", (_key, subclass) => {
    expect(getClericPrintedBlocks(clericAt(17, subclass, 16))).toMatchSnapshot();
  });
});
