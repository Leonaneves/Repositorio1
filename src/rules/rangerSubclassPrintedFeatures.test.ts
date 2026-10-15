import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getRangerPrintedBlocks } from "./rangerPrintedFeatures.js";
import { getRangerSubclassPrintedBlocks } from "./rangerSubclassPrintedFeatures.js";

function rangerAt(level: number, subclassFullName: string | null, wisdom = 16, charisma = 14): Character {
  const character = createBlankCharacter("ranger-print-test");
  character.classId = "patrulheiro";
  character.level = level;
  character.subclassId = subclassFullName;
  character.abilities.SAB.score = wisdom;
  character.abilities.CAR.score = charisma;
  return character;
}

const BANNED_PATTERN = /→|½|×|≥|≤|±|\{[A-Za-zÀ-ú]+\}/;

describe("getRangerPrintedBlocks — classe errada ou classe base sem subclasse", () => {
  it("devolve [] para qualquer classe que não seja Patrulheiro", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 10;
    expect(getRangerPrintedBlocks(mago)).toEqual([]);
  });

  it("devolve os blocos da classe BASE (fonte \"COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF\") mesmo sem subclasse escolhida", () => {
    const blocks = getRangerPrintedBlocks(rangerAt(5, null));
    expect(blocks.some((b) => b.startsWith("# MAESTRIA EM ARMA"))).toBe(true);
    expect(blocks.some((b) => b.startsWith("# MARCA DO PREDADOR"))).toBe(true);
  });

  it("devolve [] para qualquer nome de subclasse não reconhecido — só os blocos de SUBCLASSE, nunca a classe base", () => {
    expect(getRangerSubclassPrintedBlocks(rangerAt(10, "Guardião Oco"))).toEqual([]);
  });
});

describe("Andarilho Feérico", () => {
  it("nível 3: só Glamour Transcendental e Golpes Terríveis (1d4)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Andarilho Feérico", 16));
    expect(blocks).toEqual([
      "# GLAMOUR TRANSCENDENTAL\n> Testes de CAR +3 (já incluso nas perícias)",
      "# GOLPES TERRÍVEIS\n> Acerto com arma: 1/turno +1d4 Psíquico",
    ]);
  });

  it("nível 7: soma Detalhe Sedutor, com a CD de conjuração do Patrulheiro", () => {
    const character = rangerAt(7, "Andarilho Feérico", 16); // SAB +3, prof +3 => CD 14
    const blocks = getRangerSubclassPrintedBlocks(character);
    const detalhe = blocks.find((b) => b.startsWith("# DETALHE SEDUTOR"))!;
    expect(detalhe).toBe(
      [
        "# DETALHE SEDUTOR",
        "> Vant contra Amedrontado/Enfeitiçado",
        "> Você/criatura à vista a 36m passa nessa Salv: Reação, outra a 36m faz Salv SAB CD 14",
        "> Falha: Amedrontada ou Enfeitiçada 1min; repete Salv ao fim do turno",
      ].join("\n"),
    );
  });

  it("nível 6: ainda sem Detalhe Sedutor (chega só no 7)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(6, "Andarilho Feérico"));
    expect(blocks.some((b) => b.startsWith("# DETALHE SEDUTOR"))).toBe(false);
  });

  it("nível 11: Golpes Terríveis passa a 1d6 (nunca mostra 1d4 e 1d6 juntos) e soma Reforços Feéricos", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(11, "Andarilho Feérico"));
    const golpes = blocks.find((b) => b.startsWith("# GOLPES TERRÍVEIS"))!;
    expect(golpes).toBe("# GOLPES TERRÍVEIS\n> Acerto com arma: 1/turno +1d6 Psíquico");
    expect(golpes).not.toContain("1d4");
    expect(blocks).toContain("# REFORÇOS FEÉRICOS\n> Convocar Feérico sem espaço [__]/DL\n> Pode ser sem Concentração: dura 1min");
  });

  it("nível 15: soma Andarilho Nebuloso com marcadores = máximo(1, mod SAB)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Andarilho Feérico", 16)); // SAB +3
    expect(blocks).toContain(
      "# ANDARILHO NEBULOSO\n> Passo Nebuloso [__][__][__]/DL\n> pode levar 1 voluntário a 1,5m para a 1,5m do destino",
    );
  });

  it("SAB 20 (mod +5): 5 marcadores em Andarilho Nebuloso e bônus de Glamour +5 — caso explícito de legibilidade com 5 marcadores", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Andarilho Feérico", 20));
    expect(blocks).toContain("# GLAMOUR TRANSCENDENTAL\n> Testes de CAR +5 (já incluso nas perícias)");
    expect(blocks.some((b) => b.includes("[__][__][__][__][__]/DL"))).toBe(true);
  });

  it("SAB 10 (mod +0): nunca menos que 1 marcador/bônus — piso sempre +1", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Andarilho Feérico", 10));
    expect(blocks).toContain("# GLAMOUR TRANSCENDENTAL\n> Testes de CAR +1 (já incluso nas perícias)");
    expect(blocks.some((b) => b.includes("Passo Nebuloso [__]/DL"))).toBe(true);
  });

  it("ordem sempre: Glamour, Golpes Terríveis, Detalhe Sedutor, Reforços Feéricos, Andarilho Nebuloso", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Andarilho Feérico"));
    const headers = blocks.map((b) => b.split("\n")[0]);
    expect(headers).toEqual([
      "# GLAMOUR TRANSCENDENTAL",
      "# GOLPES TERRÍVEIS",
      "# DETALHE SEDUTOR",
      "# REFORÇOS FEÉRICOS",
      "# ANDARILHO NEBULOSO",
    ]);
  });

  it("nunca imprime a proficiência escolhida em Glamour Transcendental (já aparece nas perícias)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Andarilho Feérico"));
    const joined = blocks.join("\n");
    expect(joined).not.toContain("Atuação");
    expect(joined).not.toContain("Enganação");
    expect(joined).not.toContain("Persuasão");
  });

  it("nenhuma {Variável} literal nem símbolo banido, em nenhum nível de 3 a 20", () => {
    for (const level of [3, 7, 11, 15, 20]) {
      const joined = getRangerSubclassPrintedBlocks(rangerAt(level, "Andarilho Feérico")).join("\n");
      expect(joined).not.toMatch(BANNED_PATTERN);
    }
  });
});

