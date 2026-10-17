import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSkillChoiceId, getClassToolChoiceId } from "../data/classes.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import {
  FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
  RANGER_MENTE_DE_FERRO_CHOICE_ID,
  RANGER_MENTE_DE_FERRO_FEATURE_ID,
} from "../data/features/subclasses.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import { PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID, PALADIN_FIGHTING_STYLE_CHOICE_ID } from "../data/features/paladin.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID, DADIVA_DA_VELOCIDADE_FEAT_ID } from "../data/features/epicBoons.js";
import {
  getBackgroundFeatures,
  getCharacterFeatures,
  getChosenEpicBoonFeatures,
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

  it("Aumento no Valor de Atributo não tem FeatureChoice genérica (UI própria); Dádiva Épica tem optionPick com as 12 Dádivas do catálogo", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 20;
    const asi = getClassFeatures(character).find((f) => f.id === "mago-asi-4");
    const dadiva = getClassFeatures(character).find((f) => f.id === "mago-dadiva-epica");
    expect(asi?.choices ?? []).toHaveLength(0);
    expect(dadiva?.choices?.[0].effect.kind).toBe("optionPick");
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

describe("getClassFeatures/getSubclassFeatures — narrowing dinâmico de Estilo de Luta (fonte \"IMPLEMENTAR TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF\" §1)", () => {
  function fighterAt(level: number, subclassFullName: string | null = null) {
    const character = createBlankCharacter("fighting-style-narrowing-test");
    character.classId = "guerreiro";
    character.level = level;
    character.subclassId = subclassFullName;
    return character;
  }

  it("sem nenhuma escolha feita: a concessão BASE (nível 1) oferece as 10 opções completas", () => {
    const character = fighterAt(1);
    const base = getClassFeatures(character).find((f) => f.id === "guerreiro-estilo-de-luta-1")!;
    expect(base.choices![0].effect).toEqual({ kind: "optionPick", options: expect.arrayContaining(["Defensivo", "Duelismo"]) });
    expect((base.choices![0].effect as { options: string[] }).options).toHaveLength(10);
  });

  it("Campeão: o estilo já escolhido na concessão ADICIONAL some das opções da concessão BASE", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    const base = getClassFeatures(character).find((f) => f.id === "guerreiro-estilo-de-luta-1")!;
    const baseOptions = (base.choices![0].effect as { options: string[] }).options;
    expect(baseOptions).not.toContain("Duelismo");
    expect(baseOptions).toHaveLength(9);
  });

  it("Campeão: o estilo já escolhido na concessão BASE some das opções da concessão ADICIONAL (getSubclassFeatures)", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    const extra = getSubclassFeatures(character).find((f) => f.id === "guerreiro-campeao-estilo-de-luta-adicional-7")!;
    const extraOptions = (extra.choices![0].effect as { options: string[] }).options;
    expect(extraOptions).not.toContain("Defensivo");
    expect(extraOptions).toHaveLength(9);
  });

  it("Patrulheiro: a sub-escolha do nome do Estilo de Luta só existe quando o ramo escolhido é exatamente 'Estilo de Luta' — ausente tanto sem escolha quanto com 'Combatente Druídico'", () => {
    const character = createBlankCharacter("fighting-style-narrowing-test");
    character.classId = "patrulheiro";
    character.level = 2;
    const estiloDeLuta = () => getClassFeatures(character).find((f) => f.id === "patrulheiro-estilo-de-luta-2")!;

    // Sem nenhum ramo escolhido ainda: nunca pede o nome do Estilo de Luta prematuramente.
    expect(estiloDeLuta().choices!.some((c) => c.id === RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID)).toBe(false);

    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Estilo de Luta" };
    expect(estiloDeLuta().choices!.some((c) => c.id === RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID)).toBe(true);

    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
    expect(estiloDeLuta().choices!.some((c) => c.id === RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID)).toBe(false);
  });

  it("Paladino: a sub-escolha do nome do Estilo de Luta só existe quando o ramo escolhido é exatamente 'Estilo de Luta' — ausente tanto sem escolha quanto com 'Combatente Abençoado'", () => {
    const character = createBlankCharacter("fighting-style-narrowing-test");
    character.classId = "paladino";
    character.level = 2;
    const estiloDeLuta = () => getClassFeatures(character).find((f) => f.id === "paladino-estilo-de-luta-2")!;

    // Sem nenhum ramo escolhido ainda: nunca pede o nome do Estilo de Luta prematuramente.
    expect(estiloDeLuta().choices!.some((c) => c.id === PALADIN_FIGHTING_STYLE_CHOICE_ID)).toBe(false);

    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Estilo de Luta" };
    expect(estiloDeLuta().choices!.some((c) => c.id === PALADIN_FIGHTING_STYLE_CHOICE_ID)).toBe(true);

    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Combatente Abençoado" };
    expect(estiloDeLuta().choices!.some((c) => c.id === PALADIN_FIGHTING_STYLE_CHOICE_ID)).toBe(false);
  });

  it("remoção condicional nunca afeta as demais escolhas da mesma característica (ex.: truques de Combatente Druídico continuam presentes)", () => {
    const character = createBlankCharacter("fighting-style-narrowing-test");
    character.classId = "patrulheiro";
    character.level = 2;
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
    const estiloDeLuta = getClassFeatures(character).find((f) => f.id === "patrulheiro-estilo-de-luta-2")!;
    expect(estiloDeLuta.choices!.some((c) => c.id === RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID)).toBe(true);
    expect(estiloDeLuta.choices!.length).toBeGreaterThan(1); // ramo + 2 truques de Druida, só o nome do Estilo de Luta saiu
  });
});

