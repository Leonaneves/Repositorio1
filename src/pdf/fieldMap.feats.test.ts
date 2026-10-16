import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring dos Talentos de Origem no campo
 * "Talentos" do PDF (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E
 * NO PDF" §3/§14) — não re-testa o CONTEÚDO de cada texto (já coberto
 * por `rules/featTalentEntries.test.ts`) — só que o fieldMap realmente
 * invoca `getFeatTalentEntries` e entrega o resultado no campo certo,
 * sem sobrescrever o que Guerreiro/Bruxo/Paladino já colocam lá.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

describe("Talentos — talento de origem do Antecedente aparece com o texto resolvido do catálogo", () => {
  it("Soldado (Atacante Selvagem): aparece no campo Talentos, sem repetir o texto bruto antigo do originFeat", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    character.backgroundId = "soldado";
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Atacante Selvagem: 1/turno, dano da arma 2 vezes, escolhe resultado");
    expect(text).not.toContain("Rerola 1 dado de dano p/ turno"); // texto antigo (pré-catálogo), nunca mais impresso
  });

  it("sem antecedente nenhum: campo Talentos vazio (sem outras fontes)", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    expect(fieldValue("Talentos", character)).toBe("");
  });
});

describe("Talentos — talento escolhido em ASI aparece junto, nunca sobrescreve o já existente (Guerreiro/Paladino)", () => {
  it("Guerreiro com Estilo de Luta + Vigoroso escolhido em ASI: as duas entradas aparecem", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "vigoroso" } };
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Vigoroso");
  });
});

describe("Talentos — notas manuais do jogador continuam preservadas junto dos textos automáticos", () => {
  it("nota manual some junto do texto automático do talento", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    character.backgroundId = "guarda"; // Alerta
    character.talentsNotes = "Também tenho um amuleto da sorte da família.";
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Alerta: após jogar Inic");
    expect(text).toContain("Também tenho um amuleto da sorte da família.");
  });
});

describe("PROF.ferramentas — Ferramentas/Instrumentos concedidos por Talento aparecem junto dos de classe", () => {
  it("Habilidoso (Antecedente Charlatão): ferramenta escolhida aparece resolvida pelo nome, sem sobrescrever PROF.ferramentas de classe", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    character.classId = "ladino"; // já tem PROF.ferramentas de classe (Ferramentas de Ladrão etc.)
    character.backgroundId = "charlatao";
    character.featureChoiceSelections["habilidoso-escolha-background"] = { value: ["ferramentas-ferreiro", "atletismo", "percepcao"] };
    const text = fieldValue("PROF.ferramentas", character);
    expect(text).toContain("Ferramentas de Ladrão");
    expect(text).toContain("Habilidoso: Ferramentas de Ferreiro");
  });

  it("sem nenhuma ferramenta concedida por Talento: PROF.ferramentas não ganha linha extra", () => {
    const character = createBlankCharacter("fieldmap-feats-test");
    character.backgroundId = "guarda"; // Alerta — não concede ferramenta
    expect(fieldValue("PROF.ferramentas", character)).toBe("");
  });
});
