import { describe, expect, it } from "vitest";
import { CLASS_IDS } from "../domain/ids.js";
import { classes } from "./classes.js";

describe("classes — dados da base consolidada aprovada (12 classes) + fonte do Artífice (13ª e última)", () => {
  it.each(CLASS_IDS)("%s tem primaryAbilityText, skillChoice e startingEquipment preenchidos", (classId) => {
    const definition = classes[classId];
    expect(definition.primaryAbilityText).toBeTruthy();
    expect(definition.skillChoice).toBeDefined();
    expect(definition.startingEquipment).toBeDefined();
    expect(definition.startingEquipment!.length).toBeGreaterThanOrEqual(2);
  });

  it("Bardo escolhe 3 perícias quaisquer (from: 'any')", () => {
    expect(classes.bardo.skillChoice).toEqual({ count: 3, from: "any" });
  });

  it("Ladino escolhe 4 perícias entre uma lista de 10", () => {
    expect(classes.ladino.skillChoice?.count).toBe(4);
    expect(classes.ladino.skillChoice?.from).toHaveLength(10);
  });

  it("Artífice escolhe 2 perícias entre uma lista de 7 (fonte própria do Artífice)", () => {
    expect(classes.artifice.skillChoice?.count).toBe(2);
    expect(classes.artifice.skillChoice?.from).toEqual([
      "arcanismo",
      "historia",
      "investigacao",
      "medicina",
      "natureza",
      "percepcao",
      "prestidigitacao",
    ]);
  });

  it("Artífice: Ferramentas de Ladrão + Funileiro automáticas, 1 Ferramenta de Artesão à escolha", () => {
    expect(classes.artifice.toolProficiencyText).toContain("Ferramentas de Ladrão");
    expect(classes.artifice.toolProficiencyText).toContain("Ferramentas de Funileiro");
    expect(classes.artifice.toolChoice).toEqual({ count: 1, optionsText: "Ferramenta de Artesão" });
  });

  it("Artífice: espaços de magia próprios (casterKind), não a fórmula genérica de meio-conjurador", () => {
    expect(classes.artifice.casterKind).toBe("artificer");
  });

  it("Guerreiro é a única classe com 3 opções de equipamento inicial (A/B/C)", () => {
    expect(classes.guerreiro.startingEquipment).toHaveLength(3);
    expect(classes.guerreiro.startingEquipment?.map((o) => o.id)).toEqual(["A", "B", "C"]);
    for (const classId of CLASS_IDS.filter((id) => id !== "guerreiro")) {
      expect(classes[classId].startingEquipment).toHaveLength(2);
    }
  });

  it("toda opção de equipamento inicial tem id, items (array) e gold (número) OU goldFormula (texto, ex.: Artífice)", () => {
    for (const classId of CLASS_IDS) {
      for (const option of classes[classId].startingEquipment ?? []) {
        expect(typeof option.id).toBe("string");
        expect(Array.isArray(option.items)).toBe(true);
        expect(typeof option.gold === "number" || typeof option.goldFormula === "string").toBe(true);
      }
    }
  });

  it("Artífice: alternativa em ouro preserva a fórmula '5d4 × 10' (nunca convertida num número fixo)", () => {
    const ouro = classes.artifice.startingEquipment?.find((o) => o.id === "ouro");
    expect(ouro?.goldFormula).toBe("5d4 × 10");
    expect(ouro?.gold).toBeUndefined();
  });

  it("hitDie continua batendo com a tabela já aprovada (não foi alterado por esta base)", () => {
    expect(classes.artifice.hitDie).toBe(8);
    expect(classes.bardo.hitDie).toBe(8);
    expect(classes.barbaro.hitDie).toBe(12);
    expect(classes.feiticeiro.hitDie).toBe(6);
    expect(classes.mago.hitDie).toBe(6);
    expect(classes.guerreiro.hitDie).toBe(10);
    expect(classes.paladino.hitDie).toBe(10);
    expect(classes.patrulheiro.hitDie).toBe(10);
  });
});
