import { describe, expect, it } from "vitest";
import { createBlankCharacter, type Character } from "../domain/character.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import {
  areAbilitiesKnownBefore,
  buildTalentChoiceCountQuery,
  getAsiFeatOpportunity,
  getTalentChoiceOpportunity,
  HUMAN_ORIGIN_FEAT_OPPORTUNITY,
} from "./currentOpportunityContext.js";

const OPTIONS = { includeUserRecords: false };

/** Guerreiro com atributos gerados (DEX 15 maior) e Antecedente Soldado já distribuído (+2 FOR, +1 CON). */
function fighter(level: number): Character {
  const character = createBlankCharacter("ctx-test");
  character.classId = "guerreiro";
  character.level = level;
  character.backgroundId = "soldado";
  character.backgroundAbilityBonuses = { FOR: 2, CON: 1 };
  for (const [ability, score] of Object.entries({ FOR: 12, DEX: 15, CON: 14, INT: 8, SAB: 10, CAR: 8 })) {
    character.abilities[ability as keyof typeof character.abilities].score = score;
  }
  return character;
}

describe("buildTalentChoiceCountQuery — contexto antes da aquisição", () => {
  it("sem classe: nenhuma consulta (classe é parte obrigatória do contexto)", () => {
    const character = createBlankCharacter("ctx-test");
    expect(buildTalentChoiceCountQuery(character, HUMAN_ORIGIN_FEAT_OPPORTUNITY, OPTIONS)).toBeNull();
  });

  it("Humano na etapa Espécie, atributos ainda não gerados: subclasse e atributo desconhecidos (o nível nunca entra na consulta)", () => {
    const character = createBlankCharacter("ctx-test");
    character.classId = "mago";
    character.speciesId = "humano";
    expect(buildTalentChoiceCountQuery(character, HUMAN_ORIGIN_FEAT_OPPORTUNITY, OPTIONS)).toEqual({
      opportunityKind: "originFeat",
      classId: "mago",
      subclassId: null,
      highestAbility: null,
      excludeCharacterId: "ctx-test",
      includeUserRecords: false,
    });
  });

  it("ASI nível 4: usa os atributos ANTES da escolha (base + Antecedente), nunca o +1 do próprio talento", () => {
    const character = fighter(4);
    character.subclassId = "Campeão";
    character.asiSelections[4] = { kind: "feat", featId: "imobilizador" };
    character.featureChoiceSelections["imobilizador-atributo-asi-4"] = { value: "DEX" };
    const query = buildTalentChoiceCountQuery(character, getAsiFeatOpportunity(4), OPTIONS)!;
    expect(query).toMatchObject({ opportunityKind: "generalFeat", subclassId: "Campeão" });
    expect(query).not.toHaveProperty("level");
    // FOR 12+2 = 14, DEX 15, CON 14+1 = 15 → empate DEX/CON, desempate FOR > DEX > CON → DEX.
    expect(query.highestAbility).toBe("DEX");
  });

  it("ASI nível 8 reflete o aumento do nível 4, mas o do nível 4 nunca reflete o do 8", () => {
    const character = fighter(8);
    character.subclassId = "Campeão";
    character.asiSelections[4] = { kind: "abilityIncrease", allocations: { FOR: 2 } };
    character.asiSelections[6] = { kind: "abilityIncrease", allocations: { FOR: 2 } };
    character.asiSelections[8] = { kind: "abilityIncrease", allocations: { CON: 2 } };
    expect(buildTalentChoiceCountQuery(character, getAsiFeatOpportunity(8), OPTIONS)!.highestAbility).toBe("FOR"); // 18 vs DEX 15
    expect(buildTalentChoiceCountQuery(character, getAsiFeatOpportunity(4), OPTIONS)!.highestAbility).toBe("DEX"); // 14 vs 15
  });

  it("ASI anterior ainda não resolvido: atributos desconhecidos (nunca calcula com dado parcial)", () => {
    const character = fighter(6);
    character.subclassId = "Campeão";
    character.asiSelections[4] = { kind: "abilityIncrease", allocations: { FOR: 1 } }; // só 1 de 2 pontos
    expect(areAbilitiesKnownBefore(character, 6)).toBe(false);
    expect(buildTalentChoiceCountQuery(character, getAsiFeatOpportunity(6), OPTIONS)!.highestAbility).toBeNull();
    // Mas o próprio nível 4 continua conhecido (depende só de base + Antecedente).
    expect(areAbilitiesKnownBefore(character, 4)).toBe(true);
  });

  it("talento anterior com +1 ainda sem atributo escolhido: atributos desconhecidos depois dele", () => {
    const character = fighter(6);
    character.subclassId = "Campeão";
    character.asiSelections[4] = { kind: "feat", featId: "imobilizador" };
    expect(areAbilitiesKnownBefore(character, 6)).toBe(false);
    character.featureChoiceSelections["imobilizador-atributo-asi-4"] = { value: "FOR" };
    expect(areAbilitiesKnownBefore(character, 6)).toBe(true);
  });

  it("Antecedente sem distribuição completa: atributos desconhecidos", () => {
    const character = fighter(1);
    character.backgroundAbilityBonuses = { FOR: 2 };
    expect(areAbilitiesKnownBefore(character, 1)).toBe(false);
  });

  it("subclasse só a partir do nível 3: Estilo de Luta de nível 1 nunca usa a subclasse atual", () => {
    const character = fighter(7);
    character.subclassId = "Campeão";
    expect(buildTalentChoiceCountQuery(character, getTalentChoiceOpportunity(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID)!, OPTIONS)!.subclassId).toBeNull();
    expect(buildTalentChoiceCountQuery(character, getTalentChoiceOpportunity(character, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID)!, OPTIONS)!.subclassId).toBe(
      "Campeão",
    );
  });
});

describe("getTalentChoiceOpportunity", () => {
  it("Estilo de Luta do Guerreiro (nível 1) e Adicional do Campeão (nível 7)", () => {
    const character = fighter(7);
    character.subclassId = "Campeão";
    expect(getTalentChoiceOpportunity(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID)).toEqual({ kind: "fightingStyle", opportunityId: FIGHTER_FIGHTING_STYLE_CHOICE_ID, level: 1 });
    expect(getTalentChoiceOpportunity(character, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID)).toEqual({
      kind: "fightingStyle",
      opportunityId: FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
      level: 7,
    });
  });

  it("Patrulheiro: o ramo 'Estilo de Luta ou Combatente Druídico' nunca é oportunidade de recomendação; o estilo em si é", () => {
    const character = createBlankCharacter("ctx-test");
    character.classId = "patrulheiro";
    character.level = 2;
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Estilo de Luta" };
    expect(getTalentChoiceOpportunity(character, RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID)).toBeNull();
    expect(getTalentChoiceOpportunity(character, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID)).toMatchObject({ kind: "fightingStyle", level: 2 });
  });

  it("Dádiva Épica no nível 19", () => {
    const character = fighter(19);
    expect(getTalentChoiceOpportunity(character, "guerreiro-dadiva-epica-escolha")).toEqual({ kind: "epicBoon", opportunityId: "guerreiro-dadiva-epica-escolha", level: 19 });
  });

  it("escolha que não é de talento: null", () => {
    expect(getTalentChoiceOpportunity(fighter(3), "qualquer-outra-escolha")).toBeNull();
  });
});
