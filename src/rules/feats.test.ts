import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { BACKGROUND_IDS } from "../domain/ids.js";
import {
  HABILIDOSO_CHOICE_BASE_ID,
  MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID,
  MAGIC_INITIATE_LIST_CHOICE_BASE_ID,
} from "../data/features/feats.js";
import { getBackgroundFeatures, getChosenFeatFeatures } from "./features.js";
import {
  BACKGROUND_ORIGIN_FEAT_ID,
  buildFeatAcquisitionFeature,
  getActiveFeatIds,
  getAlertInitiativeBonus,
  getAvailableFeatsForAsiLevel,
  getFeatAcquisitionCount,
  getFeatAcquisitions,
  getFeatChoiceId,
  getHealerKitHealingBonus,
  getLuckyPointsMax,
  getMagicInitiateList,
  getMusicianAllyCount,
  getToughHpBonus,
  getUnarmedStrikeDamageDie,
  isFeatActive,
  isFeatRepeatable,
} from "./feats.js";

function withBackground(backgroundId: Character["backgroundId"]): Character {
  const character = createBlankCharacter("feats-test");
  character.backgroundId = backgroundId;
  return character;
}

function withAsiFeat(classId: Character["classId"], level: number, featId: string | null): Character {
  const character = createBlankCharacter("feats-test");
  character.classId = classId;
  character.level = level;
  character.asiSelections = { [level]: { kind: "feat", featId } };
  return character;
}

describe("BACKGROUND_ORIGIN_FEAT_ID — os 16 antecedentes mapeiam para um dos 10 talentos, nunca inventado", () => {
  it("cobre todos os 16 antecedentes", () => {
    for (const backgroundId of BACKGROUND_IDS) {
      expect(BACKGROUND_ORIGIN_FEAT_ID[backgroundId]).toBeDefined();
    }
  });

  it("enumeração 1:1 confirmada a partir de data/backgrounds.ts#originFeat", () => {
    expect(BACKGROUND_ORIGIN_FEAT_ID.acolito).toBe("iniciado-em-magia");
    expect(BACKGROUND_ORIGIN_FEAT_ID.andarilho).toBe("sortudo");
    expect(BACKGROUND_ORIGIN_FEAT_ID.artesao).toBe("artifista");
    expect(BACKGROUND_ORIGIN_FEAT_ID.artista).toBe("musico");
    expect(BACKGROUND_ORIGIN_FEAT_ID.charlatao).toBe("habilidoso");
    expect(BACKGROUND_ORIGIN_FEAT_ID.criminoso).toBe("alerta");
    expect(BACKGROUND_ORIGIN_FEAT_ID.eremita).toBe("curandeiro");
    expect(BACKGROUND_ORIGIN_FEAT_ID.escriba).toBe("habilidoso");
    expect(BACKGROUND_ORIGIN_FEAT_ID.fazendeiro).toBe("vigoroso");
    expect(BACKGROUND_ORIGIN_FEAT_ID.guarda).toBe("alerta");
    expect(BACKGROUND_ORIGIN_FEAT_ID.guia).toBe("iniciado-em-magia");
    expect(BACKGROUND_ORIGIN_FEAT_ID.marinheiro).toBe("valentao-de-taverna");
    expect(BACKGROUND_ORIGIN_FEAT_ID.mercador).toBe("sortudo");
    expect(BACKGROUND_ORIGIN_FEAT_ID.nobre).toBe("habilidoso");
    expect(BACKGROUND_ORIGIN_FEAT_ID.sabio).toBe("iniciado-em-magia");
    expect(BACKGROUND_ORIGIN_FEAT_ID.soldado).toBe("atacante-selvagem");
  });
});

describe("isFeatRepeatable — só Habilidoso e Iniciado em Magia", () => {
  it("true para os 2 repetíveis", () => {
    expect(isFeatRepeatable("habilidoso")).toBe(true);
    expect(isFeatRepeatable("iniciado-em-magia")).toBe(true);
  });

  it("false para os outros 8", () => {
    for (const featId of ["alerta", "artifista", "atacante-selvagem", "curandeiro", "musico", "sortudo", "valentao-de-taverna", "vigoroso"]) {
      expect(isFeatRepeatable(featId)).toBe(false);
    }
  });
});

