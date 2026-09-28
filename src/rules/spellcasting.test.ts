import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getCasterProgressionType,
  getSpellAttackBonus,
  getSpellcastingAbility,
  getSpellcastingModifier,
  getSpellSaveDC,
  getSpellSlots,
} from "./spellcasting.js";

describe("getSpellcastingAbility — atributo de conjuração por classe", () => {
  it("Feiticeiro → CARISMA", () => {
    const character = createBlankCharacter("t");
    character.classId = "feiticeiro";
    expect(getSpellcastingAbility(character)).toBe("CAR");
  });

  it("Mago → INTELIGÊNCIA", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });

  it("Clérigo → SABEDORIA", () => {
    const character = createBlankCharacter("t");
    character.classId = "clerigo";
    expect(getSpellcastingAbility(character)).toBe("SAB");
  });

  it("Artífice → INTELIGÊNCIA", () => {
    const character = createBlankCharacter("t");
    character.classId = "artifice";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });

  it("classe sem conjuração e sem antecedente/subclasse relevante → null", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    expect(getSpellcastingAbility(character)).toBeNull();
  });
});

describe("getSpellcastingAbility — subclasses conjuradoras (Guerreiro/Ladino)", () => {
  it("Guerreiro/Cavaleiro Místico → INTELIGÊNCIA, mesmo a classe não tendo atributo próprio", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.subclassId = "Cavaleiro Místico";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });

  it("Ladino/Trapaceiro Arcano → INTELIGÊNCIA", () => {
    const character = createBlankCharacter("t");
    character.classId = "ladino";
    character.subclassId = "Trapaceiro Arcano";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });
});

describe("getSpellcastingAbility — fallback de antecedente (decisão do projeto)", () => {
  it("Guerreiro (sem conjuração própria) + antecedente Sábio → usa o INT do talento 'Iniciado em Magia (Mago)'", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.backgroundId = "sabio";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });

  it("Monge + antecedente Acólito → usa o SAB do talento 'Iniciado em Magia (Clérigo)'", () => {
    const character = createBlankCharacter("t");
    character.classId = "monge";
    character.backgroundId = "acolito";
    expect(getSpellcastingAbility(character)).toBe("SAB");
  });

  it("Bárbaro + antecedente Guia → usa o SAB do talento 'Iniciado em Magia (Druida)'", () => {
    const character = createBlankCharacter("t");
    character.classId = "barbaro";
    character.backgroundId = "guia";
    expect(getSpellcastingAbility(character)).toBe("SAB");
  });

  it("Mago (já tem INT própria) + antecedente Acólito → NÃO é sobreposto pelo SAB do antecedente", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.backgroundId = "acolito";
    expect(getSpellcastingAbility(character)).toBe("INT");
  });

  it("antecedente sem talento de conjuração (ex.: Soldado) não concede nada a uma classe sem conjuração", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.backgroundId = "soldado";
    expect(getSpellcastingAbility(character)).toBeNull();
  });
});

describe("getSpellcastingModifier / getSpellSaveDC / getSpellAttackBonus", () => {
  it("calcula CD e ataque mágico reaproveitando modificador e proficiência", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.level = 5; // proficiência +3
    character.abilities.INT.score = 16; // +3
    expect(getSpellcastingModifier(character)).toBe(3);
    expect(getSpellSaveDC(character)?.auto).toBe(14); // 8 + 3 + 3
    expect(getSpellAttackBonus(character)?.auto).toBe(6); // 3 + 3
  });

  it("preserva ajuste manual na CD e no ataque mágico", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.level = 1;
    character.abilities.INT.score = 10; // +0
    character.spellcasting.manualSaveDCAdjustment = 1;
    character.spellcasting.manualAttackBonusAdjustment = 1;
    expect(getSpellSaveDC(character)).toEqual({ auto: 10, manual: 1, total: 11 });
    expect(getSpellAttackBonus(character)).toEqual({ auto: 2, manual: 1, total: 3 });
  });

  it("retorna null quando não há atributo de conjuração", () => {
    const character = createBlankCharacter("t");
    character.classId = "barbaro";
    expect(getSpellcastingModifier(character)).toBeNull();
    expect(getSpellSaveDC(character)).toBeNull();
    expect(getSpellAttackBonus(character)).toBeNull();
  });
});

describe("getCasterProgressionType", () => {
  it("conjuradores completos", () => {
    for (const classId of ["bardo", "clerigo", "druida", "feiticeiro", "mago"] as const) {
      expect(getCasterProgressionType(classId, null, 5)).toBe("full");
    }
  });

  it("meio-conjuradores", () => {
    for (const classId of ["paladino", "patrulheiro"] as const) {
      expect(getCasterProgressionType(classId, null, 5)).toBe("half");
    }
  });

  it("Bruxo é 'pact', não 'full'", () => {
    expect(getCasterProgressionType("bruxo", null, 5)).toBe("pact");
  });

  it("Artífice é 'artificer' (tabela própria), não 'half' (fórmula genérica de meio-conjurador)", () => {
    expect(getCasterProgressionType("artifice", null, 5)).toBe("artificer");
  });

  it("Guerreiro sem a subclasse certa não é conjurador", () => {
    expect(getCasterProgressionType("guerreiro", "Campeão", 5)).toBe("none");
  });

  it("Guerreiro/Cavaleiro Místico só vira 'third' a partir do nível 3", () => {
    expect(getCasterProgressionType("guerreiro", "Cavaleiro Místico", 2)).toBe("none");
    expect(getCasterProgressionType("guerreiro", "Cavaleiro Místico", 3)).toBe("third");
  });
});