describe("Caçador — blocos próprios (sem Marca do Predador, agora fundida na classe base)", () => {
  it("nível 3: só Presa do Caçador", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Caçador"));
    expect(blocks).toEqual([
      [
        "# PRESA DO CAÇADOR",
        "> Escolha 1; troca em DC/DL",
        "> 1: Acerto com arma contra alvo abaixo dos PV máximos: +1d8, 1/turno",
        "> 2: 1/turno: +1 atq (mesma arma) contra outro alvo a 1,5m do original que ainda não atacado nesse turno",
      ].join("\n"),
    ]);
  });

  it("nível 7: soma Táticas Defensivas", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(7, "Caçador"));
    expect(blocks).toContain(
      [
        "# TÁTICAS DEFENSIVAS",
        "> Escolha 1; troca em DC/DL",
        "> 1: Quem acertar você tem Desv nos demais atq contra você nesse turno",
        "> 2: Atq de Oport contra você: Desv",
      ].join("\n"),
    );
  });

  it("nível 15: soma Defesa do Caçador Superior, mantendo a ordem Presa/Táticas/Defesa", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Caçador"));
    const headers = blocks.map((b) => b.split("\n")[0]);
    expect(headers).toEqual(["# PRESA DO CAÇADOR", "# TÁTICAS DEFENSIVAS", "# DEFESA DO CAÇADOR SUPERIOR"]);
  });

  it("Presa do Caçador e Táticas Defensivas nunca fixam uma opção escolhida — sempre mostram as 2 alternativas como referência", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Caçador"));
    const presa = blocks.find((b) => b.startsWith("# PRESA DO CAÇADOR"))!;
    expect(presa).toContain("1: Acerto com arma");
    expect(presa).toContain("2: 1/turno: +1 atq");
  });

  it("nenhuma {Variável} literal nem símbolo banido", () => {
    for (const level of [3, 7, 11, 15]) {
      expect(getRangerSubclassPrintedBlocks(rangerAt(level, "Caçador")).join("\n")).not.toMatch(BANNED_PATTERN);
    }
  });
});

