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
import { getFeatTalentEntries, getFeatToolProficiencyEntries, getFeatWeaponProficiencyEntries } from "./featTalentEntries.js";

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

/**
 * Textos literais dos 26 Talentos Gerais para a caixa "Talentos" do PDF
 * (fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §3-§28), com os
 * templates dados conferidos ao pé da letra.
 */
function withAsiTalent(featId: string, level = 4): Character {
  const character = createBlankCharacter("general-feat-talent-entries-test");
  character.classId = "guerreiro"; // ASI em 4/6/8/12/14/16
  character.level = level;
  character.asiSelections = { [level]: { kind: "feat", featId } };
  return character;
}

describe("Talentos Gerais — textos literais (fonte \"COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF\")", () => {
  it("Especialista em Armaduras Pesadas: só o nome (benefício já no checkbox PROF.pesa)", () => {
    expect(getFeatTalentEntries(withAsiTalent("especialista-armaduras-pesadas"))[0].text).toBe("Especialista em Armaduras Pesadas");
  });

  it("Especialista em Besta: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("especialista-besta"))[0].text).toBe(
      "Especialista em Besta: ignora Recarga/mão livre; sem Desv por inimigo a 1,5m; Atq adicional Leve soma atributo ao dano",
    );
  });

  it("Especialista em Perícia: só o nome", () => {
    expect(getFeatTalentEntries(withAsiTalent("especialista-pericia"))[0].text).toBe("Especialista em Perícia");
  });

  it("Exterminador de Conjuradores: texto literal, 1 marcador fixo", () => {
    expect(getFeatTalentEntries(withAsiTalent("exterminador-de-conjuradores"))[0].text).toBe(
      "Exterminador de Conjuradores: causar dano impõe Desv na Salv de Concent; falhou Salv INT/SAB/CAR: passa [__]/DC ou DL",
    );
  });

  it("Imobilizador: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("imobilizador"))[0].text).toBe(
      "Imobilizador: 1/turno, Atq Desarmado na ação Atacar: dano+Imobilizar; Vant contra seu alvo; mover alvo do seu tamanho ou menor sem custo extra",
    );
  });

  it("Líder Inspirador: {PVTempLider} resolvido (nível + mod do atributo escolhido)", () => {
    const character = withAsiTalent("lider-inspirador", 8);
    character.abilities.CAR.score = 16; // +3
    character.featureChoiceSelections["lider-inspirador-atributo-asi-8"] = { value: "CAR" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Líder Inspirador: DC/DL, atuação dá 11 PV Temp a até 6 aliados a 9m, incluindo você");
  });

  it("Mente Aguçada: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("mente-agucada"))[0].text).toBe("Mente Aguçada: AB Analisar");
  });

  it("Mestre das Armas: texto literal, nunca fixa a arma escolhida", () => {
    const character = withAsiTalent("mestre-das-armas");
    character.featureChoiceSelections["mestre-das-armas-nota-asi-4"] = { value: "Espada Longa" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Mestre das Armas: maestria em 1 arma proficiente Simples/Marcial, troca em DL");
  });

  it("Mestre em Armaduras Médias: só o nome (CA já calculada)", () => {
    expect(getFeatTalentEntries(withAsiTalent("mestre-em-armaduras-medias"))[0].text).toBe("Mestre em Armaduras Médias");
  });

  it("Mestre em Armaduras Pesadas: {BP} resolvido", () => {
    const character = withAsiTalent("mestre-em-armaduras-pesadas", 8); // nível 8 → BP 3
    expect(getFeatTalentEntries(character)[0].text).toBe("Mestre em Armaduras Pesadas: com Pesada, reduz 3 dano Conc/Cort/Perf de Atq");
  });

  it("Mestre em Armas de Haste: texto literal, sem variável", () => {
    expect(getFeatTalentEntries(withAsiTalent("mestre-em-armas-de-haste"))[0].text).toBe(
      "Mestre em Armas de Haste: Cajado/Lança ou Extensão+Pesada; após Atacar, AB Atq d4 Conc; Reação: Atq em quem entra no alcance",
    );
  });

  it("Mestre em Armas Grandes: {BP} resolvido", () => {
    const character = withAsiTalent("mestre-em-armas-grandes"); // nível 4 → BP 2
    expect(getFeatTalentEntries(character)[0].text).toBe(
      "Mestre em Armas Grandes: ação Atacar no seu turno, acerto com Pesada +2 dano; crítico/0 PV com arma corpo a corpo: AB Atq com ela",
    );
  });

  it("Mestre em Escudos: {CDEscudo} resolvido, 2 linhas", () => {
    const character = withAsiTalent("mestre-em-escudos");
    character.abilities.FOR.score = 16; // +3
    expect(getFeatTalentEntries(character)[0].text).toBe(
      "Mestre em Escudos: 1/turno, acerto corpo a corpo a 1,5m na ação Atacar: Salv FOR CD 13, falha: empurra 1,5m/Caído\nReação com Escudo: passou Salv DEX para 1/2 dano, sofre 0",
    );
  });

  it("Mestre-Atirador: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("mestre-atirador"))[0].text).toBe(
      "Mestre-Atirador: Atq à distância com arma ignora cobertura 1/2 e 3/4; armas à Distância sem Desv por inimigo a 1,5m ou alcance longo",
    );
  });

  it("Adepto Elemental: tipo de dano escolhido (ou [__] enquanto pendente)", () => {
    const character = withAsiTalent("adepto-elemental");
    expect(getFeatTalentEntries(character)[0].text).toBe("Adepto Elemental ([__]): magias ignoram Res; dano 1 vira 2");
    character.featureChoiceSelections["adepto-elemental-tipo-de-dano-asi-4"] = { value: "Frio" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Adepto Elemental (Frio): magias ignoram Res; dano 1 vira 2");
    // Nome antigo gravado por versões anteriores continua válido e sai com o nome atual.
    character.featureChoiceSelections["adepto-elemental-tipo-de-dano-asi-4"] = { value: "Trovejante" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Adepto Elemental (Trovão): magias ignoram Res; dano 1 vira 2");
  });

  it("Atirador Arcano e Conjurador Bélico (ids mantidos): textos literais", () => {
    expect(getFeatTalentEntries(withAsiTalent("atirador-de-magias"))[0].text).toBe(
      "Atirador Arcano: Atq de magia ignora cobertura 1/2 e 3/4, sem Desv por inimigo a 1,5m; alcance de 3m ou mais: +18m",
    );
    expect(getFeatTalentEntries(withAsiTalent("conjurador-de-guerra"))[0].text).toBe(
      "Conjurador Bélico: Vant Salv CON para Concent; Reação: troca Atq de Oport por magia de 1 ação só no alvo",
    );
  });

  it("Perfurador: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("perfurador"))[0].text).toBe("Perfurador: 1/turno, acerto Perf repete 1 dado de dano, usa novo; crítico Perf +1 dado");
  });

  it("Resiliente: só o nome", () => {
    expect(getFeatTalentEntries(withAsiTalent("resiliente"))[0].text).toBe("Resiliente");
  });

  it("Resistente: texto literal, nunca omitido (sem campo próprio de Vant em Salv Contra Morte)", () => {
    expect(getFeatTalentEntries(withAsiTalent("resistente"))[0].text).toBe("Resistente: Vant Salv Contra Morte; AB gasta Dado de PV e cura resultado");
  });

  it("Sentinela: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("sentinela"))[0].text).toBe(
      "Sentinela: Reação, Atq de Oport contra criatura a 1,5m que Desengaja/acerta outro alvo; acerto de Atq de Oport: Desl 0 até fim do turno",
    );
  });

  it("Sorrateiro: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("sorrateiro"))[0].text).toBe("Sorrateiro: Vant Furt ao Esconder em combate; Atq escondido que erra não revela localização");
  });

  it("Talhador: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("talhador"))[0].text).toBe("Talhador: 1/turno, acerto Cort: Desl -3m; crítico Cort: Desv nos Atq, ambos até início do prxm turno");
  });

  it("Telecinético: {CDTelecinetico} resolvido com o atributo ESCOLHIDO nesta aquisição", () => {
    const character = withAsiTalent("telecinetico");
    character.abilities.SAB.score = 14; // +2
    character.featureChoiceSelections["telecinetico-atributo-asi-4"] = { value: "SAB" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Telecinético: Mãos Mágicas Invisível, alcance/distância +9m; AB alvo a 9m, Salv FOR CD 12, falha: aproxima/afasta 1,5m");
  });

  it("Telecinético: [] enquanto a escolha de atributo não foi resolvida (CD ainda não existe)", () => {
    expect(getFeatTalentEntries(withAsiTalent("telecinetico"))).toEqual([]);
  });

  it("Telepático: texto literal, com marcador", () => {
    expect(getFeatTalentEntries(withAsiTalent("telepatico"))[0].text).toBe("Telepático: fala mental a 18m, idioma comum, sem resposta; Detectar Pensamentos [__]/DL");
  });

  it("Tocado Pelas Sombras: só Invisibilidade enquanto a magia escolhida não foi preenchida", () => {
    expect(getFeatTalentEntries(withAsiTalent("tocado-pelas-sombras"))[0].text).toBe("Tocado Pelas Sombras: Invisibilidade [__]/DL");
  });

  it("Tocado Pelas Sombras: as duas magias, cada uma com seu marcador, um único /DL final", () => {
    const character = withAsiTalent("tocado-pelas-sombras");
    character.featureChoiceSelections["tocado-pelas-sombras-magia-asi-4"] = { value: "Toque Chocante" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Tocado Pelas Sombras: Invisibilidade [__] Toque Chocante [__]/DL");
  });

  it("Tocado Por Fadas: as duas magias, cada uma com seu marcador, um único /DL final", () => {
    const character = withAsiTalent("tocado-por-fadas");
    character.featureChoiceSelections["tocado-por-fadas-magia-asi-4"] = { value: "Enfeitiçar Pessoa" };
    expect(getFeatTalentEntries(character)[0].text).toBe("Tocado Por Fadas: Passo Nebuloso [__] Enfeitiçar Pessoa [__]/DL");
  });

  it("Treinamento com Armas Marciais: só o nome na caixa Talentos (descrição vai para PROF.armas)", () => {
    expect(getFeatTalentEntries(withAsiTalent("treinamento-com-armas-marciais"))[0].text).toBe("Treinamento com Armas Marciais");
  });

  it("Treinamento com Armas Marciais: entra em PROF.armas via getFeatWeaponProficiencyEntries", () => {
    expect(getFeatWeaponProficiencyEntries(withAsiTalent("treinamento-com-armas-marciais"))).toEqual([
      { text: "Treinamento com Armas Marciais: Armas Marciais", source: "feat" },
    ]);
  });

  it("getFeatWeaponProficiencyEntries: [] sem nenhum talento que conceda arma", () => {
    expect(getFeatWeaponProficiencyEntries(createBlankCharacter("x"))).toEqual([]);
  });

  it("Velocista: texto literal", () => {
    expect(getFeatTalentEntries(withAsiTalent("velocista"))[0].text).toBe("Velocista: Correr ignora custo extra de Terreno Difícil no turno; Atq de Oport contra você têm Desv");
  });
});
