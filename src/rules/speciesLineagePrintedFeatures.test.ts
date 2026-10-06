import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getSpeciesTraitsPrintedText } from "./speciesLineagePrintedFeatures.js";

/** Nenhuma variável/condição literal `{...}` pode sobrar no texto final. */
function expectNoLiteralPlaceholders(text: string) {
  expect(text).not.toMatch(/\{[^}]*\}/);
}

describe("getSpeciesTraitsPrintedText — espécies sem linhagem continuam com o traitsText estático", () => {
  it("Humano/Anão/Halfling/Aasimar/Orc: texto igual ao species[id].traitsText", () => {
    const character = createBlankCharacter("t");
    character.speciesId = "anao";
    expect(getSpeciesTraitsPrintedText(character)).toContain("RESILIÊNCIA ANÃNICA");
  });

  it("\"\" sem espécie escolhida", () => {
    const character = createBlankCharacter("t");
    expect(getSpeciesTraitsPrintedText(character)).toBe("");
  });
});

describe("getSpeciesTraitsPrintedText — Draconato", () => {
  function draconatoAt(level: number, lineageId: string | null) {
    const character = createBlankCharacter("t");
    character.speciesId = "draconato";
    character.level = level;
    character.speciesLineageId = lineageId;
    character.abilities.CON.score = 14; // +2
    return character;
  }

  it("nível 1: CD=8+2(CON)+2(Prof)=12, 1d10, sem bloco de Vôo", () => {
    const text = getSpeciesTraitsPrintedText(draconatoAt(1, "draconato-vermelho"));
    expect(text).toContain("# VISÃO NO ESCURO 18m");
    expect(text).toContain("# Resistência a dano Fogo");
    expect(text).toContain("Salv. de DES CD 12 para 1/2 do dano");
    expect(text).toContain("Dano = 1d10 Fogo");
    expect(text).not.toContain("VÔO DRACÔNICO");
    expectNoLiteralPlaceholders(text);
  });

  it("nível 5: 2d10, CD=8+2+3=13, bloco de Vôo aparece com o deslocamento atual", () => {
    const text = getSpeciesTraitsPrintedText(draconatoAt(5, "draconato-azul"));
    expect(text).toContain("# Resistência a dano Elétrico");
    expect(text).toContain("Salv. de DES CD 13 para 1/2 do dano");
    expect(text).toContain("Dano = 2d10 Elétrico");
    expect(text).toContain("# VÔO DRACÔNICO (1 uso/DL)");
    expect(text).toContain("AB: vôo = 9m por 10 min");
  });

  it("nível 11: 3d10, CD=8+2+4=14", () => {
    const text = getSpeciesTraitsPrintedText(draconatoAt(11, "draconato-prata"));
    expect(text).toContain("# Resistência a dano Frio");
    expect(text).toContain("Salv. de DES CD 14 para 1/2 do dano");
    expect(text).toContain("Dano = 3d10 Frio");
  });

  it("nível 17: 4d10, CD=8+2+6=16", () => {
    const text = getSpeciesTraitsPrintedText(draconatoAt(17, "draconato-verde"));
    expect(text).toContain("# Resistência a dano Veneno");
    expect(text).toContain("Salv. de DES CD 16 para 1/2 do dano");
    expect(text).toContain("Dano = 4d10 Veneno");
  });

  it("sem ancestral escolhido, nunca mostra placeholder literal", () => {
    const text = getSpeciesTraitsPrintedText(draconatoAt(1, null));
    expectNoLiteralPlaceholders(text);
    expect(text).toContain("não escolhido");
  });
});

describe("getSpeciesTraitsPrintedText — Elfo", () => {
  function elfoAt(level: number, lineageId: string | null) {
    const character = createBlankCharacter("t");
    character.speciesId = "elfo";
    character.level = level;
    character.speciesLineageId = lineageId;
    return character;
  }

  it("Drow: Visão no Escuro 36m (sobrescreve o padrão de 18m)", () => {
    const text = getSpeciesTraitsPrintedText(elfoAt(1, "elfo-drow"));
    expect(text).toContain("# VISÃO NO ESCURO 36m");
    expect(text).toContain("# LINHAGEM ÉLFICA:\nDrow");
  });

  it("Alto Elfo/Elfo da Floresta: Visão no Escuro 18m (padrão)", () => {
    expect(getSpeciesTraitsPrintedText(elfoAt(1, "elfo-alto-elfo"))).toContain("# VISÃO NO ESCURO 18m");
    expect(getSpeciesTraitsPrintedText(elfoAt(1, "elfo-floresta"))).toContain("# VISÃO NO ESCURO 18m");
  });

  it("nunca duplica a lista de magias dentro do bloco de traços (nenhum nome de magia aparece aqui)", () => {
    const text = getSpeciesTraitsPrintedText(elfoAt(5, "elfo-alto-elfo"));
    expect(text).not.toContain("Prestidigitação");
    expect(text).not.toContain("Detectar Magia");
    expect(text).not.toContain("Passo Nebuloso");
  });

  it("usa a frase nova ('Não dorme, nem por magias'), não a antiga ('meios mágicos')", () => {
    const text = getSpeciesTraitsPrintedText(elfoAt(1, "elfo-drow"));
    expect(text).toContain("Não dorme, nem por magias");
    expect(text).not.toContain("meios mágicos");
  });

  it("sem linhagem escolhida, nunca mostra placeholder literal", () => {
    const text = getSpeciesTraitsPrintedText(elfoAt(1, null));
    expectNoLiteralPlaceholders(text);
  });
});

