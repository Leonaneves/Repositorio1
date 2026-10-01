import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../../domain/character.js";
import type { Character } from "../../domain/character.js";
import { getClassSkillChoiceId } from "../classes.js";
import { CONHECIMENTO_PRIMORDIAL_CHOICE_ID, barbarianClassFeatures, barbarianWeaponMasteryFeatures, getBarbarianWeaponMasteryChoiceId } from "./barbarian.js";
import { getCharacterFeatures, getIncompleteRequiredChoices, isFeatureComplete } from "../../rules/features.js";
import { getSkillProficiency, isSkillGrantedByClassChoice } from "../../rules/skills.js";

function barbarianAt(level: number): Character {
  const character = createBlankCharacter("barbarian-features-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = level >= 3 ? "Caminho do Berserker" : null;
  return character;
}

describe("barbarianClassFeatures — nunca duplica uma característica que evolui", () => {
  it("só existe uma FeatureDefinition chamada 'Fúria' (nível 15 é evolução de texto, não uma 2ª feature)", () => {
    expect(barbarianClassFeatures.filter((f) => f.name === "Fúria")).toHaveLength(1);
  });

  it("só existe uma FeatureDefinition chamada 'Golpe Brutal' (13/17 são evolução, não features novas)", () => {
    expect(barbarianClassFeatures.filter((f) => f.name === "Golpe Brutal")).toHaveLength(1);
    expect(barbarianClassFeatures.some((f) => f.name.includes("Fortalecido"))).toBe(false);
  });

  it("todos os ids são únicos", () => {
    const ids = barbarianClassFeatures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Conhecimento Primordial — escolha obrigatória de 1 perícia, excluindo as já proficientes", () => {
  it("bloqueia o avanço do Builder (getIncompleteRequiredChoices) enquanto não escolhida", () => {
    const character = barbarianAt(3);
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.id === "barbaro-conhecimento-primordial-3")).toBe(true);
  });

  it("completa com exatamente 1 perícia selecionada", () => {
    const character = barbarianAt(3);
    character.featureChoiceSelections[CONHECIMENTO_PRIMORDIAL_CHOICE_ID] = { value: ["intimidacao"] };
    const feature = getCharacterFeatures(character).find((f) => f.id === "barbaro-conhecimento-primordial-3")!;
    expect(isFeatureComplete(feature, character)).toBe(true);
  });

  it("concede a proficiência final via isSkillGrantedByClassChoice/getSkillProficiency", () => {
    const character = barbarianAt(3);
    character.featureChoiceSelections[CONHECIMENTO_PRIMORDIAL_CHOICE_ID] = { value: ["intimidacao"] };
    expect(isSkillGrantedByClassChoice(character, "intimidacao")).toBe(true);
    expect(getSkillProficiency(character, "intimidacao")).toBe(true);
  });

  it("não aparece antes do nível 3", () => {
    const character = barbarianAt(2);
    expect(getCharacterFeatures(character).some((f) => f.id === "barbaro-conhecimento-primordial-3")).toBe(false);
  });

  it("a escolha de 'Conhecimento Primordial' é independente da escolha-base de 'Perícias de Classe' (podem repetir perícias diferentes)", () => {
    const character = barbarianAt(3);
    character.featureChoiceSelections[getClassSkillChoiceId("barbaro")] = { value: ["atletismo", "percepcao"] };
    character.featureChoiceSelections[CONHECIMENTO_PRIMORDIAL_CHOICE_ID] = { value: ["intimidacao"] };
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
    expect(getSkillProficiency(character, "intimidacao")).toBe(true);
    expect(getSkillProficiency(character, "arcanismo")).toBe(false);
  });
});

describe("Maestria em Arma — 4 FeatureDefinitions separadas, desbloqueando em 1/1/4/10", () => {
  it("2 slots no nível 1, a 3ª arma só a partir do nível 4, a 4ª só a partir do nível 10", () => {
    expect(barbarianWeaponMasteryFeatures.filter((f) => f.level === 1)).toHaveLength(2);
    expect(barbarianWeaponMasteryFeatures.filter((f) => f.level === 4)).toHaveLength(1);
    expect(barbarianWeaponMasteryFeatures.filter((f) => f.level === 10)).toHaveLength(1);
  });

  it("nível 1: só os slots 1 e 2 contam como características já adquiridas", () => {
    const character = barbarianAt(1);
    const acquired = barbarianWeaponMasteryFeatures.filter((f) => f.level !== null && f.level <= character.level);
    expect(acquired).toHaveLength(2);
  });

  it("nível 10: todos os 4 slots já adquiridos", () => {
    const character = barbarianAt(10);
    const acquired = barbarianWeaponMasteryFeatures.filter((f) => f.level !== null && f.level <= character.level);
    expect(acquired).toHaveLength(4);
  });

  it("cada slot tem um choice id estável e único, lido por getBarbarianWeaponMasteryChoiceId", () => {
    const ids = ([1, 2, 3, 4] as const).map(getBarbarianWeaponMasteryChoiceId);
    expect(new Set(ids).size).toBe(4);
    barbarianWeaponMasteryFeatures.forEach((feature, index) => {
      expect(feature.choices?.[0]?.id).toBe(ids[index]);
    });
  });

  it("o effect é sempre weaponPicker restrito a corpo a corpo (nunca à distância)", () => {
    for (const feature of barbarianWeaponMasteryFeatures) {
      expect(feature.choices?.[0]?.effect.kind).toBe("weaponPicker");
      expect((feature.choices?.[0]?.effect as { rangeKind?: string }).rangeKind).toBe("corpoACorpo");
    }
  });

  it("bloqueia o avanço do Builder enquanto algum slot já desbloqueado não tiver arma escolhida", () => {
    const character = barbarianAt(4); // slots 1, 2, 3 já desbloqueados
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.filter((f) => f.name === "Maestria em Arma")).toHaveLength(3);
  });

  it("completo assim que todos os slots desbloqueados tiverem arma escolhida", () => {
    const character = barbarianAt(4);
    character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(1)] = { value: "machadoGrande" };
    character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(2)] = { value: "azagaia" };
    character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(3)] = { value: "clava" };
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.filter((f) => f.name === "Maestria em Arma")).toHaveLength(0);
  });
});

describe("Campeão Primitivo — estrutural, nunca impresso em Características de Classe (coberto também em rules/abilities.test.ts)", () => {
  it("existe como FeatureDefinition de nível 20, mas seu efeito já é aplicado automaticamente (rules/abilities.ts)", () => {
    const feature = barbarianClassFeatures.find((f) => f.name === "Campeão Primitivo")!;
    expect(feature.level).toBe(20);
    expect(feature.autoGranted).toBe(true);
  });
});
