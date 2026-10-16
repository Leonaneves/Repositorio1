import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { CLASS_IDS, SPECIES_IDS } from "../domain/ids.js";
import { subclasses } from "../data/subclasses.js";
import { getSpeciesLineageOptions } from "../data/speciesLineages.js";
import { GOLPES_ABENCOADOS_CHOICE_ID } from "../data/features/cleric.js";
import { FURIA_ELEMENTAL_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getBarbarianPrintedBlocks } from "../rules/barbarianPrintedFeatures.js";
import { getBardPrintedBlocks } from "../rules/bardPrintedFeatures.js";
import { getClericPrintedBlocks } from "../rules/clericPrintedFeatures.js";
import { getDruidPrintedBlocks } from "../rules/druidPrintedFeatures.js";
import { getSorcererPrintedBlocks } from "../rules/sorcererPrintedFeatures.js";
import { getWarlockPrintedBlocks } from "../rules/warlockPrintedFeatures.js";
import { getRoguePrintedBlocks } from "../rules/roguePrintedFeatures.js";
import { getWizardPrintedBlocks } from "../rules/wizardPrintedFeatures.js";
import { getMonkPrintedBlocks } from "../rules/monkPrintedFeatures.js";
import { getPaladinPrintedBlocks } from "../rules/paladinPrintedFeatures.js";
import { getSpeciesTraitsPrintedText } from "../rules/speciesLineagePrintedFeatures.js";

/**
 * Fonte "AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS" §1: nenhum
 * texto que pode chegar ao PDF deve usar abreviação de tipo de dano
 * (ex.: "Ig"/"Gel"/"Trov" em vez de "Fogo"/"Frio"/"Trovão"). Única
 * exceção já documentada no projeto (`data/features/subclasses.ts`,
 * comentário acima de "FEITICEIRO"): Contundente/Cortante/Perfurante
 * continuam abreviados (Conc/Cort/Perf) de propósito — nunca os demais
 * tipos. Este arquivo varre TODA combinação de classe/subclasse/escolha
 * e espécie/linhagem que produz texto impresso, para nunca deixar uma
 * abreviação de dano reaparecer sem que algum teste quebre.
 */
const BANNED_DAMAGE_TYPE_ABBREVIATIONS = new Set([
  "Ig",
  "Gel",
  "Trov",
  "Elet",
  "Ven",
  "Necr",
  "Nec",
  "Rad",
  "Psiq",
  "Energ",
]);

function expectNoAbbreviatedDamageTypes(text: string): void {
  const tokens = text.split(/[^\p{L}]+/u).filter(Boolean);
  for (const token of tokens) {
    expect(BANNED_DAMAGE_TYPE_ABBREVIATIONS.has(token)).toBe(false);
  }
}

function baseCharacter(classId: Character["classId"], level: number, subclassFullName: string | null): Character {
  const character = createBlankCharacter("damage-type-fullnames-test");
  character.classId = classId;
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities = {
    FOR: { score: 16 },
    DEX: { score: 14 },
    CON: { score: 14 },
    INT: { score: 12 },
    SAB: { score: 16 },
    CAR: { score: 16 },
  };
  return character;
}

describe("Nenhuma abreviação de tipo de dano aparece nos textos impressos de Classe/Subclasse (todas as classes com gerador de texto compacto)", () => {
  it.each(["barbaro", "bardo", "clerigo", "druida", "feiticeiro", "bruxo"] as const)("classe %s, em todas as subclasses cadastradas", (classId) => {
    const subclassNames = subclasses[classId].map((s) => s.fullName);
    for (const subclassFullName of [null, ...subclassNames]) {
      const character = baseCharacter(classId, 20, subclassFullName);

      // Escolhas que condicionam texto com tipo de dano — sempre o mesmo valor em todo
      // personagem, irrelevante se a classe/subclasse atual nem usa a escolha.
      character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID] = { value: "Golpe Divino" };
      character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID] = { value: "Ataque Primal" };
      character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID] = { value: "Tropical" };
      character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID] = { value: "Fogo" };
      character.knownMetamagicOptions = ["sutil", "distante", "cautelosa", "potencializada", "buscadora", "transmutada"];
      character.chosenInvocations = [
        "explosao-agonizante",
        "explosao-repulsiva",
        "investimento-mestre-da-corrente",
        "lamina-devoradora",
        "lanca-mistica",
        "mente-mistica",
        "olhar-de-duas-mentes",
        "pacto-da-corrente",
        "pacto-da-lamina",
        "presente-das-profundezas",
        "presente-dos-protetores",
        "punicao-mistica",
        "sorvedouro-de-vida",
        "visao-da-bruxa",
        "visao-diabolica",
      ].map((invocationId) => ({ invocationId, subChoice: "" }));

      const blocks =
        classId === "barbaro"
          ? getBarbarianPrintedBlocks(character)
          : classId === "bardo"
            ? getBardPrintedBlocks(character)
            : classId === "clerigo"
              ? getClericPrintedBlocks(character)
              : classId === "druida"
                ? getDruidPrintedBlocks(character)
                : classId === "feiticeiro"
                  ? getSorcererPrintedBlocks(character)
                  : getWarlockPrintedBlocks(character);

      expectNoAbbreviatedDamageTypes(blocks.join("\n"));
    }
  });
});

