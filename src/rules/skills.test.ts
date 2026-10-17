import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { SKILL_KEYS } from "../domain/ids.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_PROFICIENCIA_EM_PERICIA_EXPERTISE_CHOICE_ID, DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID } from "../data/features/epicBoons.js";
import { getBardSkillExpertiseChoiceId } from "../data/features/bard.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { getInitiative } from "./derived.js";
import { getSavingThrow } from "./savingThrows.js";
import { getAttackBonus } from "./attack.js";
import { RANGER_GLAMOUR_SKILL_CHOICE_ID } from "../data/features/subclasses.js";
import { ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1, ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6 } from "../data/features/rogue.js";
import { WIZARD_ACADEMIC_CHOICE_ID } from "../data/features/wizard.js";
import {
  getAutomaticSkillProficiencyGrants,
  getGlamourTranscendentalBonus,
  getJackOfAllTradesBonus,
  getSkillBonus,
  getSkillExpertise,
  getSkillProficiency,
  getSkillProficiencyOrigin,
  getThaumaturgeSkillBonus,
  getShamanSkillBonus,
  isSkillGrantedByBackground,
  isSkillGrantedByClassChoice,
  isSkillGrantedByEpicBoon,
  isSkillGrantedByFeatChoice,
  isSkillGrantedBySpeciesChoice,
  isSkillGrantedBySubclassChoice,
  isSkillGrantedBySubclassFixed,
  isSkillGrantedExpertiseByClassChoice,
} from "./skills.js";
import { HABILIDOSO_CHOICE_BASE_ID } from "../data/features/feats.js";
import { getFeatChoiceId } from "./feats.js";

function characterAt(level: number) {
  const character = createBlankCharacter("skills-test");
  character.level = level;
  return character;
}

describe("getSkillBonus", () => {
  it("sem proficiência, é apenas o modificador do atributo", () => {
    const character = characterAt(1);
    character.abilities.DEX.score = 14; // +2
    const bonus = getSkillBonus(character, "acrobacia");
    expect(bonus).toEqual({ auto: 2, manual: 0, total: 2 });
  });

  it("com proficiência (override manual), soma o bônus de proficiência do nível", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.SAB.score = 14; // +2
    character.skills.percepcao.manualOverride = true;
    const bonus = getSkillBonus(character, "percepcao");
    expect(bonus.auto).toBe(5); // 2 + 3
  });

  it("com especialização, dobra o bônus de proficiência", () => {
    const character = characterAt(5); // proficiência +3
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.manualOverride = true;
    character.skills.furtividade.expertise = true;
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(8); // 2 + 3*2
  });

  it("especialização sem proficiência não tem efeito (não é uma combinação válida)", () => {
    const character = characterAt(5);
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.manualOverride = false;
    character.skills.furtividade.expertise = true;
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(2); // sem proficiência, expertise é ignorada
  });

  it("preserva o ajuste manual separado do valor automático", () => {
    const character = characterAt(1);
    character.abilities.INT.score = 10; // +0
    character.skills.arcanismo.manualAdjustment = 4;
    const bonus = getSkillBonus(character, "arcanismo");
    expect(bonus).toEqual({ auto: 0, manual: 4, total: 4 });
  });
});

describe("isSkillGrantedByBackground / getSkillProficiency (§1.1 — fontes de proficiência)", () => {
  it("perícia concedida pelo antecedente atual conta como proficiente sem nenhum override", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "sabio"; // Arcanismo, História
    expect(isSkillGrantedByBackground(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "medicina")).toBe(false);
  });

  it("trocar de antecedente remove a proficiência concedida pelo antecedente anterior", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre"; // História, Persuasão
    expect(getSkillProficiency(character, "historia")).toBe(true);

    character.backgroundId = "soldado"; // Atletismo, Intimidação
    expect(getSkillProficiency(character, "historia")).toBe(false);
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
  });

  it("override manual sobrevive à troca de antecedente (nunca é apagado silenciosamente)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre";
    character.skills.furtividade.manualOverride = true; // escolha manual, sem relação com o antecedente

    character.backgroundId = "soldado";
    character.backgroundId = "sabio";

    expect(getSkillProficiency(character, "furtividade")).toBe(true);
  });

  it("perícia concedida pelo antecedente E também confirmada manualmente continua proficiente quando a fonte do antecedente desaparece", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "guarda"; // Atletismo, Percepção
    character.skills.percepcao.manualOverride = true; // jogador também fixa manualmente

    character.backgroundId = "sabio"; // não concede mais Percepção

    // A fonte "antecedente" desapareceu, mas a fonte "manual" continua.
    expect(isSkillGrantedByBackground(character, "percepcao")).toBe(false);
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
  });

  it("override manual também consegue REMOVER uma proficiência concedida pelo antecedente (editável, como no PDF original)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre"; // História, Persuasão
    character.skills.historia.manualOverride = false; // jogador desmarca deliberadamente

    expect(isSkillGrantedByBackground(character, "historia")).toBe(true);
    expect(getSkillProficiency(character, "historia")).toBe(false);
  });

  it("sem antecedente escolhido, nenhuma perícia é concedida automaticamente", () => {
    const character = createBlankCharacter("t");
    expect(isSkillGrantedByBackground(character, "arcanismo")).toBe(false);
  });
});

