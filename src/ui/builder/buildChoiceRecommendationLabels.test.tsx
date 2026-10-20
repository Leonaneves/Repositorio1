import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import type { ClassId } from "../../domain/ids.js";
import { createBlankCharacter, type Character } from "../../domain/character.js";
import { getBardSkillExpertiseChoiceId } from "../../data/features/bard.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../../data/features/species.js";
import type { AbilityKey } from "../../domain/common.js";
import { getBuildChoiceStatsRepository, InMemoryBuildStore } from "../../repositories/index.js";
import { clearBuildChoiceRecommendationCache } from "../../recommendations/buildChoiceRecommendationEngine.js";
import { clearTalentRecommendationCache } from "../../recommendations/talentRecommendationEngine.js";
import { testAbilities, testBuildId, testUserBuild } from "../../references/testFixtures.js";
import { getSkillChoiceFeatures } from "../../rules/features.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { FeatureChoiceControl } from "./FeatureChoiceControl.js";
import { Step4Species } from "./steps/Step4Species.js";
import { Step5Background } from "./steps/Step5Background.js";
import { Step6Abilities } from "./steps/Step6Abilities.js";
import { Step3Subclass } from "./steps/Step3Subclass.js";
import { StepMetamagic } from "./steps/StepMetamagic.js";
import { StepInvocations } from "./steps/StepInvocations.js";
import { StepManeuvers } from "./steps/StepManeuvers.js";

/**
 * Rótulo "(Recomendado)" em Espécie, Antecedente, Perícias,
 * Especialização e na distribuição de atributos — só dados REAIS
 * (personagens de teste fictícios confirmados no repositório em memória
 * deste processo), 10+ personagens da mesma classe.
 */

const repository = getBuildChoiceStatsRepository() as InMemoryBuildStore;

async function confirm(count: number, classId: ClassId, overrides: (index: number) => Partial<CharacterBuild>): Promise<void> {
  for (let i = 0; i < count; i++) await repository.insertConfirmed(testUserBuild(i + 1, classId, [], overrides(i)));
}

function setCharacter(character: Character): void {
  useCharacterStore.setState({ character });
}

function fighter(): Character {
  const character = createBlankCharacter("ui-build-choice-test");
  character.classId = "guerreiro";
  character.level = 1;
  return character;
}

const recommendedTexts = () => screen.queryAllByText(/\((★ )?Recomendado/).map((element) => element.textContent);
/** Linha de explicação das recomendações de vários fatores ("★ Recomendações com base em …"). */
const basisText = () => screen.queryAllByLabelText("Por que recomendado").map((element) => element.textContent);
const reasonTexts = () =>
  screen
    .queryAllByRole("list", { name: "Por que recomendado" })
    .flatMap((list) => within(list).getAllByRole("listitem"))
    .map((item) => item.textContent);

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  clearBuildChoiceRecommendationCache();
  clearTalentRecommendationCache();
});

afterEach(() => {
  vi.restoreAllMocks();
  repository.clear();
});

