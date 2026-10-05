import { beforeEach, describe, expect, it } from "vitest";
import { useBuilderStore } from "./builderStore.js";
import { useCharacterStore } from "./characterStore.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useBuilderStore.setState({ abilityGenerationMode: "standardArray", draftScores: {}, currentStepId: "basicInfo" });
});

/** Preenche os 6 atributos com o Array Padrão — usado para "passar" a etapa 'abilities' em testes que focam outra etapa. */
function setValidAbilities(): void {
  const setAbilityScore = useCharacterStore.getState().setAbilityScore;
  (["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const).forEach((ability, i) => setAbilityScore(ability, [15, 14, 13, 12, 10, 8][i]));
}

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
    useCharacterStore.getState().setBackground("acolito");
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
    useCharacterStore.getState().setSpecies("humano");
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

describe("useBuilderStore — canAdvance/goNext travam em 'featuresAndTalents' com escolha obrigatória pendente (§5/§11)", () => {
  it("canAdvance() é true fora da etapa 'featuresAndTalents', mesmo com escolhas pendentes em outras classes/etapas", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro"); // tem Perícias de Classe pendente
    setValidAbilities();
    store.goToStep("abilities");
    expect(store.canAdvance()).toBe(true);
  });

  it("canAdvance() é false em 'featuresAndTalents' com Perícias de Classe do Guerreiro pendente", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro");
    store.goToStep("featuresAndTalents");
    expect(store.canAdvance()).toBe(false);
  });

  it("goNext não sai de 'featuresAndTalents' enquanto a escolha não for respondida por completo", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro");
    store.goToStep("featuresAndTalents");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("featuresAndTalents"); // não avançou
  });

  it("goNext avança normalmente depois que a escolha de perícias é completada", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro");
    store.goToStep("featuresAndTalents");

    const setFeatureChoiceSelection = useCharacterStore.getState().setFeatureChoiceSelection;
    setFeatureChoiceSelection("classe-guerreiro-pericias", ["atletismo", "intimidacao"]);

    store.goNext();
    expect(useBuilderStore.getState().currentStepId).not.toBe("featuresAndTalents");
  });
});

describe("useBuilderStore — canAdvance/goNext travam em 'invocations' enquanto as Invocações Místicas do Bruxo não estiverem resolvidas", () => {
  it("canAdvance() é false em 'invocations' sem nenhuma invocação escolhida (nível 1 já exige 1)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("bruxo");
    useCharacterStore.getState().setLevel(1);
    store.goToStep("invocations");
    expect(store.canAdvance()).toBe(false);
  });

  it("canAdvance() é true em 'invocations' depois de escolher a quantidade exata do nível", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("bruxo");
    useCharacterStore.getState().setLevel(1);
    useCharacterStore.getState().addInvocation("mente-mistica");
    store.goToStep("invocations");
    expect(store.canAdvance()).toBe(true);
  });

  it("goNext não sai de 'invocations' enquanto a quantidade não bater", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("bruxo");
    useCharacterStore.getState().setLevel(1);
    store.goToStep("invocations");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("invocations");
  });

  it("canAdvance() em 'invocations' também é false quando uma invocação escolhida está em estado inválido (dependência quebrada)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("bruxo");
    useCharacterStore.getState().setLevel(5);
    useCharacterStore.getState().addInvocation("pacto-da-lamina");
    useCharacterStore.getState().addInvocation("lamina-sedenta");
    useCharacterStore.getState().addInvocation("mente-mistica");
    useCharacterStore.getState().addInvocation("visao-diabolica");
    useCharacterStore.getState().addInvocation("vigor-infero"); // 5 invocações no nível 5 — quantidade completa

    store.goToStep("invocations");
    expect(store.canAdvance()).toBe(true);

    useCharacterStore.getState().removeInvocation(0); // remove o Pacto da Lâmina — invalida Lâmina Sedenta
    expect(store.canAdvance()).toBe(false);
  });

  it("canAdvance() é true fora da etapa 'invocations', mesmo com invocações pendentes", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("bruxo");
    useCharacterStore.getState().setLevel(5);
    setValidAbilities();
    store.goToStep("abilities");
    expect(store.canAdvance()).toBe(true);
  });
});

