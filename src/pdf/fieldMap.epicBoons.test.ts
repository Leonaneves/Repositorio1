import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { getEpicBoonChoiceId } from "../data/features/classes.js";
import { DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID } from "../data/features/epicBoons.js";
import { FIGHTER_FIGHTING_STYLE_CHOICE_ID } from "../data/features/fighter.js";
import { pdfCheckboxFields, pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring das Dádivas Épicas nos campos do PDF
 * (fonte "IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF"
 * §2/§15) — não re-testa o CONTEÚDO de cada texto impresso (já coberto
 * por `rules/epicBoonTalentEntries.test.ts`) nem o cálculo de cada
 * bônus (já coberto por `rules/abilities.test.ts`, `rules/hp.test.ts`,
 * `rules/speed.test.ts`, `rules/skills.test.ts`) — só que o fieldMap
 * realmente entrega cada benefício automático no campo certo, sem
 * repetir o que já está representado em outro campo, e sem sobrescrever
 * o que Manobras/Estilos de Luta/Talentos Gerais já colocam na caixa de
 * Talentos.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function checkboxValue(pdfField: string, character: Character): boolean {
  const mapping = pdfCheckboxFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Checkbox não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as boolean;
}

function fighterAt19WithBoon(boonName: string) {
  const character = createBlankCharacter("fieldmap-epic-boons-test");
  character.classId = "guerreiro";
  character.level = 19;
  character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: boonName };
  return character;
}

describe("Talentos — Dádiva Épica escolhida aparece no campo, sem sobrescrever Estilo de Luta/outros talentos já presentes", () => {
  it("Dádiva da Fortitude aparece junto do Estilo de Luta base do Guerreiro", () => {
    const character = fighterAt19WithBoon("Dádiva da Fortitude");
    character.featureChoiceSelections[FIGHTER_FIGHTING_STYLE_CHOICE_ID] = { value: "Defensivo" };
    character.abilities.CON.score = 14; // mod +2
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Dádiva da Fortitude: ao curar, +2 PV; recarrega no início do seu turno");
    expect(text).toContain("Defensivo");
  });

  it("sem Dádiva Épica escolhida (nível < 19): campo Talentos não ganha nenhuma linha de Dádiva", () => {
    const character = createBlankCharacter("fieldmap-epic-boons-test");
    character.classId = "guerreiro";
    character.level = 18;
    expect(fieldValue("Talentos", character)).not.toContain("Dádiva");
  });

  it("notas manuais do jogador continuam preservadas junto do texto automático da Dádiva", () => {
    const character = fighterAt19WithBoon("Dádiva da Velocidade");
    character.talentsNotes = "Também carrego um talismã de família.";
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Dádiva da Velocidade: AB Desengajar e encerra Imobilizado");
    expect(text).toContain("Também carrego um talismã de família.");
  });
});

describe("HP.max — Dádiva da Fortitude soma +40, sem repetir o bônus em nenhum outro campo", () => {
  it("+40 somado ao PV máximo normal do Guerreiro nível 19", () => {
    const withoutBoon = createBlankCharacter("fieldmap-epic-boons-test");
    withoutBoon.classId = "guerreiro";
    withoutBoon.level = 19;
    withoutBoon.abilities.CON.score = 12;
    const baseline = Number(fieldValue("HP.max", withoutBoon));

    const withBoon = fighterAt19WithBoon("Dádiva da Fortitude");
    withBoon.abilities.CON.score = 12;
    expect(Number(fieldValue("HP.max", withBoon))).toBe(baseline + 40);
  });
});

describe("Deslocamento — Dádiva da Velocidade soma +9m, nunca repetido na caixa de Talentos", () => {
  it("+9m somado ao deslocamento normal", () => {
    const character = fighterAt19WithBoon("Dádiva da Velocidade");
    character.speciesId = "humano"; // 9m
    expect(fieldValue("Deslocamento", character)).toBe("18");
    expect(fieldValue("Talentos", character)).not.toContain("9m");
  });
});

describe("FOR.val/.MOD — aumento de atributo da Dádiva Épica soma ao valor efetivo, independente do teto 20 dos Talentos Gerais", () => {
  it("Dádiva do Ataque Irresistível com FOR escolhida: +1 aparece em FOR.val e no modificador", () => {
    const character = fighterAt19WithBoon("Dádiva do Ataque Irresistível");
    character.abilities.FOR.score = 18; // mod +4
    character.featureChoiceSelections[`${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`] = { value: "FOR" };
    expect(fieldValue("FOR.val", character)).toBe("19");
    expect(fieldValue("FOR.MOD", character)).toBe("+4");
  });
});

describe("Perícias — Dádiva da Proficiência em Perícia marca todas as 18 perícias como proficientes, sem desmarcar nenhuma outra proficiência já existente", () => {
  it("perícia sem proficiência prévia por nenhuma outra fonte: checkbox marca true com a Dádiva ativa", () => {
    const character = fighterAt19WithBoon("Dádiva da Proficiência em Perícia");
    expect(checkboxValue("O.DEX.acr", character)).toBe(true);
    expect(checkboxValue("o.INT.arc", character)).toBe(true); // Arcanismo — exceção de nome do campo
  });

  it("sem a Dádiva ativa: nenhuma proficiência extra aparece", () => {
    const character = fighterAt19WithBoon("Dádiva da Velocidade");
    expect(checkboxValue("O.DEX.acr", character)).toBe(false);
  });

  it("proficiência já concedida por outra fonte (perícia de classe) continua marcada mesmo trocando para outra Dádiva", () => {
    const character = createBlankCharacter("fieldmap-epic-boons-test");
    character.classId = "guerreiro";
    character.level = 19;
    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["atletismo", "intimidacao"] };
    character.featureChoiceSelections[getEpicBoonChoiceId("guerreiro")] = { value: "Dádiva da Velocidade" };
    expect(checkboxValue("O.FOR.atl", character)).toBe(true);
  });
});

describe("Dádiva da Resistência à Energia — CD/dano resolvidos aparecem só na caixa de Talentos, sem campo próprio de Resistências", () => {
  it("texto aparece na caixa de Talentos com CD e dano já calculados", () => {
    const character = fighterAt19WithBoon("Dádiva da Resistência à Energia");
    character.abilities.CON.score = 14; // mod +2
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Res a 2 tipos, troca em DL");
    expect(text).toContain("CD 16");
  });
});