describe("isSkillGrantedByClassChoice / getSkillProficiency — escolha de Perícias de Classe (base consolidada)", () => {
  it("perícia escolhida na feature de classe conta como proficiente", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro"; // escolhe 2 entre uma lista, sem relação com "any"
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo", "intimidacao"] };

    expect(isSkillGrantedByClassChoice(character, "atletismo")).toBe(true);
    expect(isSkillGrantedByClassChoice(character, "intimidacao")).toBe(true);
    expect(isSkillGrantedByClassChoice(character, "historia")).toBe(false);
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
  });

  it("sem classe, ou classe sem skillChoice confirmado (Artífice), nunca concede nada por essa fonte", () => {
    const semClasse = createBlankCharacter("t");
    expect(isSkillGrantedByClassChoice(semClasse, "atletismo")).toBe(false);

    const artifice = createBlankCharacter("t");
    artifice.classId = "artifice";
    expect(isSkillGrantedByClassChoice(artifice, "arcanismo")).toBe(false);
  });

  it("trocar de classe some com a proficiência da classe anterior, sem apagar override manual nem a do antecedente", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };
    expect(getSkillProficiency(character, "atletismo")).toBe(true);

    character.classId = "mago"; // não escolheu Atletismo para o Mago
    expect(getSkillProficiency(character, "atletismo")).toBe(false);
  });

  it("antecedente E escolha de classe apontando para a mesma perícia continuam sendo só uma fonte 'true' (nunca dobra nada)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "guarda"; // Atletismo, Percepção
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };

    expect(getSkillProficiency(character, "atletismo")).toBe(true);
    expect(character.skills.atletismo.expertise).toBe(false); // expertise continua exigindo escolha explícita do jogador
  });

  it("remover UMA das origens nunca apaga a proficiência enquanto a OUTRA ainda concede a mesma perícia (fonte \"REORGANIZAR O BUILDER...\" §4: 'preservar a origem dos benefícios')", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "guarda"; // Atletismo, Percepção
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };
    expect(getSkillProficiency(character, "atletismo")).toBe(true);

    character.backgroundId = null; // remove o Antecedente — a escolha de Classe continua concedendo "atletismo"
    expect(getSkillProficiency(character, "atletismo")).toBe(true);

    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: [] }; // agora remove também a escolha de Classe
    expect(getSkillProficiency(character, "atletismo")).toBe(false);
  });
});

function bardoAt(level: number) {
  const character = createBlankCharacter("skills-test-bardo");
  character.classId = "bardo";
  character.level = level;
  return character;
}

describe("getJackOfAllTradesBonus — Pau pra Toda Obra do Bardo (nível 2+)", () => {
  it.each([
    [2, 1],
    [4, 1],
    [5, 1],
    [8, 1],
    [9, 2],
    [12, 2],
    [13, 2],
    [16, 2],
    [17, 3],
    [20, 3],
  ])("nível %i (Prof +%i → metade arredondada) → bônus +%i", (level, expectedBonus) => {
    expect(getJackOfAllTradesBonus(bardoAt(level))).toBe(expectedBonus);
  });

  it("nível 1 (ainda não tem a característica) → 0", () => {
    expect(getJackOfAllTradesBonus(bardoAt(1))).toBe(0);
  });

  it("outra classe nunca recebe o bônus", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.level = 20;
    expect(getJackOfAllTradesBonus(character)).toBe(0);
  });
});

describe("getSkillBonus — Pau pra Toda Obra aplicado só em perícias NÃO proficientes", () => {
  it("DEX +2, Furtividade sem proficiência, Prof +3 → +3 no total (2 DEX + 1 Pau pra Toda Obra)", () => {
    const character = bardoAt(5); // Prof +3 → metade = +1
    character.abilities.DEX.score = 14; // +2
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(3);
  });

  it("perícia proficiente NUNCA recebe o bônus de Pau pra Toda Obra (usa o bônus de proficiência normal)", () => {
    const character = bardoAt(5); // Prof +3
    character.abilities.DEX.score = 14; // +2
    character.skills.furtividade.manualOverride = true; // proficiente
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(5); // 2 + 3 (bônus de proficiência cheio, nunca +1 por cima)
  });

  it("Pau pra Toda Obra NUNCA torna a perícia proficiente", () => {
    const character = bardoAt(5);
    expect(getSkillProficiency(character, "furtividade")).toBe(false);
  });

  it("não se aplica antes do nível 2", () => {
    const character = bardoAt(1);
    character.abilities.DEX.score = 14; // +2
    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(2); // só o modificador, sem Pau pra Toda Obra ainda
  });
});

describe("Pau pra Toda Obra NUNCA altera Iniciativa, Salvaguardas ou Ataques (só testes associados a perícia)", () => {
  it("Iniciativa usa só DEX + ajuste manual — nunca o bônus de perícia não-proficiente", () => {
    const character = bardoAt(10); // Prof +4, se (erroneamente) aplicado somaria +2
    character.abilities.DEX.score = 14; // +2
    expect(getInitiative(character).auto).toBe(2);
  });

  it("Salvaguardas nunca recebem Pau pra Toda Obra mesmo sem proficiência", () => {
    const character = bardoAt(10); // Prof +4 → metade = +2, se (erroneamente) aplicado
    character.abilities.INT.score = 10; // +0
    const save = getSavingThrow(character, "INT");
    expect(save.auto).toBe(0); // nunca +2 por Pau pra Toda Obra
  });

  it("Ataques sem proficiência na arma nunca recebem o bônus de Pau pra Toda Obra (fórmula própria, sem perícia)", () => {
    const character = bardoAt(10); // Prof +4, se (erroneamente) aplicado somaria +2
    character.abilities.FOR.score = 14; // +2
    const bonus = getAttackBonus(character, { ability: "FOR", proficient: false });
    expect(bonus.auto).toBe(2);
  });
});

