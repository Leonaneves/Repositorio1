import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { ABILITY_KEYS } from "../domain/common.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { getPendingBuilderSteps, getStepBlockers } from "./builderProgress.js";

function blank(): Character {
  return createBlankCharacter("builder-progress-test");
}

function setValidAbilities(character: Character): Character {
  const scores = [15, 14, 13, 12, 10, 8];
  const abilities = { ...character.abilities };
  ABILITY_KEYS.forEach((key, i) => (abilities[key] = { score: scores[i] }));
  return { ...character, abilities };
}

describe("getStepBlockers — etapas genéricas exigem o campo correspondente", () => {
  it("'class' bloqueia sem classId; com classId, ainda lista a Perícias de Classe pendente (escolha movida para esta etapa)", () => {
    const character = blank();
    expect(getStepBlockers("class", character)).toEqual(["Escolha uma classe para continuar."]);
    const withClass = getStepBlockers("class", { ...character, classId: "mago" });
    expect(withClass).toHaveLength(1);
    expect(withClass[0]).toContain("Perícias de Classe");
  });

  it("'species' bloqueia sem speciesId, libera com speciesId", () => {
    const character = blank();
    expect(getStepBlockers("species", character)).toEqual(["Escolha uma espécie para continuar."]);
    expect(getStepBlockers("species", { ...character, speciesId: "humano" })).toEqual([]);
  });

  it("'species' (Draconato/Gnomo/Golias/Tiefling) exige a Linhagem/Ancestralidade, com mensagem nomeando a escolha certa", () => {
    const draconato: Character = { ...blank(), speciesId: "draconato" };
    expect(getStepBlockers("species", draconato)).toEqual(["Escolha a Ancestral Dracônico para continuar."]);
    expect(getStepBlockers("species", { ...draconato, speciesLineageId: "draconato-vermelho" })).toEqual([]);

    const gnomo: Character = { ...blank(), speciesId: "gnomo" };
    expect(getStepBlockers("species", gnomo)).toEqual(["Escolha a Linhagem Gnômica para continuar."]);

    const golias: Character = { ...blank(), speciesId: "golias" };
    expect(getStepBlockers("species", golias)).toEqual(["Escolha a Ancestralidade Gigante para continuar."]);

    const tiefling: Character = { ...blank(), speciesId: "tiefling" };
    expect(getStepBlockers("species", tiefling)).toEqual(["Escolha a Linhagem Infernal para continuar."]);
  });

  it("'species' (Elfo) exige só a Linhagem Élfica — o atributo de conjuração é sempre automático, nunca uma escolha manual separada", () => {
    const character: Character = { ...blank(), speciesId: "elfo" };
    expect(getStepBlockers("species", character)).toEqual(["Escolha a Linhagem Élfica para continuar."]);

    const comLinhagem: Character = { ...character, speciesLineageId: "elfo-drow" };
    expect(getStepBlockers("species", comLinhagem)).toEqual([]);
  });

  it("'background' bloqueia sem backgroundId; libera assim que escolhido — a distribuição dos Aumentos de Atributo do Antecedente agora só é validada em 'abilities' (fonte \"REORGANIZAR O BUILDER...\" §3: distribuições transferidas para Atributos não bloqueiam o avanço em Classe/Antecedente)", () => {
    const character = blank();
    expect(getStepBlockers("background", character)).toEqual(["Escolha um antecedente para continuar."]);
    expect(getStepBlockers("background", { ...character, backgroundId: "acolito" })).toEqual([]);
  });

  it("'class' exige a DECISÃO de subclasse a partir do nível 3 (canChooseSubclass) — a subclasse não é mais uma etapa própria, mora dentro de 'class' (§2)", () => {
    const character = { ...blank(), classId: "mago" as const, level: 1 };
    expect(getStepBlockers("class", character).some((b) => b.includes("subclasse"))).toBe(false);
    const atLevel3 = { ...character, level: 3 };
    expect(getStepBlockers("class", atLevel3)).toContain("Escolha uma subclasse para continuar.");
    expect(getStepBlockers("class", { ...atLevel3, subclassId: "Evocador" })).not.toContain("Escolha uma subclasse para continuar.");
  });

  it("'abilities' bloqueia com os 6 atributos ainda no padrão (10), libera depois de gerados", () => {
    const character = blank();
    expect(getStepBlockers("abilities", character)).toEqual(["Gere e confirme os 6 atributos antes de continuar."]);
    expect(getStepBlockers("abilities", setValidAbilities(character))).toEqual([]);
  });

  it("'abilities' exige distribuir os Aumentos de Atributo do Antecedente — única etapa que valida essa distribuição (§3)", () => {
    const character = setValidAbilities({ ...blank(), backgroundId: "acolito" as const });
    expect(getStepBlockers("abilities", character)).toEqual(["Distribua todos os pontos de Aumento de Atributo do Antecedente."]);
    const withAllocation = { ...character, backgroundAbilityBonuses: { INT: 2, SAB: 1 } };
    expect(getStepBlockers("abilities", withAllocation)).toEqual([]);
  });

  it("'abilities' exige distribuir os pontos de cada ASI já no modo 'Aumentar Atributos' — a DECISÃO (ASI vs Talento) continua bloqueando em 'class', só a distribuição mora aqui", () => {
    const character = setValidAbilities({ ...blank(), classId: "guerreiro" as const, level: 4 });
    const withMode = { ...character, asiSelections: { 4: { kind: "abilityIncrease" as const, allocations: {} } } };
    expect(getStepBlockers("abilities", withMode)).toEqual(["Nível 4: distribua os 2 pontos de atributo (0/2)."]);
    expect(getStepBlockers("class", withMode).some((b) => b.includes("Aumentar Atributos"))).toBe(false);

    const withAllocation = { ...character, asiSelections: { 4: { kind: "abilityIncrease" as const, allocations: { FOR: 2 } } } };
    expect(getStepBlockers("abilities", withAllocation)).toEqual([]);
  });

  it("'basicInfo' nunca bloqueia (nenhuma regra definida para ela)", () => {
    expect(getStepBlockers("basicInfo", blank())).toEqual([]);
  });
});

