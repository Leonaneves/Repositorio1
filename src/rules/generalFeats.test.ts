import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID,
  ESPECIALISTA_BESTA_FEAT_ID,
  IMOBILIZADOR_FEAT_ID,
  LIDER_INSPIRADOR_FEAT_ID,
  MENTE_AGUCADA_FEAT_ID,
  MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID,
  MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID,
  MESTRE_EM_ARMAS_GRANDES_FEAT_ID,
  MESTRE_EM_ESCUDOS_FEAT_ID,
  RESILIENTE_FEAT_ID,
  RESISTENTE_FEAT_ID,
  TELECINETICO_FEAT_ID,
  TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID,
  VELOCISTA_FEAT_ID,
} from "../data/features/feats.js";
import {
  buildFeatAcquisitionFeature,
  getFeatAbilityIncreaseBonus,
  getFeatAbilityIncreaseChoice,
  getFeatAbilityIncreaseChoiceId,
  getFeatAcquisitions,
  getFeatSpeedBonus,
  getGreatWeaponMasterDamageBonus,
  getHeavyArmorMasterReduction,
  getInspiringLeaderTempHp,
  getResilientGrantedAbility,
  getShieldMasterCd,
  getTelekineticCd,
  meetsFeatPrerequisites,
} from "./feats.js";
import { getEffectiveAbilityScore } from "./abilities.js";
import { getSavingThrow } from "./savingThrows.js";
import { getSkillExpertise, getSkillProficiency } from "./skills.js";
import { getSpeed } from "./speed.js";
import { getArmorClass } from "./armor.js";

function withAsiFeat(level: number, featId: string): Character {
  const character = createBlankCharacter("general-feats-test");
  character.classId = "guerreiro"; // ASI em 4/6/8/12/14/16
  character.level = level;
  character.asiSelections = { [level]: { kind: "feat", featId } };
  return character;
}

function setAbility(character: Character, score: number): Character {
  for (const ability of ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const) character.abilities[ability].score = score;
  return character;
}

describe("meetsFeatPrerequisites — Talentos Gerais (fonte \"COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF\" §1)", () => {
  it("atributo >=13: falha com 12, passa com 13", () => {
    const character = createBlankCharacter("x");
    character.abilities.DEX.score = 12;
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_BESTA_FEAT_ID, "asi-4")).toBe(false);
    character.abilities.DEX.score = 13;
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_BESTA_FEAT_ID, "asi-4")).toBe(true);
  });

  it("atributo >=13 satisfeito por QUALQUER um dos listados (Imobilizador: FOR ou DEX)", () => {
    const character = createBlankCharacter("x");
    character.abilities.FOR.score = 13;
    character.abilities.DEX.score = 8;
    expect(meetsFeatPrerequisites(character, IMOBILIZADOR_FEAT_ID, "asi-4")).toBe(true);
  });

  it("treinamento de armadura: Mestre em Armaduras Pesadas exige treinamento PESADO (não médio)", () => {
    const character = createBlankCharacter("x");
    character.armor.proficiencies.medium = true;
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(false);
    character.armor.proficiencies.heavy = true;
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(true);
  });

  it("Especialista em Armaduras Pesadas exige treinamento MÉDIO (concede o pesado, nunca exige o próprio)", () => {
    const character = createBlankCharacter("x");
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(false);
    character.armor.proficiencies.medium = true;
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(true);
  });

  it("sem pré-requisito extra (ex.: Resiliente, Treinamento com Armas Marciais) sempre passa", () => {
    const character = createBlankCharacter("x");
    expect(meetsFeatPrerequisites(character, RESILIENTE_FEAT_ID, "asi-4")).toBe(true);
  });

  it("nunca permite que o aumento da PRÓPRIA aquisição cumpra seu próprio pré-requisito de atributo", () => {
    const character = createBlankCharacter("x");
    character.abilities.DEX.score = 12; // 1 abaixo do exigido
    character.asiSelections = { 4: { kind: "feat", featId: ESPECIALISTA_BESTA_FEAT_ID } };
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(ESPECIALISTA_BESTA_FEAT_ID) + "-asi-4"] = { value: "DEX" };
    // Mesmo com o próprio +1 de DEX já "escolhido" nesta aquisição, a checagem de pré-requisito
    // EXCLUI essa contribuição — 12 continua < 13.
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_BESTA_FEAT_ID, "asi-4")).toBe(false);
  });

  it("o pré-requisito de atributo PODE ser cumprido pelo aumento de OUTRA aquisição", () => {
    const character = createBlankCharacter("x");
    character.abilities.DEX.score = 12;
    character.asiSelections = {
      4: { kind: "feat", featId: TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID },
      8: { kind: "feat", featId: null },
    };
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID) + "-asi-4"] = { value: "DEX" };
    // DEX efetivo = 12 + 1 (da aquisição asi-4) = 13 — já soma ao checar a aquisição asi-8.
    expect(meetsFeatPrerequisites(character, ESPECIALISTA_BESTA_FEAT_ID, "asi-8")).toBe(true);
  });
});

