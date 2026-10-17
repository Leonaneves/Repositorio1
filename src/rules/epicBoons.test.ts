import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { DADIVA_EPICA_CLASSES, getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_FORTITUDE_FEAT_ID, DADIVA_DA_VELOCIDADE_FEAT_ID, DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID, EPIC_BOON_NAMES } from "../data/features/epicBoons.js";
import {
  getChosenEpicBoonId,
  getEpicBoonAbilityIncreaseBonus,
  getEpicBoonAbilityIncreaseChoice,
  getEpicBoonEnergyRedirectCd,
  getEpicBoonEnergyRedirectDamage,
  getEpicBoonFeatures,
  getEpicBoonFortitudeHealBonus,
  getEpicBoonFortitudeHpBonus,
  getEpicBoonIrresistibleAttackValue,
  getEpicBoonOptions,
  getEpicBoonRecoveryHalfMaxHp,
  getEpicBoonSpeedBonus,
  hasConjuracaoFeature,
  hasEpicBoonSkillProficiencyGrant,
  isEpicBoonActive,
  isEpicBoonEligible,
} from "./epicBoons.js";

function fighterAt(level: number) {
  const character = createBlankCharacter("epic-boons-test");
  character.classId = "guerreiro";
  character.level = level;
  return character;
}

function fighterWithBoon(boonName: string, level = 19) {
  const character = fighterAt(level);
  character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: boonName };
  return character;
}

describe("isEpicBoonEligible — nível 19+ E classe entre as 12 (nunca o Artífice)", () => {
  it("nível abaixo de 19 — false", () => {
    expect(isEpicBoonEligible(fighterAt(18))).toBe(false);
  });

  it("nível 19+ numa das 12 classes confirmadas — true", () => {
    expect(isEpicBoonEligible(fighterAt(19))).toBe(true);
    expect(isEpicBoonEligible(fighterAt(20))).toBe(true);
  });

  it("Artífice nunca é elegível, mesmo no nível 19+ (recebe ASI nesse nível, não Dádiva Épica)", () => {
    const character = createBlankCharacter("epic-boons-test-artifice");
    character.classId = "artifice";
    character.level = 19;
    expect(isEpicBoonEligible(character)).toBe(false);
    expect(DADIVA_EPICA_CLASSES).not.toContain("artifice");
  });

  it("sem classe escolhida — false", () => {
    const character = createBlankCharacter("x");
    character.level = 20;
    expect(isEpicBoonEligible(character)).toBe(false);
  });

  it("todas as 12 classes confirmadas estão em DADIVA_EPICA_CLASSES", () => {
    expect(DADIVA_EPICA_CLASSES).toHaveLength(12);
  });
});

describe("hasConjuracaoFeature — pré-requisito de Dádiva da Recordação de Magia (nunca satisfeito por Magia de Pacto do Bruxo)", () => {
  it("Mago (classe base com característica 'Conjuração') — true", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 19;
    expect(hasConjuracaoFeature(character)).toBe(true);
  });

  it("Bruxo (característica 'Magia de Pacto', nunca 'Conjuração') — false", () => {
    const character = createBlankCharacter("x");
    character.classId = "bruxo";
    character.level = 19;
    expect(hasConjuracaoFeature(character)).toBe(false);
  });

  it("Guerreiro sem subclasse conjuradora — false", () => {
    expect(hasConjuracaoFeature(fighterAt(19))).toBe(false);
  });

  it("Guerreiro Cavaleiro Místico (subclasse com característica 'Conjuração') — true", () => {
    const character = fighterAt(19);
    character.subclassId = "Cavaleiro Místico";
    expect(hasConjuracaoFeature(character)).toBe(true);
  });

  it("Ladino Trapaceiro Arcano (subclasse com característica 'Conjuração') — true", () => {
    const character = createBlankCharacter("x");
    character.classId = "ladino";
    character.level = 19;
    character.subclassId = "Trapaceiro Arcano";
    expect(hasConjuracaoFeature(character)).toBe(true);
  });

  it("Guerreiro Campeão (subclasse sem conjuração) — false", () => {
    const character = fighterAt(19);
    character.subclassId = "Campeão";
    expect(hasConjuracaoFeature(character)).toBe(false);
  });
});

describe("getEpicBoonOptions — exclui Dádiva da Recordação de Magia sem Conjuração", () => {
  it("sem Conjuração: 11 opções, sem Recordação de Magia", () => {
    const options = getEpicBoonOptions(fighterAt(19));
    expect(options).toHaveLength(11);
    expect(options).not.toContain("Dádiva da Recordação de Magia");
  });

  it("com Conjuração: as 12 opções completas", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 19;
    expect(getEpicBoonOptions(character)).toEqual(EPIC_BOON_NAMES);
    expect(getEpicBoonOptions(character)).toHaveLength(12);
  });
});