describe("getStepBlockers — etapas específicas de classe reaproveitam as regras já existentes", () => {
  it("'invocations' explica quantidade pendente para o Bruxo", () => {
    const character = { ...blank(), classId: "bruxo" as const, level: 1 };
    expect(getStepBlockers("invocations", character)).toEqual(["Escolha mais 1 Invocação(ões) Místicas (0/1)."]);
  });

  it("'invocations' explica invocação inválida (pré-requisito quebrado)", () => {
    let character = { ...blank(), classId: "bruxo" as const, level: 5 };
    character = {
      ...character,
      chosenInvocations: [
        { invocationId: "pacto-da-lamina", subChoice: "" },
        { invocationId: "lamina-sedenta", subChoice: "" },
        { invocationId: "mente-mistica", subChoice: "" },
        { invocationId: "visao-diabolica", subChoice: "" },
        { invocationId: "vigor-infero", subChoice: "" },
      ],
    };
    expect(getStepBlockers("invocations", character)).toEqual([]);
    character = { ...character, chosenInvocations: character.chosenInvocations.slice(1) };
    expect(getStepBlockers("invocations", character).length).toBeGreaterThan(0);
  });

  it("'metamagic' explica quantidade pendente para o Feiticeiro", () => {
    const character = { ...blank(), classId: "feiticeiro" as const, level: 2 };
    expect(getStepBlockers("metamagic", character)).toEqual(["Escolha exatamente 2 opções de Metamagia (atualmente 0/2)."]);
  });

  it("'class' bloqueia a seção de Terreno do Círculo da Terra sem escolha, libera com uma opção válida (seção dentro de Classe, não etapa própria — §2)", () => {
    const character = { ...blank(), classId: "druida" as const, subclassId: "Círculo da Terra", level: 3 };
    expect(getStepBlockers("class", character)).toContain("Escolha o Terreno do Círculo da Terra.");
    const withChoice = {
      ...character,
      featureChoiceSelections: { [EARTH_CIRCLE_TERRAIN_CHOICE_ID]: { value: "Tropical" } },
    };
    expect(getStepBlockers("class", withChoice)).not.toContain("Escolha o Terreno do Círculo da Terra.");
  });

  it("'class' bloqueia a seção de Afinidade Elemental sem escolha, libera com uma opção válida (seção dentro de Classe, não etapa própria — §2)", () => {
    const character = { ...blank(), classId: "feiticeiro" as const, subclassId: "Feitiçaria Dracônica", level: 6 };
    expect(getStepBlockers("class", character)).toContain("Escolha o tipo de Afinidade Elemental.");
    const withChoice = {
      ...character,
      featureChoiceSelections: { [ELEMENTAL_AFFINITY_CHOICE_ID]: { value: "Fogo" } },
    };
    expect(getStepBlockers("class", withChoice)).not.toContain("Escolha o tipo de Afinidade Elemental.");
  });

  it("'equipment' explica pacote pendente", () => {
    const character = { ...blank(), classId: "guerreiro" as const };
    expect(getStepBlockers("equipment", character)).toEqual(["Escolha um pacote de Equipamento Inicial."]);
  });

  it("'class' lista cada escolha pendente por nome (fonte REORGANIZAÇÃO DO BUILDER §1: Perícias de Classe do Guerreiro mora aqui)", () => {
    const character = { ...blank(), classId: "guerreiro" as const };
    const blockers = getStepBlockers("class", character);
    expect(blockers.some((b) => b.includes('Escolha pendente em "Perícias de Classe"'))).toBe(true);
  });

  it("'featuresAndTalents' nunca lista escolhas de Classe/Subclasse — hoje sempre vazio, sem catálogo de Espécie/Antecedente/Talento com escolha", () => {
    const character = { ...blank(), classId: "guerreiro" as const };
    expect(getStepBlockers("featuresAndTalents", character)).toEqual([]);
  });
});

