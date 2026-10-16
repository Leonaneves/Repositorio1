import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  ARTIFISTA_TOOL_CHOICE_BASE_IDS,
  HABILIDOSO_CHOICE_BASE_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
  MUSICO_TOOL_CHOICE_BASE_ID,
} from "../data/features/feats.js";
import { getFeatChoiceId } from "./feats.js";
import { getFeatTalentEntries, getFeatToolProficiencyEntries } from "./featTalentEntries.js";

function withBackground(backgroundId: Character["backgroundId"], level = 1): Character {
  const character = createBlankCharacter("feat-talent-entries-test");
  character.backgroundId = backgroundId;
  character.level = level;
  return character;
}

/**
 * Testes dos 10 textos compactos de Talentos de Origem para a caixa
 * "Talentos" do PDF (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E
 * NO PDF" §14) — cada um conferido contra o modelo literal exato dado
 * pela fonte, com variáveis já resolvidas numericamente.
 */
describe("getFeatTalentEntries — []", () => {
  it("sem nenhuma aquisição ativa", () => {
    expect(getFeatTalentEntries(createBlankCharacter("x"))).toEqual([]);
  });
});

describe("Alerta", () => {
  it("texto literal, nunca repete '+BP Inic' (já calculado no campo Inic)", () => {
    const entries = getFeatTalentEntries(withBackground("guarda"));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      text: "Alerta: após jogar Inic, pode trocar com aliado voluntário, ambos sem Incapacitado",
      source: "feat",
    });
  });
});

describe("Artifista", () => {
  it("texto literal", () => {
    const entries = getFeatTalentEntries(withBackground("artesao"));
    expect(entries[0].text).toBe("Artifista: 20% desconto em itens não mágicos; DL fabrica 1 item da tabela, dura até prxm DL");
  });
});

describe("Atacante Selvagem", () => {
  it("texto literal", () => {
    const entries = getFeatTalentEntries(withBackground("soldado"));
    expect(entries[0].text).toBe("Atacante Selvagem: 1/turno, dano da arma 2 vezes, escolhe resultado");
  });
});

describe("Curandeiro", () => {
  it("2 linhas, {BP} resolvido numericamente", () => {
    const entries = getFeatTalentEntries(withBackground("eremita", 5)); // BP 3
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe(
      "Curandeiro: Usar Objeto, 1 uso do kit; alvo a 1,5m gasta Dado de PV e cura dado+3\nCura por magia/este talento: pode repetir 1, usa novo resultado",
    );
  });
});

describe("Habilidoso — colapsa em uma única linha, mesmo repetido", () => {
  it("1 aquisição: 'Habilidoso'", () => {
    const entries = getFeatTalentEntries(withBackground("charlatao"));
    expect(entries).toEqual([{ text: "Habilidoso", source: "feat" }]);
  });

  it("3 aquisições (Antecedente + 2 ASI): 'Habilidoso x3', uma única linha", () => {
    const character = withBackground("charlatao");
    character.classId = "guerreiro";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "habilidoso" },
      8: { kind: "feat", featId: "habilidoso" },
    };
    expect(getFeatTalentEntries(character)).toEqual([{ text: "Habilidoso x3", source: "feat" }]);
  });
});

