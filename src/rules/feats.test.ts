import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { BACKGROUND_IDS } from "../domain/ids.js";
import {
  HABILIDOSO_CHOICE_BASE_ID,
  MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID,
  MAGIC_INITIATE_LIST_CHOICE_BASE_ID,
  ORIGIN_FEAT_IDS,
} from "../data/features/feats.js";
import {
  ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID,
  MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID,
  SORRATEIRO_FEAT_ID,
} from "../data/features/feats.js";
import { getBackgroundFeatures, getChosenFeatFeatures, getFeaturesAndTalentsStepFeatures } from "./features.js";
import {
  BACKGROUND_ORIGIN_FEAT_ID,
  buildFeatAcquisitionFeature,
  formatFeatIneligibilityReason,
  getActiveFeatIds,
  getElementalAdeptDamageType,
  getAlertInitiativeBonus,
  getAvailableFeatsForAsiLevel,
  getAvailableOriginFeatsForHumanSpecies,
  getChosenAsiFeatIneligibilityReasons,
  getFeatAcquisitionCount,
  getFeatAcquisitionFeatures,
  getFeatAcquisitions,
  getFeatCatalogForAsiLevel,
  getFeatChoiceId,
  getHealerKitHealingBonus,
  getLuckyPointsMax,
  getMagicInitiateList,
  getMusicianAllyCount,
  getToughHpBonus,
  getUnarmedStrikeDamageDie,
  hasHumanOriginFeatConflictWithBackground,
  hasSpellcastingOrPactMagicAt,
  isFeatActive,
  isFeatRepeatable,
  meetsFeatPrerequisites,
} from "./feats.js";

function withHumanOriginFeat(featId: string | null): Character {
  const character = createBlankCharacter("feats-test");
  character.speciesId = "humano";
  character.humanOriginFeatId = featId;
  return character;
}

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

  it("Humano com Talento de Origem escolhido (traço Versátil): 1 aquisição com acquisitionKey 'species' — fonte \"ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE\" §1", () => {
    const character = withHumanOriginFeat("alerta");
    expect(getFeatAcquisitions(character)).toEqual([{ acquisitionKey: "species", featId: "alerta" }]);
  });

  it("Humano sem escolha ainda (humanOriginFeatId null): nenhuma aquisição", () => {
    const character = withHumanOriginFeat(null);
    expect(getFeatAcquisitions(character)).toEqual([]);
  });

  it("humanOriginFeatId preenchido mas espécie NÃO é Humano: nunca conta como aquisição (ex.: troca de espécie já devia ter limpado, mas a função nunca confia só no campo)", () => {
    const character = withHumanOriginFeat("alerta");
    character.speciesId = "elfo";
    expect(getFeatAcquisitions(character)).toEqual([]);
  });

  it("Humano + Antecedente + ASI: as 3 origens somam aquisições independentes, na ordem (background, species, asi-N)", () => {
    const character = withHumanOriginFeat("vigoroso");
    character.backgroundId = "soldado"; // Atacante Selvagem
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "sortudo" } };
    expect(getFeatAcquisitions(character)).toEqual([
      { acquisitionKey: "background", featId: "atacante-selvagem" },
      { acquisitionKey: "species", featId: "vigoroso" },
      { acquisitionKey: "asi-4", featId: "sortudo" },
    ]);
  });
});

