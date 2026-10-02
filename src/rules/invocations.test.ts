import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import {
  getEligibleInvocations,
  getInvalidChosenInvocations,
  getSelectableInvocations,
  isInvocationEligible,
  isInvocationSelectionComplete,
} from "./invocations.js";
import { warlockInvocationsById } from "../data/invocations.js";

function warlockAt(level: number): Character {
  const character = createBlankCharacter("invocations-test");
  character.classId = "bruxo";
  character.level = level;
  return character;
}

function choose(character: Character, invocationId: string, subChoice = ""): void {
  character.chosenInvocations.push({ invocationId, subChoice });
}

describe("getEligibleInvocations — classe errada", () => {
  it("devolve [] para qualquer classe que não seja Bruxo", () => {
    const mago = createBlankCharacter("x");
    mago.classId = "mago";
    mago.level = 20;
    expect(getEligibleInvocations(mago)).toEqual([]);
  });
});

describe("isInvocationEligible — pré-requisito de nível", () => {
  it("Explosão Agonizante (nível 2+): inelegível no 1, elegível no 2", () => {
    const invocation = warlockInvocationsById["explosao-agonizante"];
    expect(isInvocationEligible(warlockAt(1), invocation)).toBe(false);
    expect(isInvocationEligible(warlockAt(2), invocation)).toBe(true);
  });

  it("Visão da Bruxa (nível 15+): inelegível no 14, elegível no 15", () => {
    const invocation = warlockInvocationsById["visao-da-bruxa"];
    expect(isInvocationEligible(warlockAt(14), invocation)).toBe(false);
    expect(isInvocationEligible(warlockAt(15), invocation)).toBe(true);
  });

  it("Mente Mística: sem pré-requisito, elegível desde o nível 1", () => {
    const invocation = warlockInvocationsById["mente-mistica"];
    expect(isInvocationEligible(warlockAt(1), invocation)).toBe(true);
  });
});

describe("isInvocationEligible — pré-requisito de Pacto/outra invocação", () => {
  it("Lâmina Sedenta exige nível 5+ E Pacto da Lâmina já escolhido", () => {
    const invocation = warlockInvocationsById["lamina-sedenta"];
    const noPact = warlockAt(5);
    expect(isInvocationEligible(noPact, invocation)).toBe(false);

    const withPact = warlockAt(5);
    choose(withPact, "pacto-da-lamina");
    expect(isInvocationEligible(withPact, invocation)).toBe(true);

    const lowLevelWithPact = warlockAt(4);
    choose(lowLevelWithPact, "pacto-da-lamina");
    expect(isInvocationEligible(lowLevelWithPact, invocation)).toBe(false);
  });

  it("Investimento do Mestre da Corrente exige nível 5+ E Pacto da Corrente", () => {
    const invocation = warlockInvocationsById["investimento-mestre-da-corrente"];
    const character = warlockAt(5);
    expect(isInvocationEligible(character, invocation)).toBe(false);
    choose(character, "pacto-da-corrente");
    expect(isInvocationEligible(character, invocation)).toBe(true);
  });

  it("Presente dos Protetores exige nível 9+ E Pacto do Tomo", () => {
    const invocation = warlockInvocationsById["presente-dos-protetores"];
    const character = warlockAt(9);
    expect(isInvocationEligible(character, invocation)).toBe(false);
    choose(character, "pacto-do-tomo");
    expect(isInvocationEligible(character, invocation)).toBe(true);
  });

  it("Lâmina Devoradora exige nível 12+ E Lâmina Sedenta — dependência de invocação, não de Pacto direto", () => {
    const invocation = warlockInvocationsById["lamina-devoradora"];
    const withoutSedenta = warlockAt(12);
    choose(withoutSedenta, "pacto-da-lamina");
    expect(isInvocationEligible(withoutSedenta, invocation)).toBe(false);

    const withSedenta = warlockAt(12);
    choose(withSedenta, "pacto-da-lamina");
    choose(withSedenta, "lamina-sedenta");
    expect(isInvocationEligible(withSedenta, invocation)).toBe(true);
  });

  it("Punição Mística e Sorvedouro de Vida exigem Pacto da Lâmina (níveis 5+ e 9+)", () => {
    const punicao = warlockInvocationsById["punicao-mistica"];
    const sorvedouro = warlockInvocationsById["sorvedouro-de-vida"];
    const character = warlockAt(9);
    expect(isInvocationEligible(character, punicao)).toBe(false);
    expect(isInvocationEligible(character, sorvedouro)).toBe(false);
    choose(character, "pacto-da-lamina");
    expect(isInvocationEligible(character, punicao)).toBe(true);
    expect(isInvocationEligible(character, sorvedouro)).toBe(true);
  });
});

describe("getSelectableInvocations — repetibilidade", () => {
  it("invocação NÃO repetível desaparece da lista de escolhíveis depois de escolhida", () => {
    const character = warlockAt(5);
    expect(getSelectableInvocations(character).some((i) => i.id === "mente-mistica")).toBe(true);
    choose(character, "mente-mistica");
    expect(getSelectableInvocations(character).some((i) => i.id === "mente-mistica")).toBe(false);
  });

  it("invocação repetível (Explosão Agonizante) continua escolhível mesmo depois de já escolhida", () => {
    const character = warlockAt(5);
    choose(character, "explosao-agonizante", "Raio de Fogo");
    expect(getSelectableInvocations(character).some((i) => i.id === "explosao-agonizante")).toBe(true);
  });

  it("as 4 invocações repetíveis desta fonte estão marcadas repeatable:true", () => {
    for (const id of ["explosao-agonizante", "explosao-repulsiva", "lanca-mistica", "licoes-dos-grandes-antigos"]) {
      expect(warlockInvocationsById[id].repeatable).toBe(true);
    }
  });

  it("invalid eligível some da lista quando o pré-requisito não é atendido", () => {
    const character = warlockAt(1);
    expect(getSelectableInvocations(character).some((i) => i.id === "mente-mistica")).toBe(true);
    expect(getSelectableInvocations(character).some((i) => i.id === "explosao-agonizante")).toBe(false);
  });
});

