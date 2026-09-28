import { describe, expect, it } from "vitest";
import { CLASS_IDS } from "../domain/ids.js";
import { classes } from "./classes.js";

const CONFIRMED_CLASS_IDS = CLASS_IDS.filter((id) => id !== "artifice");

describe("classes — dados da base consolidada aprovada", () => {
  it("Artífice fica deliberadamente sem skillChoice/startingEquipment/primaryAbilityText (fora da base fornecida)", () => {
    expect(classes.artifice.primaryAbilityText).toBeNull();
    expect(classes.artifice.skillChoice).toBeUndefined();
    expect(classes.artifice.startingEquipment).toBeUndefined();
  });

  it.each(CONFIRMED_CLASS_IDS)("%s tem primaryAbilityText, skillChoice e startingEquipment preenchidos", (classId) => {
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

  it("Guerreiro é a única classe com 3 opções de equipamento inicial (A/B/C)", () => {
    expect(classes.guerreiro.startingEquipment).toHaveLength(3);
    expect(classes.guerreiro.startingEquipment?.map((o) => o.id)).toEqual(["A", "B", "C"]);
    for (const classId of CONFIRMED_CLASS_IDS.filter((id) => id !== "guerreiro")) {
      expect(classes[classId].startingEquipment).toHaveLength(2);
    }
  });

  it("toda opção de equipamento inicial tem id, items (array) e gold (número)", () => {
    for (const classId of CONFIRMED_CLASS_IDS) {
      for (const option of classes[classId].startingEquipment ?? []) {
        expect(typeof option.id).toBe("string");
        expect(Array.isArray(option.items)).toBe(true);
        expect(typeof option.gold).toBe("number");
      }
    }
  });

  it("hitDie continua batendo com a tabela já aprovada (não foi alterado por esta base)", () => {
    expect(classes.bardo.hitDie).toBe(8);
    expect(classes.barbaro.hitDie).toBe(12);
    expect(classes.feiticeiro.hitDie).toBe(6);
    expect(classes.mago.hitDie).toBe(6);
    expect(classes.guerreiro.hitDie).toBe(10);
    expect(classes.paladino.hitDie).toBe(10);
    expect(classes.patrulheiro.hitDie).toBe(10);
  });
});
