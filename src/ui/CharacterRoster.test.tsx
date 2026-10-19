import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useCharacterStore } from "../state/characterStore.js";
import { useBuilderStore } from "../state/builderStore.js";
import { CharacterRoster } from "./CharacterRoster.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  useCharacterStore.setState({ otherCharacters: [] });
  vi.restoreAllMocks();
});

describe("CharacterRoster — Meus personagens", () => {
  it("'Novo personagem' fica desabilitado enquanto o atual ainda está em branco", () => {
    render(<CharacterRoster />);
    expect(screen.getByRole("button", { name: "Novo personagem" })).toBeDisabled();
  });

  it("criar outro personagem e voltar ao anterior pela lista, com o Builder reiniciando na primeira etapa", () => {
    render(<CharacterRoster />);
    act(() => {
      useCharacterStore.getState().setName("Elara");
      useCharacterStore.getState().setClass("mago");
    });
    const elaraId = useCharacterStore.getState().character.id;

    fireEvent.click(screen.getByRole("button", { name: "Novo personagem" }));
    expect(useCharacterStore.getState().character.classId).toBeNull();
    expect(screen.getByRole("option", { name: "Elara — Mago nível 1" })).toBeInTheDocument();

    act(() => useBuilderStore.setState({ currentStepId: "review" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: elaraId } });
    expect(useCharacterStore.getState().character.id).toBe(elaraId);
    expect(useBuilderStore.getState().currentStepId).toBe("basicInfo");
  });

  it("personagem confirmado aparece marcado na lista", () => {
    render(<CharacterRoster />);
    act(() => {
      useCharacterStore.getState().setName("Thorn");
      useCharacterStore.getState().setClass("barbaro");
      useCharacterStore.getState().confirmCharacter();
    });
    expect(screen.getByRole("option", { name: "Thorn — Bárbaro nível 1 · confirmado" })).toBeInTheDocument();
  });

  it("excluir pede confirmação; cancelar não remove nada", () => {
    render(<CharacterRoster />);
    act(() => useCharacterStore.getState().setClass("mago"));
    const id = useCharacterStore.getState().character.id;
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Versões já confirmadas continuam nas estatísticas"));
    expect(useCharacterStore.getState().character.id).toBe(id);

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(useCharacterStore.getState().character.id).not.toBe(id);
  });
});
