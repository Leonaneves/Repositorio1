import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../App.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { useBuilderStore } from "../../state/builderStore.js";
import { useInsightSessionStore } from "../insights/insightSessionStore.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../../data/features/subclasses.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../../data/features/fighter.js";
import {
  RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID,
  RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID,
  RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID,
} from "../../data/features/ranger.js";
import { getClassSkillChoiceId } from "../../data/classes.js";
import { MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID } from "../../data/features/feats.js";
import { getFeatChoiceId } from "../../rules/feats.js";
import { getSkillProficiencyOrigin } from "../../rules/skills.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useInsightSessionStore.getState().resetSession();
  useBuilderStore.setState({ abilityGenerationMode: "standardArray", draftScores: {}, currentStepId: "basicInfo" });
});

function clickAvancar() {
  fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
}

/** Preenche os 6 atributos pelo Array Padrão e confirma — usado para destravar a etapa 'Atributos' nos testes abaixo. */
function fillStandardArrayAbilities() {
  const values: Record<string, string> = { Força: "15", Destreza: "14", Constituição: "13", Inteligência: "12", Sabedoria: "10", Carisma: "8" };
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Confirmar atributos" }));
}

describe("BuilderWizard — canAdvance explica exatamente o que falta (CONSOLIDAÇÃO DO BUILDER §9)", () => {
  it("'Classe' bloqueia Avançar só até uma classe ser escolhida — a escolha de Perícias de Classe não bloqueia mais esta etapa (mora na etapa própria 'Perícias', fonte \"CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA\")", () => {
    render(<App />);
    clickAvancar(); // basicInfo -> class
    expect(screen.getByRole("heading", { name: "Classe" })).toBeInTheDocument();
    expect(screen.getByText("Escolha uma classe para continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: "Classe" }), { target: { value: "guerreiro" } });
    expect(screen.queryByText("Escolha uma classe para continuar.")).not.toBeInTheDocument();
    // Estilo de Luta nível 1 é uma escolha PRÓPRIA de "Classe" (optionPick obrigatório) — resolvida
    // aqui para isolar o que este teste cobre (Perícias de Classe não bloqueia mais esta etapa).
    act(() => useCharacterStore.getState().setFeatureChoiceSelection(FIGHTER_FIGHTING_STYLE_CHOICE_ID, "Defensivo"));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();

    act(() => useBuilderStore.getState().goToStep("skills"));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled(); // Perícias de Classe ainda pendente, agora nesta etapa

    // Escopado à subseção certa — "Atletismo" também existe (sem origem ainda) na grade Homebrew ao final da etapa.
    const classeSubsection1 = screen.getByText("Classe — Perícias de Classe").closest("div")!;
    fireEvent.click(within(classeSubsection1).getByRole("checkbox", { name: "Atletismo" }));
    fireEvent.click(within(classeSubsection1).getByRole("checkbox", { name: "Intimidação" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("perícia redundante entre Classe e Antecedente é detectada independente da ordem de escolha, sem auto-selecionar substituta (§4 — exemplo literal: escolher perícia de Classe e depois um Antecedente que concede a mesma)", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("skills"));
    const classeSubsection = screen.getByText("Classe — Perícias de Classe").closest("div")!;
    fireEvent.click(within(classeSubsection).getByRole("checkbox", { name: "Intuição" }));
    fireEvent.click(within(classeSubsection).getByRole("checkbox", { name: "Atletismo" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();

    act(() => useCharacterStore.getState().setBackground("acolito")); // concede "Intuição" automaticamente, depois da escolha já feita
    expect(
      screen.getByText('Perícia "Intuição" escolhida em "Perícias de Classe" já é concedida por outra origem — escolha outra perícia em "Perícias de Classe".'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    // Nunca escolhe uma substituta sozinho — o checkbox de Intuição continua marcado até o jogador decidir.
    expect(within(classeSubsection).getByRole("checkbox", { name: "Intuição" })).toBeChecked();

    fireEvent.click(within(classeSubsection).getByRole("checkbox", { name: "Intuição" })); // jogador desmarca
    fireEvent.click(within(classeSubsection).getByRole("checkbox", { name: "Percepção" })); // e escolhe outra no lugar
    expect(screen.queryByText(/já é concedida por outra origem/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("'Espécie' e 'Antecedente' bloqueiam Avançar até serem escolhidos", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));

    expect(screen.getByText("Escolha uma espécie para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "humano" } });
    expect(screen.queryByText("Escolha uma espécie para continuar.")).not.toBeInTheDocument();

    // Humano também exige o Talento de Origem (traço Versátil) — fonte "ADICIONAR ESCOLHA DE
    // TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE" §1.
    expect(screen.getByText("Escolha o Talento de Origem do Humano para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Talento de Origem (traço Versátil)" }), { target: { value: "alerta" } });
    expect(screen.queryByText("Escolha o Talento de Origem do Humano para continuar.")).not.toBeInTheDocument();

    clickAvancar(); // species -> background
    expect(screen.getByText("Escolha um antecedente para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Antecedente" }), { target: { value: "acolito" } });
    expect(screen.queryByText("Escolha um antecedente para continuar.")).not.toBeInTheDocument();
  });

  it("'Espécie' com Linhagem (Draconato): bloqueia até a Ancestral Dracônica ser escolhida, sem criar etapa própria na navegação lateral", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));

    const stepsBefore = screen.getAllByRole("listitem").length;
    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "draconato" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(stepsBefore); // nenhum item novo na navegação lateral

    expect(screen.getByText("Escolha a Ancestral Dracônico para continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: "Ancestral Dracônico" }), { target: { value: "draconato-vermelho" } });
    expect(screen.queryByText("Escolha a Ancestral Dracônico para continuar.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
    expect(screen.getByText(/Resistência a dano Fogo/)).toBeInTheDocument();

    // Editável depois de preenchida — trocar o ancestral atualiza o texto, sem travar de novo.
    fireEvent.change(screen.getByRole("combobox", { name: "Ancestral Dracônico" }), { target: { value: "draconato-azul" } });
    expect(screen.getByText(/Resistência a dano Elétrico/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("'Espécie' com Linhagem Élfica exige só a linhagem — o atributo de conjuração é sempre automático, nunca uma escolha manual separada", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));

    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "elfo" } });
    expect(screen.getByText("Escolha a Linhagem Élfica para continuar.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Atributo de Conjuração da Linhagem Élfica" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Linhagem Élfica" }), { target: { value: "elfo-drow" } });
    expect(screen.queryByText("Escolha a Linhagem Élfica para continuar.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
    expect(screen.getByText(/VISÃO NO ESCURO 36m/)).toBeInTheDocument(); // Drow sobrescreve para 36m
  });

  it("'Atributos' bloqueia Avançar enquanto os 6 atributos não forem gerados/confirmados", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("guerreiro");
      useCharacterStore.getState().setSpecies("humano");
      useCharacterStore.getState().setBackground("acolito");
      // Distribui também os Aumentos de Atributo do Antecedente — essa distribuição agora é validada
      // dentro da própria etapa Atributos (§3), não é o foco deste teste (foco é a heurística dos 6 em 10).
      useCharacterStore.getState().increaseBackgroundAbilityBonus("INT");
      useCharacterStore.getState().increaseBackgroundAbilityBonus("INT");
      useCharacterStore.getState().increaseBackgroundAbilityBonus("SAB");
    });
    act(() => useBuilderStore.getState().goToStep("abilities"));

    expect(screen.getByText("Gere e confirme os 6 atributos antes de continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fillStandardArrayAbilities();
    expect(screen.queryByText("Gere e confirme os 6 atributos antes de continuar.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("a seção de Subclasse (dentro de 'Classe', não mais uma etapa própria — §2) bloqueia Avançar até uma subclasse ser escolhida (Mago nível 3)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("mago");
      useCharacterStore.getState().setLevel(3);
      useCharacterStore.getState().setFeatureChoiceSelection(getClassSkillChoiceId("mago"), ["arcanismo", "historia"]);
    });
    act(() => useBuilderStore.getState().goToStep("class"));

    expect(screen.getByText("Escolha uma subclasse para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Evocador" } });
    expect(screen.queryByText("Escolha uma subclasse para continuar.")).not.toBeInTheDocument();
  });
});

describe("BuilderWizard — Talento de Origem do Humano (traço Versátil, fonte \"ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE\")", () => {
  it("a subetapa só aparece para Humano, nunca para outra espécie", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));

    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "elfo" } });
    expect(screen.queryByRole("combobox", { name: "Talento de Origem (traço Versátil)" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "humano" } });
    expect(screen.getByRole("combobox", { name: "Talento de Origem (traço Versátil)" })).toBeInTheDocument();
  });

  it("disponível para escolha ANTES da distribuição de atributos — os 6 continuam no padrão (10) e a escolha funciona normalmente", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));
    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "humano" } });

    const ABILITY_KEYS = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const;
    expect(ABILITY_KEYS.every((key) => useCharacterStore.getState().character.abilities[key].score === 10)).toBe(true);

    fireEvent.change(screen.getByRole("combobox", { name: "Talento de Origem (traço Versátil)" }), { target: { value: "sortudo" } });
    expect(useCharacterStore.getState().character.humanOriginFeatId).toBe("sortudo");
  });

  it("conflito com o Antecedente: aviso aparece nas DUAS etapas (Espécie e Antecedente), com atalho de volta para Espécie — nunca apaga a seleção do Humano silenciosamente", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("guerreiro");
      useCharacterStore.getState().setSpecies("humano");
      useCharacterStore.getState().setHumanOriginFeat("atacante-selvagem");
    });
    act(() => useBuilderStore.getState().goToStep("background"));
    fireEvent.change(screen.getByRole("combobox", { name: "Antecedente" }), { target: { value: "soldado" } }); // também concede Atacante Selvagem

    expect(screen.getByText(/mesmo concedido pelo Antecedente atual e não é repetível/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar em Espécie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();
    // Nunca apaga/substitui silenciosamente — a seleção do Humano continua exatamente a mesma.
    expect(useCharacterStore.getState().character.humanOriginFeatId).toBe("atacante-selvagem");

    fireEvent.click(screen.getByRole("button", { name: "Editar em Espécie" }));
    expect(screen.getByRole("heading", { name: "Espécie", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/mesmo concedido pelo Antecedente atual e não é repetível/)).toBeInTheDocument();

    // Trocar o talento do Humano resolve o conflito, sem tocar no Antecedente.
    fireEvent.change(screen.getByRole("combobox", { name: "Talento de Origem (traço Versátil)" }), { target: { value: "vigoroso" } });
    expect(screen.queryByText(/mesmo concedido pelo Antecedente atual e não é repetível/)).not.toBeInTheDocument();
    expect(useCharacterStore.getState().character.backgroundId).toBe("soldado");
  });

  it("'Características e Talentos': o Talento de Origem do Humano aparece com 'Origem: Humano' e atalho de volta para Espécie — mesmo sem nenhuma escolha interna (Alerta)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("guerreiro");
      useCharacterStore.getState().setSpecies("humano");
      useCharacterStore.getState().setHumanOriginFeat("alerta");
    });
    act(() => useBuilderStore.getState().goToStep("featuresAndTalents"));

    expect(screen.getByText(/Origem: Humano/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alerta", level: 3 })).toBeInTheDocument();
    const editButtons = screen.getAllByRole("button", { name: "Editar em Espécie" });
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole("heading", { name: "Espécie", level: 2 })).toBeInTheDocument();
  });

  it("'Características e Talentos': escolhas internas do talento (ex.: Habilidoso) aparecem normalmente, sem pedir de novo QUAL talento foi escolhido", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("guerreiro");
      useCharacterStore.getState().setSpecies("humano");
      useCharacterStore.getState().setHumanOriginFeat("habilidoso");
    });
    act(() => useBuilderStore.getState().goToStep("featuresAndTalents"));

    expect(screen.getByText(/Origem: Humano/)).toBeInTheDocument();
    expect(screen.getByText(/Habilidoso — escolha 3/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Talento de Origem (traço Versátil)" })).not.toBeInTheDocument();
  });
});

