import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";
import { useCharacterStore } from "../state/characterStore.js";
import { useInsightSessionStore } from "./insights/insightSessionStore.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useInsightSessionStore.getState().resetSession();
});

describe("App — fumaça (critério de conclusão §23: abrir o site e criar um personagem)", () => {
  it("monta sem erros e mostra todos os blocos pedidos", () => {
    render(<App />);

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
    expect(container.textContent).not.toMatch(/undefined|NaN/);
    // "null" pode aparecer legitimamente dentro de atributos HTML (ex.: value={null} vira ausência),
    // então checamos apenas o texto visível, não o HTML bruto.
    expect(container.textContent?.includes("null")).toBe(false);
  });

  it("Bárbaro (sem conjuração) mostra a seção de Conjuração compacta, não uma área grande vazia", () => {
    useCharacterStore.getState().setClass("barbaro");
    render(<App />);
    expect(screen.getByText("Este personagem não tem uma fonte de conjuração.")).toBeInTheDocument();
  });

  it("escolher uma classe atualiza a lista de subclasses disponíveis, sem recarregar a página", async () => {
    render(<App />);
    const classSelect = screen.getByLabelText("Classe") as HTMLSelectElement;

    classSelect.value = "mago";
    classSelect.dispatchEvent(new Event("change", { bubbles: true }));

    const subclassSelect = (await screen.findByLabelText("Subclasse")) as HTMLSelectElement;
    const optionLabels = [...subclassSelect.options].map((o) => o.textContent);
    expect(optionLabels).toContain("Evocador");
    expect(optionLabels).toContain("Abjurador");
  });
});