describe("getFeatAcquisitions — Antecedente + cada nível de ASI resolvido", () => {
  it("[] sem antecedente e sem ASI em modo feat", () => {
    expect(getFeatAcquisitions(createBlankCharacter("x"))).toEqual([]);
  });

  it("antecedente mapeado: 1 aquisição com acquisitionKey 'background'", () => {
    const character = withBackground("soldado");
    expect(getFeatAcquisitions(character)).toEqual([{ acquisitionKey: "background", featId: "atacante-selvagem" }]);
  });

  it("nível de ASI em modo 'feat' mas sem featId ainda escolhido: não conta como aquisição", () => {
    const character = withAsiFeat("mago", 4, null);
    expect(getFeatAcquisitions(character)).toEqual([]);
  });

  it("nível de ASI resolvido: 1 aquisição com acquisitionKey 'asi-{nível}'", () => {
    const character = withAsiFeat("mago", 4, "alerta");
    expect(getFeatAcquisitions(character)).toEqual([{ acquisitionKey: "asi-4", featId: "alerta" }]);
  });

  it("antecedente + múltiplos níveis de ASI resolvidos somam todas as aquisições, na ordem", () => {
    const character = withBackground("acolito");
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "sortudo" },
      8: { kind: "feat", featId: "vigoroso" },
    };
    expect(getFeatAcquisitions(character)).toEqual([
      { acquisitionKey: "background", featId: "iniciado-em-magia" },
      { acquisitionKey: "asi-4", featId: "sortudo" },
      { acquisitionKey: "asi-8", featId: "vigoroso" },
    ]);
  });

  it("nível de ASI em modo 'abilityIncrease' nunca vira aquisição de talento", () => {
    const character = withAsiFeat("mago", 4, "alerta");
    character.asiSelections[8] = { kind: "abilityIncrease", allocations: { FOR: 2 } };
    character.level = 8;
    expect(getFeatAcquisitions(character)).toEqual([{ acquisitionKey: "asi-4", featId: "alerta" }]);
  });
});

describe("isFeatActive / getFeatAcquisitionCount", () => {
  it("isFeatActive verdadeiro só quando há ao menos 1 aquisição", () => {
    const character = withBackground("soldado");
    expect(isFeatActive(character, "atacante-selvagem")).toBe(true);
    expect(isFeatActive(character, "alerta")).toBe(false);
  });

  it("getFeatAcquisitionCount conta aquisições repetidas do mesmo talento", () => {
    const character = withBackground("charlatao"); // Habilidoso
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    expect(getFeatAcquisitionCount(character, "habilidoso")).toBe(3); // background + 2 ASI
    expect(getFeatAcquisitionCount(character, "alerta")).toBe(0);
  });
});

describe("getAvailableFeatsForAsiLevel — exclui talento não-repetível já ativo em outra aquisição", () => {
  // Personagem em branco (todos os atributos 10, nenhuma proficiência de armadura): dos 36 do
  // catálogo, os 10 Talentos de Origem (sem pré-requisito) + os 12 Talentos Gerais sem
  // pré-requisito além do nível 4+ ficam disponíveis (22); os 14 restantes exigem atributo 13+ ou
  // treinamento de armadura que este personagem não tem — ver `rules/feats.test.ts` abaixo
  // ("meetsFeatPrerequisites") para a checagem individual de cada um.
  it("os 22 sem pré-requisito adicional disponíveis sem nenhuma outra aquisição ativa", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    expect(getAvailableFeatsForAsiLevel(character, 4)).toHaveLength(22);
  });

  it("exclui um talento não-repetível já concedido pelo Antecedente", () => {
    const character = withBackground("soldado"); // Atacante Selvagem
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    const available = getAvailableFeatsForAsiLevel(character, 4).map((f) => f.id);
    expect(available).not.toContain("atacante-selvagem");
    expect(available).toHaveLength(21);
  });

  it("nunca exclui o próprio talento já escolhido PARA ESTE nível", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "alerta" } };
    const available = getAvailableFeatsForAsiLevel(character, 4).map((f) => f.id);
    expect(available).toContain("alerta");
  });

  it("exclui um talento não-repetível já escolhido em OUTRO nível de ASI", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    character.level = 6;
    character.asiSelections = {
      4: { kind: "feat", featId: "vigoroso" },
      6: { kind: "feat", featId: null },
    };
    const available = getAvailableFeatsForAsiLevel(character, 6).map((f) => f.id);
    expect(available).not.toContain("vigoroso");
  });

  it("nunca exclui Habilidoso/Iniciado em Magia (repetíveis) mesmo já ativos em outra aquisição", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    character.level = 6;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      6: { kind: "feat", featId: null },
    };
    const available = getAvailableFeatsForAsiLevel(character, 6).map((f) => f.id);
    expect(available).toContain("habilidoso");
  });
});

