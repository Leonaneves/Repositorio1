import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassProgression } from "./classProgression.js";

describe("getClassProgression — ponto único de consulta para tudo que a classe concede num nível", () => {
  it("Bárbaro nível 5: hitDie/hitDiceMax + recursos de Bárbaro + ataque extra, sem nada de conjuração", () => {
    const character = createBlankCharacter("progression-test");
    character.classId = "barbaro";
    character.level = 5;
    const progression = getClassProgression(character);

    expect(progression.hitDie).toBe(12);
    expect(progression.hitDiceMax).toBe(5);
    expect(progression.extraAttacks).toBe(1);
    expect(progression.resources.rageCount).toBe(3);
    expect(progression.resources.rageDamageBonus).toBe(2);
    expect(progression.resources.weaponMasteryCount).toBe(3);
    expect(progression.cantripsKnown).toBeNull();
    expect(progression.spellsPreparedMax).toBeNull();
    expect(progression.pactMagic).toBeNull();
    expect(progression.spellSlots[1]).toBe(0);
  });

  it("Mago nível 5: truques/magias preparadas/espaços de magia todos presentes", () => {
    const character = createBlankCharacter("progression-test");
    character.classId = "mago";
    character.level = 5;
    const progression = getClassProgression(character);

    expect(progression.hitDie).toBe(6);
    expect(progression.cantripsKnown).toBe(4);
    expect(progression.spellsPreparedMax).toBe(9);
    expect(progression.spellSlots).toEqual({ 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
    expect(progression.resources.rageCount).toBeNull(); // recurso de outra classe nunca aparece
  });

  it("Bruxo nível 5: Magia de Pacto preenchida (e refletida em spellSlots, que já sabe combinar as duas fontes)", () => {
    const character = createBlankCharacter("progression-test");
    character.classId = "bruxo";
    character.level = 5;
    const progression = getClassProgression(character);

    expect(progression.pactMagic).toEqual({ slotCircle: 3, slotCount: 2 });
    expect(progression.spellSlots[3]).toBe(2); // mesmo valor da Magia de Pacto, só no formato comum de espaços por círculo
    expect(progression.resources.invocationsKnown).toBe(5);
  });

  it("Artífice nível 10: hitDie d8, truques/infusões/itens infundidos da fonte própria, espaços de magia próprios", () => {
    const character = createBlankCharacter("progression-test");
    character.classId = "artifice";
    character.level = 10;
    const progression = getClassProgression(character);

    expect(progression.hitDie).toBe(8);
    expect(progression.hitDiceMax).toBe(10);
    expect(progression.cantripsKnown).toBe(3);
    expect(progression.spellsPreparedMax).toBeNull(); // sem coluna "Magias Preparadas" na fonte
    expect(progression.spellSlots).toEqual({ 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
    expect(progression.pactMagic).toBeNull(); // só o Bruxo tem Magia de Pacto
    expect(progression.resources.infusionsKnown).toBe(8);
    expect(progression.resources.infusedItemsMax).toBe(4);
    expect(progression.resources.rageCount).toBeNull(); // recurso de outra classe nunca aparece
  });

  it("Artífice nível 1: Truques Conhecidos=2, Infusões/Itens Infundidos indisponíveis (0, nunca null — a classe está certa)", () => {
    const character = createBlankCharacter("progression-test");
    character.classId = "artifice";
    character.level = 1;
    const progression = getClassProgression(character);

    expect(progression.cantripsKnown).toBe(2);
    expect(progression.resources.infusionsKnown).toBe(0);
    expect(progression.resources.infusedItemsMax).toBe(0);
    expect(progression.spellSlots[1]).toBe(2); // conjuração desde o nível 1
  });

  it("sem classe, campos derivados ficam null/vazios, sem quebrar", () => {
    const character = createBlankCharacter("progression-test");
    const progression = getClassProgression(character);

    expect(progression.classId).toBeNull();
    expect(progression.hitDie).toBeNull();
    expect(progression.cantripsKnown).toBeNull();
    expect(progression.pactMagic).toBeNull();
    expect(progression.extraAttacks).toBe(0);
    expect(progression.resources.rageCount).toBeNull();
  });
});
