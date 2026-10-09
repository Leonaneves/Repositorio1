import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { getBardSkillExpertiseChoiceId } from "../data/features/bard.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { getInitiative } from "./derived.js";
import { getSavingThrow } from "./savingThrows.js";
import { getAttackBonus } from "./attack.js";
import {
  getJackOfAllTradesBonus,
  getSkillBonus,
  getSkillExpertise,
  getSkillProficiency,
  getSkillProficiencyOrigin,
  getThaumaturgeSkillBonus,
  getShamanSkillBonus,
  isSkillGrantedByBackground,
  isSkillGrantedByClassChoice,
  isSkillGrantedBySpeciesChoice,
  isSkillGrantedExpertiseByClassChoice,
} from "./skills.js";

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
