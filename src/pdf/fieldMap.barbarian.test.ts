import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { CONHECIMENTO_PRIMORDIAL_CHOICE_ID, getBarbarianWeaponMasteryChoiceId } from "../data/features/barbarian.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Bárbaro nos campos do PDF
 * (`Carac.Classe.1`/`.2`, `PROF.armas`, magias preparadas) — a fonte
 * "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" pede explicitamente que
 * essas 3 áreas sejam atualizadas além do campo de Características de
 * Classe. Não re-testa o CONTEÚDO de cada texto (já coberto por
 * `rules/barbarianPrintedFeatures.test.ts` etc.) — só que o fieldMap
 * realmente os invoca e entrega para o campo certo do PDF-molde.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function fullBarbarian(level: number): Character {
  const character = createBlankCharacter("fieldmap-barb-test");
  character.classId = "barbaro";
  character.level = level;
  character.subclassId = level >= 3 ? "Caminho do Berserker" : null;
  character.featureChoiceSelections[getClassSkillChoiceId("barbaro")] = { value: ["atletismo", "percepcao"] };
  if (level >= 3) character.featureChoiceSelections[CONHECIMENTO_PRIMORDIAL_CHOICE_ID] = { value: ["intimidacao"] };
  character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(1)] = { value: "machadoGrande" };
  character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(2)] = { value: "azagaia" };
  if (level >= 4) character.featureChoiceSelections[getBarbarianWeaponMasteryChoiceId(3)] = { value: "clava" };
  return character;
}

describe("Carac.Classe.1/.2 — só o Bárbaro usa a composição dinâmica", () => {
  it("Bárbaro: o conteúdo vem de getBarbarianPrintedBlocks, nunca de character.classFeatures", () => {
    const character = fullBarbarian(5);
    character.classFeatures = { column1: "texto manual nunca deveria aparecer", column2: "" };
    const col1 = fieldValue("Carac.Classe.1", character);
    const col2 = fieldValue("Carac.Classe.2", character);
    expect(col1 + col2).toContain("#Fúria");
    expect(col1 + col2).not.toContain("texto manual nunca deveria aparecer");
  });

  it("outras classes continuam usando o texto manual de character.classFeatures, sem mudança de comportamento", () => {
    const character = createBlankCharacter("fieldmap-fighter-test");
    character.classId = "guerreiro";
    character.classFeatures = { column1: "Segundo Fôlego etc.", column2: "mais texto" };
    expect(fieldValue("Carac.Classe.1", character)).toBe("Segundo Fôlego etc.");
    expect(fieldValue("Carac.Classe.2", character)).toBe("mais texto");
  });

  it("Maestria em Arma, Subclasse de Bárbaro, Movimento Rápido, Dádiva Épica e Campeão Primitivo nunca aparecem neste campo", () => {
    const character = fullBarbarian(20);
    character.subclassId = "Caminho do Fanático";
    const joined = fieldValue("Carac.Classe.1", character) + fieldValue("Carac.Classe.2", character);
    expect(joined).not.toContain("Maestria em Arma");
    expect(joined).not.toContain("Subclasse de Bárbaro");
    expect(joined).not.toContain("Movimento Rápido");
    expect(joined).not.toContain("Dádiva Épica");
    expect(joined).not.toContain("Campeão Primitivo");
  });
});

describe("PROF.armas — Maestrias em Arma do Bárbaro aparecem junto das proficiências de arma de classe", () => {
  it("inclui as armas escolhidas com o nome real da Maestria do catálogo", () => {
    const character = fullBarbarian(5);
    const text = fieldValue("PROF.armas", character);
    expect(text).toContain("Maestrias: Machado Grande — Trespassar; Azagaia — Lentidão; Clava — Lentidão");
  });

  it("outra classe não é afetada (continua só com as proficiências normais)", () => {
    const character = createBlankCharacter("fieldmap-fighter-test");
    character.classId = "guerreiro";
    const text = fieldValue("PROF.armas", character);
    expect(text).not.toContain("Maestrias:");
  });
});

describe("Magias preparadas — rituais do Caminho do Coração Selvagem entram antes das magias manuais do jogador", () => {
  it("nível 3+: Falar com Animais e Sentido Feral aparecem nas 2 primeiras linhas", () => {
    const character = fullBarbarian(5);
    character.subclassId = "Caminho do Coração Selvagem";
    character.spellsPrepared = [
      { circle: "1", name: "Magia Manual do Jogador", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
    ];
    expect(fieldValue("nome.magia.1.0", character)).toBe("Falar com Animais");
    expect(fieldValue("nome.magia.1.1", character)).toBe("Sentido Feral");
    expect(fieldValue("nome.magia.1.2", character)).toBe("Magia Manual do Jogador");
    expect(fieldValue("circulo1.0", character)).toBe("");
    expect(fieldValue("notas.magia.1.0", character)).toContain("Ritual (SAB)");
  });

  it("nunca grava as magias de ritual de volta em character.spellsPrepared", () => {
    const character = fullBarbarian(5);
    character.subclassId = "Caminho do Coração Selvagem";
    fieldValue("nome.magia.1.0", character);
    expect(character.spellsPrepared).toEqual([]);
  });

  it("outra subclasse de Bárbaro não ganha magias de ritual", () => {
    const character = fullBarbarian(10);
    character.subclassId = "Caminho do Berserker";
    expect(fieldValue("nome.magia.1.0", character)).toBe("");
  });
});