describe("getAvailableOriginFeatsForHumanSpecies — só os 10 Talentos de Origem, sem pré-requisito, cross-exclusão com Antecedente/ASI", () => {
  it("as 10 opções completas sem nenhuma outra aquisição ativa", () => {
    const character = withHumanOriginFeat(null);
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).toHaveLength(10);
    expect(available.sort()).toEqual([...ORIGIN_FEAT_IDS].sort());
  });

  it("nunca inclui nenhum dos 26 Talentos Gerais", () => {
    const character = withHumanOriginFeat(null);
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).not.toContain("resiliente");
    expect(available).not.toContain("velocista");
  });

  it("nunca exige pré-requisito de atributo/armadura — disponível mesmo com os 6 atributos no padrão (10) e sem nenhuma proficiência de armadura", () => {
    const character = withHumanOriginFeat(null); // createBlankCharacter já deixa tudo em 10, sem proficiências
    expect(getAvailableOriginFeatsForHumanSpecies(character)).toHaveLength(10);
  });

  it("exclui um Talento de Origem NÃO-repetível já concedido pelo Antecedente", () => {
    const character = withHumanOriginFeat(null);
    character.backgroundId = "soldado"; // Atacante Selvagem
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).not.toContain("atacante-selvagem");
    expect(available).toHaveLength(9);
  });

  it("exclui um Talento de Origem NÃO-repetível já escolhido em ASI", () => {
    const character = withHumanOriginFeat(null);
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "sortudo" } };
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).not.toContain("sortudo");
  });

  it("nunca exclui o próprio talento já escolhido pelo Humano (permite reabrir/editar)", () => {
    const character = withHumanOriginFeat("alerta");
    character.backgroundId = "guarda"; // guarda também concede Alerta — mesmo assim, a seleção ATUAL nunca some da lista
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).toContain("alerta");
  });

  it("nunca exclui Habilidoso/Iniciado em Magia (repetíveis) mesmo já ativos em outra aquisição", () => {
    const character = withHumanOriginFeat(null);
    character.backgroundId = "charlatao"; // Habilidoso
    const available = getAvailableOriginFeatsForHumanSpecies(character).map((f) => f.id);
    expect(available).toContain("habilidoso");
  });
});

