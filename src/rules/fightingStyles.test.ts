import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { fightingStyles } from "../data/fightingStyles.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID } from "../data/features/subclasses.js";
import { RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID, RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID } from "../data/features/ranger.js";
import { PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID, PALADIN_FIGHTING_STYLE_CHOICE_ID } from "../data/features/paladin.js";
import {
  getActiveFightingStyles,
  getDefensiveFightingStyleBonus,
  getFightingStyleOptions,
  getFightingStylePrintedLine,
  getFightingStyleTalentEntries,
  isFightingStyleActive,
} from "./fightingStyles.js";

function fighterAt(level: number, subclassFullName: string | null = null) {
  const character = createBlankCharacter("fighting-styles-test");
  character.classId = "guerreiro";
  character.level = level;
  character.subclassId = subclassFullName;
  return character;
}

function rangerAt(level: number) {
  const character = createBlankCharacter("fighting-styles-test");
  character.classId = "patrulheiro";
  character.level = level;
  return character;
}

function paladinAt(level: number) {
  const character = createBlankCharacter("fighting-styles-test");
  character.classId = "paladino";
  character.level = level;
  return character;
}

describe("getActiveFightingStyles / isFightingStyleActive", () => {
  it("Guerreiro recém-criado sem escolha — []", () => {
    expect(getActiveFightingStyles(fighterAt(1))).toEqual([]);
  });

  it("Guerreiro com Estilo de Luta base escolhido — só essa entrada", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    expect(getActiveFightingStyles(character).map((s) => s.id)).toEqual(["defensivo"]);
    expect(isFightingStyleActive(character, "Defensivo")).toBe(true);
    expect(isFightingStyleActive(character, "Duelismo")).toBe(false);
  });

  it("Campeão nível 7 com os DOIS estilos escolhidos (base + adicional) — as duas entradas, na ordem base->adicional", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Arquearia" };
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    expect(getActiveFightingStyles(character).map((s) => s.name)).toEqual(["Arquearia", "Duelismo"]);
  });

  it("subclasse diferente de Campeão nunca lê a escolha adicional, mesmo preenchida por engano", () => {
    const character = fighterAt(7, "Mestre da Batalha");
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    expect(getActiveFightingStyles(character)).toEqual([]);
  });

  it("valor que não existe no catálogo (ex.: texto antigo pré-catálogo) é ignorado, nunca quebra", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defesa" }; // nome antigo/inválido
    expect(getActiveFightingStyles(character)).toEqual([]);
  });

  it("Patrulheiro: só conta a escolha de Estilo de Luta quando o ramo escolhido é 'Estilo de Luta', nunca com 'Combatente Druídico'", () => {
    const character = rangerAt(2);
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Combatente Druídico" };
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID] = { value: "Defensivo" };
    expect(getActiveFightingStyles(character)).toEqual([]);

    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID] = { value: "Estilo de Luta" };
    expect(getActiveFightingStyles(character).map((s) => s.name)).toEqual(["Defensivo"]);
  });

  it("Paladino: só conta a escolha de Estilo de Luta quando o ramo escolhido é 'Estilo de Luta', nunca com 'Combatente Abençoado'", () => {
    const character = paladinAt(2);
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Combatente Abençoado" };
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    expect(getActiveFightingStyles(character)).toEqual([]);

    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID] = { value: "Estilo de Luta" };
    expect(getActiveFightingStyles(character).map((s) => s.name)).toEqual(["Duelismo"]);
  });
});

describe("getFightingStyleOptions — cross-exclusão entre os 4 pontos de concessão", () => {
  it("sem nenhuma escolha feita ainda: as 10 opções completas, em qualquer dos 4 ids", () => {
    const character = fighterAt(7, "Campeão");
    expect(getFightingStyleOptions(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID)).toHaveLength(10);
    expect(getFightingStyleOptions(character, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID)).toHaveLength(10);
  });

  it("Campeão: o estilo já escolhido na concessão BASE nunca aparece nas opções da concessão ADICIONAL, e vice-versa", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    const additionalOptions = getFightingStyleOptions(character, FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID);
    expect(additionalOptions).not.toContain("Defensivo");
    expect(additionalOptions).toHaveLength(9);

    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    const baseOptions = getFightingStyleOptions(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID);
    expect(baseOptions).not.toContain("Duelismo");
    expect(baseOptions).toContain("Defensivo"); // a própria seleção atual deste id nunca se auto-exclui
  });

  it("a seleção ATUAL do próprio id nunca é excluída das suas próprias opções", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    expect(getFightingStyleOptions(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID)).toContain("Defensivo");
  });

  it("cross-exclusão é genérica entre QUALQUER par dos 4 ids, nunca um caso especial só do Guerreiro", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID] = { value: "Interceptação" };
    character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_CHOICE_ID] = { value: "Protetivo" };
    const options = getFightingStyleOptions(character, FIGHTER_FIGHTING_STYLE_CHOICE_ID);
    expect(options).not.toContain("Interceptação");
    expect(options).not.toContain("Protetivo");
    expect(options).toHaveLength(8);
  });
});