describe("BuilderWizard — Revisão detecta pendências e bloqueia a exportação (§15/§16)", () => {
  it("Bruxo nível 1 sem Invocação escolhida: banner de pendência aparece e Exportar PDF fica desabilitado", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("bruxo");
      useCharacterStore.getState().setLevel(1);
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    const pendingHeading = screen.getByRole("heading", { name: /Escolhas pendentes/ });
    const pendingSection = pendingHeading.closest("section")!;
    expect(within(pendingSection).getByText(/Invocações Místicas/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeDisabled();
  });

  it("clicar em 'Resolver' na pendência de Invocações leva direto para a etapa 'Invocações Místicas'", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("bruxo");
      useCharacterStore.getState().setLevel(1);
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    const pendingSection = screen.getByRole("heading", { name: /Escolhas pendentes/ }).closest("section")!;
    const pendingItem = within(pendingSection).getByText(/Invocações Místicas/).closest("li")!;
    fireEvent.click(within(pendingItem).getByRole("button", { name: "Resolver" }));
    expect(screen.getByRole("heading", { name: "Invocações Místicas", level: 2 })).toBeInTheDocument();
  });

  it("resolver TODAS as pendências (não só Invocações) remove o banner e libera Exportar PDF", () => {
    render(<App />);
    act(() => {
      const store = useCharacterStore.getState();
      store.setClass("bruxo");
      store.setLevel(1);
      store.setSpecies("humano");
      store.setHumanOriginFeat("vigoroso"); // Talento de Origem do Humano (traço Versátil) — sem escolhas internas
      store.setBackground("acolito"); // INT, SAB, CAR
      store.increaseBackgroundAbilityBonus("INT");
      store.increaseBackgroundAbilityBonus("INT");
      store.increaseBackgroundAbilityBonus("SAB");
      store.setAbilityScore("FOR", 10);
      store.setAbilityScore("DEX", 14);
      store.setAbilityScore("CON", 13);
      store.setAbilityScore("INT", 12);
      store.setAbilityScore("SAB", 8);
      store.setAbilityScore("CAR", 15);
      store.addInvocation("mente-mistica");
      store.setStartingEquipmentOption("A");
      store.setFeatureChoiceSelection(getClassSkillChoiceId("bruxo"), ["arcanismo", "enganacao"]);
      // Acólito concede Iniciado em Magia (Clérigo) — a lista vem fixa, mas o atributo de
      // conjuração desta aquisição (optionPick) ainda precisa ser escolhido (fonte "IMPLEMENTAR
      // TALENTOS DE ORIGEM NO BUILDER E NO PDF" §9) para não ficar como pendência.
      store.setFeatureChoiceSelection(getFeatChoiceId(MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID, "background"), "Sabedoria");
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    expect(screen.queryByRole("heading", { name: /Escolhas pendentes/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
  });
});

describe("BuilderWizard — Revisão mostra as escolhas específicas de classe/subclasse (§15)", () => {
  it("Feiticeiro com Metamagia conhecida aparece em 'Escolhas de Classe'", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("feiticeiro");
      useCharacterStore.getState().setLevel(2);
      useCharacterStore.getState().addMetamagicOption("sutil");
      useCharacterStore.getState().addMetamagicOption("distante");
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    expect(screen.getByRole("heading", { name: "Escolhas de Classe" })).toBeInTheDocument();
    expect(screen.getByText("Magia Sutil")).toBeInTheDocument();
    expect(screen.getByText("Magia Distante")).toBeInTheDocument();
  });

  it("Feiticeiro (Feitiçaria Dracônica) com Afinidade Elemental escolhida aparece em 'Escolhas de Subclasse'", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("feiticeiro");
      useCharacterStore.getState().setLevel(6);
      useCharacterStore.getState().setSubclass("Feitiçaria Dracônica");
      useCharacterStore.getState().setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, "Fogo");
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    expect(screen.getByRole("heading", { name: "Escolhas de Subclasse" })).toBeInTheDocument();
    expect(screen.getByText("Fogo")).toBeInTheDocument();
  });

  it("Editar numa linha de 'Escolhas de Subclasse' leva para 'Classe' (a Subclasse não tem etapa própria — destino da tabela do §7: 'Classe, na seção de Subclasse')", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("feiticeiro");
      useCharacterStore.getState().setLevel(6);
      useCharacterStore.getState().setSubclass("Feitiçaria Dracônica");
      useCharacterStore.getState().setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, "Fogo");
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    const affinityHeading = screen.getByRole("heading", { name: /Afinidade Elemental/ });
    fireEvent.click(within(affinityHeading).getByRole("button", { name: /Editar/ }));
    expect(screen.getByRole("heading", { name: "Classe", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Afinidade Elemental", level: 3 })).toBeInTheDocument();
  });

  it("Editar numa linha de 'Escolhas de Classe' volta para a etapa certa", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("feiticeiro");
      useCharacterStore.getState().setLevel(2);
      useCharacterStore.getState().addMetamagicOption("sutil");
      useCharacterStore.getState().addMetamagicOption("distante");
    });
    act(() => useBuilderStore.getState().goToStep("review"));

    const metamagicHeading = screen.getByRole("heading", { name: /Metamagia/ });
    fireEvent.click(within(metamagicHeading).getByRole("button", { name: /Editar/ }));
    expect(screen.getByRole("heading", { name: "Metamagia", level: 2 })).toBeInTheDocument();
  });
});