describe("getInvalidChosenInvocations — nunca mantém estado inválido silenciosamente", () => {
  it("id desconhecido é marcado inválido", () => {
    const character = warlockAt(5);
    choose(character, "invocacao-que-nao-existe");
    const invalid = getInvalidChosenInvocations(character);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].index).toBe(0);
  });

  it("pré-requisito quebrado por queda de nível marca a invocação como pendente", () => {
    const character = warlockAt(5);
    choose(character, "pacto-da-lamina");
    choose(character, "lamina-sedenta");
    expect(getInvalidChosenInvocations(character)).toHaveLength(0);

    character.level = 4; // Lâmina Sedenta exige nível 5+
    const invalid = getInvalidChosenInvocations(character);
    expect(invalid.some((i) => i.chosen.invocationId === "lamina-sedenta")).toBe(true);
  });

  it("remover o Pacto da Lâmina invalida Lâmina Sedenta (dependência de outra invocação, não só de nível)", () => {
    const character = warlockAt(5);
    choose(character, "pacto-da-lamina");
    choose(character, "lamina-sedenta");
    character.chosenInvocations = character.chosenInvocations.filter((c) => c.invocationId !== "pacto-da-lamina");
    const invalid = getInvalidChosenInvocations(character);
    expect(invalid.some((i) => i.chosen.invocationId === "lamina-sedenta")).toBe(true);
  });

  it("sub-escolha obrigatória vazia é inválida (Explosão Agonizante sem Truque escolhido)", () => {
    const character = warlockAt(2);
    choose(character, "explosao-agonizante", "");
    const invalid = getInvalidChosenInvocations(character);
    expect(invalid).toHaveLength(1);
  });

  it("2 cópias de Explosão Agonizante com o MESMO Truque são inválidas — precisam ser diferentes", () => {
    const character = warlockAt(2);
    choose(character, "explosao-agonizante", "Raio de Fogo");
    choose(character, "explosao-agonizante", "Raio de Fogo");
    const invalid = getInvalidChosenInvocations(character);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].index).toBe(1); // a 2ª cópia é a repetida
  });

  it("2 cópias de Explosão Agonizante com Truques DIFERENTES são válidas", () => {
    const character = warlockAt(2);
    choose(character, "explosao-agonizante", "Raio de Fogo");
    choose(character, "explosao-agonizante", "Mãos Flamejantes");
    expect(getInvalidChosenInvocations(character)).toHaveLength(0);
  });

  it("Lições dos Grandes Antigos repetível com Talentos diferentes nunca colide entre si e com Lança Mística (sub-escolha isolada por invocação)", () => {
    const character = warlockAt(2);
    choose(character, "licoes-dos-grandes-antigos", "Afortunado");
    choose(character, "licoes-dos-grandes-antigos", "Resiliente");
    choose(character, "lanca-mistica", "Afortunado"); // mesmo texto, invocação DIFERENTE — não deve colidir
    expect(getInvalidChosenInvocations(character)).toHaveLength(0);
  });

  it("Lança Mística repetível com Truques diferentes é válida; com o mesmo Truque é inválida", () => {
    const valid = warlockAt(2);
    choose(valid, "lanca-mistica", "Raio de Fogo");
    choose(valid, "lanca-mistica", "Mãos Flamejantes");
    expect(getInvalidChosenInvocations(valid)).toHaveLength(0);

    const invalid = warlockAt(2);
    choose(invalid, "lanca-mistica", "Raio de Fogo");
    choose(invalid, "lanca-mistica", "Raio de Fogo");
    expect(getInvalidChosenInvocations(invalid)).toHaveLength(1);
  });
});

describe("isInvocationSelectionComplete — gating do Builder", () => {
  it("incompleta enquanto a quantidade escolhida for menor que a do nível", () => {
    const character = warlockAt(5); // 5 invocações no nível 5
    choose(character, "mente-mistica");
    expect(isInvocationSelectionComplete(character)).toBe(false);
  });

  it("completa quando a quantidade bate e nenhuma está inválida", () => {
    const character = warlockAt(1); // 1 invocação no nível 1
    choose(character, "mente-mistica");
    expect(isInvocationSelectionComplete(character)).toBe(true);
  });

  it("nunca completa enquanto houver 1 invocação inválida, mesmo com a quantidade certa", () => {
    const character = warlockAt(1);
    choose(character, "pacto-da-lamina");
    character.level = 0 + 1; // ainda nível 1, mas vamos forçar uma invalidação via id desconhecido
    character.chosenInvocations = [{ invocationId: "nao-existe", subChoice: "" }];
    expect(isInvocationSelectionComplete(character)).toBe(false);
  });

  it("sempre true para quem não é Bruxo (nada a resolver)", () => {
    const character = createBlankCharacter("x");
    character.classId = "mago";
    expect(isInvocationSelectionComplete(character)).toBe(true);
  });

  it("mudança de nível reabre a etapa corretamente (quantidade nova precisa ser atingida)", () => {
    const character = warlockAt(1);
    choose(character, "mente-mistica");
    expect(isInvocationSelectionComplete(character)).toBe(true);

    character.level = 2; // agora precisa de 3
    expect(isInvocationSelectionComplete(character)).toBe(false);
  });
});
