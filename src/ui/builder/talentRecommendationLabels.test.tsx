import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AbilityKey } from "../../domain/common.js";
import { createBlankCharacter, type Character } from "../../domain/character.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../../data/features/fighter.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID } from "../../data/features/ranger.js";
import { getTalentChoiceStatsRepository, InMemoryBuildStore } from "../../repositories/index.js";
import { clearTalentRecommendationCache } from "../../recommendations/talentRecommendationEngine.js";
import { referenceDatasetsToFacts } from "../../references/referenceFacts.js";
import type { ReferenceFile, ReferenceFileCharacter } from "../../references/referenceFormat.js";
import { testAbilities, testAcquisition, testCharacter, testFighterAsi4, testReferenceFile, testUserBuild } from "../../references/testFixtures.js";
import { validateReferenceFile } from "../../references/validateReferenceFile.js";
import { getTalentOpportunityFeatures } from "../../rules/features.js";
import { pdfTextFields } from "../../pdf/fieldMap.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { AsiControl } from "./AsiControl.js";
import { FeatureChoiceControl } from "./FeatureChoiceControl.js";
import { Step4Species } from "./steps/Step4Species.js";

/**
 * Rótulo "(Recomendado)" nos seletores existentes (fonte "IMPLEMENTAR
 * RECOMENDAÇÕES DE TALENTOS" §1/§2/§5/§7) — sempre com referências
 * FICTÍCIAS de teste (`references/testFixtures.ts`) carregadas só no
 * repositório em memória deste processo de teste.
 */

const repository = getTalentChoiceStatsRepository() as InMemoryBuildStore;

function loadReferences(files: ReferenceFile[]): void {
  repository.setReferenceFacts(
    referenceDatasetsToFacts(
      files.map((file) => {
        const result = validateReferenceFile(file);
        if (!result.ok || !result.dataset) throw new Error(JSON.stringify(result.issues, null, 2));
        return result.dataset;
      }),
    ),
  );
}

function setCharacter(character: Character): void {
  useCharacterStore.setState({ character });
}

function updateCharacter(update: (character: Character) => Character): void {
  setCharacter(update(useCharacterStore.getState().character));
}

/** Guerreiro Campeão nível 4, atributos gerados (FOR maior, DEX 12) e Antecedente distribuído, com o ASI 4 em modo Talento ainda vazio. */
function fighterAtAsi4(): Character {
  const character = createBlankCharacter("ui-reco-test");
  character.classId = "guerreiro";
  character.subclassId = "Campeão";
  character.level = 4;
  character.backgroundId = "soldado";
  character.backgroundAbilityBonuses = { FOR: 2, CON: 1 };
  const scores: Record<AbilityKey, number> = { FOR: 15, DEX: 12, CON: 14, INT: 8, SAB: 10, CAR: 8 };
  for (const ability of Object.keys(scores) as AbilityKey[]) character.abilities[ability] = { ...character.abilities[ability], score: scores[ability] };
  character.asiSelections = { 4: { kind: "feat", featId: null } };
  return character;
}

const FOR_HIGH = testAbilities({ FOR: 16, DEX: 14 });
const DEX_HIGH = testAbilities({ DEX: 18, FOR: 14 });

/** Guerreiros Campeões fictícios: com FOR maior, Mestre-Atirador é o mais escolhido (mas é inelegível para o personagem de teste, DEX 12). */
function asiReferences(): ReferenceFile[] {
  const a: ReferenceFileCharacter[] = [
    testFighterAsi4("a1", "sentinela", FOR_HIGH),
    testFighterAsi4("a2", "sentinela", FOR_HIGH),
    testFighterAsi4("a3", "mestre-atirador", FOR_HIGH),
    testFighterAsi4("a4", "mestre-atirador", FOR_HIGH),
    testFighterAsi4("a5", "mestre-atirador", FOR_HIGH),
    testFighterAsi4("d1", "velocista", DEX_HIGH),
  ];
  const b: ReferenceFileCharacter[] = [
    testFighterAsi4("b1", "resistente", FOR_HIGH),
    testFighterAsi4("b2", "alerta", FOR_HIGH),
    testFighterAsi4("b3", "vigoroso", FOR_HIGH),
    testFighterAsi4("b4", "mestre-atirador", FOR_HIGH),
    testFighterAsi4("d2", "velocista", DEX_HIGH),
    testFighterAsi4("d3", "imobilizador", DEX_HIGH),
  ];
  return [testReferenceFile("ui-a", { independenceGroup: "ui-a", characters: a }), testReferenceFile("ui-b", { independenceGroup: "ui-b", characters: b })];
}