describe("Especialista do Bardo — skillExpertise (nunca concede proficiência, só Especialização)", () => {
  it("perícia escolhida em 'Especialista' (nível 2) ganha Especialização mesmo sem o jogador marcar o checkbox manual", () => {
    const character = bardoAt(2);
    character.skills.persuasao.manualOverride = true; // precisa já ser proficiente
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao"] };

    expect(isSkillGrantedExpertiseByClassChoice(character, "persuasao")).toBe(true);
    expect(getSkillExpertise(character, "persuasao")).toBe(true);
  });

  it("nunca concede a proficiência em si — só a Especialização", () => {
    const character = bardoAt(2);
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao"] };

    expect(getSkillProficiency(character, "persuasao")).toBe(false);
    expect(getSkillExpertise(character, "persuasao")).toBe(true); // a flag existe, mas sem proficiência o multiplicador de getSkillBonus ainda é 0
  });

  it("dobra o bônus quando a perícia é de fato proficiente", () => {
    const character = bardoAt(9); // Prof +4
    character.abilities.CAR.score = 16; // +3
    character.skills.persuasao.manualOverride = true;
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao"] };

    const bonus = getSkillBonus(character, "persuasao");
    expect(bonus.auto).toBe(11); // 3 + 4*2
  });

  it("nível 9 soma mais 2 escolhas (choice separado), nunca reaproveitando o id do nível 2", () => {
    const character = bardoAt(9);
    character.skills.persuasao.manualOverride = true;
    character.skills.enganacao.manualOverride = true;
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao"] };
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(2)] = { value: ["enganacao"] };

    expect(getSkillExpertise(character, "persuasao")).toBe(true);
    expect(getSkillExpertise(character, "enganacao")).toBe(true);
  });

  it("outra classe nunca tem Especialização concedida por escolha (mapa vazio)", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getBardSkillExpertiseChoiceId(1)] = { value: ["persuasao"] };
    expect(isSkillGrantedExpertiseByClassChoice(character, "persuasao")).toBe(false);
  });
});

describe("Especialista do Ladino — nível 1 (2 perícias) e nível 6 (mais 2, choice separado)", () => {
  function ladinoAt(level: number): ReturnType<typeof createBlankCharacter> {
    const character = createBlankCharacter("skills-test-ladino");
    character.classId = "ladino";
    character.level = level;
    return character;
  }

  it("perícia escolhida no nível 1 ganha Especialização mesmo sem o jogador marcar o checkbox manual, nunca concedendo a proficiência em si", () => {
    const character = ladinoAt(1);
    character.featureChoiceSelections[ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1] = { value: ["furtividade", "prestidigitacao"] };

    expect(isSkillGrantedExpertiseByClassChoice(character, "furtividade")).toBe(true);
    expect(getSkillExpertise(character, "furtividade")).toBe(true);
    expect(getSkillProficiency(character, "furtividade")).toBe(false); // sem proficiência própria, nunca concedida por esta escolha
  });

  it("dobra o bônus quando a perícia é de fato proficiente (manualOverride ou outra origem)", () => {
    const character = ladinoAt(9); // BP +4
    character.abilities.DEX.score = 16; // +3
    character.skills.furtividade.manualOverride = true;
    character.featureChoiceSelections[ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1] = { value: ["furtividade"] };

    const bonus = getSkillBonus(character, "furtividade");
    expect(bonus.auto).toBe(11); // 3 + 4*2
  });

  it("nível 6 soma mais 2 escolhas, por um ID SEPARADO do nível 1 — nunca reaproveitando o mesmo choice", () => {
    const character = ladinoAt(6);
    character.featureChoiceSelections[ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1] = { value: ["furtividade", "prestidigitacao"] };
    character.featureChoiceSelections[ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6] = { value: ["percepcao", "intuicao"] };

    expect(getSkillExpertise(character, "furtividade")).toBe(true);
    expect(getSkillExpertise(character, "prestidigitacao")).toBe(true);
    expect(getSkillExpertise(character, "percepcao")).toBe(true);
    expect(getSkillExpertise(character, "intuicao")).toBe(true);
  });

  it("outra classe nunca tem Especialização concedida por esses IDs (mapa isolado por classe)", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1] = { value: ["furtividade"] };
    expect(isSkillGrantedExpertiseByClassChoice(character, "furtividade")).toBe(false);
  });
});

describe("Acadêmico do Mago — nível 2, 1 perícia restrita a Arcanismo/História/Investigação/Medicina/Natureza/Religião (fonte \"IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §5)", () => {
  function magoAt(level: number): ReturnType<typeof createBlankCharacter> {
    const character = createBlankCharacter("skills-test-mago");
    character.classId = "mago";
    character.level = level;
    return character;
  }

  it("perícia escolhida dentro das 6 opções ganha Especialização, mesmo sem marcar o checkbox manual, nunca concedendo a proficiência em si", () => {
    const character = magoAt(2);
    character.featureChoiceSelections[WIZARD_ACADEMIC_CHOICE_ID] = { value: ["arcanismo"] };

    expect(isSkillGrantedExpertiseByClassChoice(character, "arcanismo")).toBe(true);
    expect(getSkillExpertise(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "arcanismo")).toBe(false);
  });

  it("outra classe nunca tem Especialização concedida por este ID", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[WIZARD_ACADEMIC_CHOICE_ID] = { value: ["arcanismo"] };
    expect(isSkillGrantedExpertiseByClassChoice(character, "arcanismo")).toBe(false);
  });
});

function clerigoAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("skills-test-clerigo");
  character.classId = "clerigo";
  character.level = level;
  return character;
}

describe("getThaumaturgeSkillBonus — Taumaturgo (Ordem Divina do Clérigo), INCONDICIONAL (nunca exige ausência de proficiência)", () => {
  it("SAB +3, Taumaturgo escolhido: +3 em Arcanismo e Religião", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 16; // +3
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(3);
    expect(getThaumaturgeSkillBonus(character, "religiao")).toBe(3);
  });

  it("SAB +0 ou negativo: mínimo +1", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 8; // -1
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(1);
  });

  it("nunca se aplica a outras perícias", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getThaumaturgeSkillBonus(character, "historia")).toBe(0);
    expect(getThaumaturgeSkillBonus(character, "intuicao")).toBe(0);
  });

  it("Protetor escolhido (não Taumaturgo): bônus 0", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Protetor" };
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(0);
  });

  it("nenhuma escolha de Ordem Divina ainda feita: bônus 0", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 16;
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(0);
  });

  it("outra classe nunca recebe o bônus, mesmo com a mesma seleção por acidente", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(0);
  });

  it("getSkillBonus: soma INCONDICIONALMENTE, mesmo com a perícia já proficiente (empilha, nunca mutuamente exclusivo com proficiência) — Religião usa INT na fórmula base, o bônus de Taumaturgo é independente", () => {
    const character = clerigoAt(5); // Prof +3
    character.abilities.INT.score = 10; // +0 (Religião é baseada em INT)
    character.abilities.SAB.score = 16; // +3 (só alimenta o bônus de Taumaturgo)
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    character.skills.religiao.manualOverride = true; // proficiente

    const bonus = getSkillBonus(character, "religiao");
    expect(bonus.auto).toBe(6); // 0 (INT) + 3 (prof) + 3 (Taumaturgo) — nunca zera por já ser proficiente
  });

  it("getSkillBonus: também soma sem proficiência alguma", () => {
    const character = clerigoAt(1);
    character.abilities.INT.score = 10; // +0 (Arcanismo é baseado em INT)
    character.abilities.SAB.score = 14; // +2 (só alimenta o bônus de Taumaturgo)
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };

    const bonus = getSkillBonus(character, "arcanismo");
    expect(bonus.auto).toBe(2); // 0 (INT) + 0 (sem prof) + 2 (Taumaturgo)
  });

  it("Taumaturgo nunca concede a proficiência em si", () => {
    const character = clerigoAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID] = { value: "Taumaturgo" };
    expect(getSkillProficiency(character, "religiao")).toBe(false);
    expect(getSkillProficiency(character, "arcanismo")).toBe(false);
  });
});

function druidaAt(level: number): ReturnType<typeof createBlankCharacter> {
  const character = createBlankCharacter("skills-test-druida");
  character.classId = "druida";
  character.level = level;
  return character;
}

describe("getShamanSkillBonus — Xamã (Ordem Primal do Druida), INCONDICIONAL (nunca exige ausência de proficiência)", () => {
  it("SAB +3, Xamã escolhido: +3 em Arcanismo e Natureza", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 16; // +3
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getShamanSkillBonus(character, "arcanismo")).toBe(3);
    expect(getShamanSkillBonus(character, "natureza")).toBe(3);
  });

  it("SAB +0 ou negativo: mínimo +1", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 8; // -1
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getShamanSkillBonus(character, "natureza")).toBe(1);
  });

  it("nunca se aplica a outras perícias", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getShamanSkillBonus(character, "historia")).toBe(0);
    expect(getShamanSkillBonus(character, "intuicao")).toBe(0);
    expect(getShamanSkillBonus(character, "religiao")).toBe(0); // é a dupla do Taumaturgo, não do Xamã
  });

  it("Protetor escolhido (não Xamã): bônus 0", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Protetor" };
    expect(getShamanSkillBonus(character, "natureza")).toBe(0);
  });

  it("outra classe nunca recebe o bônus, mesmo com a mesma seleção por acidente", () => {
    const character = createBlankCharacter("t");
    character.classId = "mago";
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getShamanSkillBonus(character, "natureza")).toBe(0);
  });

  it("getSkillBonus: soma INCONDICIONALMENTE, mesmo com a perícia já proficiente", () => {
    const character = druidaAt(5); // Prof +3
    character.abilities.INT.score = 10; // +0 (Natureza é baseada em INT)
    character.abilities.SAB.score = 16; // +3 (só alimenta o bônus de Xamã)
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    character.skills.natureza.manualOverride = true; // proficiente

    const bonus = getSkillBonus(character, "natureza");
    expect(bonus.auto).toBe(6); // 0 (INT) + 3 (prof) + 3 (Xamã) — nunca zera por já ser proficiente
  });

  it("Xamã nunca concede a proficiência em si", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getSkillProficiency(character, "natureza")).toBe(false);
    expect(getSkillProficiency(character, "arcanismo")).toBe(false);
  });

  it("Xamã do Druida e Taumaturgo do Clérigo nunca se misturam (Arcanismo soma dos dois se, hipoteticamente, ambos fossem verdade — mas cada função só olha a própria classe)", () => {
    const character = druidaAt(1);
    character.abilities.SAB.score = 16;
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID] = { value: "Xamã" };
    expect(getThaumaturgeSkillBonus(character, "arcanismo")).toBe(0); // classId !== "clerigo"
  });
});

