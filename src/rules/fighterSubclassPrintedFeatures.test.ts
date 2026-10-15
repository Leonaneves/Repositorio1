import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { BATTLE_MASTER_CD_ABILITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getFighterSubclassPrintedBlocks } from "./fighterSubclassPrintedFeatures.js";

function fighterOf(subclassId: string, level: number) {
  const character = createBlankCharacter("fighter-printed-test");
  character.classId = "guerreiro";
  character.subclassId = subclassId;
  character.level = level;
  return character;
}

describe("getFighterSubclassPrintedBlocks — sem subclasse ou outra classe", () => {
  it("devolve [] sem subclasse escolhida", () => {
    const character = createBlankCharacter("fighter-printed-none");
    character.classId = "guerreiro";
    expect(getFighterSubclassPrintedBlocks(character)).toEqual([]);
  });

  it("devolve [] para outra classe", () => {
    const character = createBlankCharacter("fighter-printed-other");
    character.classId = "mago";
    expect(getFighterSubclassPrintedBlocks(character)).toEqual([]);
  });
});

describe("Campeão", () => {
  it("nível 3: Atleta Extraordinário + Crítico (19-20), sem Combatente Heroico/Sobrevivente", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Campeão", 3)).join("\n\n");
    expect(blocks).toContain("# ATLETA EXTRAORDINÁRIO");
    expect(blocks).toContain("Vant em Iniciativa e Atletismo");
    expect(blocks).toContain("Armas e desarmados: 19–20");
    expect(blocks).not.toContain("COMBATENTE HEROICO");
    expect(blocks).not.toContain("SOBREVIVENTE");
  });

  it("nível 10: adiciona Combatente Heroico, ainda 19-20", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Campeão", 10)).join("\n\n");
    expect(blocks).toContain("# COMBATENTE HEROICO");
    expect(blocks).toContain("Armas e desarmados: 19–20");
  });

  it("nível 18 (exemplo de exportação pedido): Crítico 18-20 (nunca os dois intervalos), Sobrevivente com cura resolvida, nunca 'Estilo de Luta Adicional' como lembrete", () => {
    const character = fighterOf("Campeão", 18);
    character.abilities.CON.score = 14; // mod +2 -> cura = 5 + 2 = 7
    const blocks = getFighterSubclassPrintedBlocks(character).join("\n\n");

    expect(blocks).toContain("Armas e desarmados: 18–20");
    expect(blocks).not.toContain("19–20");
    expect(blocks).toContain("# SOBREVIVENTE");
    expect(blocks).toContain("Salv Contra Morte: Vant; 18–20 vale 20");
    expect(blocks).toContain("recupera 7 PV");
    expect(blocks).not.toContain("{curaSobrevivente}");
    expect(blocks).not.toContain("Estilo de Luta Adicional");
  });
});

describe("Cavaleiro Místico", () => {
  it("nível 7 (exemplo de exportação pedido): Vínculo com Arma + Magia de Guerra (1 truque), sem Golpe Místico/Investida/Surto de Ação", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Cavaleiro Místico", 7)).join("\n\n");
    expect(blocks).toContain("# VÍNCULO COM ARMA");
    expect(blocks).toContain("# MAGIA DE GUERRA");
    expect(blocks).toContain("trocar 1 atq por truque de Mago de 1 ação");
    expect(blocks).not.toContain("# GOLPE MÍSTICO");
    expect(blocks).not.toContain("# SURTO DE AÇÃO");
    expect(blocks).not.toContain("1º/2º círculo");
  });

  it("nível 10: adiciona Golpe Místico, Magia de Guerra ainda na versão de 1 truque", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Cavaleiro Místico", 10)).join("\n\n");
    expect(blocks).toContain("# GOLPE MÍSTICO");
    expect(blocks).toContain("trocar 1 atq por truque de Mago de 1 ação");
  });

  it("nível 18 (exemplo de exportação pedido): Magia de Guerra Aprimorada substitui a linha anterior, Surto de Ação com Investida Mística, nunca duplica o bloco", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Cavaleiro Místico", 18));
    const joined = blocks.join("\n\n");

    expect(joined).toContain("trocar 1 atq por truque ou 2 por magia de 1º/2º círculo, de Mago e de 1 ação");
    expect(joined).not.toContain("trocar 1 atq por truque de Mago de 1 ação");
    expect(joined).toContain("# SURTO DE AÇÃO");
    expect(joined).toContain("Pode teleportar 9m antes/depois da ação adicional");
    // Um único bloco "# MAGIA DE GUERRA" e um único "# SURTO DE AÇÃO" — nunca duplicado.
    expect(blocks.filter((b) => b.startsWith("# MAGIA DE GUERRA"))).toHaveLength(1);
    expect(blocks.filter((b) => b.startsWith("# SURTO DE AÇÃO"))).toHaveLength(1);
    // Nunca imprime a tabela de conjuração, INT ou quantidade de magias aqui.
    expect(joined).not.toContain("CONJURAÇÃO");
  });
});