function recommendedOptions(): string[] {
  return screen
    .queryAllByRole("option")
    .map((option) => option.textContent ?? "")
    .filter((text) => text.includes("(Recomendado)"));
}

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  clearTalentRecommendationCache();
  repository.setReferenceFacts([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  repository.clear();
});

describe("AsiControl — Talento Geral", () => {
  it("marca no máximo 3 opções, só elegíveis, só com o sufixo — e nunca seleciona sozinho", async () => {
    loadReferences(asiReferences());
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);

    expect(await screen.findByRole("option", { name: "Sentinela (Recomendado)" })).toBeInTheDocument();
    // Mestre-Atirador (o mais escolhido) é inelegível com DEX 12 → nunca recomendado.
    // Sentinela (2 personagens) + empate de 1 entre Alerta/Vigoroso/Resistente → ordem do seletor (catálogo).
    // As opções continuam na ordem original do seletor (nunca reordenadas).
    expect(recommendedOptions()).toEqual(["Alerta (Recomendado)", "Vigoroso (Recomendado)", "Sentinela (Recomendado)"]);
    // Referências nunca aparecem como escolha de jogadores; o motivo segue a ordem do ranking.
    const reasons = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(reasons.map((text) => text.split(":")[0])).toEqual(["Sentinela", "Alerta", "Vigoroso"]);
    expect(reasons.every((text) => text.includes("guerreiros de referência (guias e fontes externas)"))).toBe(true);
    expect(screen.getByRole("option", { name: "Resistente" })).toBeInTheDocument();
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "feat", featId: null });
  });

  it("com 'Mostrar talentos indisponíveis', o inelegível aparece desabilitado e sem rótulo", async () => {
    loadReferences(asiReferences());
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={true} />);
    await screen.findByRole("option", { name: "Sentinela (Recomendado)" });
    const sharpshooter = screen.getAllByRole("option").find((option) => option.textContent?.startsWith("Mestre-Atirador"))!;
    expect(sharpshooter).toBeDisabled();
    expect(sharpshooter.textContent).not.toContain("Recomendado");
  });

  it("escolher a opção recomendada grava só o id do talento; o PDF nunca mostra o rótulo", async () => {
    loadReferences(asiReferences());
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await screen.findByRole("option", { name: "Sentinela (Recomendado)" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sentinela" } });

    const character = useCharacterStore.getState().character;
    expect(character.asiSelections[4]).toEqual({ kind: "feat", featId: "sentinela" });
    for (const field of pdfTextFields) expect(field.getValue(character)).not.toContain("Recomendado");
    expect(pdfTextFields.find((field) => field.pdfField === "Talentos")!.getValue(character)).toContain("Sentinela");
  });

  it("mudança de contexto (maior atributo antes da escolha) atualiza as recomendações", async () => {
    loadReferences(asiReferences());
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await screen.findByRole("option", { name: "Sentinela (Recomendado)" });

    updateCharacter((character) => ({ ...character, abilities: { ...character.abilities, DEX: { ...character.abilities.DEX, score: 18 } } }));
    expect(await screen.findByRole("option", { name: "Velocista (Recomendado)" })).toBeInTheDocument();
    expect(recommendedOptions()).toEqual(["Imobilizador (Recomendado)", "Velocista (Recomendado)"]);
    expect(screen.getByRole("option", { name: "Sentinela" })).toBeInTheDocument();
  });

  it("sem dados: seleção normal, sem nenhum rótulo", async () => {
    const spy = vi.spyOn(repository, "getTalentChoiceCounts");
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedOptions()).toEqual([]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "alerta" } });
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "feat", featId: "alerta" });
  });

  it("amostra insuficiente (1 fonte só): nenhum rótulo", async () => {
    loadReferences([asiReferences()[0]]);
    const spy = vi.spyOn(repository, "getTalentChoiceCounts");
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedOptions()).toEqual([]);
  });

  it("falha de conexão: seleção continua funcionando, sem rótulo e sem erro", async () => {
    loadReferences(asiReferences());
    const spy = vi.spyOn(repository, "getTalentChoiceCounts").mockRejectedValue(new Error("Failed to fetch"));
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await expect(spy.mock.results[0].value).rejects.toThrow();
    expect(recommendedOptions()).toEqual([]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sentinela" } });
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "feat", featId: "sentinela" });
  });
});

