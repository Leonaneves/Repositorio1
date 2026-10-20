import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import type { AbilityKey } from "../domain/common.js";
import { generalFeats } from "../data/features/feats.js";
import { getAvailableArmor } from "./armor.js";
import { getFeatAutoPreparedSpells } from "./featAutoPreparedSpells.js";
import { getFeatTalentEntries, getFeatToolProficiencyEntries } from "./featTalentEntries.js";
import {
  buildFeatAcquisitionFeature,
  getAbilityScoreImprovementCount,
  getActorCd,
  getAvailableFeatsForAsiLevel,
  getFeatCatalogForAsiLevel,
  getFeatChoiceId,
  getPoisonerCd,
  hasArmorTraining,
  isFeatRepeatable,
  meetsFeatPrerequisites,
} from "./feats.js";
import { getEffectiveAbilityScore } from "./abilities.js";
import { getSkillExpertise, getSkillProficiency } from "./skills.js";
import { getClimbSpeed, getSpeed } from "./speed.js";
import { getKnownTools } from "./tools.js";

/**
 * Lote "IMPLEMENTAR TALENTOS GERAIS RESTANTES NO BUILDER E NO PDF" (§1–§20):
 * pré-requisitos, aumentos, repetição, perícias/ferramentas/armaduras
 * aplicadas aos campos próprios, valores dinâmicos e textos mínimos do PDF.
 */

const LOT_FEAT_NAMES = [
  "Adepto Elemental",
  "Agressor",
  "Analítico",
  "Atirador Arcano",
  "Atleta",
  "Ator",
  "Chef",
  "Combatente Montado",
  "Conjurador Bélico",
  "Conjurador Ritualista",
  "Duelista Defensivo",
  "Envenenador",
  "Esmagador",
  "Ambidestro",
  "Especialista em Armaduras Leves",
  "Especialista em Armaduras Médias",
];

function wizard(level = 4, scores: Partial<Record<AbilityKey, number>> = {}): Character {
  const character = createBlankCharacter("lote-talentos");
  character.classId = "mago";
  character.level = level;
  for (const [ability, score] of Object.entries(scores)) character.abilities[ability as AbilityKey].score = score;
  return character;
}

function withFeat(character: Character, level: number, featId: string): Character {
  character.asiSelections = { ...character.asiSelections, [level]: { kind: "feat", featId } };
  return character;
}

function pick(character: Character, baseId: string, acquisitionKey: string, value: string): void {
  character.featureChoiceSelections[getFeatChoiceId(baseId, acquisitionKey)] = { value };
}

function talentText(character: Character): string {
  return getFeatTalentEntries(character)
    .map((entry) => entry.text)
    .join("\n");
}

describe("catálogo do lote", () => {
  it("os 16 talentos estão cadastrados uma única vez, com aumento de atributo e descrição completa", () => {
    for (const name of LOT_FEAT_NAMES) {
      const matches = generalFeats.filter((feat) => feat.name === name);
      expect(matches, name).toHaveLength(1);
      expect(matches[0].summary.startsWith("Nível 4+."), name).toBe(true);
      expect(matches[0].choices?.some((choice) => choice.effect.kind === "abilityScoreIncrease"), name).toBe(true);
    }
  });

  it("só Adepto Elemental é repetível neste lote", () => {
    const repeatable = generalFeats.filter((feat) => LOT_FEAT_NAMES.includes(feat.name) && isFeatRepeatable(feat.id)).map((feat) => feat.name);
    expect(repeatable).toEqual(["Adepto Elemental"]);
  });
});