describe("getClassFeatures — narrowing dinâmico de Dádiva Épica por Conjuração (fonte \"IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF\" §1)", () => {
  function characterAt19(classId: "guerreiro" | "mago" | "bruxo", subclassFullName: string | null = null) {
    const character = createBlankCharacter("epic-boon-narrowing-test");
    character.classId = classId;
    character.level = 19;
    character.subclassId = subclassFullName;
    return character;
  }

  it("Guerreiro (sem Conjuração): a opção 'Dádiva da Recordação de Magia' nunca aparece entre as opções da escolha — 11 opções", () => {
    const character = characterAt19("guerreiro");
    const feature = getClassFeatures(character).find((f) => f.id === "guerreiro-dadiva-epica")!;
    const options = (feature.choices![0].effect as { options: string[] }).options;
    expect(options).not.toContain("Dádiva da Recordação de Magia");
    expect(options).toHaveLength(11);
  });

  it("Mago (Conjuração própria da classe): as 12 opções completas aparecem, incluindo 'Dádiva da Recordação de Magia'", () => {
    const character = characterAt19("mago");
    const feature = getClassFeatures(character).find((f) => f.id === "mago-dadiva-epica")!;
    const options = (feature.choices![0].effect as { options: string[] }).options;
    expect(options).toContain("Dádiva da Recordação de Magia");
    expect(options).toHaveLength(12);
  });

  it("Bruxo (só Magia de Pacto, nunca Conjuração): a opção nunca aparece — 11 opções, mesmo tendo magias", () => {
    const character = characterAt19("bruxo");
    const feature = getClassFeatures(character).find((f) => f.id === "bruxo-dadiva-epica")!;
    const options = (feature.choices![0].effect as { options: string[] }).options;
    expect(options).not.toContain("Dádiva da Recordação de Magia");
    expect(options).toHaveLength(11);
  });

  it("subclasse que concede Conjuração (Cavaleiro Místico) habilita a opção mesmo numa classe-base sem Conjuração própria", () => {
    const character = characterAt19("guerreiro", "Cavaleiro Místico");
    const feature = getClassFeatures(character).find((f) => f.id === "guerreiro-dadiva-epica")!;
    const options = (feature.choices![0].effect as { options: string[] }).options;
    expect(options).toContain("Dádiva da Recordação de Magia");
    expect(options).toHaveLength(12);
  });
});