describe("getChosenEpicBoonId / isEpicBoonActive / getEpicBoonFeatures", () => {
  it("sem elegibilidade — null / [] mesmo com um valor preenchido", () => {
    const character = fighterAt(18);
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Fortitude" };
    expect(getChosenEpicBoonId(character)).toBeNull();
    expect(getEpicBoonFeatures(character)).toEqual([]);
  });

  it("elegível, sem escolha feita — null / []", () => {
    expect(getChosenEpicBoonId(fighterAt(19))).toBeNull();
    expect(getEpicBoonFeatures(fighterAt(19))).toEqual([]);
  });

  it("escolha resolvida — resolve o id correto e expõe a FeatureDefinition com suas próprias choices", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    expect(getChosenEpicBoonId(character)).toBe(DADIVA_DA_FORTITUDE_FEAT_ID);
    expect(isEpicBoonActive(character, DADIVA_DA_FORTITUDE_FEAT_ID)).toBe(true);
    expect(isEpicBoonActive(character, DADIVA_DA_VELOCIDADE_FEAT_ID)).toBe(false);
    const features = getEpicBoonFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].id).toBe(DADIVA_DA_FORTITUDE_FEAT_ID);
    expect(features[0].sourceType).toBe("feat");
    expect(features[0].choices).toHaveLength(1);
  });

  it("valor que não existe no catálogo é ignorado, nunca quebra", () => {
    const character = fighterWithBoon("Nome Inventado");
    expect(getChosenEpicBoonId(character)).toBeNull();
  });
});

describe("getEpicBoonAbilityIncreaseChoice / getEpicBoonAbilityIncreaseBonus", () => {
  it("null/0 sem Dádiva ativa ou sem a escolha de atributo resolvida", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    expect(getEpicBoonAbilityIncreaseChoice(character)).toBeNull();
    expect(getEpicBoonAbilityIncreaseBonus(character, "CON")).toBe(0);
  });

  it("com a escolha resolvida: devolve o atributo e soma +1 só nele", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    character.featureChoiceSelections[`${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`] = { value: "CON" };
    expect(getEpicBoonAbilityIncreaseChoice(character)).toBe("CON");
    expect(getEpicBoonAbilityIncreaseBonus(character, "CON")).toBe(1);
    expect(getEpicBoonAbilityIncreaseBonus(character, "FOR")).toBe(0);
  });
});

describe("getEpicBoonFortitudeHpBonus / getEpicBoonFortitudeHealBonus — Dádiva da Fortitude (fonte §3)", () => {
  it("40/null sem a Dádiva ativa — na verdade 0/null", () => {
    const character = fighterWithBoon("Dádiva da Velocidade");
    expect(getEpicBoonFortitudeHpBonus(character)).toBe(0);
    expect(getEpicBoonFortitudeHealBonus(character)).toBeNull();
  });

  it("com a Dádiva ativa: +40 fixo e o modificador de CON para a cura adicional", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    character.abilities.CON.score = 16; // mod +3
    expect(getEpicBoonFortitudeHpBonus(character)).toBe(40);
    expect(getEpicBoonFortitudeHealBonus(character)).toBe(3);
  });

  it("modificador de CON negativo é devolvido corretamente (sem distorção)", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    character.abilities.CON.score = 8; // mod -1
    expect(getEpicBoonFortitudeHealBonus(character)).toBe(-1);
  });
});

describe("getEpicBoonRecoveryHalfMaxHp — Dádiva da Recuperação (fonte §7, 'Até a Morte')", () => {
  it("null sem a Dádiva ativa", () => {
    expect(getEpicBoonRecoveryHalfMaxHp(fighterWithBoon("Dádiva da Velocidade"))).toBeNull();
  });

  it("metade do PV máximo ATUAL, arredondada para baixo", () => {
    const character = fighterWithBoon("Dádiva da Recuperação");
    character.abilities.CON.score = 10; // mod 0, Guerreiro d10
    // nível 1: 10; níveis 2-19: 18×6=108; total = 118 (ímpar) -> metade arredondada para baixo = 59
    expect(getEpicBoonRecoveryHalfMaxHp(character)).toBe(59);
  });

  it("reflete ajuste manual de PV máximo também (usa o 'máximo atual')", () => {
    const character = fighterWithBoon("Dádiva da Recuperação");
    character.abilities.CON.score = 10;
    character.hp.maxManualAdjustment = 2; // 118 + 2 = 120
    expect(getEpicBoonRecoveryHalfMaxHp(character)).toBe(60);
  });
});