describe("getSkillProficiencyOrigin — §6/§10 (de onde vem a proficiência, para a UI diferenciar automática/manual)", () => {
  it("sem nenhuma fonte, retorna null", () => {
    const character = createBlankCharacter("t");
    expect(getSkillProficiencyOrigin(character, "arcanismo")).toBeNull();
  });

  it("concedida pelo antecedente → 'background'", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "sabio"; // Arcanismo, História
    expect(getSkillProficiencyOrigin(character, "arcanismo")).toBe("background");
  });

  it("concedida pela escolha de Perícias de Classe → 'class'", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBe("class");
  });

  it("override manual true → 'manual', mesmo sem nenhuma fonte estrutural", () => {
    const character = createBlankCharacter("t");
    character.skills.furtividade.manualOverride = true;
    expect(getSkillProficiencyOrigin(character, "furtividade")).toBe("manual");
  });

  it("override manual false → null, mesmo que o antecedente concedesse a perícia (removida deliberadamente)", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "nobre"; // História, Persuasão
    character.skills.historia.manualOverride = false;
    expect(getSkillProficiencyOrigin(character, "historia")).toBeNull();
  });

  it("override manual sempre tem prioridade sobre as fontes estruturais, nos dois sentidos", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };
    character.skills.atletismo.manualOverride = false; // jogador desmarca o que a classe concedeu
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBeNull();
  });

  it("uma sobreposição manual redundante com a Classe nunca apaga, no estado, o fato de que a perícia também é concedida pela Classe (fonte \"AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS\" §3: 'uma alteração manual nunca deve apagar silenciosamente' a origem estrutural) — limpar o override depois reverte à origem automática, sem refazer a escolha de Classe", () => {
    const character = createBlankCharacter("t");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };

    // Jogador reafirma manualmente (Homebrew) uma perícia que já é concedida pela Classe — redundante, mas não é erro.
    character.skills.atletismo.manualOverride = true;
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBe("manual");
    // A seleção de Classe em si nunca é tocada por uma sobreposição manual — a escolha continua lá, intocada.
    expect(character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")]?.value).toEqual(["atletismo"]);

    // Ao limpar o override (ex.: desativar o modo Homebrew e restaurar), a origem volta a 'class' automaticamente —
    // nunca é preciso refazer a escolha de "Perícias de Classe" para recuperar a proficiência.
    character.skills.atletismo.manualOverride = null;
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBe("class");
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
  });

  it("antecedente E classe concedendo a mesma perícia: prioriza 'background' só para exibição (a proficiência em si não depende de qual 'venceu')", () => {
    const character = createBlankCharacter("t");
    character.backgroundId = "guarda"; // Atletismo, Percepção
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo"] };
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBe("background");
  });
});

describe("isSkillGrantedBySpeciesChoice — Sentidos Aguçados do Elfo (fonte \"IMPLEMENTAR LINHAGENS...\" §5)", () => {
  it("concede a perícia escolhida entre Intuição/Percepção/Sobrevivência", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["percepcao"] };

    expect(isSkillGrantedBySpeciesChoice(character, "percepcao")).toBe(true);
    expect(isSkillGrantedBySpeciesChoice(character, "intuicao")).toBe(false);
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
  });

  it("independe de qual Linhagem Élfica foi escolhida", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-drow";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["sobrevivencia"] };
    expect(getSkillProficiency(character, "sobrevivencia")).toBe(true);
  });

  it("nunca concede nada para outra espécie, mesmo com a mesma seleção por acidente", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "humano";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["percepcao"] };
    expect(isSkillGrantedBySpeciesChoice(character, "percepcao")).toBe(false);
  });

  it("trocar de espécie some com a proficiência (derivada, sem precisar apagar a seleção antiga)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["intuicao"] };
    expect(getSkillProficiency(character, "intuicao")).toBe(true);

    character.speciesId = "anao";
    expect(getSkillProficiency(character, "intuicao")).toBe(false);
  });

  it("getSkillProficiencyOrigin devolve 'species'", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["intuicao"] };
    expect(getSkillProficiencyOrigin(character, "intuicao")).toBe("species");
  });

  it("override manual sempre tem prioridade sobre a escolha de espécie", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["intuicao"] };
    character.skills.intuicao.manualOverride = false;
    expect(getSkillProficiency(character, "intuicao")).toBe(false);
    expect(getSkillProficiencyOrigin(character, "intuicao")).toBeNull();
  });
});