describe("getMagicInitiateList — fixa pelo Antecedente, escolhida pela optionPick em aquisições de ASI", () => {
  it("Acólito -> Clérigo, Guia -> Druida, Sábio -> Mago, fixos", () => {
    expect(getMagicInitiateList(withBackground("acolito"), "background")).toBe("Clérigo");
    expect(getMagicInitiateList(withBackground("guia"), "background")).toBe("Druida");
    expect(getMagicInitiateList(withBackground("sabio"), "background")).toBe("Mago");
  });

  it("outro antecedente (sem Iniciado em Magia): null", () => {
    expect(getMagicInitiateList(withBackground("soldado"), "background")).toBeNull();
  });

  it("aquisição de ASI: lê a optionPick de lista já parametrizada", () => {
    const character = withAsiFeat("mago", 4, "iniciado-em-magia");
    expect(getMagicInitiateList(character, "asi-4")).toBeNull();
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-4")] = { value: "Druida" };
    expect(getMagicInitiateList(character, "asi-4")).toBe("Druida");
  });
});

describe("buildFeatAcquisitionFeature — Iniciado em Magia: Antecedente sem escolha de lista; ASI com lista restrita às ainda não usadas", () => {
  it("aquisição do Antecedente (Acólito) nunca tem a FeatureChoice de lista", () => {
    const character = withBackground("acolito");
    const feature = buildFeatAcquisitionFeature(character, { acquisitionKey: "background", featId: "iniciado-em-magia" })!;
    const choiceIds = (feature.choices ?? []).map((c) => c.id);
    expect(choiceIds.some((id) => id.startsWith(MAGIC_INITIATE_LIST_CHOICE_BASE_ID))).toBe(false);
    // Truques/magia/atributo continuam como escolhas do jogador.
    expect(feature.choices).toHaveLength(4);
  });

  it("aquisição por ASI tem a FeatureChoice de lista, com as 3 opções quando é a única aquisição", () => {
    const character = withAsiFeat("mago", 4, "iniciado-em-magia");
    const feature = buildFeatAcquisitionFeature(character, { acquisitionKey: "asi-4", featId: "iniciado-em-magia" })!;
    const listChoice = feature.choices!.find((c) => c.id === getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-4"))!;
    expect(listChoice.effect.kind).toBe("optionPick");
    expect(listChoice.effect.kind === "optionPick" && listChoice.effect.options).toEqual(["Clérigo", "Druida", "Mago"]);
  });

  it("aquisição por ASI exclui a lista já usada pela aquisição do Antecedente (Acólito -> Clérigo)", () => {
    const character = withBackground("acolito");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "iniciado-em-magia" } };
    const feature = buildFeatAcquisitionFeature(character, { acquisitionKey: "asi-4", featId: "iniciado-em-magia" })!;
    const listChoice = feature.choices!.find((c) => c.id === getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-4"))!;
    expect(listChoice.effect.kind === "optionPick" && listChoice.effect.options).toEqual(["Druida", "Mago"]);
  });

  it("exclui também a lista já escolhida por OUTRA aquisição de ASI, nunca a própria", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "iniciado-em-magia" },
      8: { kind: "feat", featId: "iniciado-em-magia" },
    };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-4")] = { value: "Mago" };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-8")] = { value: "Druida" };

    const feature8 = buildFeatAcquisitionFeature(character, { acquisitionKey: "asi-8", featId: "iniciado-em-magia" })!;
    const listChoice8 = feature8.choices!.find((c) => c.id === getFeatChoiceId(MAGIC_INITIATE_LIST_CHOICE_BASE_ID, "asi-8"))!;
    // Exclui "Mago" (usado pela aquisição asi-4) mas preserva "Druida" (a própria escolha atual desta aquisição).
    expect(listChoice8.effect.kind === "optionPick" && listChoice8.effect.options).toEqual(["Clérigo", "Druida"]);
  });

  it("talento desconhecido devolve null (nunca inventa)", () => {
    expect(buildFeatAcquisitionFeature(createBlankCharacter("x"), { acquisitionKey: "asi-4", featId: "talento-inexistente" })).toBeNull();
  });
});