describe("getEpicBoonEnergyRedirectCd / getEpicBoonEnergyRedirectDamage — Dádiva da Resistência à Energia (fonte §8)", () => {
  it("null sem a Dádiva ativa", () => {
    const character = fighterWithBoon("Dádiva da Velocidade");
    expect(getEpicBoonEnergyRedirectCd(character)).toBeNull();
    expect(getEpicBoonEnergyRedirectDamage(character)).toBeNull();
  });

  it("CD = 8 + mod. CON + BP", () => {
    const character = fighterWithBoon("Dádiva da Resistência à Energia");
    character.abilities.CON.score = 16; // mod +3
    // nível 19 -> BP 6; CD = 8+3+6 = 17
    expect(getEpicBoonEnergyRedirectCd(character)).toBe(17);
  });

  it("dano formatado com sinal correto (positivo, zero, negativo — nunca '2d12+-1')", () => {
    const positive = fighterWithBoon("Dádiva da Resistência à Energia");
    positive.abilities.CON.score = 16; // mod +3
    expect(getEpicBoonEnergyRedirectDamage(positive)).toBe("2d12+3");

    const zero = fighterWithBoon("Dádiva da Resistência à Energia");
    zero.abilities.CON.score = 10; // mod 0
    expect(getEpicBoonEnergyRedirectDamage(zero)).toBe("2d12");

    const negative = fighterWithBoon("Dádiva da Resistência à Energia");
    negative.abilities.CON.score = 8; // mod -1
    expect(getEpicBoonEnergyRedirectDamage(negative)).toBe("2d12-1");
  });
});

describe("getEpicBoonSpeedBonus — Dádiva da Velocidade (fonte §9)", () => {
  it("9 com a Dádiva ativa, 0 sem ela", () => {
    expect(getEpicBoonSpeedBonus(fighterWithBoon("Dádiva da Velocidade"))).toBe(9);
    expect(getEpicBoonSpeedBonus(fighterWithBoon("Dádiva da Fortitude"))).toBe(0);
  });
});

describe("getEpicBoonIrresistibleAttackValue — Dádiva do Ataque Irresistível (fonte §12: valor do atributo, nunca o modificador)", () => {
  it("null sem a Dádiva ativa, ou com a escolha de atributo ainda não resolvida", () => {
    expect(getEpicBoonIrresistibleAttackValue(fighterWithBoon("Dádiva da Velocidade"))).toBeNull();
    expect(getEpicBoonIrresistibleAttackValue(fighterWithBoon("Dádiva do Ataque Irresistível"))).toBeNull();
  });

  it("devolve o VALOR EFETIVO do atributo escolhido (FOR ou DEX, já com o +1 desta própria escolha), nunca o modificador", () => {
    const character = fighterWithBoon("Dádiva do Ataque Irresistível");
    character.abilities.FOR.score = 19; // efetivo 20 com o +1 da própria Dádiva; o modificador seria +5
    character.featureChoiceSelections[`${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`] = { value: "FOR" };
    expect(getEpicBoonIrresistibleAttackValue(character)).toBe(20); // nunca o mod (+5)
  });

  it("reflete o +1 da própria escolha (efetivo, não o bruto)", () => {
    const character = fighterWithBoon("Dádiva do Ataque Irresistível");
    character.abilities.DEX.score = 19;
    character.featureChoiceSelections[`${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`] = { value: "DEX" };
    expect(getEpicBoonIrresistibleAttackValue(character)).toBe(20); // 19 + 1
  });
});

describe("hasEpicBoonSkillProficiencyGrant — Dádiva da Proficiência em Perícia (fonte §5)", () => {
  it("true só com a Dádiva ativa", () => {
    expect(hasEpicBoonSkillProficiencyGrant(fighterWithBoon("Dádiva da Proficiência em Perícia"))).toBe(true);
    expect(hasEpicBoonSkillProficiencyGrant(fighterWithBoon("Dádiva da Velocidade"))).toBe(false);
    expect(hasEpicBoonSkillProficiencyGrant(fighterAt(19))).toBe(false);
  });
});

describe("Nenhuma Dádiva Épica é repetível, e só uma pode estar ativa por vez — isEpicBoonActive nunca é true para 2 dádivas simultaneamente", () => {
  it("Guerreiro só tem UM ponto de concessão de nível 19 — trocar a escolha substitui, nunca acumula", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    expect(isEpicBoonActive(character, DADIVA_DA_FORTITUDE_FEAT_ID)).toBe(true);

    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    expect(isEpicBoonActive(character, DADIVA_DA_FORTITUDE_FEAT_ID)).toBe(false);
    expect(isEpicBoonActive(character, DADIVA_DA_VELOCIDADE_FEAT_ID)).toBe(true);
  });
});