describe("pré-requisitos específicos (nível 4+ e o próprio aumento nunca conta)", () => {
  it.each([
    ["agressor", { FOR: 13 }, { DEX: 13 }],
    ["analitico", { INT: 13 }, { SAB: 13 }],
    ["atleta", { FOR: 13 }, { DEX: 13 }],
    ["ator", { CAR: 13 }, { CAR: 13 }],
    ["conjurador-ritualista", { INT: 13 }, { CAR: 13 }],
    ["duelista-defensivo", { DEX: 13 }, { DEX: 13 }],
    ["ambidestro", { FOR: 13 }, { DEX: 13 }],
  ] as const)("%s: indisponível com 12, disponível com 13 em qualquer atributo listado", (featId, first, second) => {
    expect(meetsFeatPrerequisites(withFeat(wizard(4), 4, featId), featId, "asi-4")).toBe(false);
    expect(meetsFeatPrerequisites(withFeat(wizard(4, first), 4, featId), featId, "asi-4")).toBe(true);
    expect(meetsFeatPrerequisites(withFeat(wizard(4, second), 4, featId), featId, "asi-4")).toBe(true);
  });

  it("o +1 do próprio Ator nunca cumpre o Carisma 13 dele", () => {
    const character = withFeat(wizard(4, { CAR: 12 }), 4, "ator");
    pick(character, "ator-atributo", "asi-4", "CAR");
    expect(getEffectiveAbilityScore(character, "CAR")).toBe(13);
    expect(meetsFeatPrerequisites(character, "ator", "asi-4")).toBe(false);
  });

  it("Chef, Combatente Montado, Envenenador, Esmagador e Especialista em Armaduras Leves não têm pré-requisito adicional", () => {
    const available = getAvailableFeatsForAsiLevel(withFeat(wizard(4), 4, "alerta"), 4).map((feat) => feat.id);
    for (const featId of ["chef", "combatente-montado", "envenenador", "esmagador", "especialista-armaduras-leves"]) expect(available).toContain(featId);
  });
});

describe("armaduras — Leves concede Leve + Escudos; Médias exige Leve e concede só Média", () => {
  it("Especialista em Armaduras Leves: campos de treinamento e armaduras elegíveis, sem equipar nada", () => {
    const character = withFeat(wizard(4), 4, "especialista-armaduras-leves");
    expect(hasArmorTraining(character, "light")).toBe(true);
    expect(hasArmorTraining(character, "shield")).toBe(true);
    expect(hasArmorTraining(character, "medium")).toBe(false);
    expect(getAvailableArmor(character).every((armor) => armor.category === "light")).toBe(true);
    expect(getAvailableArmor(character).length).toBeGreaterThan(0);
    expect(character.armor.equipped).toBe("unarmed");
    expect(character.armor.shield).toBe(false);
  });

  it("Especialista em Armaduras Médias exige treinamento com Armadura Leve NO MOMENTO da aquisição", () => {
    const medium = getFeatCatalogForAsiLevel(withFeat(wizard(4), 4, "alerta"), 4).find((entry) => entry.feat.id === "especialista-armaduras-medias")!;
    expect(medium.reasons).toEqual([{ kind: "missingArmorTraining", category: "light" }]);

    const lightFirst = withFeat(withFeat(wizard(8), 4, "especialista-armaduras-leves"), 8, "especialista-armaduras-medias");
    expect(meetsFeatPrerequisites(lightFirst, "especialista-armaduras-medias", "asi-8")).toBe(true);
    expect(hasArmorTraining(lightFirst, "medium")).toBe(true);

    const lightLater = withFeat(withFeat(wizard(8), 4, "especialista-armaduras-medias"), 8, "especialista-armaduras-leves");
    expect(meetsFeatPrerequisites(lightLater, "especialista-armaduras-medias", "asi-4")).toBe(false);
  });

  it("Médias nunca concede Escudos, mas preserva Escudos de outra origem; classe com Leve cumpre o pré-requisito", () => {
    const fighter = createBlankCharacter("lote-talentos");
    fighter.classId = "ladino"; // Armadura Leve pela classe, sem Escudo
    fighter.level = 4;
    fighter.armor.proficiencies = { light: true, medium: false, heavy: false, shield: false };
    withFeat(fighter, 4, "especialista-armaduras-medias");
    expect(meetsFeatPrerequisites(fighter, "especialista-armaduras-medias", "asi-4")).toBe(true);
    expect(hasArmorTraining(fighter, "medium")).toBe(true);
    expect(hasArmorTraining(fighter, "shield")).toBe(false);
    fighter.armor.proficiencies.shield = true;
    expect(hasArmorTraining(fighter, "shield")).toBe(true);
  });

  it("Especialista em Armaduras Pesadas e Mestre em Escudos passam a aceitar o treinamento concedido por talento anterior", () => {
    const character = withFeat(withFeat(wizard(8, { FOR: 13 }), 4, "especialista-armaduras-leves"), 8, "mestre-em-escudos");
    expect(meetsFeatPrerequisites(character, "mestre-em-escudos", "asi-8")).toBe(true);
  });
});