describe("Habilidoso — cada aquisição repetível tem o id de FeatureChoice parametrizado, sem colidir entre si", () => {
  it("getChosenFeatFeatures devolve uma feature por aquisição, com ids de escolha independentes", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    const features = getChosenFeatFeatures(character);
    expect(features).toHaveLength(2);
    const choiceId4 = features[0].choices![0].id;
    const choiceId8 = features[1].choices![0].id;
    expect(choiceId4).not.toBe(choiceId8);
    expect(choiceId4).toBe(getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4"));
    expect(choiceId8).toBe(getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-8"));
  });

  it("selecionar perícias numa aquisição nunca vaza para a seleção da outra", () => {
    const character = createBlankCharacter("x");
    character.classId = "guerreiro";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4")] = { value: ["atletismo", "furtividade", "alaude"] };
    const features = getChosenFeatFeatures(character);
    const selectionFor8 = character.featureChoiceSelections[features[1].choices![0].id];
    expect(selectionFor8).toBeUndefined();
  });
});

describe("getBackgroundFeatures — mesclado com a aquisição mecânica real (nunca só o texto literal do originFeat)", () => {
  it("Soldado concede Atacante Selvagem com as escolhas reais (nenhuma, neste caso) e summary do catálogo", () => {
    const character = withBackground("soldado");
    const features = getBackgroundFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].id).toBe("antecedente-soldado-talento-origem");
    expect(features[0].sourceType).toBe("feat");
    expect(features[0].summary).toContain("dados de dano da arma duas vezes");
    expect(features[0].choices).toBeUndefined();
  });

  it("Artesão concede Artifista com as 3 escolhas de ferramenta (manualText, catálogo pendente)", () => {
    const character = withBackground("artesao");
    const features = getBackgroundFeatures(character);
    expect(features[0].choices).toHaveLength(3);
    expect(features[0].choices!.every((c) => c.effect.kind === "manualText")).toBe(true);
  });
});

describe("Getters de recurso — null/0 sem o talento ativo, resolvidos com ele", () => {
  it("getLuckyPointsMax = BP, só com Sortudo ativo", () => {
    const character = withBackground("andarilho"); // Sortudo
    character.level = 5; // BP 3
    expect(getLuckyPointsMax(character)).toBe(3);
    expect(getLuckyPointsMax(createBlankCharacter("x"))).toBeNull();
  });

  it("getMusicianAllyCount = BP, só com Músico ativo", () => {
    const character = withBackground("artista"); // Músico
    character.level = 9; // BP 4
    expect(getMusicianAllyCount(character)).toBe(4);
    expect(getMusicianAllyCount(createBlankCharacter("x"))).toBeNull();
  });

  it("getHealerKitHealingBonus = BP, só com Curandeiro ativo", () => {
    const character = withBackground("eremita"); // Curandeiro
    character.level = 1; // BP 2
    expect(getHealerKitHealingBonus(character)).toBe(2);
    expect(getHealerKitHealingBonus(createBlankCharacter("x"))).toBeNull();
  });

  it("getToughHpBonus = 2×nível, só com Vigoroso ativo; 0 sem o talento", () => {
    const character = withBackground("fazendeiro"); // Vigoroso
    character.level = 7;
    expect(getToughHpBonus(character)).toBe(14);
    expect(getToughHpBonus(createBlankCharacter("x"))).toBe(0);
  });

  it("getAlertInitiativeBonus = BP, só com Alerta ativo; 0 sem o talento", () => {
    const character = withBackground("guarda"); // Alerta
    character.level = 5; // BP 3
    expect(getAlertInitiativeBonus(character)).toBe(3);
    expect(getAlertInitiativeBonus(createBlankCharacter("x"))).toBe(0);
  });
});

describe("getUnarmedStrikeDamageDie — Valentão de Taverna, 1d4 ou o dado de Artes Marciais do Monge se maior", () => {
  it("null sem o talento ativo", () => {
    expect(getUnarmedStrikeDamageDie(createBlankCharacter("x"))).toBeNull();
  });

  it("4 com o talento ativo, sem ser Monge", () => {
    const character = withBackground("marinheiro"); // Valentão de Taverna
    expect(getUnarmedStrikeDamageDie(character)).toBe(4);
  });

  it("usa o dado de Artes Marciais do Monge quando maior que 4, nunca soma os dois", () => {
    const character = withBackground("marinheiro");
    character.classId = "monge";
    character.level = 1; // Artes Marciais = d6
    expect(getUnarmedStrikeDamageDie(character)).toBe(6);
  });

  it("acompanha a progressão do dado de Artes Marciais do Monge em níveis mais altos", () => {
    const character = withBackground("marinheiro");
    character.classId = "monge";
    character.level = 17; // Artes Marciais = d12
    expect(getUnarmedStrikeDamageDie(character)).toBe(12);
  });
});

describe("getActiveFeatIds", () => {
  it("lista plana dos featIds de todas as aquisições ativas", () => {
    const character = withBackground("acolito");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "sortudo" } };
    expect(getActiveFeatIds(character)).toEqual(["iniciado-em-magia", "sortudo"]);
  });
});
