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

const ABILITY_SCORE_INCREASE_CHOICE: FeatureChoice = {
  id: "resistente-atributo-asi-4",
  prompt: "Resistente — aumente em 1 (máx. 20): Constituição",
  effect: { kind: "abilityScoreIncrease", options: ["CON"] },
};

/**
 * Testes do controle de `abilityScoreIncrease` (26 Talentos Gerais, fonte
 * "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §1) — um `<select>`
 * simples entre as opções elegíveis, gravando o código do atributo
 * (`AbilityKey`) na seleção.
 */
describe("FeatureChoiceControl — abilityScoreIncrease", () => {
  it("mostra as opções elegíveis com o nome por extenso", () => {
    render(<FeatureChoiceControl choice={ABILITY_SCORE_INCREASE_CHOICE} />);
    expect(screen.getByRole("option", { name: "Constituição" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2); // "- Selecione -" + Constituição
  });

  it("escolher uma opção grava o código do atributo na seleção", () => {
    render(<FeatureChoiceControl choice={ABILITY_SCORE_INCREASE_CHOICE} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "CON" } });
    const selection = useCharacterStore.getState().character.featureChoiceSelections["resistente-atributo-asi-4"];
    expect(selection?.value).toBe("CON");
  });
});

const SKILL_PROFICIENCY_OR_EXPERTISE_CHOICE: FeatureChoice = {
  id: "mente-agucada-pericia-asi-4",
  prompt: "Mente Aguçada — Arcanismo/História/Investigação/Natureza/Religião",
  effect: { kind: "skillProficiencyOrExpertise", options: ["arcanismo", "historia", "investigacao", "natureza", "religiao"] },
};

/**
 * Testes do controle de `skillProficiencyOrExpertise` (Mente Aguçada,
 * fonte §9) — um `<select>` entre as 5 perícias fixas, com um rótulo que
 * indica se a escolha concederia Proficiência ou Especialização no
 * estado ATUAL do personagem (nunca decide aqui — a regra em si vive em
 * `rules/skills.ts`).
 */
describe("FeatureChoiceControl — skillProficiencyOrExpertise (Mente Aguçada)", () => {
  it("mostra as 5 perícias fixas, rotuladas como 'concede Proficiência' quando ainda não proficiente", () => {
    render(<FeatureChoiceControl choice={SKILL_PROFICIENCY_OR_EXPERTISE_CHOICE} />);
    expect(screen.getByRole("option", { name: "Arcanismo (concede Proficiência)" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(6); // "- Selecione -" + 5 perícias
  });

  it("rotula como 'vira Especialização' quando a perícia já é proficiente por outra origem", () => {
    useCharacterStore.getState().setBackground("sabio"); // concede História
    render(<FeatureChoiceControl choice={SKILL_PROFICIENCY_OR_EXPERTISE_CHOICE} />);
    expect(screen.getByRole("option", { name: "História (vira Especialização)" })).toBeInTheDocument();
  });

  it("escolher uma opção grava a chave da perícia na seleção", () => {
    render(<FeatureChoiceControl choice={SKILL_PROFICIENCY_OR_EXPERTISE_CHOICE} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "arcanismo" } });
    const selection = useCharacterStore.getState().character.featureChoiceSelections["mente-agucada-pericia-asi-4"];
    expect(selection?.value).toBe("arcanismo");
  });
});