describe("BuilderWizard — Conjuração mostra truques/magias/magias automáticas e permite preencher manualmente (§12/§13)", () => {
  it("Clérigo (Domínio da Vida) mostra Truques Conhecidos e as magias de domínio concedidas automaticamente", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("clerigo");
      useCharacterStore.getState().setLevel(3);
      useCharacterStore.getState().setSubclass("Domínio da Vida");
    });
    act(() => useBuilderStore.getState().goToStep("spellcasting"));

    expect(screen.getByText("Truques Conhecidos")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Magias Concedidas Automaticamente" })).toBeInTheDocument();
  });

  it("Guerreiro + Tiefling: etapa Conjuração aparece mesmo sem conjuração de classe, mostrando a magia de espécie (fonte \"IMPLEMENTAR LINHAGENS...\" §3)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("guerreiro");
      useCharacterStore.getState().setSpecies("tiefling");
      useCharacterStore.getState().setSpeciesLineage("tiefling-infernal");
    });
    act(() => useBuilderStore.getState().goToStep("spellcasting"));

    expect(screen.getByRole("heading", { name: "Magias Concedidas Automaticamente" })).toBeInTheDocument();
    expect(screen.getByText("Taumaturgia")).toBeInTheDocument();
    expect(screen.getByText("Raio de Fogo")).toBeInTheDocument();
    expect(screen.getByText(/aguardam o catálogo completo/)).toBeInTheDocument();
  });

  it("Bruxo mostra o aviso de Magia de Pacto junto dos espaços de magia", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("bruxo");
      useCharacterStore.getState().setLevel(3);
    });
    act(() => useBuilderStore.getState().goToStep("spellcasting"));

    expect(screen.getByText(/Magia de Pacto/)).toBeInTheDocument();
  });

  it("'Adicionar magia preparada' cria uma linha editável que grava no Character", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("clerigo");
      useCharacterStore.getState().setLevel(1);
    });
    act(() => useBuilderStore.getState().goToStep("spellcasting"));

    fireEvent.click(screen.getByRole("button", { name: "Adicionar magia preparada" }));
    const nameInput = screen.getByPlaceholderText("Nome da magia");
    fireEvent.change(nameInput, { target: { value: "Curar Feridas" } });

    expect(useCharacterStore.getState().character.spellsPrepared[0]?.name).toBe("Curar Feridas");
  });

  it("nunca mostra o controle 'Gastos' de espaços de magia — a criação só mostra o total máximo (§32-37, estado de sessão fora do escopo)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("clerigo");
      useCharacterStore.getState().setLevel(3);
      useCharacterStore.getState().setSubclass("Domínio da Vida");
    });
    act(() => useBuilderStore.getState().goToStep("spellcasting"));

    expect(screen.queryByText("Gastos")).not.toBeInTheDocument();
  });
});

