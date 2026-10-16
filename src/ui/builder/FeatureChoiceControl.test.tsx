import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { FeatureChoice } from "../../domain/features.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { FeatureChoiceControl } from "./FeatureChoiceControl.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
});

const HABILIDOSO_CHOICE: FeatureChoice = {
  id: "habilidoso-escolha-asi-4",
  prompt: "Habilidoso — escolha 3",
  effect: { kind: "skillOrToolProficiency", toolCategory: ["artisanTool", "musicalInstrument", "thievesTools"], count: 3 },
};

/**
 * Testes do controle combinado de `skillOrToolProficiency` (Habilidoso —
 * fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF" §8): uma
 * ÚNICA lista de opções mistura perícias e ferramentas/instrumentos,
 * compartilhando um único limite — nunca dois controles (um de
 * `skillProficiency`, outro de `toolProficiency`) com contagens
 * independentes.
 */
describe("FeatureChoiceControl — skillOrToolProficiency (Habilidoso)", () => {
  it("mostra perícias e ferramentas na mesma lista, com a contagem combinada", () => {
    render(<FeatureChoiceControl choice={HABILIDOSO_CHOICE} />);
    expect(screen.getByText("Habilidoso — escolha 3 (0/3)")).toBeInTheDocument();
    expect(screen.getByText("Atletismo")).toBeInTheDocument();
    expect(screen.getByText("Alaúde")).toBeInTheDocument();
  });

  it("marcar 2 perícias e 1 ferramenta completa a contagem de 3 (nunca exige 3 de cada)", () => {
    render(<FeatureChoiceControl choice={HABILIDOSO_CHOICE} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Atletismo" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Furtividade" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Alaúde" }));

    const selection = useCharacterStore.getState().character.featureChoiceSelections["habilidoso-escolha-asi-4"];
    expect(selection?.value).toEqual(["atletismo", "furtividade", "alaude"]);
  });

  it("ao atingir o limite de 3, as demais opções (perícia e ferramenta) ficam desabilitadas", () => {
    render(<FeatureChoiceControl choice={HABILIDOSO_CHOICE} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Atletismo" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Furtividade" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Alaúde" }));

    expect(screen.getByRole("checkbox", { name: "Acrobacia" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Flauta" })).toBeDisabled();
    // As já marcadas continuam habilitadas, para poderem ser desmarcadas.
    expect(screen.getByRole("checkbox", { name: "Atletismo" })).toBeEnabled();
  });

  it("esconde perícias já proficientes por outra origem (como as demais escolhas de perícia)", () => {
    useCharacterStore.getState().setBackground("soldado"); // concede Atletismo
    render(<FeatureChoiceControl choice={HABILIDOSO_CHOICE} />);
    expect(screen.queryByText("Atletismo")).not.toBeInTheDocument();
  });
});