describe("Ladino — Psíquico (Adaga Espiritual) e Venenoso (Assassino) nunca abreviados nos textos impressos (fonte \"IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §3)", () => {
  it.each(["Lâmina Psíquica", "Assassino", "Ladrão", "Trapaceiro Arcano"] as const)("subclasse %s, nível 20", (subclassFullName) => {
    const character = baseCharacter("ladino", 20, subclassFullName);
    const joined = getRoguePrintedBlocks(character).join("\n");
    expectNoAbbreviatedDamageTypes(joined);
    if (subclassFullName === "Lâmina Psíquica") expect(joined).toContain("Psíquico");
    if (subclassFullName === "Assassino") expect(joined).toContain("Venenoso");
  });

  it("sem subclasse escolhida (só classe base)", () => {
    const character = baseCharacter("ladino", 14, null);
    expectNoAbbreviatedDamageTypes(getRoguePrintedBlocks(character).join("\n"));
  });
});

describe("Mago — Necrótico (Sobrecarga do Evocador) nunca abreviado nos textos impressos (fonte \"IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §2)", () => {
  it.each(["Abjurador", "Adivinho", "Evocador", "Ilusionista"] as const)("subclasse %s, nível 20", (subclassFullName) => {
    const character = baseCharacter("mago", 20, subclassFullName);
    const joined = getWizardPrintedBlocks(character).join("\n");
    expectNoAbbreviatedDamageTypes(joined);
    if (subclassFullName === "Evocador") expect(joined).toContain("Necrótico");
  });

  it("sem subclasse escolhida (só classe base)", () => {
    const character = baseCharacter("mago", 14, null);
    expectNoAbbreviatedDamageTypes(getWizardPrintedBlocks(character).join("\n"));
  });
});

describe("Monge — nunca abrevia nem troca os 5 tipos elementais de Sintonia Elemental, nem usa Ígneo/Gélido/Trovejante em vez de Fogo/Frio/Trovão (fonte \"IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF\" §1)", () => {
  const BANNED_ALTERNATE_DAMAGE_WORDS = ["Ígneo", "Gélido", "Trovejante"];

  it.each(["Guerreiro da Mão Aberta", "Guerreiro da Misericórdia", "Guerreiro das Sombras", "Guerreiro dos Elementos"] as const)(
    "subclasse %s, nível 20",
    (subclassFullName) => {
      const character = baseCharacter("monge", 20, subclassFullName);
      const joined = getMonkPrintedBlocks(character).join("\n");
      expectNoAbbreviatedDamageTypes(joined);
      for (const banned of BANNED_ALTERNATE_DAMAGE_WORDS) expect(joined).not.toContain(banned);
    },
  );

  it("Caminho dos Elementos cita Ácido/Elétrico/Frio/Fogo/Trovão por extenso em Sintonia Elemental/Explosão Elemental", () => {
    const character = baseCharacter("monge", 20, "Guerreiro dos Elementos");
    const joined = getMonkPrintedBlocks(character).join("\n");
    expect(joined).toContain("Ácido/Elétrico/Frio/Fogo/Trovão");
  });

  it("sem subclasse escolhida (só classe base)", () => {
    const character = baseCharacter("monge", 14, null);
    expectNoAbbreviatedDamageTypes(getMonkPrintedBlocks(character).join("\n"));
  });
});

describe("Paladino — Radiante (Golpes Radiantes/Resplendor Sagrado) e Necrótico/Psíquico (Aura de Resistência) nunca abreviados nos textos impressos (fonte \"IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF\" §2)", () => {
  it.each(["Juramento da Devoção", "Juramento da Glória", "Juramento da Vingança", "Juramento dos Anciões"] as const)(
    "subclasse %s, nível 20",
    (subclassFullName) => {
      const character = baseCharacter("paladino", 20, subclassFullName);
      const joined = getPaladinPrintedBlocks(character).join("\n");
      expectNoAbbreviatedDamageTypes(joined);
      expect(joined).toContain("Radiante");
      if (subclassFullName === "Juramento dos Anciões") expect(joined).toContain("Necrótico/Psíquico/Radiante");
    },
  );

  it("sem subclasse escolhida (só classe base)", () => {
    const character = baseCharacter("paladino", 14, null);
    expectNoAbbreviatedDamageTypes(getPaladinPrintedBlocks(character).join("\n"));
  });
});

describe("Nenhuma abreviação de tipo de dano aparece no texto impresso de Espécie (todas as espécies, com toda linhagem/ancestralidade cadastrada)", () => {
  it.each(SPECIES_IDS)("espécie %s", (speciesId) => {
    const character = createBlankCharacter("damage-type-fullnames-species-test");
    character.speciesId = speciesId;
    character.level = 20;

    const lineageOptions = getSpeciesLineageOptions(speciesId);
    for (const lineageId of lineageOptions.length > 0 ? lineageOptions.map((option) => option.id) : [null]) {
      character.speciesLineageId = lineageId;
      expectNoAbbreviatedDamageTypes(getSpeciesTraitsPrintedText(character));
    }
  });
});