describe("Analítico — proficiência ou Especialização conforme outras fontes", () => {
  it("sem outra fonte: proficiência; com o Antecedente já dando Percepção: Especialização", () => {
    const character = withFeat(wizard(4, { SAB: 13 }), 4, "analitico");
    pick(character, "analitico-pericia", "asi-4", "percepcao");
    expect(getSkillProficiency(character, "percepcao")).toBe(true);
    expect(getSkillExpertise(character, "percepcao")).toBe(false);

    character.backgroundId = "escriba"; // Investigação, Percepção
    expect(getSkillExpertise(character, "percepcao")).toBe(true);
    character.backgroundId = null; // trocar o Antecedente recalcula
    expect(getSkillExpertise(character, "percepcao")).toBe(false);
  });

  it("Mente Aguçada e Analítico na mesma perícia: a segunda concessão vira Especialização", () => {
    const character = withFeat(withFeat(wizard(8, { INT: 13 }), 4, "mente-agucada"), 8, "analitico");
    pick(character, "mente-agucada-pericia", "asi-4", "investigacao");
    pick(character, "analitico-pericia", "asi-8", "investigacao");
    expect(getSkillExpertise(character, "investigacao")).toBe(true);
  });
});

describe("ferramentas, Escalada e magias aplicadas aos campos próprios", () => {
  it("Chef e Envenenador: ferramentas no campo de ferramentas (nunca o item físico)", () => {
    const character = withFeat(withFeat(wizard(8), 4, "chef"), 8, "envenenador");
    expect(getKnownTools(character)).toEqual(expect.arrayContaining(["utensilios-cozinheiro", "kit-veneno"]));
    expect(getFeatToolProficiencyEntries(character).map((entry) => entry.text)).toEqual(["Chef: Utensílios de Cozinheiro", "Envenenador: Kit de Veneno"]);
  });

  it("Atleta: Escalada igual ao Deslocamento e acompanha alterações dele", () => {
    const character = withFeat(wizard(4, { FOR: 13 }), 4, "atleta");
    expect(getClimbSpeed(character)!.total).toBe(getSpeed(character).total);
    character.speed.manualAdjustment = 3;
    expect(getClimbSpeed(character)!.total).toBe(getSpeed(character).total);
    expect(talentText(character)).toBe(`Atleta: Escalada ${getSpeed(character).total}m; levantar custa 1,5m; saltos com corrida após 1,5m`);
    expect(getClimbSpeed(wizard(4))).toBeNull();
  });

  it("Conjurador Ritualista: BP escolhas de magia, acompanhando o BP, sempre preparadas e marcadas como Ritual", () => {
    const character = withFeat(wizard(4, { INT: 13 }), 4, "conjurador-ritualista");
    const spellChoices = (c: Character) =>
      buildFeatAcquisitionFeature(c, { acquisitionKey: "asi-4", featId: "conjurador-ritualista" })!.choices!.filter((choice) => choice.effect.kind === "manualText");
    expect(spellChoices(character)).toHaveLength(2); // BP 2
    pick(character, "conjurador-ritualista-atributo", "asi-4", "INT");
    pick(character, "conjurador-ritualista-magia-1", "asi-4", "Detectar Magia");
    pick(character, "conjurador-ritualista-magia-2", "asi-4", "Detectar Magia");
    expect(getFeatAutoPreparedSpells(character).map((spell) => [spell.name, spell.ritual])).toEqual([["Detectar Magia", true]]); // magias diferentes
    character.level = 5;
    expect(spellChoices(character)).toHaveLength(3); // BP 3: uma escolha nova
    expect(talentText(character)).toBe("Conjurador Ritualista: Ritual preparado no tempo normal sem espaço [__]/DL");
  });
});