describe("BuilderWizard — Forma Selvagem nunca é escolha de criação (fonte \"AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS\" §2)", () => {
  it("Druida de qualquer nível nunca mostra 'Formas Conhecidas' na navegação lateral, nem trava Avançar por causa dela", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("druida");
      useCharacterStore.getState().setLevel(5);
      useCharacterStore.getState().setSpecies("humano");
      useCharacterStore.getState().setBackground("acolito");
      useCharacterStore.getState().increaseBackgroundAbilityBonus("INT");
      useCharacterStore.getState().increaseBackgroundAbilityBonus("INT");
      useCharacterStore.getState().increaseBackgroundAbilityBonus("SAB");
    });

    expect(screen.queryByRole("button", { name: /Formas Conhecidas/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Forma\(s\) Conhecida\(s\)/)).not.toBeInTheDocument();

    act(() => useBuilderStore.getState().goToStep("review"));
    expect(screen.queryByText(/Formas Conhecidas/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Forma\(s\) Conhecida\(s\)/)).not.toBeInTheDocument();
  });
});

describe("BuilderWizard — etapa 'Perícias' centraliza as escolhas (fonte \"CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA\" — substitui a decisão anterior de nunca ter etapa lateral e editar só pela Revisão)", () => {
  function setupGuerreiroAcolito() {
    act(() => {
      const store = useCharacterStore.getState();
      store.setClass("guerreiro");
      store.setSpecies("humano");
      store.setBackground("acolito"); // concede Intuição/Religião automaticamente
      store.setFeatureChoiceSelection(getClassSkillChoiceId("guerreiro"), ["atletismo", "intimidacao"]);
    });
  }

  function openSkillsStep() {
    const periciasHeading = screen.getByRole("heading", { name: /^Perícias/, level: 3 });
    fireEvent.click(within(periciasHeading).getByRole("button", { name: "Editar perícias" }));
  }

  it("'Perícias' aparece na navegação lateral do Builder, em qualquer momento da criação", () => {
    render(<App />);
    setupGuerreiroAcolito();
    expect(screen.getByRole("button", { name: /Perícias$/ })).toBeInTheDocument();

    act(() => useBuilderStore.getState().goToStep("review"));
    expect(screen.getByRole("button", { name: /Perícias$/ })).toBeInTheDocument();
  });

  it("botão 'Editar' de Perícias na Revisão leva direto à etapa 'Perícias', mostrando as origens automáticas de Antecedente e a escolha já feita em Classe, com a origem claramente identificada", () => {
    render(<App />);
    setupGuerreiroAcolito();
    act(() => useBuilderStore.getState().goToStep("review"));
    openSkillsStep();

    expect(screen.getByRole("heading", { name: "Perícias", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Religião — Antecedente")).toBeInTheDocument(); // perícia concedida pelo Antecedente, origem identificada ao lado
    expect(screen.getByText("Classe — Perícias de Classe")).toBeInTheDocument();
    // A escolha de Classe já feita (Atletismo) é visível e editável na própria etapa, sem precisar voltar à etapa Classe.
    expect(screen.getByRole("checkbox", { name: "Atletismo" })).toBeChecked();
  });

  it("perícia redundante entre Classe e Antecedente aparece como aviso no próprio bloco de origem, sem substituir a escolha automaticamente (mesmo caso do §4 — a escolha fica visível ali para correção, exceção ao filtro de esconder já concedidas)", () => {
    render(<App />);
    act(() => {
      const store = useCharacterStore.getState();
      store.setClass("guerreiro");
      store.setFeatureChoiceSelection(getClassSkillChoiceId("guerreiro"), ["intuicao", "atletismo"]);
      store.setBackground("acolito"); // concede Intuição também, depois da escolha já feita
    });
    act(() => useBuilderStore.getState().goToStep("skills"));

    const classeSubsection = screen.getByText("Classe — Perícias de Classe").closest("div")!;
    expect(within(classeSubsection).getByText(/já concedida\(s\) por outra origem/)).toBeInTheDocument();
    expect(classeSubsection.textContent).toContain("nada é substituído automaticamente");
    // o checkbox de Intuição continua marcado e visível no bloco de origem, para o jogador corrigir manualmente
    expect(within(classeSubsection).getByRole("checkbox", { name: "Intuição" })).toBeChecked();

    // a seleção de Classe continua intocada — nada foi trocado sozinho
    expect(useCharacterStore.getState().character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")]?.value).toEqual([
      "intuicao",
      "atletismo",
    ]);
  });

  it("Homebrew ativado na etapa Perícias marca uma proficiência manual e persiste ao navegar para outra etapa e voltar, sem afetar as proficiências automáticas (etapa permanente, não mais um modal com Cancelar/Salvar)", () => {
    render(<App />);
    setupGuerreiroAcolito();
    act(() => useBuilderStore.getState().goToStep("skills"));

    fireEvent.click(screen.getByRole("button", { name: /Editar perícias manualmente \(Homebrew\)/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Furtividade" })); // sem nenhuma origem automática neste personagem
    // Depois de marcada manualmente, a origem passa a "Manual" e o rótulo da perícia muda de acordo (§10) — por isso o regex abaixo.
    expect(screen.getByRole("checkbox", { name: /^Furtividade/ })).toBeChecked();

    const character = useCharacterStore.getState().character;
    expect(character.skills.furtividade.manualOverride).toBe(true);

    // As proficiências automáticas de Classe/Antecedente nunca são tocadas por essa edição manual — sem duplicar nem perder a origem.
    expect(getSkillProficiencyOrigin(character, "atletismo")).toBe("class");
    expect(character.skills.atletismo.manualOverride).toBeNull();
    expect(getSkillProficiencyOrigin(character, "intuicao")).toBe("background");
    expect(character.skills.intuicao.manualOverride).toBeNull();

    // Navegar para outra etapa e voltar preserva a seleção manual — a etapa não reseta o Homebrew a cada visita.
    act(() => useBuilderStore.getState().goToStep("equipment"));
    act(() => useBuilderStore.getState().goToStep("skills"));
    expect(screen.getByRole("checkbox", { name: /^Furtividade/ })).toBeChecked();

    // A Revisão reflete a perícia recém-habilitada.
    act(() => useBuilderStore.getState().goToStep("review"));
    expect(screen.getByText(/●\s*Furtividade/)).toBeInTheDocument();
  });
});

describe("BuilderWizard — Patrulheiro, escolhas permanentes das subclasses (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §2/§5/§6)", () => {
  function setupRanger(level = 3) {
    act(() => {
      const store = useCharacterStore.getState();
      store.setClass("patrulheiro");
      store.setLevel(level);
      // Resolve escolhas NÃO relacionadas (Perícias de Classe + Estilo de Luta/Combatente
      // Druídico do nível 2 + nome do Estilo de Luta + Especialização de Explorador Hábil do
      // nível 2 + ASI de nível 4) — sem isso, Avançar já ficaria bloqueado por um motivo que
      // nada tem a ver com a subclasse sob teste (ambas as escolhas de Estilo de Luta são
      // optionPick obrigatório, e Explorador Hábil é um skillExpertise).
      store.setFeatureChoiceSelection(getClassSkillChoiceId("patrulheiro"), ["furtividade", "percepcao", "sobrevivencia"]);
      store.setFeatureChoiceSelection(RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, "Estilo de Luta");
      store.setFeatureChoiceSelection(RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID, "Arquearia");
      store.setFeatureChoiceSelection(RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID, ["furtividade"]);
      if (level >= 4) store.setAsiMode(4, "feat");
    });
    act(() => useBuilderStore.getState().goToStep("class"));
  }

  it("Andarilho Feérico: 'Glamour Transcendental' exige escolher Atuação, Enganação ou Persuasão — a escolha mora na etapa 'Perícias', e não bloqueia mais 'Classe' (fonte \"CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA\")", () => {
    render(<App />);
    setupRanger();
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Andarilho Feérico" } });

    expect(screen.getByRole("heading", { name: "Glamour Transcendental" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Atuação" })).not.toBeInTheDocument(); // escolha de perícia saiu desta etapa
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled(); // 'Classe' já não tem mais pendência própria

    act(() => useBuilderStore.getState().goToStep("skills"));
    // Escopado à subseção certa — essas perícias também existem (sem origem ainda) na grade Homebrew ao final da etapa.
    const glamourSubsection = screen.getByText("Subclasse — Glamour Transcendental").closest("div")!;
    expect(within(glamourSubsection).getByRole("checkbox", { name: "Atuação" })).toBeInTheDocument();
    expect(within(glamourSubsection).getByRole("checkbox", { name: "Enganação" })).toBeInTheDocument();
    expect(within(glamourSubsection).getByRole("checkbox", { name: "Persuasão" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.click(within(glamourSubsection).getByRole("checkbox", { name: "Persuasão" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("Caçador: 'Presa do Caçador' e 'Táticas Defensivas' nunca aparecem como escolha do Builder — são só referência, nunca travam Avançar", () => {
    render(<App />);
    setupRanger(7);
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Caçador" } });

    expect(screen.queryByRole("heading", { name: "Presa do Caçador" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Táticas Defensivas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("Senhor das Feras: nenhuma escolha de animal/aparência aparece — subclasse sozinha nunca trava Avançar", () => {
    render(<App />);
    setupRanger();
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Senhor das Feras" } });

    expect(screen.queryByRole("combobox", { name: /fera|animal/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("Vigilante das Sombras: 'Mente de Ferro' só aparece como escolha quando Sabedoria já é proficiente por outra origem", () => {
    render(<App />);
    setupRanger(7);
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Vigilante das Sombras" } });

    expect(screen.queryByRole("heading", { name: "Mente de Ferro" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();

    act(() => useCharacterStore.getState().setSavingThrowProficient("SAB", true));
    expect(screen.getByRole("heading", { name: "Mente de Ferro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: /Mente de Ferro/ }), { target: { value: "Carisma" } });
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });
});

describe("BuilderWizard — Guerreiro, escolhas permanentes das subclasses (fonte \"IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF\" §3/§6)", () => {
  function setupFighter(level = 3) {
    act(() => {
      const store = useCharacterStore.getState();
      store.setClass("guerreiro");
      store.setLevel(level);
      // Resolve escolhas NÃO relacionadas (Perícias de Classe + Estilo de Luta nível 1 +
      // ASI de cada nível já alcançado) — sem isso, Avançar já ficaria bloqueado por um
      // motivo que nada tem a ver com a subclasse sob teste (Estilo de Luta é optionPick
      // obrigatório desde que o catálogo passou a existir).
      store.setFeatureChoiceSelection(getClassSkillChoiceId("guerreiro"), ["atletismo", "percepcao"]);
      store.setFeatureChoiceSelection(FIGHTER_FIGHTING_STYLE_CHOICE_ID, "Defensivo");
      for (const asiLevel of [4, 6, 8, 12, 14, 16]) {
        if (level >= asiLevel) store.setAsiMode(asiLevel, "feat");
      }
    });
    act(() => useBuilderStore.getState().goToStep("class"));
  }

  it("Campeão: 'Estilo de Luta Adicional' bloqueia Avançar até escolher um Estilo de Luta do catálogo, diferente do já escolhido na concessão base", () => {
    render(<App />);
    setupFighter(7);
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Campeão" } });

    expect(screen.getByRole("heading", { name: "Estilo de Luta Adicional" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled(); // falta o Estilo de Luta Adicional

    act(() => {
      useCharacterStore.getState().setFeatureChoiceSelection(FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID, "Duelismo");
    });
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("Mestre de Batalha: exibido com o nome corrigido na lista de subclasses", () => {
    render(<App />);
    setupFighter();
    expect(screen.getByRole("option", { name: "Mestre de Batalha" })).toBeInTheDocument();
  });

  it("Mestre de Batalha: 'Estudioso da Guerra' bloqueia Avançar em 'Classe' até a Ferramenta ser escolhida — a Perícia mora agora na etapa 'Perícias' (fonte \"CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA\"); 'Superioridade em Combate' nunca aparece como escolha — a CD de Manobras é automática, nunca apresentada ao jogador (fonte \"AUTOMATIZAR A CD DAS MANOBRAS DO MESTRE DE BATALHA\")", () => {
    render(<App />);
    setupFighter();
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Mestre da Batalha" } });

    expect(screen.getByRole("heading", { name: "Estudioso da Guerra" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Superioridade em Combate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /CD de Manobras/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "História" })).not.toBeInTheDocument(); // escolha de perícia saiu desta etapa
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled(); // falta a Ferramenta de Estudioso da Guerra

    const estudiosoCard = screen.getByRole("heading", { name: "Estudioso da Guerra" }).closest("article")!;
    fireEvent.click(within(estudiosoCard).getByRole("checkbox", { name: "Ferramentas de Ferreiro" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled(); // 'Classe' já não tem mais pendência própria

    act(() => useBuilderStore.getState().goToStep("skills"));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled(); // falta a Perícia de Estudioso da Guerra
    const estudiosoSkillsSubsection = screen.getByText("Subclasse — Estudioso da Guerra").closest("div")!;
    fireEvent.click(within(estudiosoSkillsSubsection).getByRole("checkbox", { name: "História" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("Mestre de Batalha nível 3: a subetapa 'Manobras' exige exatamente 3 manobras, permite ver a descrição antes de escolher e nunca duplica", () => {
    render(<App />);
    setupFighter();
    act(() => {
      const store = useCharacterStore.getState();
      store.setSubclass("Mestre da Batalha");
      store.setFeatureChoiceSelection("guerreiro-mestre-de-batalha-estudioso-da-guerra-ferramenta-escolha", ["ferramentas-ferreiro"]);
      store.setFeatureChoiceSelection("guerreiro-mestre-de-batalha-estudioso-da-guerra-pericia-escolha", ["historia"]);
    });
    act(() => useBuilderStore.getState().goToStep("maneuvers"));

    expect(screen.getByText("Manobras escolhidas: 0/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.click(screen.getByText("Desarme"));
    expect(screen.getByText(/solta um objeto que esteja segurando/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Desarme" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Finta" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Emboscada" }));

    expect(screen.getByText("Manobras escolhidas: 3/3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Desarme" })).not.toBeInTheDocument(); // já escolhida, não duplica
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();

    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
    expect(screen.getByText("Manobras escolhidas: 2/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();
  });
});