describe("getFeatAbilityIncreaseChoice / getFeatAbilityIncreaseBonus", () => {
  it("[] sem nenhuma aquisição que resolva a escolha de atributo", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    expect(getFeatAbilityIncreaseBonus(character, "CON")).toBe(0);
  });

  it("soma +1 por aquisição resolvida para o atributo certo", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    expect(getFeatAbilityIncreaseBonus(character, "CON")).toBe(1);
    expect(getFeatAbilityIncreaseBonus(character, "FOR")).toBe(0);
  });

  it("duas aquisições diferentes mirando o MESMO atributo somam (ex.: Resiliente + Resistente ambos em CON)", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.asiSelections[8] = { kind: "feat", featId: RESILIENTE_FEAT_ID };
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESILIENTE_FEAT_ID) + "-asi-8"] = { value: "CON" };
    expect(getFeatAbilityIncreaseBonus(character, "CON")).toBe(2);
  });

  it("excludeAcquisitionKey exclui só a aquisição indicada", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    expect(getFeatAbilityIncreaseBonus(character, "CON", "asi-4")).toBe(0);
    expect(getFeatAbilityIncreaseBonus(character, "CON", "asi-999")).toBe(1);
  });

  it("getFeatAbilityIncreaseChoice lê a escolha de UMA aquisição específica", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    const [acquisition] = getFeatAcquisitions(character);
    expect(getFeatAbilityIncreaseChoice(character, acquisition)).toBe("CON");
  });
});

describe("getEffectiveAbilityScore — teto de 20 do Aumento de 1 por Talento", () => {
  it("soma normalmente quando o total fica abaixo de 20", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.abilities.CON.score = 15;
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "CON")).toBe(16);
  });

  it("nunca ultrapassa 20 por causa do Aumento de 1 do Talento", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.abilities.CON.score = 20;
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "CON")).toBe(20);
  });

  it("nunca REDUZ um valor já acima de 20 por outra fonte (só limita a contribuição do próprio talento)", () => {
    const character = withAsiFeat(4, RESISTENTE_FEAT_ID);
    character.abilities.CON.score = 22; // acima de 20 por valor bruto digitado
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESISTENTE_FEAT_ID) + "-asi-4"] = { value: "CON" };
    expect(getEffectiveAbilityScore(character, "CON")).toBe(22);
  });
});

describe("Resiliente — opções dinâmicas + proficiência de Salvaguarda concedida pela mesma escolha", () => {
  it("opções do seletor excluem atributos já proficientes em Salvaguarda (rules/feats.ts#buildFeatAcquisitionFeature)", () => {
    const character = withAsiFeat(4, RESILIENTE_FEAT_ID);
    character.classId = "guerreiro"; // proficiente em FOR/CON por classe
    character.savingThrows.FOR.proficient = true;
    character.savingThrows.CON.proficient = true;
    const [acquisition] = getFeatAcquisitions(character);
    const feature = buildFeatAcquisitionFeature(character, acquisition);
    const choice = feature?.choices?.find((c) => c.effect.kind === "abilityScoreIncrease");
    expect(choice?.effect.kind === "abilityScoreIncrease" ? choice.effect.options.sort() : null).toEqual(["CAR", "DEX", "INT", "SAB"].sort());
  });

  it("escolher um atributo concede +1 E a proficiência em Salvaguarda correspondente, ambos pela MESMA escolha", () => {
    const character = withAsiFeat(4, RESILIENTE_FEAT_ID);
    character.abilities.INT.score = 12;
    expect(getSavingThrow(character, "INT").auto).toBe(1); // só mod, sem proficiência ainda
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(RESILIENTE_FEAT_ID) + "-asi-4"] = { value: "INT" };
    expect(getEffectiveAbilityScore(character, "INT")).toBe(13);
    expect(getResilientGrantedAbility(character)).toBe("INT");
    // mod INT efetivo (13 → +1) + BP (nível 4 → +2) = +3, agora proficiente.
    expect(getSavingThrow(character, "INT").auto).toBe(3);
  });

  it("getResilientGrantedAbility é null sem o talento ativo ou com a escolha ainda não resolvida", () => {
    expect(getResilientGrantedAbility(createBlankCharacter("x"))).toBeNull();
    expect(getResilientGrantedAbility(withAsiFeat(4, RESILIENTE_FEAT_ID))).toBeNull();
  });
});

