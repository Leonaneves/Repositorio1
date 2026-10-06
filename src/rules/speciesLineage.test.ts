import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import {
  getSpeciesLineageDamageType,
  getSpeciesLineageSpeedBonus,
  getSpeciesLineageSpellcastingAbility,
  isSpeciesLineageResolved,
} from "./speciesLineage.js";

describe("isSpeciesLineageResolved", () => {
  it("true sem espécie escolhida (a própria etapa já bloqueia por outro motivo)", () => {
    const character = createBlankCharacter("t");
    expect(isSpeciesLineageResolved(character)).toBe(true);
  });

  it("true para espécie sem linhagem (Humano) — nada a resolver", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "humano";
    expect(isSpeciesLineageResolved(character)).toBe(true);
  });

  it("false para Draconato sem ancestral escolhido", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "draconato";
    expect(isSpeciesLineageResolved(character)).toBe(false);
  });

  it("true para Draconato com ancestral escolhido", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "draconato";
    character.speciesLineageId = "draconato-vermelho";
    expect(isSpeciesLineageResolved(character)).toBe(true);
  });

  it("Elfo/Gnomo/Tiefling/Golias só exigem a linhagem/ancestralidade — o atributo de conjuração é sempre automático, nunca uma escolha manual separada", () => {
    const elfo = createBlankCharacter("t");
    elfo.speciesId = "elfo";
    expect(isSpeciesLineageResolved(elfo)).toBe(false);

    elfo.speciesLineageId = "elfo-alto-elfo";
    expect(isSpeciesLineageResolved(elfo)).toBe(true);

    const gnomo = createBlankCharacter("t");
    gnomo.speciesId = "gnomo";
    gnomo.speciesLineageId = "gnomo-rocha";
    expect(isSpeciesLineageResolved(gnomo)).toBe(true);

    const tiefling = createBlankCharacter("t");
    tiefling.speciesId = "tiefling";
    tiefling.speciesLineageId = "tiefling-infernal";
    expect(isSpeciesLineageResolved(tiefling)).toBe(true);

    const golias = createBlankCharacter("t");
    golias.speciesId = "golias";
    golias.speciesLineageId = "golias-fogo";
    expect(isSpeciesLineageResolved(golias)).toBe(true);
  });
});

describe("getSpeciesLineageDamageType", () => {
  it("Draconato Verde → Veneno (tabela exata pedida)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "draconato";
    character.speciesLineageId = "draconato-verde";
    expect(getSpeciesLineageDamageType(character)).toBe("Veneno");
  });

  it("Tiefling Abissal → Venenoso (tabela exata pedida, diferente do Draconato Verde)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "tiefling";
    character.speciesLineageId = "tiefling-abissal";
    expect(getSpeciesLineageDamageType(character)).toBe("Venenoso");
  });

  it("null sem linhagem escolhida, ou para espécie sem esse campo (Golias)", () => {
    const draconato = createBlankCharacter("t");
    draconato.speciesId = "draconato";
    expect(getSpeciesLineageDamageType(draconato)).toBeNull();

    const golias = createBlankCharacter("t");
    golias.speciesId = "golias";
    golias.speciesLineageId = "golias-fogo";
    expect(getSpeciesLineageDamageType(golias)).toBeNull();
  });
});

describe("getSpeciesLineageSpeedBonus — Elfo da Floresta (+1,5m)", () => {
  it("0 para qualquer espécie/linhagem que não seja Elfo da Floresta", () => {
    const humano = createBlankCharacter("t");
    humano.speciesId = "humano";
    expect(getSpeciesLineageSpeedBonus(humano)).toBe(0);

    const altoElfo = createBlankCharacter("t");
    altoElfo.speciesId = "elfo";
    altoElfo.speciesLineageId = "elfo-alto-elfo";
    expect(getSpeciesLineageSpeedBonus(altoElfo)).toBe(0);
  });

  it("1,5 para Elfo da Floresta", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-floresta";
    expect(getSpeciesLineageSpeedBonus(character)).toBe(1.5);
  });
});

describe("getSpeciesLineageSpellcastingAbility — mesma regra para Elfo/Gnomo/Tiefling (ajuste pedido: usar getSpellcastingAbility para o Elfo também)", () => {
  it("usa o atributo de conjuração da CLASSE quando ela já define um", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.classId = "mago"; // INT
    character.abilities.SAB.score = 20; // mesmo SAB bem maior, a classe vence
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("INT");
  });

  it("vale também para o Elfo — classe conjuradora vence qualquer atributo mais alto", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-drow";
    character.classId = "clerigo"; // SAB
    character.abilities.CAR.score = 20;
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("SAB");
  });

  it("sem classe conjuradora, usa o maior valor efetivo entre INT/SAB/CAR", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "tiefling";
    character.classId = "guerreiro"; // sem conjuração própria
    character.abilities.INT.score = 10;
    character.abilities.SAB.score = 16;
    character.abilities.CAR.score = 12;
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("SAB");
  });

  it("Elfo sem classe conjuradora também usa o maior valor efetivo entre INT/SAB/CAR (nunca precisa de escolha manual)", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-alto-elfo";
    character.classId = "guerreiro";
    character.abilities.CAR.score = 18;
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("CAR");
  });

  it("empate decidido por INT > SAB > CAR — nunca escolhe INT só por ser o primeiro quando não empata", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.abilities.INT.score = 10;
    character.abilities.SAB.score = 10;
    character.abilities.CAR.score = 14; // maior isolado — não é empate, deve vencer
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("CAR");

    character.abilities.CAR.score = 10; // agora os 3 empatam em 10
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("INT");

    character.abilities.INT.score = 8; // INT cai, SAB e CAR empatam em 10 — SAB vence (prioridade sobre CAR)
    expect(getSpeciesLineageSpellcastingAbility(character)).toBe("SAB");
  });
});
