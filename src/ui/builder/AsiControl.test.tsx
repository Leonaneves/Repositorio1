import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AsiControl } from "./AsiControl.js";
import { useCharacterStore } from "../../state/characterStore.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
});

/**
 * Testes do seletor de Talento dentro de `AsiControl` (fonte
 * "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF") — a DECISÃO
 * "Aumentar Atributos" vs "Talento" já era coberta por
 * `state/characterStore.test.ts`; este arquivo cobre só a parte nova:
 * escolher QUAL talento, com `getAvailableFeatsForAsiLevel` filtrando
 * as opções.
 */
describe("AsiControl — seletor de Talento", () => {
  it("em modo 'Aumentar Atributos', nunca mostra o seletor de Talento", () => {
    useCharacterStore.getState().setClass("mago");
    useCharacterStore.getState().setAsiMode(4, "abilityIncrease");
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    expect(screen.queryByText("Talento")).not.toBeInTheDocument();
  });

  it("em modo 'Talento', mostra as opções do catálogo sem pré-requisito pendente (10 de Origem + 12 Gerais sem pré-requisito extra + 3 de Conjuração)", () => {
    useCharacterStore.getState().setClass("mago");
    useCharacterStore.getState().setAsiMode(4, "feat");
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    expect(screen.getByRole("option", { name: "Alerta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Vigoroso" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Resiliente" })).toBeInTheDocument();
    // Atributos padrão (10) e sem proficiência de armadura: os 14 Talentos Gerais com
    // pré-requisito de atributo 13+/treinamento de armadura nunca aparecem aqui.
    expect(screen.queryByRole("option", { name: "Sentinela" })).not.toBeInTheDocument();
    // O Mago tem Conjuração: Adepto Elemental, Atirador de Magias e Conjurador de Guerra aparecem.
    expect(screen.getByRole("option", { name: "Conjurador de Guerra" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(26); // "- Selecione -" + 25 talentos sem pré-requisito pendente
  });

  it("escolher um talento grava o featId no nível de ASI certo", () => {
    useCharacterStore.getState().setClass("mago");
    useCharacterStore.getState().setAsiMode(4, "feat");
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "alerta" } });
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "feat", featId: "alerta" });
  });

  it("exclui um talento não-repetível já escolhido em outro nível de ASI", () => {
    useCharacterStore.getState().setClass("guerreiro");
    useCharacterStore.getState().setLevel(6);
    useCharacterStore.getState().setAsiMode(4, "feat");
    useCharacterStore.getState().setAsiFeat(4, "vigoroso");
    useCharacterStore.getState().setAsiMode(6, "feat");
    render(<AsiControl level={6} showUnavailableFeats={false} />);
    expect(screen.queryByRole("option", { name: "Vigoroso" })).not.toBeInTheDocument();
  });

  it("nunca exclui Habilidoso (repetível) mesmo já escolhido em outro nível", () => {
    useCharacterStore.getState().setClass("guerreiro");
    useCharacterStore.getState().setLevel(6);
    useCharacterStore.getState().setAsiMode(4, "feat");
    useCharacterStore.getState().setAsiFeat(4, "habilidoso");
    useCharacterStore.getState().setAsiMode(6, "feat");
    render(<AsiControl level={6} showUnavailableFeats={false} />);
    expect(screen.getByRole("option", { name: "Habilidoso" })).toBeInTheDocument();
  });
});