describe("valores dinâmicos resolvidos e textos mínimos do PDF", () => {
  it("Ator: CD 8 + mod CAR + BP (nunca o atributo de conjuração)", () => {
    const character = withFeat(wizard(4, { CAR: 14, INT: 18 }), 4, "ator");
    pick(character, "ator-atributo", "asi-4", "CAR");
    expect(getActorCd(character)).toBe(8 + 2 + 2);
    expect(talentText(character)).toBe("Ator: disfarçado, Vant Atuação/Enganação para personificar; imita sons, Intuição CD 12 identifica");
  });

  it("Envenenador: CD pelo atributo AUMENTADO (DEX ou INT), nunca o maior automaticamente", () => {
    const character = withFeat(wizard(8, { DEX: 14, INT: 18 }), 8, "envenenador");
    pick(character, "envenenador-atributo", "asi-8", "DEX");
    expect(getPoisonerCd(character)).toBe(8 + 2 + 3); // DEX 15 → +2, BP 3
    expect(talentText(character)).toBe(
      "Envenenador: ignora Res Venenoso; 1h+50 PO: 3 doses\nAB aplicar, 1min ou até dar dano; Salv CON CD 13, falha: 2d8 Venenoso e Envenenado até fim do prxm turno",
    );
  });

  it("Chef e Duelista Defensivo acompanham o BP", () => {
    expect(talentText(withFeat(wizard(5), 4, "chef"))).toBe("Chef: DC, comida para 7; gastar Dado de PV cura +1d8\n1h/DL: 3 guloseimas por 8h; AB comer: 3 PV Temp");
    expect(talentText(withFeat(wizard(9, { DEX: 13 }), 8, "duelista-defensivo"))).toBe(
      "Duelista Defensivo: com arma de Acuidade, Reação ao acerto: +4 CA contra corpo a corpo até prxm turno",
    );
  });

  it("Adepto Elemental repetido: uma entrada por aquisição, cada uma com seu tipo", () => {
    const character = withFeat(withFeat(wizard(8), 4, "adepto-elemental"), 8, "adepto-elemental");
    pick(character, "adepto-elemental-tipo-de-dano", "asi-4", "Fogo");
    pick(character, "adepto-elemental-tipo-de-dano", "asi-8", "Frio");
    expect(talentText(character)).toBe("Adepto Elemental (Fogo): magias ignoram Res; dano 1 vira 2\nAdepto Elemental (Frio): magias ignoram Res; dano 1 vira 2");
  });

  it("textos literais dos demais talentos do lote", () => {
    const cases: [string, string][] = [
      ["agressor", "Agressor: Correr +3m; 1/turno, avançar 3m reto e acertar corpo a corpo na ação Atacar: +1d8 ou empurra 3m"],
      ["analitico", "Analítico: AB Procurar"],
      [
        "combatente-montado",
        "Combatente Montado: Vant contra alvo desmontado menor que montaria a 1,5m dela\nMontaria, Salv DEX para 1/2 dano: sucesso 0, falha 1/2; pode receber Atq que a atinja",
      ],
      ["esmagador", "Esmagador: 1/turno, acerto Conc move alvo 1,5m; crítico Conc: Vant contra alvo até início do prxm turno"],
      ["ambidestro", "Ambidestro: Atacar com Leve: AB Atq com outra arma corpo a corpo sem Duas Mãos; dano sem atributo positivo\nSaca/guarda 2 armas sem Duas Mãos"],
      ["especialista-armaduras-leves", "Especialista em Armaduras Leves"],
      ["especialista-armaduras-medias", "Especialista em Armaduras Médias"],
    ];
    for (const [featId, text] of cases) expect(talentText(withFeat(wizard(4), 4, featId))).toBe(text);
  });

  it("Aumento no Valor de Atributo: só o nome, com a quantidade de aquisições quando repetido", () => {
    const character = wizard(8);
    character.asiSelections = { 4: { kind: "abilityIncrease", allocations: { INT: 2 } } };
    expect(getAbilityScoreImprovementCount(character)).toBe(1);
    expect(talentText(character)).toBe("Aumento no Valor de Atributo");
    character.asiSelections[8] = { kind: "abilityIncrease", allocations: { INT: 1, CON: 1 } };
    expect(talentText(character)).toBe("Aumento no Valor de Atributo x2");
  });

  it("nenhum texto do lote menciona componentes, Incapacitado nem deixa variável literal", () => {
    const character = wizard(20, { FOR: 13, DEX: 13, INT: 13, CAR: 13 });
    const featIds = ["agressor", "ator", "chef", "combatente-montado", "conjurador-de-guerra", "envenenador", "ambidestro", "atleta", "conjurador-ritualista"];
    featIds.forEach((featId, index) => {
      const level = 4 + index; // níveis fictícios distintos, só para várias aquisições simultâneas
      withFeat(character, level, featId);
      pick(character, `${featId}-atributo`, `asi-${level}`, featId === "envenenador" ? "DEX" : featId === "ator" ? "CAR" : "INT");
    });
    const text = talentText(character);
    expect(text).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
    expect(text).not.toMatch(/Incapacitado|componente|Somátic/i);
  });
});
