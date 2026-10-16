import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  getPaladinAuraExtraLines,
  getPaladinAuraImmunityConditions,
  getPaladinChannelDivinityOptionLines,
  getPaladinDivineSmiteExtraLines,
  getPaladinSubclassPrintedBlocks,
} from "./paladinSubclassPrintedFeatures.js";
import { getPaladinPrintedBlocks } from "./paladinPrintedFeatures.js";

function paladinAt(level: number, subclassFullName: string | null, carScore = 16): Character {
  const character = createBlankCharacter("paladin-subclass-printed-test");
  character.classId = "paladino";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.CAR.score = carScore;
  return character;
}

describe("getPaladinChannelDivinityOptionLines", () => {
  it("sem subclasse — []", () => {
    expect(getPaladinChannelDivinityOptionLines(paladinAt(3, null))).toEqual([]);
  });

  it("Juramento da Devoção, nível 3 (mod CAR +3): Arma Sagrada com bônus resolvido +3", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(3, "Juramento da Devoção"));
    expect(lines).toContain("> Arma Sagrada: ao Atacar, arma Corpo a Corpo ganha +3 Atq por 10min");
    expect(lines).toContain("> Pode causar Radiante; Luz Plena 6m + Meia-luz 6m");
    expect(lines).toContain("> Encerra ao deixar de carregar a arma ou usar novamente");
    expect(lines.join("\n")).not.toContain("mod CAR");
  });

  it("Juramento da Devoção, mod CAR negativo: bônus nunca cai abaixo de +1", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(3, "Juramento da Devoção", 8));
    expect(lines).toContain("> Arma Sagrada: ao Atacar, arma Corpo a Corpo ganha +1 Atq por 10min");
  });

  it("Juramento da Glória, nível 3: Atleta Inigualável e Destruição Inspiradora (PV Temp resolvido)", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(3, "Juramento da Glória"));
    expect(lines).toContain("> Atleta Inigualável: AB, Vant em Atlet/Acrobacia e saltos +3m por 1h");
    expect(lines).toContain("> Destruição Inspiradora: após Destruição Divina, distribui 2d8+3 PV Temp a 9m");
  });

  it("Juramento da Vingança, nível 3: Voto de Inimizade, sem Alma Vingativa ainda", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(3, "Juramento da Vingança"));
    expect(lines).toContain("> Voto de Inimizade: ao Atacar, Vant contra 1 alvo a 9m por 1min");
    expect(lines).toContain("> Alvo cai a 0 PV: pode transferir a outro a 9m sem ação");
    expect(lines.join("\n")).not.toContain("Reação para Atq corpo a corpo");
  });

  it("Juramento da Vingança, nível 15: Alma Vingativa acrescenta a linha de Reação, junto do Voto (mesmo array, sem bloco próprio)", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(15, "Juramento da Vingança"));
    expect(lines).toContain("> Voto de Inimizade: ao Atacar, Vant contra 1 alvo a 9m por 1min");
    expect(lines).toContain("> Alvo do Voto acerta/erra Atq: Reação para Atq corpo a corpo contra ele");
  });

  it("Juramento dos Anciões, nível 3: A Ira da Natureza", () => {
    const lines = getPaladinChannelDivinityOptionLines(paladinAt(3, "Juramento dos Anciões"));
    expect(lines).toContain("> A Ira da Natureza: Usar Magia, criaturas escolhidas a 4,5m, Salv FOR");
    expect(lines).toContain("> Falha: Contido 1min, repete no fim do turno");
  });

  it("nível abaixo do de aquisição — []", () => {
    expect(getPaladinChannelDivinityOptionLines(paladinAt(2, "Juramento da Devoção"))).toEqual([]);
  });
});