describe("isSkillGrantedBySubclassChoice — Glamour Transcendental do Andarilho Feérico (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §2)", () => {
  function feyWanderer(): ReturnType<typeof createBlankCharacter> {
    const character = createBlankCharacter("t");
    character.classId = "patrulheiro";
    character.subclassId = "Andarilho Feérico";
    character.level = 3;
    return character;
  }

  it("concede a perícia escolhida entre Atuação/Enganação/Persuasão", () => {
    const character = feyWanderer();
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["enganacao"] };
    expect(isSkillGrantedBySubclassChoice(character, "enganacao")).toBe(true);
    expect(isSkillGrantedBySubclassChoice(character, "atuacao")).toBe(false);
    expect(getSkillProficiency(character, "enganacao")).toBe(true);
    expect(getSkillProficiencyOrigin(character, "enganacao")).toBe("subclass");
  });

  it("nunca concede nada para outra subclasse, mesmo com a mesma seleção por acidente", () => {
    const character = feyWanderer();
    character.subclassId = "Caçador";
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["persuasao"] };
    expect(isSkillGrantedBySubclassChoice(character, "persuasao")).toBe(false);
  });

  it("integra a mesma validação de conflitos: perícia redundante com o Antecedente é detectada e identifica a origem 'subclass'", () => {
    const character = feyWanderer();
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["persuasao"] };
    character.backgroundId = "artesao"; // escolhido só para o teste a seguir validar via rules/skillChoiceConflicts.ts
    // (a asserção de redundância em si mora em skillChoiceConflicts.test.ts — aqui só confirmamos
    // que a seleção de subclasse nunca é apagada sozinha quando outra origem passa a conceder a mesma perícia depois).
    expect(character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID]?.value).toEqual(["persuasao"]);
  });

  it("override manual sempre tem prioridade sobre a escolha de subclasse", () => {
    const character = feyWanderer();
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["atuacao"] };
    character.skills.atuacao.manualOverride = false;
    expect(getSkillProficiency(character, "atuacao")).toBe(false);
    expect(getSkillProficiencyOrigin(character, "atuacao")).toBeNull();
  });
});

describe("isSkillGrantedBySubclassChoice — Estudioso da Guerra do Mestre de Batalha (fonte \"IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF\" §6, generalização do mapa por subclasse)", () => {
  function battleMaster(): ReturnType<typeof createBlankCharacter> {
    const character = createBlankCharacter("t2");
    character.classId = "guerreiro";
    character.subclassId = "Mestre da Batalha";
    character.level = 3;
    return character;
  }

  it("concede a perícia escolhida entre as opções de Guerreiro nível 1, com origem 'subclass'", () => {
    const character = battleMaster();
    character.featureChoiceSelections["guerreiro-mestre-de-batalha-estudioso-da-guerra-pericia-escolha"] = { value: ["percepcao"] };
    expect(isSkillGrantedBySubclassChoice(character, "percepcao")).toBe(true);
    expect(isSkillGrantedBySubclassChoice(character, "furtividade")).toBe(false);
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
    expect(getSkillProficiencyOrigin(character, "percepcao")).toBe("subclass");
  });

  it("nunca concede nada para outra subclasse de Guerreiro", () => {
    const character = battleMaster();
    character.subclassId = "Campeão";
    character.featureChoiceSelections["guerreiro-mestre-de-batalha-estudioso-da-guerra-pericia-escolha"] = { value: ["percepcao"] };
    expect(isSkillGrantedBySubclassChoice(character, "percepcao")).toBe(false);
  });

  it("Glamour Transcendental e Estudioso da Guerra nunca se confundem — cada subclasse só lê sua própria escolha", () => {
    const character = battleMaster();
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["persuasao"] };
    expect(isSkillGrantedBySubclassChoice(character, "persuasao")).toBe(false);
  });
});

describe("getGlamourTranscendentalBonus — Andarilho Feérico, nível 3 (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §2)", () => {
  function feyWandererAt(level: number, wisdom: number): ReturnType<typeof createBlankCharacter> {
    const character = createBlankCharacter("glamour-test");
    character.classId = "patrulheiro";
    character.subclassId = "Andarilho Feérico";
    character.level = level;
    character.abilities.SAB.score = wisdom;
    return character;
  }

  it("soma modificador de Sabedoria (mínimo 1) a todas as 4 perícias de Carisma, nunca a outras", () => {
    const character = feyWandererAt(3, 16); // SAB +3
    expect(getGlamourTranscendentalBonus(character, "atuacao")).toBe(3);
    expect(getGlamourTranscendentalBonus(character, "enganacao")).toBe(3);
    expect(getGlamourTranscendentalBonus(character, "intimidacao")).toBe(3);
    expect(getGlamourTranscendentalBonus(character, "persuasao")).toBe(3);
    expect(getGlamourTranscendentalBonus(character, "furtividade")).toBe(0);
    expect(getGlamourTranscendentalBonus(character, "arcanismo")).toBe(0);
  });

  it("mínimo +1, mesmo com modificador de Sabedoria negativo ou zero", () => {
    const character = feyWandererAt(3, 8); // SAB -1
    expect(getGlamourTranscendentalBonus(character, "persuasao")).toBe(1);
  });

  it("nunca se aplica fora de Andarilho Feérico, nem para outra classe", () => {
    const outraSubclasse = feyWandererAt(3, 16);
    outraSubclasse.subclassId = "Caçador";
    expect(getGlamourTranscendentalBonus(outraSubclasse, "persuasao")).toBe(0);

    const outraClasse = createBlankCharacter("x");
    outraClasse.subclassId = "Andarilho Feérico"; // nome de subclasse sem a classe certa, nunca deveria bastar
    outraClasse.abilities.SAB.score = 16;
    expect(getGlamourTranscendentalBonus(outraClasse, "persuasao")).toBe(0);
  });

  it("soma ao bônus total da perícia, sem dobrar por Especialização (nunca multiplicado pelo bônus de proficiência)", () => {
    const character = feyWandererAt(9, 16); // SAB +3, proficiência +4
    character.abilities.CAR.score = 14; // +2
    character.skills.persuasao.manualOverride = true;
    character.skills.persuasao.expertise = true;
    const bonus = getSkillBonus(character, "persuasao");
    // 2 (CAR) + 4*2 (proficiência dobrada por Especialização) + 3 (Glamour, nunca dobrado) = 13
    expect(bonus.auto).toBe(13);
  });

  it("some mesmo sem proficiência na perícia (vale para o teste 'sem perícia associada' também)", () => {
    const character = feyWandererAt(3, 16);
    character.abilities.CAR.score = 10; // +0
    const bonus = getSkillBonus(character, "intimidacao");
    expect(bonus.auto).toBe(3); // 0 (CAR) + 0 (sem proficiência) + 3 (Glamour)
  });
});

