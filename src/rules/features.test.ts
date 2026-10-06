import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSkillChoiceId, getClassToolChoiceId } from "../data/classes.js";
import {
  getBackgroundFeatures,
  getCharacterFeatures,
  getChosenFeatFeatures,
  getClassFeatures,
  getFeatureView,
  getIncompleteRequiredChoices,
  getSpeciesFeatures,
  getSubclassFeatures,
  isFeatureChoiceComplete,
  isFeatureComplete,
} from "./features.js";

describe("getClassFeatures — progressão por nível", () => {
  it("Bárbaro nível 4 já tem Perícias de Classe e as features de nível 1–4, mas ainda não Movimento Rápido (chega no 5)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 4;
    const ids = getClassFeatures(character).map((f) => f.id);
    expect(ids).toContain("barbaro-pericias-de-classe");
    expect(ids).toContain("barbaro-defesa-sem-armadura-1");
    expect(ids).toContain("barbaro-asi-4");
    expect(ids).not.toContain("barbaro-movimento-rapido");
    expect(ids).not.toContain("barbaro-ataque-extra-5");
  });

  it("Bárbaro nível 5 já tem Movimento Rápido e Ataque Extra", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 5;
    const ids = getClassFeatures(character).map((f) => f.id);
    expect(ids).toContain("barbaro-movimento-rapido");
    expect(ids).toContain("barbaro-ataque-extra-5");
  });

  it("Monge nível 1 já tem Perícias de Classe, Artes Marciais e Defesa sem Armadura, mas ainda não Movimento sem Armadura (chega no 2)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "monge";
    character.level = 1;
    const ids = getClassFeatures(character).map((f) => f.id);
    expect(ids).toContain("monge-pericias-de-classe");
    expect(ids).toContain("monge-artes-marciais-1");
    expect(ids).not.toContain("monge-movimento-sem-armadura");
  });

  it("Monge nível 20 acumula todas as features até esse nível, incluindo Movimento sem Armadura e Dádiva Épica", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "monge";
    character.level = 20;
    const ids = getClassFeatures(character).map((f) => f.id);
    expect(ids).toContain("monge-movimento-sem-armadura");
    expect(ids).toContain("monge-pericias-de-classe");
    expect(ids).toContain("monge-dadiva-epica");
    expect(ids).toContain("monge-corpo-e-mente-20");
  });

  it("sem classe definida, nenhuma feature", () => {
    const character = createBlankCharacter("features-test");
    expect(getClassFeatures(character)).toHaveLength(0);
  });

  it("Artífice nível 10 já tem Adepto de Itens Mágicos (fonte própria do Artífice)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "artifice";
    character.level = 10;
    const names = getClassFeatures(character).map((f) => f.name);
    expect(names).toContain("Adepto de Itens Mágicos");
    expect(names).not.toContain("Sábio dos Itens Mágicos"); // só a partir do nível 14
  });

  it("Aumento no Valor de Atributo não tem FeatureChoice genérica (UI própria); Dádiva Épica continua manualText (catálogo pendente)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 20;
    const asi = getClassFeatures(character).find((f) => f.id === "mago-asi-4");
    const dadiva = getClassFeatures(character).find((f) => f.id === "mago-dadiva-epica");
    expect(asi?.choices ?? []).toHaveLength(0);
    expect(dadiva?.choices?.[0].effect.kind).toBe("manualText");
  });

  it("Guerreiro recebe 6 Aumentos no Valor de Atributo (mais que as outras classes) e Ladino recebe 5", () => {
    const guerreiro = createBlankCharacter("features-test");
    guerreiro.classId = "guerreiro";
    guerreiro.level = 20;
    expect(getClassFeatures(guerreiro).filter((f) => f.name === "Aumento no Valor de Atributo")).toHaveLength(6);

    const ladino = createBlankCharacter("features-test");
    ladino.classId = "ladino";
    ladino.level = 20;
    expect(getClassFeatures(ladino).filter((f) => f.name === "Aumento no Valor de Atributo")).toHaveLength(5);
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
    character.speciesId = "anao";
    const features = getSpeciesFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].summary).toContain("RESILIÊNCIA ANÃNICA");
  });

  it("para espécies com Linhagem/Ancestralidade (Golias), o summary é o texto dinâmico — FORMA GRANDE só a partir do nível 5", () => {
    const character = createBlankCharacter("features-test");
    character.speciesId = "golias";
    character.level = 5;
    const features = getSpeciesFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].summary).toContain("FORMA GRANDE");

    character.level = 1;
    expect(getSpeciesFeatures(character)[0].summary).not.toContain("FORMA GRANDE");
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
  it("Bárbaro Golias nível 5 com antecedente Soldado: junta features de classe + espécie + antecedente, sem repetir nenhum id", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "barbaro";
    character.level = 5;
    character.speciesId = "golias";
    character.backgroundId = "soldado";
    const features = getCharacterFeatures(character);
    const ids = features.map((f) => f.id);

    expect(ids).toContain("barbaro-movimento-rapido");
    expect(ids).toContain("barbaro-pericias-de-classe");
    expect(ids).toContain("antecedente-soldado-talento-origem");
    expect(ids).toContain("especie-golias-tracos");
    expect(new Set(ids).size).toBe(ids.length); // nenhum id duplicado
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

describe("isFeatureChoiceComplete / isFeatureComplete / getIncompleteRequiredChoices — trava do Builder (§5/§11)", () => {
  it("skillProficiency: incompleto enquanto a contagem exata não for atingida", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro"; // escolhe 2
    const feature = getClassFeatures(character).find((f) => f.name === "Perícias de Classe")!;
    const choice = feature.choices![0];

    expect(isFeatureChoiceComplete(choice, character)).toBe(false);

    character.featureChoiceSelections[choice.id] = { value: ["atletismo"] };
    expect(isFeatureChoiceComplete(choice, character)).toBe(false); // só 1 de 2

    character.featureChoiceSelections[choice.id] = { value: ["atletismo", "intimidacao"] };
    expect(isFeatureChoiceComplete(choice, character)).toBe(true);
  });

  it("toolProficiency: completo só quando a quantidade exata de ferramentas elegíveis foi escolhida", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "bardo";
    const feature = getClassFeatures(character).find((f) => f.name === "Ferramentas de Classe")!;
    const choice = feature.choices![0];

    expect(isFeatureChoiceComplete(choice, character)).toBe(false);

    character.featureChoiceSelections[choice.id] = { value: ["alaude"] }; // só 1 de 3
    expect(isFeatureChoiceComplete(choice, character)).toBe(false);

    character.featureChoiceSelections[choice.id] = { value: ["alaude", "flauta", "tambor"] };
    expect(isFeatureChoiceComplete(choice, character)).toBe(true);
  });

  it("manualText (ASI/Dádiva Épica) nunca bloqueia — sem catálogo para validar contra", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 4;
    const asi = getClassFeatures(character).find((f) => f.id === "mago-asi-4")!;
    expect(isFeatureComplete(asi, character)).toBe(true);
  });

  it("getIncompleteRequiredChoices: Guerreiro recém-criado tem Perícias de Classe pendente", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Perícias de Classe")).toBe(true);
  });

  it("getIncompleteRequiredChoices: fica vazio depois que a escolha é respondida por completo", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo", "intimidacao"] };
    expect(getIncompleteRequiredChoices(character)).toEqual([]);
  });

  it("getIncompleteRequiredChoices: Bardo continua pendente enquanto só resolver perícias, faltando ferramentas", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "bardo";
    character.featureChoiceSelections[getClassSkillChoiceId("bardo")] = { value: ["acrobacia", "atletismo", "enganacao"] };
    const incomplete = getIncompleteRequiredChoices(character);
    expect(incomplete.some((f) => f.name === "Ferramentas de Classe")).toBe(true);

    character.featureChoiceSelections[getClassToolChoiceId("bardo")] = { value: ["alaude", "flauta", "tambor"] };
    expect(getIncompleteRequiredChoices(character)).toEqual([]);
  });
});