describe("Especialista em Perícia — proficiência + Especialização, cada uma sua PRÓPRIA escolha (fonte §5)", () => {
  it("a 2ª escolha (skillExpertise) concede Especialização de fato, mesmo fora do mapa fixo por classe", () => {
    const character = withAsiFeat(4, "especialista-pericia");
    character.featureChoiceSelections["especialista-pericia-pericia-asi-4"] = { value: ["investigacao"] };
    character.featureChoiceSelections["especialista-pericia-especializacao-asi-4"] = { value: ["investigacao"] };
    expect(getSkillProficiency(character, "investigacao")).toBe(true);
    expect(getSkillExpertise(character, "investigacao")).toBe(true);
  });

  it("a Especialização pode mirar uma perícia DIFERENTE da escolhida na 1ª (já proficiente por outra fonte)", () => {
    const character = withAsiFeat(4, "especialista-pericia");
    character.backgroundId = "sabio"; // concede História
    character.featureChoiceSelections["especialista-pericia-pericia-asi-4"] = { value: ["investigacao"] };
    character.featureChoiceSelections["especialista-pericia-especializacao-asi-4"] = { value: ["historia"] };
    expect(getSkillExpertise(character, "historia")).toBe(true);
    expect(getSkillExpertise(character, "investigacao")).toBe(false); // só recebeu Proficiência, nunca Especialização
  });
});

describe("Mente Aguçada — proficiência OU Especialização, revalidado a cada leitura (fonte §9)", () => {
  it("concede Proficiência quando a perícia ainda não é proficiente por nenhuma outra fonte", () => {
    const character = withAsiFeat(4, MENTE_AGUCADA_FEAT_ID);
    character.featureChoiceSelections[`${MENTE_AGUCADA_FEAT_ID}-pericia-asi-4`] = { value: "arcanismo" };
    expect(getSkillProficiency(character, "arcanismo")).toBe(true);
    expect(getSkillExpertise(character, "arcanismo")).toBe(false);
  });

  it("concede Especialização quando a perícia JÁ é proficiente por outra fonte", () => {
    const character = withAsiFeat(4, MENTE_AGUCADA_FEAT_ID);
    character.backgroundId = "sabio"; // concede História
    character.featureChoiceSelections[`${MENTE_AGUCADA_FEAT_ID}-pericia-asi-4`] = { value: "historia" };
    expect(getSkillProficiency(character, "historia")).toBe(true);
    expect(getSkillExpertise(character, "historia")).toBe(true);
  });

  it("revalida a cada leitura: perder a outra fonte de proficiência reverte de Especialização para só Proficiência", () => {
    const character = withAsiFeat(4, MENTE_AGUCADA_FEAT_ID);
    character.backgroundId = "sabio";
    character.featureChoiceSelections[`${MENTE_AGUCADA_FEAT_ID}-pericia-asi-4`] = { value: "historia" };
    expect(getSkillExpertise(character, "historia")).toBe(true);
    character.backgroundId = null;
    expect(getSkillProficiency(character, "historia")).toBe(true); // Mente Aguçada sozinha já garante
    expect(getSkillExpertise(character, "historia")).toBe(false); // mas não mais a Especialização
  });
});