describe("Caçador — integração no bloco único 'Marca do Predador' da classe base (fonte \"COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF\" §7)", () => {
  it("nível 3: bloco único com a linha-base e a linha de Imunidades do Caçador, sem a linha do nível 11", () => {
    const blocks = getRangerPrintedBlocks(rangerAt(3, "Caçador"));
    const marca = blocks.find((b) => b.startsWith("# MARCA DO PREDADOR"))!;
    expect(marca).toBe(
      ["# MARCA DO PREDADOR", "> Sem espaço [__] [__]/DL | Dano 1d6", "> Sabe Imunidades, Resistências e Vulnerabilidades do alvo"].join(
        "\n",
      ),
    );
    expect(blocks.filter((b) => b.startsWith("# MARCA DO PREDADOR"))).toHaveLength(1); // nunca dois títulos
  });

  it("nível 11: soma a linha de dano em outro alvo, no MESMO bloco (nunca duplicado)", () => {
    const blocks = getRangerPrintedBlocks(rangerAt(11, "Caçador"));
    const marca = blocks.find((b) => b.startsWith("# MARCA DO PREDADOR"))!;
    expect(marca).toBe(
      [
        "# MARCA DO PREDADOR",
        "> Sem espaço [__] [__] [__] [__]/DL | Dano 1d6",
        "> Sabe Imunidades, Resistências e Vulnerabilidades do alvo",
        "> 1/turno, ao causar dano ao marcado: dano da marca em outro alvo 9m dele",
      ].join("\n"),
    );
    expect(blocks.filter((b) => b.startsWith("# MARCA DO PREDADOR"))).toHaveLength(1);
  });
});

describe("Senhor das Feras — sem ficha de criatura, nunca gera escolha de animal/aparência", () => {
  it("nível 3: bloco base de Companheiro Primal, comando simples (1 Golpe da Fera)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Senhor das Feras"));
    expect(blocks).toEqual([
      [
        "# COMPANHEIRO PRIMAL",
        "> Age no seu turno; move e usa Reação; sem comando: Esquivar",
        "> AB: ordenar ação | Trocar 1 atq da ação Atacar: Golpe da Fera",
        "> Você Incapacitado: age sozinha; você morre: desaparece",
        "> Morta há 1h ou menos: Usar Magia + toque + 1 espaço; revive em 1min, PV completos",
        "> DL: pode reinvocar a 1,5m",
      ].join("\n"),
    ]);
  });

  it("nível 7: insere Treinamento Excepcional imediatamente após a linha de comando, no MESMO bloco", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(7, "Senhor das Feras"));
    expect(blocks).toHaveLength(1); // nunca um título separado
    const lines = blocks[0].split("\n");
    expect(lines[2]).toBe("> AB: ordenar ação | Trocar 1 atq da ação Atacar: Golpe da Fera"); // linha de comando
    expect(lines[3]).toBe("> Comando com AB: fera também usa AB para Ajudar/Correr/Desengajar/Esquivar");
    expect(lines[4]).toBe("> Acerto da fera: pode trocar dano por Energético");
  });

  it("nível 11: comando passa a '2 Golpe da Fera' (substitui, nunca soma as duas versões) e insere a linha de dano Energético da marca logo depois do bloco do nível 7", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(11, "Senhor das Feras"));
    const lines = blocks[0].split("\n");
    expect(lines[2]).toBe("> AB: ordenar ação | Trocar 1 atq da ação Atacar: 2 Golpe da Fera");
    expect(lines).not.toContain("> AB: ordenar ação | Trocar 1 atq da ação Atacar: Golpe da Fera");
    expect(lines[5]).toBe("> 1º acerto/turno no marcado: +dano da Marca do Predador, Energético");
  });

  it("nível 15: soma o bloco separado de Compartilhar Magias, depois de Companheiro Primal", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Senhor das Feras"));
    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toBe("# COMPARTILHAR MAGIAS\n> Magia em si pode também afetar a fera a 9m");
  });

  it("nenhum bloco contém ficha de criatura (sem ND/CA/PV numéricos de estatística, sem nome de animal)", () => {
    const joined = getRangerSubclassPrintedBlocks(rangerAt(15, "Senhor das Feras")).join("\n");
    expect(joined).not.toMatch(/\bND\b|\bCA \d|\bPV \d/);
    expect(joined).not.toMatch(/Lobo|Urso|Águia|Corvo|Pantera/i);
  });

  it("nenhuma {Variável} literal nem símbolo banido", () => {
    for (const level of [3, 7, 11, 15]) {
      expect(getRangerSubclassPrintedBlocks(rangerAt(level, "Senhor das Feras")).join("\n")).not.toMatch(BANNED_PATTERN);
    }
  });
});