describe("Iniciado em Magia — uma linha por aquisição, só quando lista e magia estão preenchidas", () => {
  it("aquisição do Antecedente (Acólito -> Clérigo) sem a magia ainda preenchida: nenhuma linha", () => {
    expect(getFeatTalentEntries(withBackground("acolito"))).toEqual([]);
  });

  it("aquisição do Antecedente com a magia preenchida: lista fixa + magia, [__]/DL", () => {
    const character = withBackground("acolito");
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "background")] = { value: "Escudo da Fé" };
    expect(getFeatTalentEntries(character)).toEqual([{ text: "Iniciado em Magia (Clérigo): Escudo da Fé sem espaço [__]/DL", source: "feat" }]);
  });

  it("2 aquisições (Antecedente + ASI, listas diferentes): 2 linhas, uma por aquisição", () => {
    const character = withBackground("guia"); // Druida
    character.classId = "mago";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "iniciado-em-magia" } };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "background")] = { value: "Enredar" };
    character.featureChoiceSelections["iniciado-em-magia-lista-asi-4"] = { value: "Mago" };
    character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, "asi-4")] = { value: "Mísseis Mágicos" };

    expect(getFeatTalentEntries(character)).toEqual([
      { text: "Iniciado em Magia (Druida): Enredar sem espaço [__]/DL", source: "feat" },
      { text: "Iniciado em Magia (Mago): Mísseis Mágicos sem espaço [__]/DL", source: "feat" },
    ]);
  });
});

describe("Músico", () => {
  it("{BP} resolvido numericamente", () => {
    const entries = getFeatTalentEntries(withBackground("artista", 9)); // BP 4
    expect(entries[0].text).toBe("Músico: DC/DL, tocar instrumento proficiente dá Inspiração Heroica a 4 aliados");
  });
});

describe("Sortudo — marcadores exatos por BP", () => {
  it("BP 2 (nível 1): 2 marcadores", () => {
    const entries = getFeatTalentEntries(withBackground("andarilho", 1));
    expect(entries[0].text).toBe("Sortudo: Vant em Teste de D20 ou Desv em Atq contra você [__] [__]/DL");
  });

  it("BP 6 (nível 17): 6 marcadores", () => {
    const entries = getFeatTalentEntries(withBackground("mercador", 17));
    expect(entries[0].text).toBe("Sortudo: Vant em Teste de D20 ou Desv em Atq contra você [__] [__] [__] [__] [__] [__]/DL");
  });
});

describe("Valentão de Taverna", () => {
  it("2 linhas; {danoDesarmado} = 1d4 + mod FOR, sem Monge", () => {
    const character = withBackground("marinheiro");
    character.abilities.FOR.score = 14; // +2
    const entries = getFeatTalentEntries(character);
    expect(entries[0].text).toBe(
      "Valentão de Taverna: dano desarmado repete 1, usa novo; 1/turno, acerto desarmado na ação Atacar empurra 1,5m\nDesarmado pode causar 1d4+2 Conc",
    );
  });

  it("usa o dado de Artes Marciais do Monge quando maior (nunca soma os dois)", () => {
    const character = withBackground("marinheiro");
    character.classId = "monge";
    character.level = 1; // Artes Marciais d6
    character.abilities.FOR.score = 10; // +0
    const entries = getFeatTalentEntries(character);
    expect(entries[0].text).toContain("1d6 Conc");
  });

  it("modificador de FOR negativo formatado corretamente", () => {
    const character = withBackground("marinheiro");
    character.abilities.FOR.score = 8; // -1
    const entries = getFeatTalentEntries(character);
    expect(entries[0].text).toContain("1d4-1 Conc");
  });
});

describe("Vigoroso", () => {
  it("texto literal, nunca repete o valor do bônus (já calculado em PV máximo)", () => {
    const entries = getFeatTalentEntries(withBackground("fazendeiro"));
    expect(entries).toEqual([{ text: "Vigoroso", source: "feat" }]);
  });
});

describe("Múltiplas aquisições na ordem correta, sem nenhuma repetida indevidamente", () => {
  it("Antecedente + 2 talentos escolhidos em ASI aparecem em ordem, cada um 1 vez", () => {
    const character = withBackground("guarda"); // Alerta
    character.classId = "guerreiro";
    character.level = 8;
    character.asiSelections = {
      4: { kind: "feat", featId: "vigoroso" },
      8: { kind: "feat", featId: "atacante-selvagem" },
    };
    const entries = getFeatTalentEntries(character);
    expect(entries.map((e) => e.text)).toEqual([
      "Alerta: após jogar Inic, pode trocar com aliado voluntário, ambos sem Incapacitado",
      "Vigoroso",
      "Atacante Selvagem: 1/turno, dano da arma 2 vezes, escolhe resultado",
    ]);
  });
});

