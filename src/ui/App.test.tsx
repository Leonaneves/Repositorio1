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

    expect(screen.getByRole("heading", { name: /Ficha de Personagem/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Identificação" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Atributos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Perícias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Salvaguardas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Iniciativa/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Armadura / CA" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conjuração" })).toBeInTheDocument();
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
