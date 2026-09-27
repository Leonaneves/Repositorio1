import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "./character.js";

describe("createBlankCharacter", () => {
  it("cria um personagem com todos os atributos em 10 e nenhuma proficiência marcada", () => {
    const character = createBlankCharacter("test-1");

    expect(character.level).toBe(1);
    expect(character.classId).toBeNull();
    for (const ability of Object.values(character.abilities)) {
      expect(ability.score).toBe(10);
    }
    for (const skill of Object.values(character.skills)) {
      expect(skill.proficient).toBe(false);
      expect(skill.expertise).toBe(false);
      expect(skill.manualAdjustment).toBe(0);
    }
    for (const save of Object.values(character.savingThrows)) {
      expect(save.proficient).toBe(false);
      expect(save.manualAdjustment).toBe(0);
    }
  });

  it("começa sem armadura equipada e sem escudo", () => {
    const character = createBlankCharacter("test-2");
    expect(character.armor.equipped).toBe("unarmed");
    expect(character.armor.shield).toBe(false);
  });

  it("gera 9 espaços de magia (círculos 1–9) zerados", () => {
    const character = createBlankCharacter("test-3");
    expect(Object.keys(character.spellcasting.slots)).toHaveLength(9);
    for (const slot of Object.values(character.spellcasting.slots)) {
      expect(slot.expended).toBe(0);
    }
  });
});
