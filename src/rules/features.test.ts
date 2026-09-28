import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getBackgroundFeatures,
  getCharacterFeatures,
  getChosenFeatFeatures,
  getClassFeatures,
  getFeatureView,
  getSpeciesFeatures,
  getSubclassFeatures,
} from "./features.js";

describe("getClassFeatures — progressão por nível", () => {
  it("Bárbaro nível 4 ainda não tem Movimento Rápido (chega no 5)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 4;
    expect(getClassFeatures(character)).toHaveLength(0);
  });

  it("Bárbaro nível 5 já tem Movimento Rápido", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 5;
    const features = getClassFeatures(character);
    expect(features.map((f) => f.id)).toEqual(["barbaro-movimento-rapido"]);
  });

  it("Monge nível 1 ainda não tem Movimento sem Armadura (chega no 2)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "monge";
    character.level = 1;
    expect(getClassFeatures(character)).toHaveLength(0);
  });

  it("Monge nível 2+ tem Movimento sem Armadura", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "monge";
    character.level = 20;
    expect(getClassFeatures(character).map((f) => f.id)).toEqual(["monge-movimento-sem-armadura"]);
  });

  it("sem classe definida, nenhuma feature", () => {
    const character = createBlankCharacter("features-test");
    expect(getClassFeatures(character)).toHaveLength(0);
  });

  it("classe sem features cadastradas (ex.: Guerreiro) não quebra, só devolve vazio", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    character.level = 10;
    expect(getClassFeatures(character)).toEqual([]);
  });
});

describe("getSubclassFeatures — catálogo ainda pendente, nunca inventado", () => {
  it("sempre vazio (nenhuma subclasse tem feature confirmada nesta etapa)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 20;
    character.subclassId = "Evocador";
    expect(getSubclassFeatures(character)).toEqual([]);
  });
});

describe("getSpeciesFeatures", () => {
  it("devolve os traços da espécie escolhida, reaproveitando o traitsText já confirmado", () => {
    const character = createBlankCharacter("features-test");
    character.speciesId = "golias";
    const features = getSpeciesFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].summary).toContain("FORMA GRANDE");
  });

  it("sem espécie definida, nenhum traço", () => {
    const character = createBlankCharacter("features-test");
    expect(getSpeciesFeatures(character)).toEqual([]);
  });
});

describe("getBackgroundFeatures — talento de origem modelado como sourceType feat", () => {
  it("devolve o talento de origem do antecedente escolhido", () => {
    const character = createBlankCharacter("features-test");
    character.backgroundId = "soldado";
    const features = getBackgroundFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].sourceType).toBe("feat");
    expect(features[0].summary).toContain("Atacante Selvagem");
  });
});

describe("getChosenFeatFeatures — catálogo geral vazio nesta etapa", () => {
  it("sempre vazio, mesmo com ids em chosenFeatIds (não há talentos cadastrados ainda)", () => {
    const character = createBlankCharacter("features-test");
    character.chosenFeatIds = ["talento-inexistente"];
    expect(getChosenFeatFeatures(character)).toEqual([]);
  });
});

describe("getCharacterFeatures — junta todas as fontes sem duplicar", () => {
  it("Bárbaro Golias nível 5 com antecedente Soldado: 3 features (classe + espécie + antecedente)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 5;
    character.speciesId = "golias";
    character.backgroundId = "soldado";
    const features = getCharacterFeatures(character);
    expect(features.map((f) => f.id).sort()).toEqual(
      ["barbaro-movimento-rapido", "antecedente-soldado-talento-origem", "especie-golias-tracos"].sort(),
    );
  });
});

describe("getFeatureView — visão explicável, não só uma lista", () => {
  it("expõe nome, origem legível e resumo em texto próprio", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 5;
    const [feature] = getClassFeatures(character);
    const view = getFeatureView(feature);
    expect(view.name).toBe("Movimento Rápido");
    expect(view.originLabel).toBe("Classe");
    expect(view.summary.length).toBeGreaterThan(0);
  });

  it("rótulo de origem correto para cada sourceType", () => {
    const character = createBlankCharacter("features-test");
    character.backgroundId = "sabio";
    const [feature] = getBackgroundFeatures(character);
    expect(getFeatureView(feature).originLabel).toBe("Talento");
  });
});