describe("getPendingBuilderSteps — agrega pendências de todas as etapas visíveis, nunca da 'review'", () => {
  it("personagem em branco: pendências de classe (etapas posteriores ainda nem são visíveis)", () => {
    const pending = getPendingBuilderSteps(blank());
    expect(pending.map((p) => p.stepId)).toContain("class");
    expect(pending.some((p) => p.stepId === "review")).toBe(false);
  });

  it("personagem completo (classe/espécie/antecedente/atributos) sem pendências genéricas restantes", () => {
    let character = blank();
    character = {
      ...character,
      classId: "guerreiro",
      speciesId: "humano",
      backgroundId: "acolito",
      backgroundAbilityBonuses: { INT: 2, SAB: 1 },
    };
    character = setValidAbilities(character);
    const pending = getPendingBuilderSteps(character);
    expect(pending.some((p) => p.stepId === "species")).toBe(false);
    expect(pending.some((p) => p.stepId === "background")).toBe(false);
    expect(pending.some((p) => p.stepId === "abilities")).toBe(false);
    // "featuresAndTalents" nunca mais tem pendência de Classe — a Perícias de Classe do Guerreiro agora é bloqueio da própria etapa "class".
    expect(pending.some((p) => p.stepId === "featuresAndTalents")).toBe(false);
    expect(pending.some((p) => p.stepId === "class")).toBe(true);
    expect(pending.some((p) => p.stepId === "equipment")).toBe(true);
  });

  it("Feiticeiro nível 2 com Metamagia resolvida: a pendência de 'metamagic' desaparece", () => {
    let character = blank();
    character = { ...character, classId: "feiticeiro", speciesId: "humano", backgroundId: "acolito", level: 2 };
    character = setValidAbilities(character);
    expect(getPendingBuilderSteps(character).some((p) => p.stepId === "metamagic")).toBe(true);

    character = { ...character, knownMetamagicOptions: ["sutil", "distante"] };
    expect(getPendingBuilderSteps(character).some((p) => p.stepId === "metamagic")).toBe(false);
  });
});

describe("getStepBlockers — perícia redundante entre origens, independente da ordem de escolha (§4)", () => {
  it("'class' explica a perícia redundante e aponta para a feature certa (Classe escolhida antes do Antecedente)", () => {
    let character: Character = { ...blank(), classId: "guerreiro" };
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };
    character = { ...character, backgroundId: "acolito" }; // concede "intuicao" automaticamente, depois da escolha de Classe já feita

    const blockers = getStepBlockers("class", character);
    expect(blockers).toContain(
      'Perícia "Intuição" escolhida em "Perícias de Classe" já é concedida por outra origem — escolha outra perícia em "Perícias de Classe".',
    );
  });

  it("o mesmo aviso aparece mesmo quando o Antecedente já estava presente antes da escolha de Classe (detecção independente da ordem)", () => {
    let character: Character = { ...blank(), backgroundId: "acolito", classId: "guerreiro" };
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };

    expect(getStepBlockers("class", character)).toContain(
      'Perícia "Intuição" escolhida em "Perícias de Classe" já é concedida por outra origem — escolha outra perícia em "Perícias de Classe".',
    );
  });

  it("escolher outra perícia no lugar resolve o aviso, sem o jogador precisar remover o Antecedente", () => {
    let character: Character = { ...blank(), classId: "guerreiro", backgroundId: "acolito" };
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };
    expect(getStepBlockers("class", character).some((b) => b.includes("Intuição"))).toBe(true);

    character = {
      ...character,
      featureChoiceSelections: { [getClassSkillChoiceId("guerreiro")]: { value: ["percepcao", "atletismo"] } },
    };
    expect(getStepBlockers("class", character).some((b) => b.includes("Intuição"))).toBe(false);
  });

  it("'species' explica a perícia redundante da escolha de Sentidos Aguçados do Elfo quando o Antecedente concede a mesma perícia", () => {
    let character: Character = { ...blank(), speciesId: "elfo", speciesLineageId: "elfo-drow" };
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["intuicao"] };
    character = { ...character, backgroundId: "acolito" };

    expect(getStepBlockers("species", character)).toContain(
      'Perícia "Intuição" escolhida em "Traços de Elfo" já é concedida por outra origem — escolha outra perícia em "Traços de Elfo".',
    );
  });

  it("remover o Antecedente que causava a redundância limpa o aviso sem apagar a escolha de perícia feita em Classe", () => {
    let character: Character = { ...blank(), classId: "guerreiro", backgroundId: "acolito" };
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };
    expect(getStepBlockers("class", character).some((b) => b.includes("Intuição"))).toBe(true);

    const semAntecedente = { ...character, backgroundId: null };
    expect(getStepBlockers("class", semAntecedente).some((b) => b.includes("Intuição"))).toBe(false);
    expect(semAntecedente.featureChoiceSelections[getClassSkillChoiceId("guerreiro")]?.value).toEqual(["intuicao", "atletismo"]);
  });
});