describe("Espécie e Antecedente", () => {
  it("com 10 personagens da mesma classe, marca até 3 espécies, na ordem do seletor", async () => {
    const species = ["anao", "anao", "anao", "anao", "elfo", "elfo", "elfo", "humano", "humano", "orc"] as const;
    await confirm(10, "guerreiro", (i) => ({ speciesId: species[i] }));
    setCharacter(fighter());
    render(<Step4Species />);
    expect(await screen.findByRole("option", { name: "Anão (★ Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elfo (★ Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Humano (★ Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Orc" })).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe."]);
    expect(useCharacterStore.getState().character.speciesId).toBeNull();
  });

  it("com 4, nada é recomendado", async () => {
    await confirm(4, "guerreiro", () => ({ speciesId: "anao" }));
    const spy = vi.spyOn(repository, "getBuildChoiceScores");
    setCharacter(fighter());
    render(<Step4Species />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedTexts()).toEqual([]);
    expect(screen.queryByRole("list", { name: "Por que recomendado" })).toBeNull();
  });

  it("outra classe não conta; sem classe nem consulta", async () => {
    await confirm(10, "mago", () => ({ backgroundId: "sabio" }));
    const spy = vi.spyOn(repository, "getBuildChoiceScores");
    setCharacter(fighter());
    render(<Step5Background />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedTexts()).toEqual([]);

    spy.mockClear();
    setCharacter(createBlankCharacter("sem-classe"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(spy).not.toHaveBeenCalled();
  });

  it("antecedente recomendado pelo que a classe escolheu", async () => {
    await confirm(10, "guerreiro", (i) => ({ backgroundId: i < 6 ? "soldado" : "guarda" }));
    setCharacter(fighter());
    render(<Step5Background />);
    expect(await screen.findByRole("option", { name: "Soldado (★ Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Guarda (★ Recomendado)" })).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe e os atributos que ela mais usa."]);
  });

  it("o próprio personagem nunca conta para a sua recomendação", async () => {
    await confirm(5, "guerreiro", () => ({ speciesId: "anao" }));
    const spy = vi.spyOn(repository, "getBuildChoiceScores");
    const character = fighter();
    character.id = testBuildId(1);
    setCharacter(character);
    render(<Step4Species />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedTexts()).toEqual([]);
  });
});

describe("Atributos: maior, 2º maior e menor", () => {
  it("marca exatamente um maior, um 2º maior e um menor (valores base), sem repetir atributo", async () => {
    await confirm(10, "guerreiro", (i) => ({ abilityScores: i < 7 ? testAbilities({ FOR: 15, INT: 8 }) : testAbilities({ DEX: 15, CAR: 8 }) }));
    setCharacter(fighter());
    render(<Step6Abilities />);
    expect(await screen.findByText("Força (★ Recomendado: maior)")).toBeInTheDocument();
    expect(await screen.findByText("Destreza (★ Recomendado: 2º maior)")).toBeInTheDocument();
    expect(await screen.findByText("Inteligência (★ Recomendado: menor)")).toBeInTheDocument();
    expect(recommendedTexts()).toHaveLength(3);
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe."]);
  });
});

describe("Perícias e Especialização", () => {
  it("Perícias de Classe: só a mesma escolha, nunca uma perícia que o personagem já tem por outra origem", async () => {
    const choiceId = "classe-guerreiro-pericias";
    await confirm(10, "guerreiro", (i) => ({ skillChoices: { [choiceId]: i < 8 ? ["atletismo", "percepcao"] : ["intimidacao", "percepcao"] } }));
    const character = fighter();
    character.backgroundId = "soldado"; // já concede Atletismo e Intimidação
    setCharacter(character);
    const choice = getSkillChoiceFeatures(character)
      .flatMap((feature) => feature.choices ?? [])
      .find((candidate) => candidate.id === choiceId)!;
    render(<FeatureChoiceControl choice={choice} />);
    expect(await screen.findByText("Percepção (★ Recomendado)")).toBeInTheDocument();
    expect(recommendedTexts()).toEqual(["Percepção (★ Recomendado)"]);
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe."]);
  });

  it("Especialização: recomenda entre as perícias já proficientes", async () => {
    const choiceId = getBardSkillExpertiseChoiceId(1);
    await confirm(10, "bardo", (i) => ({ skillChoices: { [choiceId]: i < 6 ? ["persuasao", "atuacao"] : ["persuasao", "enganacao"] } }));
    const character = createBlankCharacter("ui-build-choice-bard");
    character.classId = "bardo";
    character.level = 2;
    character.featureChoiceSelections["classe-bardo-pericias"] = { value: ["persuasao", "atuacao", "furtividade"] };
    setCharacter(character);
    const choice = getSkillChoiceFeatures(character)
      .flatMap((feature) => feature.choices ?? [])
      .find((candidate) => candidate.id === choiceId)!;
    render(<FeatureChoiceControl choice={choice} />);
    expect(await screen.findByText("Persuasão (★ Recomendado)")).toBeInTheDocument();
    // Enganação foi escolhida por 4, mas o personagem não é proficiente nela — nunca aparece.
    expect(recommendedTexts().sort()).toEqual(["Atuação (★ Recomendado)", "Persuasão (★ Recomendado)"]);
    expect(useCharacterStore.getState().character.featureChoiceSelections[choiceId]).toBeUndefined();
  });
});

describe("Subclasse e Metamagia", () => {
  function sorcerer(level: number): Character {
    const character = createBlankCharacter("ui-build-choice-sorcerer");
    character.classId = "feiticeiro";
    character.level = level;
    return character;
  }

  it("Subclasse: só a mais escolhida da classe, e continua a mesma depois de escolher outra", async () => {
    await confirm(12, "feiticeiro", (i) => ({ subclassId: i < 7 ? "Feitiçaria Dracônica" : "Feitiçaria Aberrante" }));
    const character = sorcerer(3);
    character.subclassId = "Feitiçaria Aberrante";
    setCharacter(character);
    render(<Step3Subclass />);
    expect(await screen.findByRole("option", { name: "Dracônica (Recomendado)" })).toBeInTheDocument();
    expect(recommendedTexts()).toEqual(["Dracônica (Recomendado)"]);
    expect(reasonTexts()).toEqual(["Dracônica: escolhido por cerca de 6 de cada 10 feiticeiros"]);
    expect(useCharacterStore.getState().character.subclassId).toBe("Feitiçaria Aberrante");
  });

  it("Metamagia: até 3 entre as opções ainda não conhecidas", async () => {
    await confirm(10, "feiticeiro", (i) => ({ metamagicOptions: i < 6 ? ["acelerada", "duplicada"] : ["acelerada", "sutil"] }));
    const character = sorcerer(2);
    character.knownMetamagicOptions = ["acelerada"];
    setCharacter(character);
    render(<StepMetamagic />);
    expect(await screen.findByText("+ Magia Duplicada (★ Recomendado)")).toBeInTheDocument();
    expect(screen.getByText("+ Magia Sutil (★ Recomendado)")).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe e as Metamagias que você já escolheu."]);
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toEqual(["acelerada"]);
  });
});

describe("Invocações e Manobras", () => {
  it("Invocações: classe/subclasse + o que costuma ser escolhido junto das já escolhidas", async () => {
    await confirm(10, "bruxo", (i) => ({ invocationIds: i < 6 ? ["mente-mistica", "armadura-de-sombras"] : ["mente-mistica", "explosao-repulsiva"] }));
    const character = createBlankCharacter("ui-build-choice-warlock");
    character.classId = "bruxo";
    character.level = 2;
    character.chosenInvocations = [{ invocationId: "mente-mistica", subChoice: "" }];
    setCharacter(character);
    render(<StepInvocations />);
    expect(await screen.findByText("+ Armadura de Sombras (★ Recomendado)")).toBeInTheDocument();
    expect(screen.getByText("+ Explosão Repulsiva (★ Recomendado)")).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em sua classe e as Invocações que você já escolheu."]);
    expect(useCharacterStore.getState().character.chosenInvocations).toHaveLength(1);
  });

  it("Manobras: Mestres de Batalha + o que costuma ser escolhido junto das já escolhidas", async () => {
    await confirm(10, "guerreiro", (i) => ({ subclassId: "Mestre da Batalha", maneuverIds: i < 7 ? ["aparar", "ataque-ameacador"] : ["aparar", "ataque-de-varredura"] }));
    const character = createBlankCharacter("ui-build-choice-battlemaster");
    character.classId = "guerreiro";
    character.level = 3;
    character.subclassId = "Mestre da Batalha";
    character.chosenManeuvers = ["aparar"];
    setCharacter(character);
    render(<StepManeuvers />);
    expect(await screen.findByText("Ataque Ameaçador (★ Recomendado)")).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em sua subclasse e as Manobras que você já escolheu."]);
  });
});

describe("Linhagem, aumentos de atributo e Perícias por fonte", () => {
  it("Linhagem: só a própria espécie, de qualquer classe — 'escolhido por X de cada 10 elfos'", async () => {
    await confirm(5, "mago", (i) => ({ speciesId: "elfo", speciesLineageId: i < 3 ? "elfo-alto-elfo" : "elfo-drow" }));
    const character = fighter();
    character.speciesId = "elfo";
    setCharacter(character);
    render(<Step4Species />);
    expect(await screen.findByRole("option", { name: "Alto Elfo (Recomendado)" })).toBeInTheDocument();
    expect(reasonTexts()).toEqual(["Alto Elfo: escolhido por 6 de cada 10 elfos"]);
  });

  it("aumentos do Antecedente mostram maior/2º maior/menor da distribuição GERAL (nunca a do Antecedente)", async () => {
    await confirm(5, "guerreiro", () => ({ abilityScores: testAbilities({ FOR: 15, CON: 14, CAR: 8 }), backgroundId: "sabio" }));
    const character = fighter();
    character.backgroundId = "soldado"; // FOR, DEX, CON
    setCharacter(character);
    render(<Step6Abilities />);
    const section = await screen.findByRole("region", { name: "Aumentos de Antecedente" });
    await within(section).findByText("(★ maior)");
    expect(within(section).getByText("(★ 2º maior)")).toBeInTheDocument();
    expect(within(section).queryByText("(★ menor)")).toBeNull(); // CAR não é aumentável pelo Soldado
  });

  it("talento com aumento de atributo: 1º o atributo de conjuração; sem conjuração, o maior dos outros jogadores", async () => {
    const choice = { id: "teste-aumento", prompt: "Aumente 1 atributo", effect: { kind: "abilityScoreIncrease" as const, options: ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as AbilityKey[] } };
    const wizard = createBlankCharacter("ui-build-choice-wizard");
    wizard.classId = "mago";
    setCharacter(wizard);
    const { unmount } = render(<FeatureChoiceControl choice={choice} />);
    expect(await screen.findByRole("option", { name: "Inteligência (★ Recomendado)" })).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em seu atributo de conjuração."]);
    unmount();

    await confirm(5, "guerreiro", () => ({ abilityScores: testAbilities({ DEX: 15 }) }));
    setCharacter(fighter());
    render(<FeatureChoiceControl choice={choice} />);
    expect(await screen.findByRole("option", { name: "Destreza (★ Recomendado)" })).toBeInTheDocument();
    expect(recommendedTexts()).toEqual(["Destreza (★ Recomendado)"]);
  });

  it("Perícias de espécie: base = outros personagens com a mesma escolha, de qualquer classe", async () => {
    await confirm(5, "mago", () => ({ skillChoices: { [ELFO_SENTIDOS_AGUCADOS_CHOICE_ID]: ["percepcao"] } }));
    const character = fighter();
    character.speciesId = "elfo";
    setCharacter(character);
    const choice = getSkillChoiceFeatures(character)
      .flatMap((feature) => feature.choices ?? [])
      .find((candidate) => candidate.id === ELFO_SENTIDOS_AGUCADOS_CHOICE_ID)!;
    render(<FeatureChoiceControl choice={choice} />);
    expect(await screen.findByText("Percepção (★ Recomendado)")).toBeInTheDocument();
    expect(basisText()).toEqual(["★ Recomendações com base em outros personagens com Traços de Elfo."]);
  });
});