describe("getFightingStylePrintedLine — placeholders resolvidos", () => {
  it("estilos sem placeholder voltam literalmente, sem nenhuma substituição", () => {
    const character = fighterAt(1);
    const defensivo = fightingStyles.find((s) => s.id === "defensivo")!;
    expect(getFightingStylePrintedLine(defensivo, character)).toBe("Defensivo");
    const duelismo = fightingStyles.find((s) => s.id === "duelismo")!;
    expect(getFightingStylePrintedLine(duelismo, character)).toBe(duelismo.printedLine);
  });

  it("Interceptação resolve {BP} pelo bônus de proficiência do nível atual", () => {
    const interceptacao = fightingStyles.find((s) => s.id === "interceptacao")!;
    expect(getFightingStylePrintedLine(interceptacao, fighterAt(1))).toBe(
      "Interceptação: com arma/Escudo, Reação ao acerto em outro a 1,5m: reduz 1d10+2 dano",
    );
    expect(getFightingStylePrintedLine(interceptacao, fighterAt(9))).toBe(
      "Interceptação: com arma/Escudo, Reação ao acerto em outro a 1,5m: reduz 1d10+4 dano",
    );
  });

  it("Combate Desarmado resolve os dois dados (1d6/1d8) com o modificador de Força — positivo, zero e negativo", () => {
    const desarmado = fightingStyles.find((s) => s.id === "combate-desarmado")!;

    const positive = fighterAt(1);
    positive.abilities.FOR.score = 16; // mod +3
    expect(getFightingStylePrintedLine(desarmado, positive)).toBe(
      "Combate Desarmado: início do turno, 1d4 Conc a 1 criatura Imobilizada por você\nDesarmado 1d6+3; sem arma/Escudo 1d8+3 Conc",
    );

    const zero = fighterAt(1);
    zero.abilities.FOR.score = 10; // mod 0
    expect(getFightingStylePrintedLine(desarmado, zero)).toBe(
      "Combate Desarmado: início do turno, 1d4 Conc a 1 criatura Imobilizada por você\nDesarmado 1d6; sem arma/Escudo 1d8 Conc",
    );

    const negative = fighterAt(1);
    negative.abilities.FOR.score = 8; // mod -1
    expect(getFightingStylePrintedLine(desarmado, negative)).toBe(
      "Combate Desarmado: início do turno, 1d4 Conc a 1 criatura Imobilizada por você\nDesarmado 1d6-1; sem arma/Escudo 1d8-1 Conc",
    );
  });
});

describe("getFightingStyleTalentEntries — uma ÚNICA entrada mesclada, sem linha em branco entre estilos", () => {
  it("nenhum estilo ativo — []", () => {
    expect(getFightingStyleTalentEntries(fighterAt(1))).toEqual([]);
  });

  it("um único estilo ativo — uma entrada, com source 'class'", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Arquearia" };
    const entries = getFightingStyleTalentEntries(character);
    expect(entries).toEqual([{ text: "Arquearia: +2 Atq com armas à Distância", source: "class" }]);
  });

  it("Campeão com os 2 estilos ativos — UMA única entrada, as 2 linhas unidas por '\\n' (nunca '\\n\\n', nunca 2 entradas)", () => {
    const character = fighterAt(7, "Campeão");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    character.featureChoiceSelections[FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID] = { value: "Duelismo" };
    const entries = getFightingStyleTalentEntries(character);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("Defensivo\nDuelismo: +2 dano com arma corpo a corpo em 1 mão, sem outra arma");
    expect(entries[0].text).not.toContain("\n\n");
  });
});

describe("getDefensiveFightingStyleBonus", () => {
  it("sem Defensivo ativo, com armadura equipada — 0", () => {
    const character = fighterAt(1);
    character.armor.equipped = "couro";
    expect(getDefensiveFightingStyleBonus(character)).toBe(0);
  });

  it("com Defensivo ativo e armadura equipada — +1", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    character.armor.equipped = "cotaDeMalha";
    expect(getDefensiveFightingStyleBonus(character)).toBe(1);
  });

  it("com Defensivo ativo mas desarmado (sem armadura) — 0, nunca aplica o bônus", () => {
    const character = fighterAt(1);
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    character.armor.equipped = "unarmed";
    expect(getDefensiveFightingStyleBonus(character)).toBe(0);
  });
});