describe("getSpellSlots — progressão de espaços de magia", () => {
  it("conjurador completo nível 5: [4,3,2,0,...]", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.level = 5;
    const slots = getSpellSlots(character);
    expect([slots[1], slots[2], slots[3], slots[4], slots[5]]).toEqual([4, 3, 2, 0, 0]);
  });

  it("conjurador completo nível 20 tem o topo da tabela: [4,3,3,3,3,2,2,1,1]", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.level = 20;
    const slots = getSpellSlots(character);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => slots[c as 1])).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });

  it("meio-conjurador (Paladino) nível 5 conjura como completo de nível 3 (ceil(5/2)=3): [4,2,0,...]", () => {
    const character = createBlankCharacter("t");
    character.classId = "paladino";
    character.level = 5;
    const slots = getSpellSlots(character);
    expect([slots[1], slots[2], slots[3]]).toEqual([4, 2, 0]);
  });

  it("meio-conjuradores (Paladino, Patrulheiro) já têm 2 espaços de 1º círculo no nível 1 — confirmado como correto para o ruleset 2024 (ceil(1/2)=1)", () => {
    for (const classId of ["paladino", "patrulheiro"] as const) {
      const character = createBlankCharacter("t");
      character.classId = classId;
      character.level = 1;
      const slots = getSpellSlots(character);
      expect(slots[1]).toBe(2);
    }
  });

  it("Artífice: espaços de magia batem com a tabela própria da fonte (não a fórmula de meio-conjurador) em toda a progressão", () => {
    const expected: Record<number, number[]> = {
      1: [2, 0, 0, 0, 0],
      3: [3, 0, 0, 0, 0],
      5: [4, 2, 0, 0, 0],
      9: [4, 3, 2, 0, 0],
      13: [4, 3, 3, 1, 0],
      17: [4, 3, 3, 3, 1],
      20: [4, 3, 3, 3, 2],
    };
    for (const [level, rowExpected] of Object.entries(expected)) {
      const character = createBlankCharacter("t");
      character.classId = "artifice";
      character.level = Number(level);
      const slots = getSpellSlots(character);
      expect([slots[1], slots[2], slots[3], slots[4], slots[5]]).toEqual(rowExpected);
      expect(slots[6]).toBe(0); // Artífice nunca ultrapassa o 5º círculo
    }
  });

  it("terço-conjurador (Guerreiro/Cavaleiro Místico) nível 3 → 2 espaços de 1º círculo", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.subclassId = "Cavaleiro Místico";
    character.level = 3;
    const slots = getSpellSlots(character);
    expect(slots[1]).toBe(2);
  });

  it("terço-conjurador (Ladino/Trapaceiro Arcano) abaixo do nível 3 não tem espaços", () => {
    const character = createBlankCharacter("t");
    character.classId = "ladino";
    character.subclassId = "Trapaceiro Arcano";
    character.level = 2;
    const slots = getSpellSlots(character);
    expect(Object.values(slots).every((v) => v === 0)).toBe(true);
  });

  it("Bruxo usa Magia de Pacto (tabela própria, não a de conjurador completo)", () => {
    const character = createBlankCharacter("t");
    character.classId = "bruxo";
    character.level = 5; // pacto: círculo 3, 2 espaços
    const slots = getSpellSlots(character);
    expect(slots[3]).toBe(2);
    expect(slots[1]).toBe(0);
    expect(slots[2]).toBe(0);
  });

  it("Bruxo nível 11 concentra 3 espaços no círculo 5", () => {
    const character = createBlankCharacter("t");
    character.classId = "bruxo";
    character.level = 11;
    const slots = getSpellSlots(character);
    expect(slots[5]).toBe(3);
  });

  it("classe não conjuradora (Bárbaro) nunca tem espaços, mesmo com antecedente de conjuração", () => {
    const character = createBlankCharacter("t");
    character.classId = "barbaro";
    character.backgroundId = "sabio"; // concede atributo de conjuração, mas não espaços
    character.level = 20;
    const slots = getSpellSlots(character);
    expect(Object.values(slots).every((v) => v === 0)).toBe(true);
  });

  it("sem classe definida, todos os espaços são zero", () => {
    const character = createBlankCharacter("t");
    const slots = getSpellSlots(character);
    expect(Object.values(slots).every((v) => v === 0)).toBe(true);
  });
});
