import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { HABILIDOSO_CHOICE_BASE_ID } from "../data/features/feats.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { fightingStylesByName } from "../data/fightingStyles.js";
import { getFeatAbilityIncreaseChoiceId, getFeatChoiceId } from "./feats.js";
import { getRecordedTalentAcquisitions } from "./talentAcquisitionHistory.js";

function withBackground(backgroundId: Character["backgroundId"]): Character {
  const character = createBlankCharacter("history-test");
  character.backgroundId = backgroundId;
  return character;
}

function withHumanOriginFeat(featId: string | null): Character {
  const character = createBlankCharacter("history-test");
  character.speciesId = "humano";
  character.humanOriginFeatId = featId;
  return character;
}

describe("getRecordedTalentAcquisitions — Talento de Origem do Antecedente/Humano", () => {
  it("Antecedente (Soldado -> Atacante Selvagem): nunca voluntário, sem nível, sem escolhas internas", () => {
    const character = withBackground("soldado");
    const records = getRecordedTalentAcquisitions(character);
    const record = records.find((r) => r.opportunityId === "background")!;

    expect(record).toBeDefined();
    expect(record.talentId).toBe("atacante-selvagem");
    expect(record.grantOrigin).toBe("background");
    expect(record.acquisitionLevel).toBeNull();
    expect(record.voluntary).toBe(false);
    expect(record.internalChoices).toEqual({});
    expect(record.abilityIncreased).toBeNull();
    expect(record.context.level).toBeNull();
    expect(record.context.subclassId).toBe("desconhecido");
    expect(record.context.classId).toBeNull();
  });

  it("Talento de Origem do Humano: voluntário (o jogador escolhe QUAL talento)", () => {
    const character = withHumanOriginFeat("vigoroso");
    const records = getRecordedTalentAcquisitions(character);
    const record = records.find((r) => r.opportunityId === "species")!;

    expect(record).toBeDefined();
    expect(record.talentId).toBe("vigoroso");
    expect(record.grantOrigin).toBe("species");
    expect(record.acquisitionLevel).toBeNull();
    expect(record.voluntary).toBe(true);
    expect(record.internalChoices).toEqual({});
  });

  it("sem Antecedente/Humano com talento: nenhum registro de origem", () => {
    const character = createBlankCharacter("history-test");
    const records = getRecordedTalentAcquisitions(character);
    expect(records.find((r) => r.opportunityId === "background" || r.opportunityId === "species")).toBeUndefined();
  });
});

describe("getRecordedTalentAcquisitions — contexto histórico nunca usa benefícios de aquisição posterior (fonte §3)", () => {
  it("o contexto da PRÓPRIA aquisição de ASI exclui o aumento que ELA MESMA concede", () => {
    const character = createBlankCharacter("history-test");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "resistente" } };
    character.featureChoiceSelections[getFeatChoiceId(getFeatAbilityIncreaseChoiceId("resistente"), "asi-4")] = { value: "CON" };

    const records = getRecordedTalentAcquisitions(character);
    const record = records.find((r) => r.opportunityId === "asi-4")!;

    expect(record.talentId).toBe("resistente");
    expect(record.grantOrigin).toBe("class");
    expect(record.acquisitionLevel).toBe(4);
    expect(record.voluntary).toBe(true);
    expect(record.abilityIncreased).toBe("CON");
    // Nunca 11 — o +1 concedido por esta MESMA aquisição não pode validar/compor seu próprio contexto.
    expect(record.context.abilityScores.CON).toBe(10);
  });

  it("uma aquisição POSTERIOR já reflete o aumento de uma aquisição ANTERIOR, mas uma aquisição anterior nunca reflete a posterior", () => {
    const character = createBlankCharacter("history-test");
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "resistente" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    character.featureChoiceSelections[getFeatChoiceId(getFeatAbilityIncreaseChoiceId("resistente"), "asi-4")] = { value: "CON" };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-8")] = { value: ["atletismo", "furtividade", "alaude"] };

    const records = getRecordedTalentAcquisitions(character);
    const record4 = records.find((r) => r.opportunityId === "asi-4")!;
    const record8 = records.find((r) => r.opportunityId === "asi-8")!;

    // asi-4: ainda não existe nenhum aumento prévio (nem o seu próprio).
    expect(record4.context.abilityScores.CON).toBe(10);
    // asi-8: já reflete o +1 de CON concedido no nível 4 (aconteceu ANTES).
    expect(record8.context.abilityScores.CON).toBe(11);
    expect(record8.talentId).toBe("habilidoso");
    expect(record8.abilityIncreased).toBeNull();
    expect(record8.internalChoices).toEqual({ [HABILIDOSO_CHOICE_BASE_ID]: ["atletismo", "furtividade", "alaude"] });
    // Nível 8 >= 3: subclasse já poderia ter sido escolhida — aqui é null (nenhuma escolhida), nunca "desconhecido".
    expect(record8.context.subclassId).toBeNull();
  });

  it("duas aquisições do MESMO talento repetível (Habilidoso em dois níveis de ASI) nunca se fundem num só registro", () => {
    const character = createBlankCharacter("history-test");
    character.classId = "guerreiro";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4")] = { value: ["atletismo", "furtividade", "alaude"] };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-8")] = { value: ["intuicao", "enganacao", "ladroes"] };

    const records = getRecordedTalentAcquisitions(character).filter((r) => r.talentId === "habilidoso");
    expect(records).toHaveLength(2);

    const record4 = records.find((r) => r.opportunityId === "asi-4")!;
    const record8 = records.find((r) => r.opportunityId === "asi-8")!;
    expect(record4.internalChoices).toEqual({ [HABILIDOSO_CHOICE_BASE_ID]: ["atletismo", "furtividade", "alaude"] });
    expect(record8.internalChoices).toEqual({ [HABILIDOSO_CHOICE_BASE_ID]: ["intuicao", "enganacao", "ladroes"] });
  });
});

describe("getRecordedTalentAcquisitions — Estilo de Luta (categorias existentes, fonte §3)", () => {
  it("Estilo de Luta do Guerreiro nível 1 entra como registro próprio, distinto de Talento Geral", () => {
    const character = createBlankCharacter("history-test");
    character.classId = "guerreiro";
    character.level = 1;
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };

    const records = getRecordedTalentAcquisitions(character);
    const record = records.find((r) => r.opportunityId === FIGHTER_FIGHTING_STYLE_CHOICE_ID)!;

    expect(record).toBeDefined();
    expect(record.talentId).toBe(fightingStylesByName["Defensivo"].id);
    expect(record.grantOrigin).toBe("class");
    expect(record.acquisitionLevel).toBe(1);
    expect(record.voluntary).toBe(true);
    expect(record.internalChoices).toEqual({});
    expect(record.abilityIncreased).toBeNull();
    // Nível 1 < 3: subclasse ainda não podia ter sido escolhida.
    expect(record.context.subclassId).toBe("desconhecido");
  });

  it("sem Estilo de Luta escolhido: nenhum registro para essa oportunidade", () => {
    const character = createBlankCharacter("history-test");
    character.classId = "guerreiro";
    character.level = 1;

    const records = getRecordedTalentAcquisitions(character);
    expect(records.find((r) => r.opportunityId === FIGHTER_FIGHTING_STYLE_CHOICE_ID)).toBeUndefined();
  });
});