describe("getChosenEpicBoonFeatures / getCharacterFeatures — expõe a Dádiva Épica escolhida (fonte \"IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF\" §1)", () => {
  it("vazio sem elegibilidade (nível < 19)", () => {
    const character = createBlankCharacter("epic-boon-chosen-test");
    character.classId = "guerreiro";
    character.level = 18;
    expect(getChosenEpicBoonFeatures(character)).toEqual([]);
  });

  it("vazio quando elegível mas a escolha ainda não foi respondida", () => {
    const character = createBlankCharacter("epic-boon-chosen-test");
    character.classId = "guerreiro";
    character.level = 19;
    expect(getChosenEpicBoonFeatures(character)).toEqual([]);
  });

  it("devolve a própria FeatureDefinition (sourceType feat) da Dádiva escolhida, com a sub-escolha de atributo", () => {
    const character = createBlankCharacter("epic-boon-chosen-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    const features = getChosenEpicBoonFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].id).toBe(DADIVA_DA_VELOCIDADE_FEAT_ID);
    expect(features[0].sourceType).toBe("feat");
    expect(features[0].choices?.some((c) => c.id === `${DADIVA_DA_VELOCIDADE_FEAT_ID}-atributo`)).toBe(true);
  });

  it("trocar a escolha do picker troca a Dádiva exposta, nunca acumula as duas", () => {
    const character = createBlankCharacter("epic-boon-chosen-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    expect(getChosenEpicBoonFeatures(character).map((f) => f.id)).toEqual([DADIVA_DA_VELOCIDADE_FEAT_ID]);

    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Recordação de Magia" };
    // Guerreiro não tem Conjuração — mas a função só lê a seleção já feita, nunca revalida contra as opções elegíveis.
    expect(getChosenEpicBoonFeatures(character).map((f) => f.id)).toEqual([DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID]);
  });

  it("getCharacterFeatures junta a Dádiva escolhida com as demais features, sem duplicar nenhum id", () => {
    const character = createBlankCharacter("epic-boon-chosen-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.speciesId = "humano";
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    const features = getCharacterFeatures(character);
    const ids = features.map((f) => f.id);
    expect(ids).toContain(DADIVA_DA_VELOCIDADE_FEAT_ID);
    expect(ids).toContain("guerreiro-dadiva-epica");
    expect(ids).toContain("especie-humano-tracos");
    expect(new Set(ids).size).toBe(ids.length);
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

describe("getBackgroundFeatures — talento de origem modelado como sourceType feat, mesclado com o talento mecânico real (rules/feats.ts)", () => {
  it("devolve o talento de origem do antecedente escolhido, já com o resumo do talento mecânico", () => {
    const character = createBlankCharacter("features-test");
    character.backgroundId = "soldado";
    const features = getBackgroundFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].sourceType).toBe("feat");
    expect(features[0].id).toBe("antecedente-soldado-talento-origem");
    expect(features[0].summary).toContain("dados de dano da arma duas vezes");
  });
});

describe("getChosenFeatFeatures — talentos escolhidos em níveis de ASI (rules/feats.ts)", () => {
  it("vazio sem nenhuma aquisição de ASI resolvida", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    expect(getChosenFeatFeatures(character)).toEqual([]);
  });

  it("devolve o talento escolhido num nível de ASI", () => {
    const character = createBlankCharacter("features-test");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "alerta" } };
    const features = getChosenFeatFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].name).toBe("Alerta");
    expect(features[0].sourceType).toBe("feat");
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
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
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

  it("getSkillChoiceFeatures: Guerreiro recém-criado só traz 'Perícias de Classe' (Estilo de Luta é optionPick, nunca é escolha de perícia)", () => {
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
