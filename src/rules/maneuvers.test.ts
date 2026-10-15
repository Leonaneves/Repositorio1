import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { maneuvers } from "../data/maneuvers.js";
import { BATTLE_MASTER_CD_ABILITY_CHOICE_ID } from "../data/features/subclasses.js";
import {
  getKnownManeuvers,
  getManeuverPrintedLine,
  getManeuversCd,
  getSelectableManeuvers,
  isManeuverSelectionComplete,
} from "./maneuvers.js";

function battleMasterOf(level: number) {
  const character = createBlankCharacter("maneuvers-test");
  character.classId = "guerreiro";
  character.subclassId = "Mestre da Batalha";
  character.level = level;
  return character;
}

describe("getSelectableManeuvers", () => {
  it("devolve as 20 manobras cadastradas", () => {
    expect(getSelectableManeuvers()).toHaveLength(20);
  });

  it("inclui Aparar e Recuperar Energia (as 2 com placeholder dinâmico)", () => {
    const ids = getSelectableManeuvers().map((m) => m.id);
    expect(ids).toContain("aparar");
    expect(ids).toContain("recuperar-energia");
  });
});

describe("getKnownManeuvers", () => {
  it("resolve os ids escolhidos nas definições do catálogo, na ordem escolhida", () => {
    const character = battleMasterOf(3);
    character.chosenManeuvers = ["desarme", "finta"];
    const known = getKnownManeuvers(character);
    expect(known.map((m) => m.id)).toEqual(["desarme", "finta"]);
  });

  it("ignora um id desconhecido sem quebrar", () => {
    const character = battleMasterOf(3);
    character.chosenManeuvers = ["id-inexistente"];
    expect(getKnownManeuvers(character)).toEqual([]);
  });
});

describe("isManeuverSelectionComplete", () => {
  it("nível 3 exige exatamente 3 manobras — incompleto com 2, completo com 3, incompleto com 4 (excesso)", () => {
    const character = battleMasterOf(3);
    character.chosenManeuvers = ["desarme", "finta"];
    expect(isManeuverSelectionComplete(character)).toBe(false);

    character.chosenManeuvers = ["desarme", "finta", "emboscada"];
    expect(isManeuverSelectionComplete(character)).toBe(true);

    character.chosenManeuvers = ["desarme", "finta", "emboscada", "prostrar"];
    expect(isManeuverSelectionComplete(character)).toBe(false);
  });

  it("duplicata nunca conta como completo mesmo com a quantidade certa de entradas", () => {
    const character = battleMasterOf(3);
    character.chosenManeuvers = ["desarme", "desarme", "finta"];
    expect(isManeuverSelectionComplete(character)).toBe(false);
  });

  it("classe/subclasse diferente de Mestre de Batalha nunca bloqueia (required=0)", () => {
    const character = createBlankCharacter("maneuvers-test-2");
    character.classId = "mago";
    expect(isManeuverSelectionComplete(character)).toBe(true);
  });

  it("nível 18 exige 9 manobras", () => {
    const character = battleMasterOf(18);
    character.chosenManeuvers = maneuvers.slice(0, 9).map((m) => m.id);
    expect(isManeuverSelectionComplete(character)).toBe(true);
  });
});