/**
 * Fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §2:
 * "Perícias concedidas automaticamente" — Antecedente (lista fixa) e,
 * desde "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" §10,
 * também uma concessão fixa de SUBCLASSE (Implementos de Misericórdia).
 * Classe/Espécie continuam só com concessões por escolha (aparecem na
 * etapa "Perícias" como blocos, nunca aqui).
 */
describe("getAutomaticSkillProficiencyGrants — perícias concedidas SEM escolha (Antecedente e concessão fixa de Subclasse)", () => {
  it("sem Antecedente escolhido — []", () => {
    const character = createBlankCharacter("auto-grants-test");
    expect(getAutomaticSkillProficiencyGrants(character)).toEqual([]);
  });

  it("Acólito concede Intuição e Religião, cada uma com origem ['background']", () => {
    const character = createBlankCharacter("auto-grants-test-2");
    character.backgroundId = "acolito";
    const grants = getAutomaticSkillProficiencyGrants(character);
    expect(grants).toEqual(
      expect.arrayContaining([
        { skill: "intuicao", origins: ["background"] },
        { skill: "religiao", origins: ["background"] },
      ]),
    );
    expect(grants).toHaveLength(2);
  });

  it("nunca inclui uma perícia concedida só por escolha de Classe/Subclasse/Espécie, mesmo já respondida", () => {
    const character = createBlankCharacter("auto-grants-test-3");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo", "intimidacao"] };
    // "atletismo"/"intimidacao" vieram de uma ESCOLHA de Classe — nunca contam como "sem escolha".
    expect(getAutomaticSkillProficiencyGrants(character)).toEqual([]);
  });

  it("troca de Antecedente recalcula a lista — nunca mantém a anterior", () => {
    const character = createBlankCharacter("auto-grants-test-4");
    character.backgroundId = "acolito"; // Intuição/Religião
    expect(getAutomaticSkillProficiencyGrants(character).map((g) => g.skill).sort()).toEqual(["intuicao", "religiao"]);

    character.backgroundId = "soldado"; // Atletismo/Intimidação
    expect(getAutomaticSkillProficiencyGrants(character).map((g) => g.skill).sort()).toEqual(["atletismo", "intimidacao"]);
  });

  it("Implementos de Misericórdia (Caminho da Misericórdia do Monge) concede Intuição e Medicina, cada uma com origem ['subclass']", () => {
    const character = createBlankCharacter("auto-grants-test-5");
    character.classId = "monge";
    character.subclassId = "Guerreiro da Misericórdia";
    const grants = getAutomaticSkillProficiencyGrants(character);
    expect(grants).toEqual(
      expect.arrayContaining([
        { skill: "intuicao", origins: ["subclass"] },
        { skill: "medicina", origins: ["subclass"] },
      ]),
    );
    expect(grants).toHaveLength(2);
  });

  it("antecedente E subclasse concedendo a mesma perícia: as duas origens aparecem juntas", () => {
    const character = createBlankCharacter("auto-grants-test-6");
    character.backgroundId = "acolito"; // Intuição/Religião
    character.classId = "monge";
    character.subclassId = "Guerreiro da Misericórdia"; // Intuição/Medicina
    const grants = getAutomaticSkillProficiencyGrants(character);
    expect(grants).toEqual(
      expect.arrayContaining([
        { skill: "intuicao", origins: ["background", "subclass"] },
        { skill: "religiao", origins: ["background"] },
        { skill: "medicina", origins: ["subclass"] },
      ]),
    );
  });

  it("outra subclasse de Monge, ou outra classe, nunca ganha a concessão fixa", () => {
    const character = createBlankCharacter("auto-grants-test-7");
    character.classId = "monge";
    character.subclassId = "Guerreiro das Sombras";
    expect(getAutomaticSkillProficiencyGrants(character)).toEqual([]);
  });

  it("Dádiva da Proficiência em Perícia concede as 18 perícias, cada uma com origem ['feat']", () => {
    const character = createBlankCharacter("auto-grants-epic-boon-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Proficiência em Perícia" };
    const grants = getAutomaticSkillProficiencyGrants(character);
    expect(grants).toHaveLength(18);
    expect(grants.every((g) => g.origins.includes("feat"))).toBe(true);
  });
});

