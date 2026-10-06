import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../App.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { useBuilderStore } from "../../state/builderStore.js";
import { useInsightSessionStore } from "../insights/insightSessionStore.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../../data/features/subclasses.js";
import { getClassSkillChoiceId } from "../../data/classes.js";

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
  it("'Classe' bloqueia Avançar e mostra o motivo até uma classe ser escolhida e suas escolhas (Perícias de Classe) resolvidas", () => {
    render(<App />);
    clickAvancar(); // basicInfo -> class
    expect(screen.getByRole("heading", { name: "Classe" })).toBeInTheDocument();
    expect(screen.getByText("Escolha uma classe para continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: "Classe" }), { target: { value: "guerreiro" } });
    expect(screen.queryByText("Escolha uma classe para continuar.")).not.toBeInTheDocument();
    // Guerreiro ainda tem "Perícias de Classe" pendente — a escolha mora agora na própria etapa Classe (§1/§2).
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Atletismo" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Intimidação" }));
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("'Espécie' e 'Antecedente' bloqueiam Avançar até serem escolhidos", () => {
    render(<App />);
    act(() => useCharacterStore.getState().setClass("guerreiro"));
    act(() => useBuilderStore.getState().goToStep("species"));

    expect(screen.getByText("Escolha uma espécie para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Espécie" }), { target: { value: "humano" } });
    expect(screen.queryByText("Escolha uma espécie para continuar.")).not.toBeInTheDocument();

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
    });
    act(() => useBuilderStore.getState().goToStep("abilities"));

    expect(screen.getByText("Gere e confirme os 6 atributos antes de continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeDisabled();

    fillStandardArrayAbilities();
    expect(screen.queryByText("Gere e confirme os 6 atributos antes de continuar.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeEnabled();
  });

  it("'Subclasse' bloqueia Avançar até uma subclasse ser escolhida (Mago nível 3)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("mago");
      useCharacterStore.getState().setLevel(3);
    });
    act(() => useBuilderStore.getState().goToStep("subclass"));

    expect(screen.getByText("Escolha uma subclasse para continuar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Subclasse" }), { target: { value: "Evocador" } });
    expect(screen.queryByText("Escolha uma subclasse para continuar.")).not.toBeInTheDocument();
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