/**
 * Nomes resolvidos de Ferramentas/Instrumentos concedidos por Talento —
 * único lugar onde essa proficiência é exibida (não há caixa de
 * checkboxes de ferramenta na etapa Perícias, diferente de perícias).
 */
describe("getFeatToolProficiencyEntries", () => {
  it("[] sem nenhuma aquisição que conceda ferramenta", () => {
    expect(getFeatToolProficiencyEntries(createBlankCharacter("x"))).toEqual([]);
  });

  it("Habilidoso: só perícias escolhidas → [] (nada de ferramenta a imprimir)", () => {
    const character = withBackground("charlatao");
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "background")] = {
      value: ["atletismo", "percepcao", "intimidacao"],
    };
    expect(getFeatToolProficiencyEntries(character)).toEqual([]);
  });

  it("Habilidoso: mistura de perícias e ferramentas → só as ferramentas aparecem, resolvidas pelo nome", () => {
    const character = withBackground("charlatao");
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "background")] = {
      value: ["atletismo", "ferramentas-ferreiro", "alaude"],
    };
    expect(getFeatToolProficiencyEntries(character)).toEqual([{ text: "Habilidoso: Ferramentas de Ferreiro, Alaúde", source: "feat" }]);
  });

  it("Habilidoso: duas aquisições com ferramentas diferentes → uma linha por aquisição", () => {
    const character = withBackground("charlatao");
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "habilidoso" } };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "background")] = { value: ["alaude", "atletismo", "percepcao"] };
    character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, "asi-4")] = { value: ["ferramentas-ferreiro", "intimidacao", "enganacao"] };
    expect(getFeatToolProficiencyEntries(character)).toEqual([
      { text: "Habilidoso: Alaúde", source: "feat" },
      { text: "Habilidoso: Ferramentas de Ferreiro", source: "feat" },
    ]);
  });

  it("Músico: 3 instrumentos escolhidos aparecem resolvidos pelo nome", () => {
    const character = withBackground("artista");
    character.featureChoiceSelections[getFeatChoiceId(MUSICO_TOOL_CHOICE_BASE_ID, "background")] = { value: ["alaude", "flauta", "tambor"] };
    expect(getFeatToolProficiencyEntries(character)).toEqual([{ text: "Músico: Alaúde, Flauta, Tambor", source: "feat" }]);
  });

  it("Artifista: as 3 ferramentas digitadas manualmente aparecem, na ordem preenchida", () => {
    const character = withBackground("artesao");
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "artifista" } };
    const [id1, id2, id3] = ARTIFISTA_TOOL_CHOICE_BASE_IDS;
    character.featureChoiceSelections[getFeatChoiceId(id1, "background")] = { value: "Ferramentas de Ferreiro" };
    character.featureChoiceSelections[getFeatChoiceId(id2, "background")] = { value: "Suprimentos de Alquimista" };
    character.featureChoiceSelections[getFeatChoiceId(id3, "background")] = { value: "Ferramentas de Carpinteiro" };
    expect(getFeatToolProficiencyEntries(character)).toEqual([
      { text: "Artifista: Ferramentas de Ferreiro, Suprimentos de Alquimista, Ferramentas de Carpinteiro", source: "feat" },
    ]);
  });

  it("Artifista: campos ainda não preenchidos não aparecem — nunca nome vazio/placeholder", () => {
    const character = withBackground("artesao");
    const [id1] = ARTIFISTA_TOOL_CHOICE_BASE_IDS;
    character.featureChoiceSelections[getFeatChoiceId(id1, "background")] = { value: "Ferramentas de Ferreiro" };
    expect(getFeatToolProficiencyEntries(character)).toEqual([{ text: "Artifista: Ferramentas de Ferreiro", source: "feat" }]);
  });
});