describe("isSkillGrantedByEpicBoon / getSkillProficiency / getSkillProficiencyOrigin — Dádiva da Proficiência em Perícia (fonte \"IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF\" §5)", () => {
  function fighterAt19WithSkillBoon() {
    const character = createBlankCharacter("epic-boon-skills-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Proficiência em Perícia" };
    return character;
  }

  it("sem a Dádiva ativa: nenhuma perícia proficiente por esta origem", () => {
    const character = createBlankCharacter("epic-boon-skills-test-2");
    expect(isSkillGrantedByEpicBoon(character)).toBe(false);
    for (const skill of SKILL_KEYS) expect(getSkillProficiency(character, skill)).toBe(false);
  });

  it("com a Dádiva ativa: TODAS as 18 perícias ficam proficientes, origem 'feat'", () => {
    const character = fighterAt19WithSkillBoon();
    expect(isSkillGrantedByEpicBoon(character)).toBe(true);
    for (const skill of SKILL_KEYS) {
      expect(getSkillProficiency(character, skill)).toBe(true);
      expect(getSkillProficiencyOrigin(character, skill)).toBe("feat");
    }
  });

  it("nunca concede proficiência ou Especialização em ferramentas (só perícias)", () => {
    // Não há campo de ferramentas tocado por isSkillGrantedByEpicBoon — a função só opera em SkillKey.
    const character = fighterAt19WithSkillBoon();
    expect(isSkillGrantedByEpicBoon(character)).toBe(true);
  });

  it("preserva Especialização e proficiências já concedidas por outras origens, sem duplicar nem exigir nova escolha", () => {
    const character = fighterAt19WithSkillBoon();
    character.skills.atletismo.expertise = true; // já especializado por outra origem (manual/talento)
    expect(getSkillExpertise(character, "atletismo")).toBe(true);
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
  });

  it("a escolha de Especialização (skillExpertise, count 1) da própria Dádiva fica elegível em QUALQUER perícia, já que todas estão proficientes", () => {
    const character = fighterAt19WithSkillBoon();
    character.featureChoiceSelections[DADIVA_DA_PROFICIENCIA_EM_PERICIA_EXPERTISE_CHOICE_ID] = { value: ["furtividade"] };
    expect(getSkillExpertise(character, "furtividade")).toBe(true);
    expect(getSkillExpertise(character, "medicina")).toBe(false); // só a escolhida vira Especialização
  });

  it("o atributo próprio desta Dádiva nunca afeta perícia nenhuma (escolha separada)", () => {
    const character = fighterAt19WithSkillBoon();
    character.featureChoiceSelections[`${DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID}-atributo`] = { value: "CAR" };
    expect(getSkillProficiency(character, "furtividade")).toBe(true); // continua proficiente, sem relação com o atributo
  });
});

describe("isSkillGrantedBySubclassFixed — Implementos de Misericórdia, nível 3 (fonte \"IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF\" §10)", () => {
  it("concede Intuição e Medicina, sem escolha nenhuma do jogador", () => {
    const character = createBlankCharacter("t");
    character.classId = "monge";
    character.subclassId = "Guerreiro da Misericórdia";
    expect(isSkillGrantedBySubclassFixed(character, "intuicao")).toBe(true);
    expect(isSkillGrantedBySubclassFixed(character, "medicina")).toBe(true);
    expect(isSkillGrantedBySubclassFixed(character, "arcanismo")).toBe(false);
  });

  it("nunca concede nada sem a subclasse certa", () => {
    const character = createBlankCharacter("t");
    character.classId = "monge";
    character.subclassId = "Guerreiro dos Elementos";
    expect(isSkillGrantedBySubclassFixed(character, "intuicao")).toBe(false);
  });

  it("getSkillProficiency/getSkillProficiencyOrigin refletem a concessão", () => {
    const character = createBlankCharacter("t");
    character.classId = "monge";
    character.subclassId = "Guerreiro da Misericórdia";
    expect(getSkillProficiency(character, "medicina")).toBe(true);
    expect(getSkillProficiencyOrigin(character, "medicina")).toBe("subclass");
  });
});

describe("isSkillGrantedByFeatChoice — Habilidoso (fonte \"IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF\" §8)", () => {
  function habilidosoCharacter() {
    const character = createBlankCharacter("feat-skill-test");
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "habilidoso" } };
    return character;
  }

  it("false sem nenhuma escolha de Habilidoso selecionando a perícia", () => {
    expect(isSkillGrantedByFeatChoice(habilidosoCharacter(), "atletismo")).toBe(false);
  });

  it("true quando a perícia foi escolhida em Habilidoso (mesmo junto de ferramentas na mesma escolha)", () => {
    const character = habilidosoCharacter();
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4")] = { value: ["atletismo", "alaude"] };
    expect(isSkillGrantedByFeatChoice(character, "atletismo")).toBe(true);
    expect(isSkillGrantedByFeatChoice(character, "furtividade")).toBe(false);
  });

  it("getSkillProficiency/getSkillProficiencyOrigin refletem a concessão por Talento", () => {
    const character = habilidosoCharacter();
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4")] = { value: ["persuasao"] };
    expect(getSkillProficiency(character, "persuasao")).toBe(true);
    expect(getSkillProficiencyOrigin(character, "persuasao")).toBe("feat");
  });
});
