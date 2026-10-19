import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import type { ClassId } from "../../domain/ids.js";
import { createBlankCharacter, type Character } from "../../domain/character.js";
import { getBardSkillExpertiseChoiceId } from "../../data/features/bard.js";
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

const recommendedTexts = () => screen.queryAllByText(/\(Recomendado/).map((element) => element.textContent);
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
    expect(await screen.findByRole("option", { name: "Anão (Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elfo (Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Humano (Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Orc" })).toBeInTheDocument();
    expect(reasonTexts()).toEqual(["Anão: escolhido por 4 de 10 guerreiros", "Elfo: escolhido por 3 de 10 guerreiros", "Humano: escolhido por 2 de 10 guerreiros"]);
    expect(useCharacterStore.getState().character.speciesId).toBeNull();
  });

  it("com 9, nada é recomendado", async () => {
    await confirm(9, "guerreiro", () => ({ speciesId: "anao" }));
    const spy = vi.spyOn(repository, "getBuildChoiceCounts");
    setCharacter(fighter());
    render(<Step4Species />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedTexts()).toEqual([]);
    expect(screen.queryByRole("list", { name: "Por que recomendado" })).toBeNull();
  });

  it("outra classe não conta; sem classe nem consulta", async () => {
    await confirm(10, "mago", () => ({ backgroundId: "sabio" }));
    const spy = vi.spyOn(repository, "getBuildChoiceCounts");
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
    expect(await screen.findByRole("option", { name: "Soldado (Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Guarda (Recomendado)" })).toBeInTheDocument();
    expect(reasonTexts()).toEqual(["Soldado: escolhido por 6 de 10 guerreiros", "Guarda: escolhido por 4 de 10 guerreiros"]);
  });

  it("o próprio personagem nunca conta para a sua recomendação", async () => {
    await confirm(10, "guerreiro", () => ({ speciesId: "anao" }));
    const spy = vi.spyOn(repository, "getBuildChoiceCounts");
    const character = fighter();
    character.id = testBuildId(1);
    setCharacter(character);
    render(<Step4Species />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedTexts()).toEqual([]);
  });
});

describe("Atributos: 1 maior e 1 menor", () => {
  it("marca exatamente um atributo maior e um menor (valores base)", async () => {
    await confirm(10, "guerreiro", (i) => ({ abilityScores: i < 7 ? testAbilities({ FOR: 15, INT: 8 }) : testAbilities({ DEX: 15, CAR: 8 }) }));
    setCharacter(fighter());
    render(<Step6Abilities />);
    expect(await screen.findByText("Força (Recomendado: maior)")).toBeInTheDocument();
    expect(await screen.findByText("Inteligência (Recomendado: menor)")).toBeInTheDocument();
    expect(recommendedTexts()).toHaveLength(2);
    expect(reasonTexts()).toEqual(["Força: o maior atributo de 7 de 10 guerreiros", "Inteligência: o menor atributo de 7 de 10 guerreiros"]);
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
    expect(await screen.findByText("Percepção (Recomendado)")).toBeInTheDocument();
    expect(recommendedTexts()).toEqual(["Percepção (Recomendado)"]);
    expect(reasonTexts()).toEqual(["Percepção: escolhido por 10 de 10 guerreiros"]);
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
    expect(await screen.findByText("Persuasão (Recomendado)")).toBeInTheDocument();
    // Enganação foi escolhida por 4, mas o personagem não é proficiente nela — nunca aparece.
    expect(recommendedTexts().sort()).toEqual(["Atuação (Recomendado)", "Persuasão (Recomendado)"]);
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
    expect(await screen.findByText("+ Magia Duplicada (Recomendado)")).toBeInTheDocument();
    expect(screen.getByText("+ Magia Sutil (Recomendado)")).toBeInTheDocument();
    expect(reasonTexts()).toEqual(["Magia Duplicada: escolhido por 6 de 10 feiticeiros", "Magia Sutil: escolhido por 4 de 10 feiticeiros"]);
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toEqual(["acelerada"]);
  });
});