describe("FeatureChoiceControl — Estilo de Luta", () => {
  function fighterLevel1(): Character {
    const character = createBlankCharacter("ui-reco-test");
    character.classId = "guerreiro";
    character.level = 1;
    return character;
  }

  function styleReferences(): ReferenceFile[] {
    const style = (key: string, talentId: string) => testCharacter(key, { classId: "guerreiro", level: 1, acquisitions: [testAcquisition("fightingStyle", 1, talentId)] });
    return [
      testReferenceFile("estilo-a", { independenceGroup: "estilo-a", characters: [style("a1", "arquearia"), style("a2", "arquearia")] }),
      testReferenceFile("estilo-b", { independenceGroup: "estilo-b", characters: [style("b1", "defensivo")] }),
    ];
  }

  it("marca os Estilos de Luta recomendados; o valor gravado continua sendo o nome da opção", async () => {
    loadReferences(styleReferences());
    setCharacter(fighterLevel1());
    const choice = getTalentOpportunityFeatures(fighterLevel1())
      .flatMap((feature) => feature.choices ?? [])
      .find((candidate) => candidate.id === FIGHTER_FIGHTING_STYLE_CHOICE_ID)!;
    render(<FeatureChoiceControl choice={choice} />);

    expect(await screen.findByRole("option", { name: "Arquearia (Recomendado)" })).toBeInTheDocument();
    expect(recommendedOptions()).toEqual(["Arquearia (Recomendado)", "Defensivo (Recomendado)"]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Arquearia" } });
    expect(useCharacterStore.getState().character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID]).toEqual({ value: "Arquearia" });
  });

  it("escolha que não é de talento (ramo do Patrulheiro) nunca consulta recomendações", async () => {
    loadReferences(styleReferences());
    const spy = vi.spyOn(repository, "getTalentChoiceCounts");
    const character = createBlankCharacter("ui-reco-test");
    character.classId = "patrulheiro";
    character.level = 2;
    setCharacter(character);
    const choice = getTalentOpportunityFeatures(character)
      .flatMap((feature) => feature.choices ?? [])
      .find((candidate) => candidate.id === RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID)!;
    render(<FeatureChoiceControl choice={choice} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(spy).not.toHaveBeenCalled();
    expect(recommendedOptions()).toEqual([]);
  });
});

describe("Step4Species — Talento de Origem do Humano", () => {
  it("marca o Talento de Origem recomendado para a classe (atributos ainda desconhecidos)", async () => {
    const origin = (key: string, talentId: string) =>
      testCharacter(key, { classId: "mago", speciesId: "humano", level: 1, acquisitions: [testAcquisition("originFeat", null, talentId)] });
    loadReferences([
      testReferenceFile("origem-a", { independenceGroup: "origem-a", characters: [origin("a1", "alerta"), origin("a2", "alerta")] }),
      testReferenceFile("origem-b", { independenceGroup: "origem-b", characters: [origin("b1", "sortudo")] }),
    ]);
    const character = createBlankCharacter("ui-reco-test");
    character.classId = "mago";
    character.speciesId = "humano";
    setCharacter(character);
    render(<Step4Species />);

    expect(await screen.findByRole("option", { name: "Alerta (Recomendado)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sortudo (Recomendado)" })).toBeInTheDocument();
    expect(useCharacterStore.getState().character.humanOriginFeatId).toBeNull();
  });
});

describe("Dados reais liberados no recomendador", () => {
  async function confirmFighters(count: number, talentId: string) {
    for (let i = 1; i <= count; i++) {
      await repository.insertConfirmed(
        testUserBuild(i, "guerreiro", [
          { kind: "generalFeat", opportunityId: "asi-4", level: 4, talentId, subclassId: "Campeão", abilityScores: FOR_HIGH },
        ]),
      );
    }
  }

  it("com 10 personagens reais confirmados no mesmo contexto, recomenda pelo que eles escolheram (sem nenhuma referência)", async () => {
    await confirmFighters(10, "resistente");
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    expect(await screen.findByRole("option", { name: "Resistente (Recomendado)" })).toBeInTheDocument();
    expect(recommendedOptions()).toEqual(["Resistente (Recomendado)"]);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Resistente: escolhido por 10 de 10 guerreiros"]);
  });

  it("com 9, a amostra real é insuficiente e nada é recomendado", async () => {
    await confirmFighters(9, "resistente");
    const spy = vi.spyOn(repository, "getTalentChoiceCounts");
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await spy.mock.results[0].value;
    expect(recommendedOptions()).toEqual([]);
  });

  it("dados reais suficientes têm prioridade sobre referências (sem misturar os rankings)", async () => {
    loadReferences(asiReferences());
    await confirmFighters(10, "resistente");
    setCharacter(fighterAtAsi4());
    render(<AsiControl level={4} showUnavailableFeats={false} />);
    expect(await screen.findByRole("option", { name: "Resistente (Recomendado)" })).toBeInTheDocument();
    expect(recommendedOptions()).toEqual(["Resistente (Recomendado)"]);
  });
});
