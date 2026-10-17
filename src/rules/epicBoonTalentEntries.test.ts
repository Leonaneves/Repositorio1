import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DA_FORTITUDE_FEAT_ID, DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID } from "../data/features/epicBoons.js";
import { getEpicBoonTalentEntries } from "./epicBoonTalentEntries.js";

function fighterAt(level: number) {
  const character = createBlankCharacter("epic-boon-talent-entries-test");
  character.classId = "guerreiro";
  character.level = level;
  return character;
}

function fighterWithBoon(boonName: string) {
  const character = fighterAt(19);
  character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: boonName };
  return character;
}

describe("getEpicBoonTalentEntries", () => {
  it("sem Dádiva Épica ativa — []", () => {
    expect(getEpicBoonTalentEntries(fighterAt(19))).toEqual([]);
  });

  it("nunca mais de uma entrada (só 1 Dádiva Épica pode estar ativa)", () => {
    const entries = getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Velocidade"));
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("feat");
  });

  it("Dádiva da Fortitude: modificador de CON resolvido, formatado com sinal (nunca '+-N')", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    character.abilities.CON.score = 16; // mod +3
    expect(getEpicBoonTalentEntries(character)).toEqual([
      { text: "Dádiva da Fortitude: ao curar, +3 PV; recarrega no início do seu turno", source: "feat" },
    ]);

    character.abilities.CON.score = 8; // mod -1
    expect(getEpicBoonTalentEntries(character)[0].text).toBe("Dádiva da Fortitude: ao curar, -1 PV; recarrega no início do seu turno");
  });

  it("Dádiva da Proeza em Combate: texto estático", () => {
    expect(getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Proeza em Combate"))).toEqual([
      { text: "Dádiva da Proeza em Combate: errou Atq, pode acertar; recarrega no início do seu turno", source: "feat" },
    ]);
  });

  it("Dádiva da Proficiência em Perícia: só o nome (benefícios já representados nos campos de Perícias)", () => {
    expect(getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Proficiência em Perícia"))).toEqual([
      { text: "Dádiva da Proficiência em Perícia", source: "feat" },
    ]);
  });

  it("Dádiva da Recordação de Magia: texto estático", () => {
    expect(getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Recordação de Magia"))).toEqual([
      { text: "Dádiva da Recordação de Magia: espaço de 1º-4º, joga 1d4; igual ao círculo usado: não gasta", source: "feat" },
    ]);
  });

  it("Dádiva da Recuperação: metade do PV máximo resolvida + exatamente 10 marcadores de Recuperar Vitalidade", () => {
    const character = fighterWithBoon("Dádiva da Recuperação");
    character.abilities.CON.score = 10; // mod 0
    const entries = getEpicBoonTalentEntries(character);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toContain("fica com 1 e cura 59 [__]/DL");
    const markerCount = (entries[0].text.match(/\[__\]/g) ?? []).length;
    expect(markerCount).toBe(1 + 10); // 1 de Até a Morte + 10 de Recuperar Vitalidade
    expect(entries[0].text).toContain("AB: gasta d10 e cura soma [__] [__] [__] [__] [__] [__] [__] [__] [__] [__]/DL");
  });

  it("Dádiva da Resistência à Energia: CD e dano resolvidos, nunca os tipos fixados no texto", () => {
    const character = fighterWithBoon("Dádiva da Resistência à Energia");
    character.abilities.CON.score = 16; // mod +3
    const entries = getEpicBoonTalentEntries(character);
    expect(entries).toEqual([
      {
        text: "Dádiva da Resistência à Energia: Res a 2 tipos, troca em DL\nSofreu dano escolhido: Reação, alvo a 18m faz Salv DEX CD 17; falha: 2d12+3 do mesmo tipo",
        source: "feat",
      },
    ]);
    expect(entries[0].text).not.toMatch(/Ácido|Elétrico|Frio|Fogo|Necrótico|Psíquico|Radiante|Trovão|Venenoso/);
  });

  it("Dádiva da Velocidade: texto só da Ação Bônus (o +9m já está no campo de Deslocamento, nunca repetido aqui)", () => {
    const entries = getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Velocidade"));
    expect(entries).toEqual([{ text: "Dádiva da Velocidade: AB Desengajar e encerra Imobilizado", source: "feat" }]);
    expect(entries[0].text).not.toContain("9m");
  });

  it("Dádiva da Viagem Dimensional: texto estático, mantém 'Usar Magia' (identifica o gatilho)", () => {
    const entries = getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Viagem Dimensional"));
    expect(entries[0].text).toBe("Dádiva da Viagem Dimensional: após ação Atacar/Usar Magia, teleporta 9m");
  });

  it("Dádiva da Visão Verdadeira: versão com resumo (sem campo de Sentidos no PDF)", () => {
    expect(getEpicBoonTalentEntries(fighterWithBoon("Dádiva da Visão Verdadeira"))).toEqual([
      { text: "Dádiva da Visão Verdadeira: Visão Verdadeira 18m", source: "feat" },
    ]);
  });

  it("Dádiva do Ataque Irresistível: valor do atributo resolvido — [] enquanto a escolha de atributo não foi respondida", () => {
    const withoutChoice = fighterWithBoon("Dádiva do Ataque Irresistível");
    expect(getEpicBoonTalentEntries(withoutChoice)).toEqual([]);

    const withChoice = fighterWithBoon("Dádiva do Ataque Irresistível");
    withChoice.abilities.FOR.score = 19; // efetivo 20 com o +1 da própria Dádiva
    withChoice.featureChoiceSelections[`${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`] = { value: "FOR" };
    expect(getEpicBoonTalentEntries(withChoice)).toEqual([
      { text: "Dádiva do Ataque Irresistível: Conc/Cort/Perf ignoram Res; 20 no d20 de Atq: +20 dano do mesmo tipo", source: "feat" },
    ]);
  });

  it("Dádiva do Destino: texto estático + exatamente 1 marcador", () => {
    const entries = getEpicBoonTalentEntries(fighterWithBoon("Dádiva do Destino"));
    expect(entries).toEqual([{ text: "Dádiva do Destino: Teste de D20 seu/outro a 18m, +2d4 ou -2d4 [__]; recupera em Inic/DC/DL", source: "feat" }]);
    expect((entries[0].text.match(/\[__\]/g) ?? []).length).toBe(1);
  });

  it("Dádiva do Espírito da Noite: texto estático", () => {
    expect(getEpicBoonTalentEntries(fighterWithBoon("Dádiva do Espírito da Noite"))).toEqual([
      {
        text: "Dádiva do Espírito da Noite: Meia-luz/Escuridão, AB Invisível até executar ação/AB/Reação; Res a danos exceto Psíquico/Radiante",
        source: "feat",
      },
    ]);
  });

  it("nenhuma abreviação nova nem variável literal ({}) chega ao texto de nenhuma das 12 dádivas", () => {
    const boons = [
      "Dádiva da Fortitude",
      "Dádiva da Proeza em Combate",
      "Dádiva da Proficiência em Perícia",
      "Dádiva da Recordação de Magia",
      "Dádiva da Recuperação",
      "Dádiva da Resistência à Energia",
      "Dádiva da Velocidade",
      "Dádiva da Viagem Dimensional",
      "Dádiva da Visão Verdadeira",
      "Dádiva do Destino",
      "Dádiva do Espírito da Noite",
    ];
    for (const boon of boons) {
      const character = fighterWithBoon(boon);
      character.abilities.CON.score = 14;
      for (const entry of getEpicBoonTalentEntries(character)) {
        expect(entry.text).not.toMatch(/\{[A-Za-zÀ-ú]+\}/);
      }
    }
  });
});

describe("getEpicBoonTalentEntries — nunca grava nada de volta no personagem", () => {
  it("chamar a função não altera featureChoiceSelections", () => {
    const character = fighterWithBoon("Dádiva da Fortitude");
    const before = JSON.stringify(character.featureChoiceSelections);
    getEpicBoonTalentEntries(character);
    expect(JSON.stringify(character.featureChoiceSelections)).toBe(before);
  });
});