describe("getPaladinAuraImmunityConditions", () => {
  it("Juramento da Devoção, nível 7+: Enfeitiçado", () => {
    expect(getPaladinAuraImmunityConditions(paladinAt(7, "Juramento da Devoção"))).toEqual(["Enfeitiçado"]);
  });

  it("Juramento da Devoção, nível 6: ainda []", () => {
    expect(getPaladinAuraImmunityConditions(paladinAt(6, "Juramento da Devoção"))).toEqual([]);
  });

  it("outros juramentos: []", () => {
    expect(getPaladinAuraImmunityConditions(paladinAt(10, "Juramento da Glória"))).toEqual([]);
    expect(getPaladinAuraImmunityConditions(paladinAt(10, "Juramento da Vingança"))).toEqual([]);
    expect(getPaladinAuraImmunityConditions(paladinAt(10, "Juramento dos Anciões"))).toEqual([]);
  });
});

describe("getPaladinAuraExtraLines", () => {
  it("Juramento da Glória, nível 7+: linha de Aura de Vivacidade", () => {
    expect(getPaladinAuraExtraLines(paladinAt(7, "Juramento da Glória"))).toEqual([
      "> Aliado entra/inicia turno na aura: Desl +3m até fim do prxm turno dele",
    ]);
  });

  it("Juramento dos Anciões, nível 7+: linha de Aura de Resistência", () => {
    expect(getPaladinAuraExtraLines(paladinAt(7, "Juramento dos Anciões"))).toEqual(["> Res a Necrótico/Psíquico/Radiante na aura"]);
  });

  it("Juramento da Devoção/Vingança: []  (imunidade é tratada em outra função, Vingança não tem linha extra de aura)", () => {
    expect(getPaladinAuraExtraLines(paladinAt(10, "Juramento da Devoção"))).toEqual([]);
    expect(getPaladinAuraExtraLines(paladinAt(10, "Juramento da Vingança"))).toEqual([]);
  });

  it("nível abaixo de 7: []", () => {
    expect(getPaladinAuraExtraLines(paladinAt(6, "Juramento da Glória"))).toEqual([]);
  });
});

describe("getPaladinDivineSmiteExtraLines", () => {
  it("Juramento da Devoção, nível 15+: linha de Destruição Protetora", () => {
    expect(getPaladinDivineSmiteExtraLines(paladinAt(15, "Juramento da Devoção"))).toEqual([
      "> Conjurar Destruição Divina: Cobertura Parcial na aura até início do prxm turno",
    ]);
  });

  it("nível 14 ou outro juramento: []", () => {
    expect(getPaladinDivineSmiteExtraLines(paladinAt(14, "Juramento da Devoção"))).toEqual([]);
    expect(getPaladinDivineSmiteExtraLines(paladinAt(15, "Juramento da Glória"))).toEqual([]);
  });
});

