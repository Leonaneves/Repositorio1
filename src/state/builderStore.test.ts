import { beforeEach, describe, expect, it } from "vitest";
import { useBuilderStore } from "./builderStore.js";
import { useCharacterStore } from "./characterStore.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useBuilderStore.setState({ abilityGenerationMode: "standardArray", draftScores: {}, currentStepId: "basicInfo" });
});

describe("useBuilderStore — modo de geração de atributos", () => {
  it("começa em Array Padrão por padrão (decisão aprovada §9)", () => {
    expect(useBuilderStore.getState().abilityGenerationMode).toBe("standardArray");
  });

  it("trocar de modo limpa o rascunho (evita misturar valores de métodos diferentes)", () => {
    const store = useBuilderStore.getState();
    store.setDraftScore("FOR", 15);
    store.setAbilityGenerationMode("pointBuy");
    expect(useBuilderStore.getState().draftScores).toEqual({});
    expect(useBuilderStore.getState().abilityGenerationMode).toBe("pointBuy");
  });
});

describe("useBuilderStore — rascunho de atributos", () => {
  it("define e limpa (null) o valor de um atributo", () => {
    const store = useBuilderStore.getState();
    store.setDraftScore("DEX", 14);
    expect(useBuilderStore.getState().draftScores.DEX).toBe(14);

    store.setDraftScore("DEX", null);
    expect(useBuilderStore.getState().draftScores.DEX).toBeUndefined();
  });

  it("resetDraftScores limpa todo o rascunho", () => {
    const store = useBuilderStore.getState();
    store.setDraftScore("FOR", 15);
    store.setDraftScore("DEX", 14);
    store.resetDraftScores();
    expect(useBuilderStore.getState().draftScores).toEqual({});
  });
});

describe("useBuilderStore — isDraftValid despacha para a regra do modo ativo", () => {
  it("Array Padrão: só válido com os 6 valores fixos, um por atributo", () => {
    const store = useBuilderStore.getState();
    store.setDraftScore("FOR", 15);
    expect(store.isDraftValid()).toBe(false);

    (["DEX", "CON", "INT", "SAB", "CAR"] as const).forEach((ability, i) =>
      store.setDraftScore(ability, [14, 13, 12, 10, 8][i]),
    );
    expect(useBuilderStore.getState().isDraftValid()).toBe(true);
  });

  it("Point Buy: inválido enquanto o orçamento estiver excedido", () => {
    const store = useBuilderStore.getState();
    store.setAbilityGenerationMode("pointBuy");
    (["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const).forEach((ability) => store.setDraftScore(ability, 15));
    expect(useBuilderStore.getState().isDraftValid()).toBe(false); // 9×6=54 > 27
  });
});

describe("useBuilderStore — commitDraftScores grava no Character ativo", () => {
  it("copia cada valor do rascunho para o characterStore", () => {
    const store = useBuilderStore.getState();
    store.setAbilityGenerationMode("manual");
    store.setDraftScore("FOR", 17);
    store.setDraftScore("DEX", 12);
    store.setDraftScore("CON", 16);
    store.setDraftScore("INT", 8);
    store.setDraftScore("SAB", 10);
    store.setDraftScore("CAR", 14);

    store.commitDraftScores();

    const { abilities } = useCharacterStore.getState().character;
    expect(abilities.FOR.score).toBe(17);
    expect(abilities.DEX.score).toBe(12);
    expect(abilities.CON.score).toBe(16);
    expect(abilities.INT.score).toBe(8);
    expect(abilities.SAB.score).toBe(10);
    expect(abilities.CAR.score).toBe(14);
  });

  it("não escreve nada para atributos que ainda não estão no rascunho", () => {
    const store = useBuilderStore.getState();
    store.setDraftScore("FOR", 18);
    store.commitDraftScores();
    expect(useCharacterStore.getState().character.abilities.DEX.score).toBe(10); // valor padrão do personagem em branco
  });
});

describe("useBuilderStore — navegação por etapas (sempre recalculada a partir do Character atual)", () => {
  it("começa na etapa 'basicInfo', primeira da lista", () => {
    expect(useBuilderStore.getState().currentStepId).toBe("basicInfo");
    expect(useBuilderStore.getState().isFirstStep()).toBe(true);
  });

  it("goNext avança para a próxima etapa visível", () => {
    const store = useBuilderStore.getState();
    store.goToStep("background");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("abilities");
  });

  it("goNext não passa da última etapa visível ('review')", () => {
    const store = useBuilderStore.getState();
    store.goToStep("review");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("review");
    expect(useBuilderStore.getState().isLastStep()).toBe(true);
  });

  it("goBack não volta antes da primeira etapa", () => {
    const store = useBuilderStore.getState();
    store.goBack();
    expect(useBuilderStore.getState().currentStepId).toBe("basicInfo");
  });

  it("pula etapas condicionais que desapareceram (ex.: Subclasse ao avançar de 'species' num Bárbaro nível 1)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("barbaro"); // nível 1, sem acesso a Subclasse ainda
    store.goToStep("species");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("background"); // pula "subclass"
  });

  it("Mago nível 3: goNext de 'class' vai para 'subclass' (agora visível)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("mago");
    useCharacterStore.getState().setLevel(3);
    store.goToStep("class");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("subclass");
  });

  it("goToStep salta direto para qualquer etapa (usado pelo botão 'Editar' da Revisão)", () => {
    const store = useBuilderStore.getState();
    store.goToStep("equipment");
    expect(useBuilderStore.getState().currentStepId).toBe("equipment");
  });
});