describe("Novos getters numéricos dos Talentos Gerais", () => {
  it("getHeavyArmorMasterReduction: BP quando ativo, null sem o talento", () => {
    expect(getHeavyArmorMasterReduction(createBlankCharacter("x"))).toBeNull();
    const character = withAsiFeat(8, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID); // nível 8 → BP 3
    expect(getHeavyArmorMasterReduction(character)).toBe(3);
  });

  it("getGreatWeaponMasterDamageBonus: BP quando ativo, null sem o talento", () => {
    expect(getGreatWeaponMasterDamageBonus(createBlankCharacter("x"))).toBeNull();
    const character = withAsiFeat(4, MESTRE_EM_ARMAS_GRANDES_FEAT_ID);
    expect(getGreatWeaponMasterDamageBonus(character)).toBe(2);
  });

  it("getShieldMasterCd: 8 + mod FOR + BP", () => {
    expect(getShieldMasterCd(createBlankCharacter("x"))).toBeNull();
    const character = withAsiFeat(4, MESTRE_EM_ESCUDOS_FEAT_ID);
    character.abilities.FOR.score = 16; // +3
    expect(getShieldMasterCd(character)).toBe(13); // 8 + 3 + 2
  });

  it("getTelekineticCd: 8 + mod do atributo ESCOLHIDO nesta aquisição (nunca o de classe) + BP", () => {
    const character = withAsiFeat(4, TELECINETICO_FEAT_ID);
    expect(getTelekineticCd(character)).toBeNull(); // escolha de atributo ainda não resolvida
    setAbility(character, 10);
    character.abilities.CAR.score = 18; // +4
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(TELECINETICO_FEAT_ID) + "-asi-4"] = { value: "CAR" };
    expect(getTelekineticCd(character)).toBe(14); // 8 + 4 + 2
  });

  it("getInspiringLeaderTempHp: nível total + mod do atributo ESCOLHIDO nesta aquisição", () => {
    const character = withAsiFeat(8, LIDER_INSPIRADOR_FEAT_ID);
    expect(getInspiringLeaderTempHp(character)).toBeNull();
    character.abilities.CAR.score = 16; // +3
    character.featureChoiceSelections[getFeatAbilityIncreaseChoiceId(LIDER_INSPIRADOR_FEAT_ID) + "-asi-8"] = { value: "CAR" };
    expect(getInspiringLeaderTempHp(character)).toBe(11); // 8 + 3
  });

  it("getFeatSpeedBonus: +3 fixo quando Velocista ativo, 0 sem o talento", () => {
    expect(getFeatSpeedBonus(createBlankCharacter("x"))).toBe(0);
    expect(getFeatSpeedBonus(withAsiFeat(4, VELOCISTA_FEAT_ID))).toBe(3);
  });
});

describe("rules/speed.ts — Velocista soma +3m ao Deslocamento", () => {
  it("getSpeed soma o bônus de Velocista por cima da espécie", () => {
    const character = withAsiFeat(4, VELOCISTA_FEAT_ID);
    character.speciesId = "humano"; // 9m
    expect(getSpeed(character).auto).toBe(12);
  });
});

describe("rules/armor.ts — Mestre em Armaduras Médias: teto de DEX +3 em vez de +2", () => {
  it("sem o talento, Armadura Média sempre limita a +2 mesmo com DEX 16+", () => {
    const character = createBlankCharacter("x");
    character.armor.equipped = "gibaoDePeles"; // base 12
    character.abilities.DEX.score = 18; // +4
    expect(getArmorClass(character).auto).toBe(14); // 12 + 2
  });

  it("com o talento ativo e DEX 16+, aplica +3 em vez de +2", () => {
    const character = withAsiFeat(4, MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID);
    character.armor.equipped = "gibaoDePeles";
    character.abilities.DEX.score = 18; // +4, teto 3
    expect(getArmorClass(character).auto).toBe(15); // 12 + 3
  });

  it("com o talento ativo mas DEX efetiva abaixo de 16, continua limitado a +2", () => {
    const character = withAsiFeat(4, MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID);
    character.armor.equipped = "gibaoDePeles";
    character.abilities.DEX.score = 14; // +2, abaixo de 16
    expect(getArmorClass(character).auto).toBe(14); // 12 + 2 (DEX+2, abaixo do teto de qualquer forma)
  });

  it("nunca afeta Armadura Leve/Pesada", () => {
    const character = withAsiFeat(4, MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID);
    character.armor.equipped = "couroBatido"; // leve, base 12
    character.abilities.DEX.score = 20; // +5
    expect(getArmorClass(character).auto).toBe(17); // 12 + 5 inteiro (leve nunca tem teto)
  });
});
