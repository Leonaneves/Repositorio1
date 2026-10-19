import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createBlankCharacter, type Character } from "../domain/character.js";
import { HUMANO_HABIL_CHOICE_ID, speciesFeatures } from "../data/features/species.js";
import { tools } from "../data/tools.js";
import { getSkillChoiceFeatures, isFeatureChoiceComplete, isSkillKindChoice } from "./features.js";
import { getSkillProficiency, getSkillProficiencyOrigin } from "./skills.js";
import { getKnownTools } from "./tools.js";
import { getSpeciesToolProficiencyEntries } from "./proficiencyText.js";
import { getStepBlockers } from "./builderProgress.js";
import { getRedundantSkillChoiceSelections } from "./skillChoiceConflicts.js";
import { pdfTextFields } from "../pdf/fieldMap.js";
import { useCharacterStore } from "../state/characterStore.js";
import { StepSkills } from "../ui/builder/steps/StepSkills.js";

/** "Hábil" do Humano: proficiência em 1 perícia OU 1 ferramenta/instrumento, entre todas as existentes. */

function human(overrides: (character: Character) => void = () => {}): Character {
  const character = createBlankCharacter("humano-habil");
  character.classId = "guerreiro";
  character.speciesId = "humano";
  overrides(character);
  return character;
}

const proficiencyTools = (character: Character) => pdfTextFields.find((field) => field.pdfField === "PROF.ferramentas")!.getValue(character) as string;

describe("Hábil — dados", () => {
  it("o Humano tem UMA escolha de 1 perícia ou ferramenta, com todas as ferramentas/instrumentos", () => {
    const feature = speciesFeatures.find((candidate) => candidate.speciesId === "humano")!;
    expect(feature.autoGranted).toBe(false);
    expect(feature.choices).toHaveLength(1);
    const choice = feature.choices![0];
    expect(choice.id).toBe(HUMANO_HABIL_CHOICE_ID);
    expect(choice.effect).toMatchObject({ kind: "skillOrToolProficiency", count: 1 });
    expect(isSkillKindChoice(choice)).toBe(true);
    const categories = (choice.effect as { toolCategory: string[] }).toolCategory;
    expect(tools.every((tool) => categories.includes(tool.category))).toBe(true);
  });

  it("aparece na etapa Perícias só para o Humano", () => {
    expect(getSkillChoiceFeatures(human()).some((feature) => feature.choices?.some((choice) => choice.id === HUMANO_HABIL_CHOICE_ID))).toBe(true);
    const elf = human((c) => (c.speciesId = "elfo"));
    expect(getSkillChoiceFeatures(elf).some((feature) => feature.choices?.some((choice) => choice.id === HUMANO_HABIL_CHOICE_ID))).toBe(false);
  });
});

describe("Hábil — efeitos", () => {
  it("perícia escolhida vira proficiência de origem Espécie (só enquanto for Humano)", () => {
    const character = human((c) => (c.featureChoiceSelections[HUMANO_HABIL_CHOICE_ID] = { value: ["furtividade"] }));
    expect(getSkillProficiency(character, "furtividade")).toBe(true);
    expect(getSkillProficiencyOrigin(character, "furtividade")).toBe("species");
    expect(getKnownTools(character)).toEqual([]);
    expect(getSpeciesToolProficiencyEntries(character)).toEqual([]);

    character.speciesId = "anao";
    expect(getSkillProficiency(character, "furtividade")).toBe(false);
  });

  it("ferramenta escolhida entra nas ferramentas conhecidas e no PDF (PROF.ferramentas)", () => {
    const character = human((c) => (c.featureChoiceSelections[HUMANO_HABIL_CHOICE_ID] = { value: ["suprimentos-alquimista"] }));
    expect(getKnownTools(character)).toContain("suprimentos-alquimista");
    expect(proficiencyTools(character)).toContain("Hábil: Suprimentos de Alquimista");

    character.speciesId = "anao";
    expect(getKnownTools(character)).not.toContain("suprimentos-alquimista");
    expect(proficiencyTools(character)).not.toContain("Hábil");
  });

  it("a etapa Perícias fica bloqueada até a escolha ser feita", () => {
    const pending = human((c) => (c.featureChoiceSelections["classe-guerreiro-pericias"] = { value: ["atletismo", "percepcao"] }));
    expect(getStepBlockers("skills", pending).join(" ")).toMatch(/Hábil|Humano/);
    pending.featureChoiceSelections[HUMANO_HABIL_CHOICE_ID] = { value: ["furtividade"] };
    expect(getStepBlockers("skills", pending)).toEqual([]);
  });

  it("escolha de perícia OU ferramenta só fica completa com a quantidade exata (vale também para o talento Habilidoso)", () => {
    const choice = { id: "teste-combinada", prompt: "", effect: { kind: "skillOrToolProficiency" as const, toolCategory: "artisanTool" as const, count: 3 } };
    const character = human((c) => (c.featureChoiceSelections["teste-combinada"] = { value: ["furtividade", "alaude"] }));
    expect(isFeatureChoiceComplete(choice, character)).toBe(false);
    character.featureChoiceSelections["teste-combinada"] = { value: ["furtividade", "alaude", "suprimentos-alquimista"] };
    expect(isFeatureChoiceComplete(choice, character)).toBe(true);
  });

  it("perícia que depois passa a vir de outra origem é sinalizada, nunca trocada sozinha", () => {
    const character = human((c) => (c.featureChoiceSelections[HUMANO_HABIL_CHOICE_ID] = { value: ["atletismo"] }));
    character.backgroundId = "soldado"; // concede Atletismo
    expect(getRedundantSkillChoiceSelections(character)).toContainEqual(expect.objectContaining({ choiceId: HUMANO_HABIL_CHOICE_ID, skill: "atletismo" }));
  });
});

describe("Hábil — etapa Perícias", () => {
  beforeEach(() => useCharacterStore.getState().resetCharacter());

  it("lista perícias e ferramentas, sem as que o personagem já tem, e grava a escolha", () => {
    useCharacterStore.setState({ character: human((c) => (c.backgroundId = "soldado")) });
    render(<StepSkills />);
    const block = screen.getByText(/Hábil — escolha 1 perícia ou ferramenta/).closest("fieldset")!;
    expect(within(block).queryByRole("checkbox", { name: "Atletismo" })).toBeNull(); // já vem do Antecedente
    expect(within(block).getByRole("checkbox", { name: "Furtividade" })).toBeInTheDocument();
    expect(within(block).getByRole("checkbox", { name: "Suprimentos de Alquimista" })).toBeInTheDocument();

    fireEvent.click(within(block).getByRole("checkbox", { name: "Suprimentos de Alquimista" }));
    expect(useCharacterStore.getState().character.featureChoiceSelections[HUMANO_HABIL_CHOICE_ID]?.value).toEqual(["suprimentos-alquimista"]);
    // Limite de 1: o resto fica desabilitado.
    expect(within(block).getByRole("checkbox", { name: "Furtividade" })).toBeDisabled();
  });
});