describe("Guerreiro Psiônico", () => {
  it("nível 3: Energia Psiônica (d6 x4), Golpe Psiônico, Vínculo Protetivo, Movimento Telecinético — sem Estocada/Salto/Resguardo/Baluarte/Mestre Telecinético", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Guerreiro Psiônico", 3)).join("\n\n");
    expect(blocks).toContain("# ENERGIA PSIÔNICA");
    expect(blocks).toContain("DP d6 [__] [__] [__] [__]");
    expect(blocks).toContain("# GOLPE PSIÔNICO");
    expect(blocks).not.toContain("Salv FOR CD");
    expect(blocks).toContain("# VÍNCULO PROTETIVO");
    expect(blocks).toContain("# MOVIMENTO TELECINÉTICO");
    expect(blocks).not.toContain("SALTO COM IMPULSÃO PSÍQUICA");
    expect(blocks).not.toContain("RESGUARDO MENTAL");
    expect(blocks).not.toContain("BALUARTE DE ENERGIA");
    expect(blocks).not.toContain("MESTRE TELECINÉTICO");
  });

  it("nível 7: adiciona a linha de Estocada Telecinética dentro do bloco de Golpe Psiônico (sem título separado) e Salto com Impulsão Psíquica", () => {
    const character = fighterOf("Guerreiro Psiônico", 7);
    character.abilities.INT.score = 14; // mod +2
    const blocks = getFighterSubclassPrintedBlocks(character);
    const golpePsionico = blocks.find((b) => b.startsWith("# GOLPE PSIÔNICO"))!;
    expect(golpePsionico).toContain("Salv FOR CD 13; falha: Caído ou mover 3m horizontal"); // 8 + BP(3, nível 7) + INT(2)
    expect(blocks.join("\n\n")).toContain("# SALTO COM IMPULSÃO PSÍQUICA");
  });

  it("nível 18 (exemplo de exportação pedido, com 12 dados): todos os blocos presentes, dado d12 x12, Mestre Telecinético ao final", () => {
    const character = fighterOf("Guerreiro Psiônico", 18);
    character.speciesId = "humano"; // deslocamento base 9m — vooCalculado = dobro = 18m
    const blocks = getFighterSubclassPrintedBlocks(character);
    const joined = blocks.join("\n\n");

    expect(joined).toContain("DP d12 [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__]");
    expect(joined).toContain("voo 18m até fim do turno");
    expect(joined).toContain("# RESGUARDO MENTAL");
    expect(joined).toContain("# BALUARTE DE ENERGIA");
    expect(joined).toContain("# MESTRE TELECINÉTICO");
    expect(joined).toContain("Telecinese sem espaço [__]/DL");
    expect(blocks.filter((b) => b.startsWith("# ENERGIA PSIÔNICA"))).toHaveLength(1);
  });
});

describe("Mestre da Batalha", () => {
  it("nível 3: Superioridade em Combate (4 DS d8) sem CD resolvida (atributo não escolhido), sem bloco de Manobras (nenhuma escolhida), sem Conheça Seu Inimigo", () => {
    const blocks = getFighterSubclassPrintedBlocks(fighterOf("Mestre da Batalha", 3)).join("\n\n");
    expect(blocks).toContain("# SUPERIORIDADE EM COMBATE");
    expect(blocks).toContain("DS d8 [__] [__] [__] [__]/DC ou DL | CD —");
    expect(blocks).toContain("1 manobra/atq; cada uso gasta 1 DS");
    expect(blocks).not.toContain("# MANOBRAS");
    expect(blocks).not.toContain("CONHEÇA SEU INIMIGO");
  });

  it("nível 7: Conheça Seu Inimigo aparece após as manobras escolhidas", () => {
    const character = fighterOf("Mestre da Batalha", 7);
    character.chosenManeuvers = ["desarme"];
    const blocks = getFighterSubclassPrintedBlocks(character);
    const maneuversIndex = blocks.findIndex((b) => b.startsWith("# MANOBRAS"));
    const conheçaIndex = blocks.findIndex((b) => b.startsWith("# CONHEÇA SEU INIMIGO"));
    expect(maneuversIndex).toBeGreaterThanOrEqual(0);
    expect(conheçaIndex).toBeGreaterThan(maneuversIndex);
  });

  it("nível 18 (exemplo de exportação pedido, com nove manobras): DS d12, segunda linha de Implacável, nove manobras impressas sob um único título, nunca 'Superioridade Aprimorada/Suprema'", () => {
    const character = fighterOf("Mestre da Batalha", 18);
    character.abilities.FOR.score = 16; // mod +3
    character.featureChoiceSelections[BATTLE_MASTER_CD_ABILITY_CHOICE_ID] = { value: "Força" };
    character.chosenManeuvers = [
      "aparar",
      "ataque-ameacador",
      "ataque-de-varredura",
      "ataque-estendido",
      "ataque-para-distrair",
      "ataque-preciso",
      "ataque-provocante",
      "avaliacao-tatica",
      "contra-ataque",
    ];
    const blocks = getFighterSubclassPrintedBlocks(character);
    const joined = blocks.join("\n\n");

    expect(joined).toContain("DS d12 [__] [__] [__] [__] [__] [__]/DC ou DL | CD 17"); // 8 + BP(6, nível 18) + FOR(3)
    expect(joined).toContain("1 manobra/atq; gasta 1 DS ou, 1/turno, usa 1d8 sem gastar");
    expect(joined).not.toContain("Superioridade Aprimorada");
    expect(joined).not.toContain("Superioridade Suprema");

    const maneuversBlock = blocks.find((b) => b.startsWith("# MANOBRAS"))!;
    const lines = maneuversBlock.split("\n").filter((l) => l.startsWith(">"));
    expect(lines).toHaveLength(9);
    expect(blocks.filter((b) => b.startsWith("# MANOBRAS"))).toHaveLength(1);
  });
});