describe("hasHumanOriginFeatConflictWithBackground — mesmo Talento de Origem não-repetível concedido pelas duas origens (fonte §3)", () => {
  it("false sem Humano, sem escolha, ou sem Antecedente", () => {
    expect(hasHumanOriginFeatConflictWithBackground(createBlankCharacter("x"))).toBe(false);
    expect(hasHumanOriginFeatConflictWithBackground(withHumanOriginFeat(null))).toBe(false);
    const semAntecedente = withHumanOriginFeat("alerta");
    expect(hasHumanOriginFeatConflictWithBackground(semAntecedente)).toBe(false);
  });

  it("false quando as duas origens concedem talentos DIFERENTES", () => {
    const character = withHumanOriginFeat("vigoroso");
    character.backgroundId = "soldado"; // Atacante Selvagem
    expect(hasHumanOriginFeatConflictWithBackground(character)).toBe(false);
  });

  it("true quando as duas origens concedem o MESMO talento não-repetível", () => {
    const character = withHumanOriginFeat("atacante-selvagem");
    character.backgroundId = "soldado"; // também Atacante Selvagem
    expect(hasHumanOriginFeatConflictWithBackground(character)).toBe(true);
  });

  it("false para talentos REPETÍVEIS mesmo quando as duas origens concedem o mesmo (Habilidoso/Iniciado em Magia são aquisições independentes)", () => {
    const habilidoso = withHumanOriginFeat("habilidoso");
    habilidoso.backgroundId = "charlatao"; // também Habilidoso
    expect(hasHumanOriginFeatConflictWithBackground(habilidoso)).toBe(false);

    const iniciado = withHumanOriginFeat("iniciado-em-magia");
    iniciado.backgroundId = "acolito"; // também Iniciado em Magia
    expect(hasHumanOriginFeatConflictWithBackground(iniciado)).toBe(false);
  });

  it("false se a espécie deixou de ser Humano (mesmo com humanOriginFeatId ainda preenchido)", () => {
    const character = withHumanOriginFeat("atacante-selvagem");
    character.backgroundId = "soldado";
    character.speciesId = "elfo";
    expect(hasHumanOriginFeatConflictWithBackground(character)).toBe(false);
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
  // Personagem em branco (todos os atributos 10, nenhuma proficiência de armadura), Mago: dos 39
  // do catálogo, os 10 Talentos de Origem (sem pré-requisito) + os 12 Talentos Gerais sem
  // pré-requisito além do nível 4+ + os 3 de Conjuração/Magia de Pacto (o Mago tem Conjuração)
  // ficam disponíveis (25); os 14 restantes exigem atributo 13+ ou treinamento de armadura que
  // este personagem não tem — ver `rules/feats.test.ts` abaixo
  // ("meetsFeatPrerequisites") para a checagem individual de cada um.
  it("os 25 sem pré-requisito pendente disponíveis sem nenhuma outra aquisição ativa", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    expect(getAvailableFeatsForAsiLevel(character, 4)).toHaveLength(25);
  });

  it("exclui um talento não-repetível já concedido pelo Antecedente", () => {
    const character = withBackground("soldado"); // Atacante Selvagem
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    const available = getAvailableFeatsForAsiLevel(character, 4).map((f) => f.id);
    expect(available).not.toContain("atacante-selvagem");
    expect(available).toHaveLength(24);
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

describe("buildFeatAcquisitionFeature — aquisição 'species' marcada com speciesId: \"humano\" (nunca as outras origens)", () => {
  it("marca speciesId: 'humano' só na aquisição 'species'", () => {
    const feature = buildFeatAcquisitionFeature(withHumanOriginFeat("alerta"), { acquisitionKey: "species", featId: "alerta" });
    expect(feature?.speciesId).toBe("humano");
    expect(feature?.sourceType).toBe("feat");
  });

  it("nunca marca speciesId na aquisição 'background' ou 'asi-N'", () => {
    const background = buildFeatAcquisitionFeature(withBackground("soldado"), { acquisitionKey: "background", featId: "atacante-selvagem" });
    expect(background?.speciesId).toBeUndefined();

    const asi = buildFeatAcquisitionFeature(withAsiFeat("mago", 4, "alerta"), { acquisitionKey: "asi-4", featId: "alerta" });
    expect(asi?.speciesId).toBeUndefined();
  });

  it("o marcador sobrevive aos 2 ramos especiais (Resiliente e Iniciado em Magia), não só ao caminho genérico", () => {
    const resiliente = buildFeatAcquisitionFeature(withHumanOriginFeat("resiliente"), { acquisitionKey: "species", featId: "resiliente" });
    expect(resiliente?.speciesId).toBe("humano");

    const iniciado = buildFeatAcquisitionFeature(withHumanOriginFeat("iniciado-em-magia"), { acquisitionKey: "species", featId: "iniciado-em-magia" });
    expect(iniciado?.speciesId).toBe("humano");
  });
});

describe("getFeatAcquisitionFeatures — inclui ASI e Humano, nunca o Antecedente (mesclado à parte por getBackgroundFeatures)", () => {
  it("inclui a aquisição 'species' do Humano", () => {
    const character = withHumanOriginFeat("vigoroso");
    const features = getFeatAcquisitionFeatures(character);
    expect(features).toHaveLength(1);
    expect(features[0].id).toBe("vigoroso-species");
    expect(features[0].speciesId).toBe("humano");
  });

  it("nunca inclui a aquisição do Antecedente, mesmo junto com a do Humano", () => {
    const character = withHumanOriginFeat("vigoroso");
    character.backgroundId = "soldado";
    const ids = getFeatAcquisitionFeatures(character).map((f) => f.id);
    expect(ids).toEqual(["vigoroso-species"]);
    expect(ids).not.toContain("atacante-selvagem-background");
  });
});

describe("getFeaturesAndTalentsStepFeatures — sempre inclui o Talento de Origem do Humano já escolhido, mesmo sem nenhuma escolha interna", () => {
  it("inclui um talento do Humano SEM choices (ex.: Alerta), que getOtherFeaturesWithNonSkillChoices sozinha excluiria", () => {
    const character = withHumanOriginFeat("alerta");
    const features = getFeaturesAndTalentsStepFeatures(character);
    expect(features.some((f) => f.sourceType === "feat" && f.speciesId === "humano")).toBe(true);
  });

  it("nunca duplica quando o talento do Humano JÁ tem choices não-perícia (ex.: Habilidoso) — só 1 entrada, nunca 2", () => {
    const character = withHumanOriginFeat("habilidoso");
    const features = getFeaturesAndTalentsStepFeatures(character);
    const humanEntries = features.filter((f) => f.sourceType === "feat" && f.speciesId === "humano");
    expect(humanEntries).toHaveLength(1);
  });

  it("nunca confunde com a feature de TRAÇOS do Humano (sourceType 'species', mesmo speciesId) — só sourceType 'feat' conta", () => {
    const character = withHumanOriginFeat("alerta");
    const features = getFeaturesAndTalentsStepFeatures(character);
    const tracos = features.find((f) => f.id === "especie-humano-tracos");
    expect(tracos).toBeUndefined(); // Traços de Humano não tem choices — nunca aparece aqui por si só
  });

  it("igual à base (getOtherFeaturesWithNonSkillChoices) quando não há Talento de Origem do Humano escolhido", () => {
    const character = createBlankCharacter("x");
    expect(getFeaturesAndTalentsStepFeatures(character)).toEqual([]);
  });

  it("igual à base para espécie diferente de Humano, mesmo com humanOriginFeatId preenchido por engano", () => {
    const character = withHumanOriginFeat("alerta");
    character.speciesId = "elfo";
    expect(getFeaturesAndTalentsStepFeatures(character)).toEqual([]);
  });
});

/**
 * Validação histórica por ordem de aquisição — fonte "REESTRUTURAR A
 * ESCOLHA DE TALENTOS PARA OCORRER APÓS OS ATRIBUTOS" §6: cada
 * pré-requisito é checado com o estado do personagem NO MOMENTO da
 * aquisição (nunca com um aumento de nível POSTERIOR, mesmo que já
 * esteja distribuído por o personagem ter sido criado direto num nível
 * alto), reproduzindo os exemplos explícitos da fonte.
 */
describe("meetsFeatPrerequisites/getFeatCatalogForAsiLevel — validação histórica por ordem de aquisição (atributo)", () => {
  function guerreiroWithDex(dex: number): Character {
    const character = createBlankCharacter("historical-order-test");
    character.classId = "guerreiro";
    character.level = 16;
    character.abilities = { ...character.abilities, DEX: { score: dex } };
    return character;
  }

  it("DEX 12 na criação: Sorrateiro (exige DEX 13) indisponível em QUALQUER nível de ASI sem nenhum aumento distribuído", () => {
    const character = guerreiroWithDex(12);
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-4")).toBe(false);
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-16")).toBe(false);
  });

  it("+1 DEX distribuído no nível 4 (Aumentar Atributos): Sorrateiro continua indisponível NO PRÓPRIO nível 4 (nunca usa o aumento do próprio nível para validar a aquisição deste MESMO nível), mas libera a partir do nível 6 em diante", () => {
    const character = guerreiroWithDex(12);
    character.asiSelections = { 4: { kind: "abilityIncrease", allocations: { DEX: 1, FOR: 1 } } };
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-4")).toBe(false);
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-6")).toBe(true);
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-8")).toBe(true);
  });

  it("um aumento escolhido no nível 8 NUNCA valida retroativamente a oportunidade do nível 4, mesmo com DEX 13 já no estado FINAL do personagem", () => {
    const character = guerreiroWithDex(12);
    character.asiSelections = { 8: { kind: "abilityIncrease", allocations: { DEX: 1, FOR: 1 } } };
    // Estado final (rules/abilities.ts) já reflete DEX 13 — mas a checagem histórica do nível 4
    // nunca pode usar essa contribuição, por vir de um nível POSTERIOR.
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-4")).toBe(false);
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-8")).toBe(false); // exclui a própria contribuição também
    expect(meetsFeatPrerequisites(character, SORRATEIRO_FEAT_ID, "asi-12")).toBe(true); // nível 8 já é passado para o 12
  });

  it("getFeatCatalogForAsiLevel reporta o motivo específico com o valor disponível NESTA aquisição, nunca o valor final", () => {
    const character = guerreiroWithDex(12);
    character.asiSelections = { 8: { kind: "abilityIncrease", allocations: { DEX: 1, FOR: 1 } } };
    const entry = getFeatCatalogForAsiLevel(character, 4).find((e) => e.feat.id === SORRATEIRO_FEAT_ID)!;
    expect(entry.eligible).toBe(false);
    expect(entry.reasons).toEqual([{ kind: "abilityBelowThreshold", required: 13, abilities: [{ ability: "DEX", available: 12 }] }]);
    expect(formatFeatIneligibilityReason(entry.reasons[0])).toBe("Requer Destreza 13; disponível nesta aquisição: 12.");

    const availableAt4 = getAvailableFeatsForAsiLevel(character, 4).map((f) => f.id);
    expect(availableAt4).not.toContain(SORRATEIRO_FEAT_ID);
    const availableAt12 = getAvailableFeatsForAsiLevel(character, 12).map((f) => f.id);
    expect(availableAt12).toContain(SORRATEIRO_FEAT_ID);
  });
});

describe("meetsFeatPrerequisites/getFeatCatalogForAsiLevel — validação histórica por ordem de aquisição (treinamento com armadura)", () => {
  function artificeAt(level: number): Character {
    const character = createBlankCharacter("historical-order-armor-test");
    character.classId = "artifice"; // base: leve + média + escudo, NUNCA pesada (único treinamento concedido por Talento no catálogo)
    character.level = level;
    return character;
  }

  it("sem Especialista em Armaduras Pesadas escolhido: Mestre em Armaduras Pesadas (exige Armadura Pesada) indisponível em qualquer nível", () => {
    const character = artificeAt(19);
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(false);
    const reasons = getFeatCatalogForAsiLevel(character, 4).find((e) => e.feat.id === MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID)!.reasons;
    expect(reasons).toEqual([{ kind: "missingArmorTraining", category: "heavy" }]);
    expect(formatFeatIneligibilityReason(reasons[0])).toBe("Requer treinamento com Armadura Pesada.");
  });

  it("Especialista em Armaduras Pesadas escolhido no nível 8 (concede Armadura Pesada): nunca valida retroativamente o nível 4, mas libera o nível 12 em diante", () => {
    const character = artificeAt(19);
    character.asiSelections = { 8: { kind: "feat", featId: ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID } };
    // O flat `armor.proficiencies.heavy` reflete a concessão (mesmo efeito de
    // `characterStore.ts#applyFeatArmorProficiencies`, chamado pelo setter real `setAsiFeat` — aqui
    // o personagem é construído direto, então o mesmo efeito é simulado manualmente).
    character.armor = { ...character.armor, proficiencies: { ...character.armor.proficiencies, heavy: true } };
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-4")).toBe(false);
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-12")).toBe(true);
    expect(meetsFeatPrerequisites(character, MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID, "asi-16")).toBe(true);
  });
});

/**
 * Recalculação/edição (fonte §9): reduzir um aumento de atributo
 * distribuído num nível anterior pode tornar um Talento JÁ ESCOLHIDO num
 * nível posterior incompatível — sinalizado (nunca apagado/substituído
 * sozinho).
 */
describe("getChosenAsiFeatIneligibilityReasons — recalculação/edição sem apagar a escolha (fonte §9)", () => {
  it("Sorrateiro escolhido no nível 8, validado pelo +1 DEX do nível 4: reduzir esse aumento invalida a escolha sem apagá-la", () => {
    const character = createBlankCharacter("recalc-test");
    character.classId = "guerreiro";
    character.level = 16;
    character.abilities = { ...character.abilities, DEX: { score: 12 } };
    character.asiSelections = {
      4: { kind: "abilityIncrease", allocations: { DEX: 1, FOR: 1 } },
      8: { kind: "feat", featId: SORRATEIRO_FEAT_ID },
    };
    expect(getChosenAsiFeatIneligibilityReasons(character, 8)).toEqual([]);

    // O jogador volta e reduz o aumento de DEX do nível 4 (ainda no mesmo nível, antes do 8) —
    // a escolha do nível 8 (Sorrateiro) permanece intocada, nunca apagada/substituída sozinha.
    const edited: Character = {
      ...character,
      asiSelections: { 4: { kind: "abilityIncrease", allocations: { FOR: 1 } }, 8: { kind: "feat", featId: SORRATEIRO_FEAT_ID } },
    };
    expect(edited.asiSelections[8]).toEqual({ kind: "feat", featId: SORRATEIRO_FEAT_ID });
    expect(getChosenAsiFeatIneligibilityReasons(edited, 8)).toEqual([{ kind: "abilityBelowThreshold", required: 13, abilities: [{ ability: "DEX", available: 12 }] }]);
  });

  it("[] quando o Talento escolhido continua elegível", () => {
    const character = createBlankCharacter("recalc-test");
    character.asiSelections = { 4: { kind: "feat", featId: "alerta" } };
    expect(getChosenAsiFeatIneligibilityReasons(character, 4)).toEqual([]);
  });

  it("[] quando o nível está no modo 'Aumentar Atributos' (nunca aplica a checagem de Talento)", () => {
    const character = createBlankCharacter("recalc-test");
    character.asiSelections = { 4: { kind: "abilityIncrease", allocations: {} } };
    expect(getChosenAsiFeatIneligibilityReasons(character, 4)).toEqual([]);
  });
});

describe("pré-requisito Conjuração ou Magia de Pacto (Adepto Elemental, Atirador de Magias, Conjurador de Guerra)", () => {
  const SPELLCASTING_FEATS = ["adepto-elemental", "atirador-de-magias", "conjurador-de-guerra"];

  function atAsi4(classId: Character["classId"], subclassId: string | null = null): Character {
    const character = createBlankCharacter("x");
    character.classId = classId;
    character.subclassId = subclassId;
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: null } };
    return character;
  }

  it.each(["artifice", "bardo", "bruxo", "clerigo", "druida", "feiticeiro", "mago", "paladino", "patrulheiro"] as const)("%s (Conjuração ou Magia de Pacto) vê os 3 talentos", (classId) => {
    const available = getAvailableFeatsForAsiLevel(atAsi4(classId), 4).map((feat) => feat.id);
    for (const featId of SPELLCASTING_FEATS) expect(available).toContain(featId);
  });

  it.each(["barbaro", "guerreiro", "ladino", "monge"] as const)("%s sem subclasse conjuradora não vê nenhum, com o motivo exato", (classId) => {
    const character = atAsi4(classId);
    const available = getAvailableFeatsForAsiLevel(character, 4).map((feat) => feat.id);
    for (const featId of SPELLCASTING_FEATS) expect(available).not.toContain(featId);
    const entry = getFeatCatalogForAsiLevel(character, 4).find((candidate) => candidate.feat.id === "conjurador-de-guerra")!;
    expect(entry.reasons).toEqual([{ kind: "missingSpellcasting" }]);
    expect(formatFeatIneligibilityReason(entry.reasons[0])).toBe("Requer a característica Conjuração ou Magia de Pacto (da classe ou da subclasse) neste nível.");
  });

  it("Cavaleiro Místico e Trapaceiro Arcano ganham Conjuração no nível 3 — elegíveis no ASI do nível 4", () => {
    expect(meetsFeatPrerequisites(atAsi4("guerreiro", "Cavaleiro Místico"), "atirador-de-magias", "asi-4")).toBe(true);
    expect(meetsFeatPrerequisites(atAsi4("ladino", "Trapaceiro Arcano"), "atirador-de-magias", "asi-4")).toBe(true);
    expect(meetsFeatPrerequisites(atAsi4("guerreiro", "Campeão"), "atirador-de-magias", "asi-4")).toBe(false);
  });

  it("checagem histórica: a característica precisa existir no nível da aquisição", () => {
    const eldritchKnight = atAsi4("guerreiro", "Cavaleiro Místico");
    expect(hasSpellcastingOrPactMagicAt(eldritchKnight, 2)).toBe(false);
    expect(hasSpellcastingOrPactMagicAt(eldritchKnight, 3)).toBe(true);
    expect(hasSpellcastingOrPactMagicAt(atAsi4("bruxo"), 1)).toBe(true);
  });

  it("Iniciado em Magia (Antecedente Sábio) não conta como a característica Conjuração", () => {
    const character = atAsi4("guerreiro");
    character.backgroundId = "sabio";
    expect(meetsFeatPrerequisites(character, "adepto-elemental", "asi-4")).toBe(false);
  });

  it("Adepto Elemental é repetível, mas cada aquisição domina um tipo de dano diferente", () => {
    expect(isFeatRepeatable("adepto-elemental")).toBe(true);
    expect(isFeatRepeatable("conjurador-de-guerra")).toBe(false);
    const character = atAsi4("feiticeiro");
    character.level = 8;
    character.asiSelections = { 4: { kind: "feat", featId: "adepto-elemental" }, 8: { kind: "feat", featId: null } };
    character.featureChoiceSelections[getFeatChoiceId("adepto-elemental-tipo-de-dano", "asi-4")] = { value: "Fogo" };
    expect(getAvailableFeatsForAsiLevel(character, 8).map((feat) => feat.id)).toContain("adepto-elemental");

    character.asiSelections[8] = { kind: "feat", featId: "adepto-elemental" };
    expect(getElementalAdeptDamageType(character, "asi-4")).toBe("Fogo");
    const second = buildFeatAcquisitionFeature(character, { acquisitionKey: "asi-8", featId: "adepto-elemental" })!;
    const damageChoice = second.choices!.find((choice) => choice.id === getFeatChoiceId("adepto-elemental-tipo-de-dano", "asi-8"))!;
    expect(damageChoice.effect).toEqual({ kind: "optionPick", options: ["Ácido", "Elétrico", "Frio", "Trovejante"] });
  });
});