describe("Vigilante das Sombras — ordem fixa (nunca só por nível de aquisição)", () => {
  it("nível 3: Emboscador das Sombras (2d6) e Visão Umbrosa, nunca Torrente nem Esquiva", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Vigilante das Sombras", 16));
    const headers = blocks.map((b) => b.split("\n")[0]);
    expect(headers).toEqual(["# EMBOSCADOR DAS SOMBRAS", "# VISÃO UMBROSA"]);
    expect(blocks[0]).toContain("+2d6 Psíquico");
  });

  it("nível 11: Torrente do Vigilante aparece IMEDIATAMENTE depois de Emboscador das Sombras, antes de Visão Umbrosa (nunca ordenado só por nível — Visão Umbrosa é nível 3, mas vem depois)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(11, "Vigilante das Sombras", 16));
    const headers = blocks.map((b) => b.split("\n")[0]);
    expect(headers).toEqual(["# EMBOSCADOR DAS SOMBRAS", "# TORRENTE DO VIGILANTE", "# VISÃO UMBROSA"]);
  });

  it("nível 11: o dano de Golpe Terrível em Emboscador das Sombras passa a 2d8 (nunca mostra 2d6 e 2d8 juntos)", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(11, "Vigilante das Sombras"));
    const emboscador = blocks.find((b) => b.startsWith("# EMBOSCADOR DAS SOMBRAS"))!;
    expect(emboscador).toContain("+2d8 Psíquico");
    expect(emboscador).not.toContain("2d6");
  });

  it("nível 15: ordem final Emboscador, Torrente, Visão Umbrosa, Esquiva Sombria", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(15, "Vigilante das Sombras", 16));
    const headers = blocks.map((b) => b.split("\n")[0]);
    expect(headers).toEqual(["# EMBOSCADOR DAS SOMBRAS", "# TORRENTE DO VIGILANTE", "# VISÃO UMBROSA", "# ESQUIVA SOMBRIA"]);
    expect(blocks[3]).toBe("# ESQUIVA SOMBRIA\n> Reação ao ser atacado: Desv no atq + pode teleportar 9m");
  });

  it("Torrente do Vigilante usa a CD de conjuração do Patrulheiro, idêntica à de Detalhe Sedutor do Andarilho Feérico", () => {
    const sombras = rangerAt(11, "Vigilante das Sombras", 16); // SAB +3, prof +4 => CD 15
    const feerico = rangerAt(11, "Andarilho Feérico", 16);
    const torrente = getRangerSubclassPrintedBlocks(sombras).find((b) => b.startsWith("# TORRENTE DO VIGILANTE"))!;
    const detalhe = getRangerSubclassPrintedBlocks(feerico).find((b) => b.startsWith("# DETALHE SEDUTOR"))!;
    expect(torrente).toContain("CD 15");
    expect(detalhe).toContain("CD 15");
  });

  it("'Mente de Ferro' nunca aparece em Características de Classe, em nenhum nível — a proficiência final aparece só nas Salvaguardas", () => {
    for (const level of [3, 7, 11, 15, 20]) {
      const joined = getRangerSubclassPrintedBlocks(rangerAt(level, "Vigilante das Sombras")).join("\n");
      expect(joined).not.toContain("Mente de Ferro");
    }
  });

  it("Golpe Terrível tem marcadores = máximo(1, mod SAB), igual ao Andarilho Nebuloso — recursos diferentes, mesma fórmula, cada um com seu próprio contador", () => {
    const blocks = getRangerSubclassPrintedBlocks(rangerAt(3, "Vigilante das Sombras", 20)); // SAB +5
    expect(blocks[0]).toContain("[__][__][__][__][__]/DL");
  });

  describe("Visão Umbrosa — alcance efetivo (nunca duplica a concessão de Espécie)", () => {
    it("Humano (sem Visão no Escuro prévia): 18m", () => {
      const character = rangerAt(3, "Vigilante das Sombras");
      character.speciesId = "humano";
      const block = getRangerSubclassPrintedBlocks(character).find((b) => b.startsWith("# VISÃO UMBROSA"))!;
      expect(block).toBe("# VISÃO UMBROSA\n> Visão no Escuro 18m\n> Na Escuridão: Invisível pra quem depende de Visão no Escuro");
    });

    it("sem espécie escolhida ainda: trata como sem Visão no Escuro prévia (18m)", () => {
      const character = rangerAt(3, "Vigilante das Sombras");
      character.speciesId = null;
      const block = getRangerSubclassPrintedBlocks(character).find((b) => b.startsWith("# VISÃO UMBROSA"))!;
      expect(block).toContain("18m");
    });

    it("Draconato (Visão no Escuro 18m de Espécie): soma +18m = 36m", () => {
      const character = rangerAt(3, "Vigilante das Sombras");
      character.speciesId = "draconato";
      const block = getRangerSubclassPrintedBlocks(character).find((b) => b.startsWith("# VISÃO UMBROSA"))!;
      expect(block).toContain("36m");
    });

    it("Elfo sem Linhagem Drow (18m de Espécie): soma +18m = 36m", () => {
      const character = rangerAt(3, "Vigilante das Sombras");
      character.speciesId = "elfo";
      character.speciesLineageId = "elfo-floresta";
      const block = getRangerSubclassPrintedBlocks(character).find((b) => b.startsWith("# VISÃO UMBROSA"))!;
      expect(block).toContain("36m");
    });

    it("Elfo Drow (36m de Espécie): soma +18m = 54m", () => {
      const character = rangerAt(3, "Vigilante das Sombras");
      character.speciesId = "elfo";
      character.speciesLineageId = "elfo-drow";
      const block = getRangerSubclassPrintedBlocks(character).find((b) => b.startsWith("# VISÃO UMBROSA"))!;
      expect(block).toContain("54m");
    });

    it("Anão/Orc (36m de Espécie): soma +18m = 54m", () => {
      const anao = rangerAt(3, "Vigilante das Sombras");
      anao.speciesId = "anao";
      expect(getRangerSubclassPrintedBlocks(anao).find((b) => b.startsWith("# VISÃO UMBROSA"))).toContain("54m");

      const orc = rangerAt(3, "Vigilante das Sombras");
      orc.speciesId = "orc";
      expect(getRangerSubclassPrintedBlocks(orc).find((b) => b.startsWith("# VISÃO UMBROSA"))).toContain("54m");
    });
  });

  it("nenhuma {Variável} literal nem símbolo banido, em nenhum nível", () => {
    for (const level of [3, 7, 11, 15, 20]) {
      const joined = getRangerSubclassPrintedBlocks(rangerAt(level, "Vigilante das Sombras")).join("\n");
      expect(joined).not.toMatch(BANNED_PATTERN);
    }
  });
});

