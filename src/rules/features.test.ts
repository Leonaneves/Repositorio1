import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSkillChoiceId, getClassToolChoiceId } from "../data/classes.js";
import { RANGER_MENTE_DE_FERRO_CHOICE_ID, RANGER_MENTE_DE_FERRO_FEATURE_ID } from "../data/features/subclasses.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import {
  getBackgroundFeatures,
  getCharacterFeatures,
  getChosenFeatFeatures,
  getClassFeatures,
  getFeatureView,
  getIncompleteRequiredChoices,
  getSkillChoiceFeatures,
  getSpeciesFeatures,
  getSubclassFeatures,
  isFeatureChoiceComplete,
  isFeatureComplete,
  isSkillKindChoice,
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

describe("getSubclassFeatures — catálogo ainda pendente para a maioria, exceto as subclasses com fonte confirmada", () => {
  it("vazio para uma subclasse sem conteúdo confirmado (ex.: Alquimista do Artífice)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "artifice";
    character.level = 20;
    character.subclassId = "Alquimista";
    expect(getSubclassFeatures(character)).toEqual([]);
  });

  it("Patrulheiro/Andarilho Feérico nível 3 já traz Glamour Transcendental, Golpes Terríveis e as magias sempre preparadas", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "patrulheiro";
    character.level = 3;
    character.subclassId = "Andarilho Feérico";
    const names = getSubclassFeatures(character).map((f) => f.name);
    expect(names).toContain("Glamour Transcendental");
    expect(names).toContain("Golpes Terríveis");
    expect(names).toContain("Magias de Andarilho Feérico");
    expect(names).not.toContain("Detalhe Sedutor"); // só a partir do nível 7
  });
});

describe("getSubclassFeatures — 'Mente de Ferro' (Vigilante das Sombras, nível 7) só recebe FeatureChoice quando SAB já é proficiente por outra origem (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §5)", () => {
  function gloomStalkerAt(level: number) {
    const character = createBlankCharacter("mente-de-ferro-features-test");
    character.classId = "patrulheiro";
    character.subclassId = "Vigilante das Sombras";
    character.level = level;
    return character;
  }

  it("sem SAB proficiente por outra origem: a característica aparece, mas sem nenhuma escolha — nunca trava o Avançar", () => {
    const character = gloomStalkerAt(7);
    const menteDeFerro = getSubclassFeatures(character).find((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)!;
    expect(menteDeFerro).toBeDefined();
    expect(menteDeFerro.choices ?? []).toHaveLength(0);
    expect(getIncompleteRequiredChoices(character).some((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)).toBe(false);
  });

  it("com SAB já proficiente por outra origem: a escolha Carisma/Inteligência aparece e trava o Avançar até ser respondida", () => {
    const character = gloomStalkerAt(7);
    character.savingThrows.SAB.proficient = true;

    const menteDeFerro = getSubclassFeatures(character).find((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)!;
    expect(menteDeFerro.choices).toHaveLength(1);
    expect(menteDeFerro.choices![0].effect).toEqual({ kind: "optionPick", options: ["Carisma", "Inteligência"] });
    expect(getIncompleteRequiredChoices(character).some((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)).toBe(true);

    character.featureChoiceSelections[RANGER_MENTE_DE_FERRO_CHOICE_ID] = { value: "Carisma" };
    expect(getIncompleteRequiredChoices(character).some((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)).toBe(false);
  });

  it("antes do nível 7, a característica nem existe ainda", () => {
    const character = gloomStalkerAt(6);
    character.savingThrows.SAB.proficient = true;
    expect(getSubclassFeatures(character).some((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)).toBe(false);
  });

  it("nunca aparece para outra subclasse, mesmo com SAB proficiente", () => {
    const character = gloomStalkerAt(7);
    character.subclassId = "Caçador";
    character.savingThrows.SAB.proficient = true;
    expect(getSubclassFeatures(character).some((f) => f.id === RANGER_MENTE_DE_FERRO_FEATURE_ID)).toBe(false);
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

/**
 * Fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" —
 * `isSkillKindChoice`/`getSkillChoiceFeatures` separam as escolhas de
 * perícia (proficiência/Especialização) das demais, de QUALQUER
 * origem, para a nova etapa "Perícias".
 */
describe("isSkillKindChoice / getSkillChoiceFeatures", () => {
  it("isSkillKindChoice: true para skillProficiency/skillExpertise, false para as demais", () => {
    expect(isSkillKindChoice({ id: "x", prompt: "x", effect: { kind: "skillProficiency", options: "any", count: 1 } })).toBe(true);
    expect(isSkillKindChoice({ id: "x", prompt: "x", effect: { kind: "skillExpertise", count: 1 } })).toBe(true);
    expect(isSkillKindChoice({ id: "x", prompt: "x", effect: { kind: "toolProficiency", category: "artisanTool", count: 1 } })).toBe(false);
    expect(isSkillKindChoice({ id: "x", prompt: "x", effect: { kind: "optionPick", options: ["A", "B"] } })).toBe(false);
    expect(isSkillKindChoice({ id: "x", prompt: "x", effect: { kind: "manualText", placeholder: "x" } })).toBe(false);
  });

  it("getSkillChoiceFeatures: Guerreiro recém-criado só traz 'Perícias de Classe' (Estilo de Luta é manualText, nunca entra aqui)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    const features = getSkillChoiceFeatures(character);
    expect(features.map((f) => f.name)).toEqual(["Perícias de Classe"]);
  });

  it("reúne features de origens DIFERENTES (Classe + Espécie) na mesma lista", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-drow";
    const features = getSkillChoiceFeatures(character);
    expect(features.map((f) => f.name).sort()).toEqual(["Perícias de Classe", "Traços de Elfo"]);
  });

  it("uma feature com escolha de perícia MISTURADA a outra escolha (Estudioso da Guerra: perícia + ferramenta) continua aparecendo — a separação é por escolha individual, nunca pela feature inteira", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "guerreiro";
    character.subclassId = "Mestre da Batalha";
    character.level = 3;
    const feature = getSkillChoiceFeatures(character).find((f) => f.name === "Estudioso da Guerra");
    expect(feature).toBeDefined();
    // A própria feature continua com AMBAS as escolhas — quem filtra por tipo é quem renderiza, não esta função.
    expect(feature!.choices?.some((c) => c.effect.kind === "toolProficiency")).toBe(true);
    expect(feature!.choices?.some((c) => isSkillKindChoice(c))).toBe(true);
  });

  it("nunca inclui uma feature sem NENHUMA escolha de perícia (ex.: Dádiva Épica, só manualText)", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 19;
    const names = getSkillChoiceFeatures(character).map((f) => f.name);
    expect(names).not.toContain("Dádiva Épica");
  });

  it("Elfo sem a escolha de Sentidos Aguçados respondida ainda aparece (pendente, não desaparece até ser resolvida)", () => {
    const character = createBlankCharacter("features-test");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-drow";
    const feature = getSkillChoiceFeatures(character).find((f) => f.name === "Traços de Elfo");
    expect(feature).toBeDefined();
    expect(character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID]).toBeUndefined();
  });
});