describe("getPaladinSubclassPrintedBlocks — blocos próprios (com checkbox quando aplicável)", () => {
  it("sem subclasse — []", () => {
    expect(getPaladinSubclassPrintedBlocks(paladinAt(20, null))).toEqual([]);
  });

  describe("Juramento da Devoção", () => {
    it("nível 20 (mod CAR +3, BP 6): Resplendor Sagrado com dano resolvido 9", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(20, "Juramento da Devoção"));
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.level).toBe(20);
      expect(blocks[0]?.text).toContain("# RESPLENDOR SAGRADO");
      expect(blocks[0]?.text).toContain("> AB: 10min [__]/DL; espaço de 5º recupera uso sem ação");
      expect(blocks[0]?.text).toContain("Inimigo inicia turno na aura: 9 Radiante");
      expect(blocks[0]?.text).toContain("Vant em Salv impostas por Ínferos/Mortos-Vivos");
    });

    it("nível 19: ainda sem Resplendor Sagrado", () => {
      expect(getPaladinSubclassPrintedBlocks(paladinAt(19, "Juramento da Devoção"))).toEqual([]);
    });
  });

  describe("Juramento da Glória", () => {
    it("nível 15 (mod CAR +3): Defesa Gloriosa com bônus/checkbox resolvidos", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(15, "Juramento da Glória"));
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.text).toContain("# DEFESA GLORIOSA");
      expect(blocks[0]?.text).toContain("+3 CA contra Atq [__][__][__]/DL");
    });

    it("nível 20: Defesa Gloriosa + Lenda Viva, cada um no próprio nível", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(20, "Juramento da Glória"));
      expect(blocks).toHaveLength(2);
      const defesa = blocks.find((b) => b.text.startsWith("# DEFESA GLORIOSA"));
      const lenda = blocks.find((b) => b.text.startsWith("# LENDA VIVA"));
      expect(defesa?.level).toBe(15);
      expect(lenda?.level).toBe(20);
      expect(lenda?.text).toContain("Vant em testes CAR; 1/no seu turno: erro com arma vira acerto");
      expect(lenda?.text).toContain("Falhou Salv: Reação para repetir, usa novo resultado");
    });
  });

  describe("Juramento da Vingança", () => {
    it("nível 7: Vingador Implacável", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(7, "Juramento da Vingança"));
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.text).toBe(
        "# VINGADOR IMPLACÁVEL\n> Acerto de Atq de Oport: Desl do alvo 0 no turno, pode mover 1/2 Desl sem Atq de Oport",
      );
    });

    it("nível 20: Vingador Implacável + Anjo Vingador", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(20, "Juramento da Vingança"));
      expect(blocks).toHaveLength(2);
      const anjo = blocks.find((b) => b.text.startsWith("# ANJO VINGADOR"));
      expect(anjo?.level).toBe(20);
      expect(anjo?.text).toContain("Voo 18m, pode pairar");
      expect(anjo?.text).toContain("Inimigo inicia turno na aura: Salv SAB, falha Amedrontado 1min ou dano");
    });
  });

  describe("Juramento dos Anciões", () => {
    it("nível 15 (nível de Paladino 15): Sentinela Imortal com cura resolvida 45", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(15, "Juramento dos Anciões"));
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.text).toContain("Cai a 0 PV sem morrer: fica com 1 PV e cura 45 PV [__]/DL");
      expect(blocks[0]?.text).toContain("Sem envelhecimento mágico ou da aparência");
    });

    it("nível 20: Sentinela Imortal + Campeão Ancestral (duração de 1min, não 10min)", () => {
      const blocks = getPaladinSubclassPrintedBlocks(paladinAt(20, "Juramento dos Anciões"));
      expect(blocks).toHaveLength(2);
      const campeao = blocks.find((b) => b.text.startsWith("# CAMPEÃO ANCESTRAL"));
      expect(campeao?.text).toContain("> AB: 1min [__]/DL; espaço de 5º recupera uso sem ação");
      expect(campeao?.text).toContain("Início do turno: recupera 10 PV");
    });
  });
});

describe("getPaladinPrintedBlocks — merge classe + subclasse, sem duplicar títulos, ordenado por nível", () => {
  it("nível 20, Juramento da Glória: blocos da classe primeiro, depois Defesa Gloriosa (15) e Lenda Viva (20) em ordem", () => {
    const blocks = getPaladinPrintedBlocks(paladinAt(20, "Juramento da Glória"));
    const defesaIndex = blocks.findIndex((b) => b.startsWith("# DEFESA GLORIOSA"));
    const lendaIndex = blocks.findIndex((b) => b.startsWith("# LENDA VIVA"));
    expect(defesaIndex).toBeGreaterThan(-1);
    expect(lendaIndex).toBeGreaterThan(defesaIndex);
  });

  it("nenhum título duplicado em todo o conjunto de blocos", () => {
    const blocks = getPaladinPrintedBlocks(paladinAt(20, "Juramento dos Anciões"));
    const titles = blocks.map((b) => b.split("\n")[0]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("classe diferente — []", () => {
    const character = createBlankCharacter("x");
    character.classId = "clerigo";
    expect(getPaladinPrintedBlocks(character)).toEqual([]);
  });
});