describe("useBuilderStore — canAdvance/goNext travam em 'metamagic' enquanto a quantidade de Metamagia do Feiticeiro não bater com o nível", () => {
  it("canAdvance() é false em 'metamagic' sem nenhuma opção escolhida (nível 2 já exige 2)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(2);
    store.goToStep("metamagic");
    expect(store.canAdvance()).toBe(false);
  });

  it("canAdvance() é true em 'metamagic' depois de escolher a quantidade exata do nível", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(2);
    useCharacterStore.getState().addMetamagicOption("sutil");
    useCharacterStore.getState().addMetamagicOption("distante");
    store.goToStep("metamagic");
    expect(store.canAdvance()).toBe(true);
  });

  it("goNext não sai de 'metamagic' enquanto a quantidade não bater", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(2);
    useCharacterStore.getState().addMetamagicOption("sutil");
    store.goToStep("metamagic");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("metamagic");
  });

  it("canAdvance() é true fora da etapa 'metamagic', mesmo com Metamagia pendente", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(2);
    setValidAbilities();
    store.goToStep("abilities");
    expect(store.canAdvance()).toBe(true);
  });
});

describe("useBuilderStore — canAdvance/goNext travam em 'elementalAffinity' sem o tipo elemental escolhido (Feitiçaria Dracônica)", () => {
  it("canAdvance() é false em 'elementalAffinity' sem escolha", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(6);
    useCharacterStore.getState().setSubclass("Feitiçaria Dracônica");
    store.goToStep("elementalAffinity");
    expect(store.canAdvance()).toBe(false);
  });

  it("canAdvance() é true em 'elementalAffinity' depois de escolher um tipo válido", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(6);
    useCharacterStore.getState().setSubclass("Feitiçaria Dracônica");
    useCharacterStore.getState().setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, "Fogo");
    store.goToStep("elementalAffinity");
    expect(store.canAdvance()).toBe(true);
  });

  it("goNext não sai de 'elementalAffinity' sem escolha", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("feiticeiro");
    useCharacterStore.getState().setLevel(6);
    useCharacterStore.getState().setSubclass("Feitiçaria Dracônica");
    store.goToStep("elementalAffinity");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("elementalAffinity");
  });
});

describe("useBuilderStore — canAdvance/goNext travam em 'equipment' sem pacote de equipamento inicial escolhido (§7/§11)", () => {
  it("canAdvance() é false em 'equipment' quando a classe tem opções e nenhuma foi escolhida", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro");
    store.goToStep("equipment");
    expect(store.canAdvance()).toBe(false);
  });

  it("canAdvance() é true em 'equipment' depois de escolher um pacote", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("guerreiro");
    useCharacterStore.getState().setStartingEquipmentOption("B");
    store.goToStep("equipment");
    expect(store.canAdvance()).toBe(true);
  });

  it("canAdvance() é true em 'equipment' quando não há classe escolhida — nunca trava por falta de dado", () => {
    const store = useBuilderStore.getState();
    store.goToStep("equipment");
    expect(store.canAdvance()).toBe(true);
  });

  it("Artífice: canAdvance() em 'equipment' segue o mesmo gating (falso sem pacote, true após escolher)", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("artifice");
    store.goToStep("equipment");
    expect(store.canAdvance()).toBe(false);
    useCharacterStore.getState().setStartingEquipmentOption("padrao");
    expect(store.canAdvance()).toBe(true);
  });

  it("goNext não sai de 'equipment' sem pacote escolhido, e avança depois de escolher", () => {
    const store = useBuilderStore.getState();
    useCharacterStore.getState().setClass("mago");
    store.goToStep("equipment");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).toBe("equipment");

    useCharacterStore.getState().setStartingEquipmentOption("A");
    store.goNext();
    expect(useBuilderStore.getState().currentStepId).not.toBe("equipment");
  });
});