describe("getManeuversCd — automática, fonte \"AUTOMATIZAR A CD DAS MANOBRAS DO MESTRE DE BATALHA\"", () => {
  it("sem nenhuma escolha (não existe mais): já calcula a CD normalmente, nunca null por falta de escolha", () => {
    const character = battleMasterOf(3);
    character.abilities.FOR.score = 10; // mod 0
    character.abilities.DEX.score = 10; // mod 0
    // nível 3 => BP 2; CD = 8 + 2 + 0 = 10
    expect(getManeuversCd(character)).toBe(10);
  });

  it("FOR maior: CD = 8 + BP + mod FOR", () => {
    const character = battleMasterOf(3);
    character.abilities.FOR.score = 16; // mod +3
    character.abilities.DEX.score = 10; // mod 0
    // nível 3 => BP 2; CD = 8 + 2 + 3 = 13
    expect(getManeuversCd(character)).toBe(13);
  });

  it("DEX maior: CD = 8 + BP + mod DEX, independente de FOR", () => {
    const character = battleMasterOf(5); // BP 3
    character.abilities.FOR.score = 8; // mod -1
    character.abilities.DEX.score = 14; // mod +2
    expect(getManeuversCd(character)).toBe(13); // 8 + 3 + 2
  });

  it("empate entre FOR e DEX: usa o valor comum sem exigir nenhuma escolha", () => {
    const character = battleMasterOf(3); // BP 2
    character.abilities.FOR.score = 14; // mod +2
    character.abilities.DEX.score = 14; // mod +2
    expect(getManeuversCd(character)).toBe(12); // 8 + 2 + 2
  });

  it("recalcula sozinha após mudanças posteriores em FOR, DEX ou BP — nunca usa um valor persistido", () => {
    const character = battleMasterOf(3); // BP 2
    character.abilities.FOR.score = 10; // mod 0
    character.abilities.DEX.score = 10; // mod 0
    expect(getManeuversCd(character)).toBe(10); // 8 + 2 + 0

    character.abilities.DEX.score = 18; // mod +4 (aumento aplicado depois)
    expect(getManeuversCd(character)).toBe(14); // 8 + 2 + 4

    character.level = 17; // BP sobe para 6
    expect(getManeuversCd(character)).toBe(18); // 8 + 6 + 4
  });

  it("ignora qualquer seleção antiga salva sob o id da escolha removida — nunca lida, nunca usada", () => {
    const character = battleMasterOf(5); // BP 3
    character.abilities.FOR.score = 16; // mod +3
    character.abilities.DEX.score = 10; // mod 0
    character.featureChoiceSelections[BATTLE_MASTER_CD_ABILITY_CHOICE_ID] = { value: "Destreza" };
    // Se a seleção antiga ainda fosse lida, daria 8+3+0=11 (Destreza); o correto é usar o maior: 8+3+3=14.
    expect(getManeuversCd(character)).toBe(14);
  });

  it("outra classe/subclasse — sempre null", () => {
    const character = createBlankCharacter("maneuvers-test-3");
    character.classId = "mago";
    expect(getManeuversCd(character)).toBeNull();
  });

  it("nível abaixo de 3 (Superioridade em Combate ainda não concedida) — null", () => {
    const character = battleMasterOf(2);
    expect(getManeuversCd(character)).toBeNull();
  });
});

describe("getManeuverPrintedLine", () => {
  it("manobras sem placeholder voltam literalmente, sem nenhuma substituição", () => {
    const character = battleMasterOf(3);
    const desarme = maneuvers.find((m) => m.id === "desarme")!;
    expect(getManeuverPrintedLine(desarme, character)).toBe(desarme.printedLine);
  });

  it("Aparar resolve para o maior modificador entre FOR/DEX, formatado com sinal", () => {
    const character = battleMasterOf(3);
    character.abilities.FOR.score = 8; // mod -1
    character.abilities.DEX.score = 18; // mod +4
    const aparar = maneuvers.find((m) => m.id === "aparar")!;
    expect(getManeuverPrintedLine(aparar, character)).toBe(
      "> Aparar: Reação ao sofrer dano corpo a corpo: reduz DS+4",
    );
  });

  it("Aparar formata modificador negativo corretamente (nunca '+ -1')", () => {
    const character = battleMasterOf(3);
    character.abilities.FOR.score = 6; // mod -2
    character.abilities.DEX.score = 8; // mod -1
    const aparar = maneuvers.find((m) => m.id === "aparar")!;
    expect(getManeuverPrintedLine(aparar, character)).toBe(
      "> Aparar: Reação ao sofrer dano corpo a corpo: reduz DS-1",
    );
  });

  it("Recuperar Energia resolve metade do nível (arredondado para baixo)", () => {
    const character = battleMasterOf(15);
    const recuperarEnergia = maneuvers.find((m) => m.id === "recuperar-energia")!;
    expect(getManeuverPrintedLine(recuperarEnergia, character)).toBe(
      "> Recuperar Energia: AB, aliado a 9m recebe DS+7 PV Temporários",
    );
  });
});
