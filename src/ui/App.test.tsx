import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App.js";
import { useCharacterStore } from "../state/characterStore.js";
import { useBuilderStore } from "../state/builderStore.js";
import { useInsightSessionStore } from "./insights/insightSessionStore.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useInsightSessionStore.getState().resetSession();
  useBuilderStore.setState({ abilityGenerationMode: "standardArray", draftScores: {}, currentStepId: "basicInfo" });
});

function goToSheetTab() {
  fireEvent.click(screen.getByRole("button", { name: "Ficha" }));
}

describe("App — modo padrão é o Builder (decisão aprovada §10: interface primária de criação)", () => {
  it("monta sem erros, mostrando a etapa 1 do Builder por padrão", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Informações Básicas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do personagem")).toBeInTheDocument();
  });

  it("mostra o indicador com as etapas visíveis (personagem em branco: 8 etapas)", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /1\. Informações Básicas/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\. Classe/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Subclasse/ })).not.toBeInTheDocument();
  });

  it("Avançar move para a próxima etapa visível; Voltar retorna", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByRole("heading", { name: "Classe" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Informações Básicas" })).toBeInTheDocument();
  });

  it("clicar numa etapa do indicador salta direto para ela", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /4\. Antecedente/ }));
    expect(screen.getByRole("heading", { name: "Antecedente" })).toBeInTheDocument();
  });

  it("escolher uma classe no Builder atualiza o Character (mesmo store da Ficha)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /2\. Classe/ }));
    const classSelect = screen.getByRole("combobox", { name: "Classe" }) as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: "mago" } });
    expect(useCharacterStore.getState().character.classId).toBe("mago");
  });

  it("Mago no nível 3 passa a mostrar Conjuração no indicador; Subclasse nunca ganha item próprio — aparece como seção dentro de 'Classe' (§2)", () => {
    render(<App />);
    act(() => {
      useCharacterStore.getState().setClass("mago");
      useCharacterStore.getState().setLevel(3);
    });
    expect(screen.queryByRole("button", { name: /Subclasse/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conjuração/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /2\. Classe/ }));
    expect(screen.getByRole("heading", { name: "Subclasse", level: 3 })).toBeInTheDocument();
  });
});

describe("App — aba Ficha (conteúdo que já existia antes do Builder)", () => {
  it("monta sem erros e mostra todos os blocos pedidos", () => {
    render(<App />);
    goToSheetTab();

    expect(screen.getByRole("heading", { name: "Atributos" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do personagem")).toBeInTheDocument();
    expect(screen.getByLabelText("Classe")).toBeInTheDocument();
    expect(screen.getByLabelText("Subclasse")).toBeInTheDocument();
    expect(screen.getByLabelText("Espécie")).toBeInTheDocument();
    expect(screen.getByLabelText("Antecedente")).toBeInTheDocument();
    expect(screen.getByText("Iniciativa")).toBeInTheDocument();
    expect(screen.getByText("Percepção Passiva")).toBeInTheDocument();
    expect(screen.getAllByText("Salvaguarda")).toHaveLength(6); // uma por atributo
    expect(screen.getByText("Atletismo")).toBeInTheDocument(); // perícia de FOR, dentro do mesmo card
    expect(screen.getByRole("heading", { name: "Conjuração" })).toBeInTheDocument();
    expect(screen.getByLabelText("Armadura equipada")).toBeInTheDocument();
  });

  it("nunca mostra undefined/null/NaN em nenhum campo (empty states corretos)", () => {
    const { container } = render(<App />);
    goToSheetTab();
    expect(container.textContent).not.toMatch(/undefined|NaN/);
    // "null" pode aparecer legitimamente dentro de atributos HTML (ex.: value={null} vira ausência),
    // então checamos apenas o texto visível, não o HTML bruto.
    expect(container.textContent?.includes("null")).toBe(false);
  });

  it("Bárbaro (sem conjuração) mostra a seção de Conjuração compacta, não uma área grande vazia", () => {
    useCharacterStore.getState().setClass("barbaro");
    render(<App />);
    goToSheetTab();
    expect(screen.getByText("Este personagem não tem uma fonte de conjuração.")).toBeInTheDocument();
  });

  it("escolher uma classe atualiza a lista de subclasses disponíveis, sem recarregar a página", async () => {
    render(<App />);
    goToSheetTab();
    const classSelect = screen.getByLabelText("Classe") as HTMLSelectElement;

    classSelect.value = "mago";
    classSelect.dispatchEvent(new Event("change", { bubbles: true }));

    const subclassSelect = (await screen.findByLabelText("Subclasse")) as HTMLSelectElement;
    const optionLabels = [...subclassSelect.options].map((o) => o.textContent);
    expect(optionLabels).toContain("Evocador");
    expect(optionLabels).toContain("Abjurador");
  });
});