describe("troca de Subclasse e redução de nível — nunca deixa resíduo de outra subclasse ou de nível superior", () => {
  it("trocar de subclasse remove completamente os blocos da subclasse anterior", () => {
    const character = rangerAt(15, "Andarilho Feérico");
    expect(getRangerPrintedBlocks(character).join("\n")).toContain("GLAMOUR TRANSCENDENTAL");

    character.subclassId = "Caçador";
    const joined = getRangerPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("GLAMOUR TRANSCENDENTAL");
    expect(joined).not.toContain("GOLPES TERRÍVEIS");
    expect(joined).not.toContain("REFORÇOS FEÉRICOS");
    expect(joined).toContain("MARCA DO PREDADOR");
  });

  it("reduzir o nível remove os blocos/linhas que dependiam do nível mais alto, sem deixar resíduo", () => {
    const character = rangerAt(15, "Vigilante das Sombras");
    expect(getRangerPrintedBlocks(character).join("\n")).toContain("ESQUIVA SOMBRIA");

    character.level = 3;
    const joined = getRangerPrintedBlocks(character).join("\n");
    expect(joined).not.toContain("ESQUIVA SOMBRIA");
    expect(joined).not.toContain("TORRENTE DO VIGILANTE");
    expect(joined).toContain("+2d6 Psíquico"); // volta ao dado base, nunca mantém o 2d8 antigo
    expect(joined).not.toContain("2d8");
  });
});