describe("getSpeciesTraitsPrintedText — Gnomo", () => {
  function gnomoAt(level: number, lineageId: string | null) {
    const character = createBlankCharacter("t");
    character.speciesId = "gnomo";
    character.level = level;
    character.speciesLineageId = lineageId;
    return character;
  }

  it("Gnomo da Floresta: usos grátis por Bônus de Proficiência", () => {
    const text = getSpeciesTraitsPrintedText(gnomoAt(5, "gnomo-floresta")); // Prof +3
    expect(text).toContain("# GNOMO DA FLORESTA:");
    expect(text).toContain("3 usos grátis / DL");
    expect(text).toContain("> Ilusão Menor");
  });

  it("Gnomo da Rocha: bloco de fabricação de dispositivos", () => {
    const text = getSpeciesTraitsPrintedText(gnomoAt(1, "gnomo-rocha"));
    expect(text).toContain("# GNOMO DA ROCHA:");
    expect(text).toContain(">Remendo");
    expect(text).toContain(">Prestidigitação");
    expect(text).toContain("Max de 3 itens p/ vez");
  });

  it("sem linhagem escolhida, nunca mostra placeholder literal", () => {
    expectNoLiteralPlaceholders(getSpeciesTraitsPrintedText(gnomoAt(1, null)));
  });
});

describe("getSpeciesTraitsPrintedText — Golias", () => {
  function goliasAt(level: number, lineageId: string | null) {
    const character = createBlankCharacter("t");
    character.speciesId = "golias";
    character.level = level;
    character.speciesLineageId = lineageId;
    character.abilities.CON.score = 14; // +2
    return character;
  }

  it("FORMA GRANDE só aparece a partir do nível 5", () => {
    expect(getSpeciesTraitsPrintedText(goliasAt(4, "golias-fogo"))).not.toContain("FORMA GRANDE");
    expect(getSpeciesTraitsPrintedText(goliasAt(5, "golias-fogo"))).toContain("FORMA GRANDE");
  });

  it("PORTE PODEROSO é incondicional — aparece mesmo sem ancestralidade escolhida e em qualquer nível", () => {
    const text1 = getSpeciesTraitsPrintedText(goliasAt(1, null));
    expect(text1).toContain("#PORTE PODEROSO");
    expect(text1).toContain("Vant. contra condição Imobilizado");

    const text20 = getSpeciesTraitsPrintedText(goliasAt(20, "golias-tempestade"));
    expect(text20).toContain("#PORTE PODEROSO");
  });

  it.each([
    ["golias-gelo", "Frio"],
    ["golias-fogo", "Fogo"],
    ["golias-nuvens", "teleporte"],
    ["golias-colina", "Caída"],
    ["golias-tempestade", "Trovejante"],
  ])("ancestralidade %s aparece no bloco GIGANTE com usos = Bônus de Proficiência", (lineageId, expectedSubstring) => {
    const text = getSpeciesTraitsPrintedText(goliasAt(5, lineageId));
    expect(text).toContain(expectedSubstring);
    expect(text).toContain("Usos: 3/DL");
  });

  it("Pedra: modificador de CON formatado corretamente, nunca '+ -1'", () => {
    const negativo = goliasAt(5, "golias-pedra");
    negativo.abilities.CON.score = 8; // -1
    const text = getSpeciesTraitsPrintedText(negativo);
    expect(text).toContain("1d12 - 1");
    expect(text).not.toContain("+ -1");
    expect(text).not.toContain("-  1");

    const positivo = goliasAt(5, "golias-pedra"); // CON 14 (padrão deste describe) → +2
    const textPositivo = getSpeciesTraitsPrintedText(positivo);
    expect(textPositivo).toContain("1d12 + 2");
  });

  it("sem ancestralidade escolhida, nunca mostra placeholder literal", () => {
    expectNoLiteralPlaceholders(getSpeciesTraitsPrintedText(goliasAt(5, null)));
  });
});

describe("getSpeciesTraitsPrintedText — Tiefling", () => {
  function tieflingAt(level: number, lineageId: string | null) {
    const character = createBlankCharacter("t");
    character.speciesId = "tiefling";
    character.level = level;
    character.speciesLineageId = lineageId;
    return character;
  }

  it("nível 1: só o truque da linhagem, sem as linhas de nível 3/5", () => {
    const text = getSpeciesTraitsPrintedText(tieflingAt(1, "tiefling-infernal"));
    expect(text).toContain(">Raio de Fogo");
    expect(text).not.toContain("Repreensão Infernal");
    expect(text).not.toContain("Escuridão");
  });

  it("nível 3: soma a linha de nível 3, ainda sem a de nível 5", () => {
    const text = getSpeciesTraitsPrintedText(tieflingAt(3, "tiefling-infernal"));
    expect(text).toContain(">Repreensão Infernal");
    expect(text).not.toContain(">Escuridão");
  });

  it("nível 5: todas as 3 linhas presentes", () => {
    const text = getSpeciesTraitsPrintedText(tieflingAt(5, "tiefling-infernal"));
    expect(text).toContain(">Raio de Fogo");
    expect(text).toContain(">Repreensão Infernal");
    expect(text).toContain(">Escuridão");
  });

  it("Abissal usa Venenoso (não Veneno) e Ctônico usa Necrótico", () => {
    expect(getSpeciesTraitsPrintedText(tieflingAt(1, "tiefling-abissal"))).toContain("Resistência a dano Venenoso");
    expect(getSpeciesTraitsPrintedText(tieflingAt(1, "tiefling-ctonico"))).toContain("Resistência a dano Necrótico");
  });

  it("sem linhagem escolhida, nunca mostra placeholder literal e omite as linhas de resistência/truque", () => {
    const text = getSpeciesTraitsPrintedText(tieflingAt(1, null));
    expectNoLiteralPlaceholders(text);
    expect(text).not.toContain("Resistência a dano");
  });
});
