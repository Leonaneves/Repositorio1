import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import type { Character } from "../domain/character.js";
import { pdfTextFields } from "./fieldMap.js";

/**
 * Testes de integração do wiring do Talento de Origem do Humano (traço
 * "Versátil") no PDF — fonte "ADICIONAR ESCOLHA DE TALENTO DE ORIGEM DO
 * HUMANO NA ETAPA ESPÉCIE" §5: "aplicar os benefícios nos campos
 * correspondentes e imprimir o resumo aprovado do talento na caixa
 * Talentos. Não repetir o texto em Características de Espécie". Não
 * re-testa o CONTEÚDO de cada texto de talento (já coberto por
 * `pdf/fieldMap.feats.test.ts`/`rules/featTalentEntries.test.ts`) — só
 * que a aquisição "species" chega ao PDF pelo mesmo caminho genérico das
 * aquisições de Antecedente/ASI, sem duplicar em HABILIDADES.ESPECIE e
 * sem sobrescrever talentos de outras origens já presentes em Talentos.
 */
function fieldValue(pdfField: string, character: Character): string {
  const mapping = pdfTextFields.find((f) => f.pdfField === pdfField);
  if (!mapping) throw new Error(`Campo não encontrado no fieldMap: ${pdfField}`);
  return mapping.getValue(character) as string;
}

function humanWith(featId: string | null): Character {
  const character = createBlankCharacter("fieldmap-human-origin-feat-test");
  character.speciesId = "humano";
  character.humanOriginFeatId = featId;
  return character;
}

describe("Talentos — Talento de Origem do Humano aparece no campo, resolvido pelo catálogo mecânico", () => {
  it("Alerta (sem escolha interna): aparece em Talentos com o texto já resolvido", () => {
    const character = humanWith("alerta");
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Alerta: após jogar Inic, pode trocar com aliado voluntário, ambos sem Incapacitado");
  });

  it("sem Talento de Origem escolhido ainda: campo Talentos vazio (sem outras fontes)", () => {
    const character = humanWith(null);
    expect(fieldValue("Talentos", character)).toBe("");
  });

  it("espécie diferente de Humano: humanOriginFeatId preenchido por engano nunca aparece em Talentos", () => {
    const character = humanWith("alerta");
    character.speciesId = "elfo";
    expect(fieldValue("Talentos", character)).toBe("");
  });
});

describe("Talentos — Talento de Origem do Humano nunca sobrescreve talentos de outras origens, inclusive o do próprio Antecedente", () => {
  it("Humano (Vigoroso) + Antecedente (Soldado, Atacante Selvagem): as duas entradas aparecem juntas", () => {
    const character = humanWith("vigoroso");
    character.backgroundId = "soldado";
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Vigoroso");
    expect(text).toContain("Atacante Selvagem: 1/turno, dano da arma 2 vezes, escolhe resultado");
  });

  it("Humano + talento escolhido em ASI: as duas entradas aparecem juntas, nunca sobrescrevendo uma à outra", () => {
    const character = humanWith("vigoroso");
    character.classId = "guerreiro";
    character.level = 4;
    character.asiSelections = { 4: { kind: "feat", featId: "sortudo" } };
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Vigoroso");
    expect(text).toContain("Sortudo: Vant em Teste de D20 ou Desv em Atq contra você");
  });

  it("notas manuais do jogador continuam preservadas junto do texto automático do Talento de Origem do Humano", () => {
    const character = humanWith("vigoroso");
    character.talentsNotes = "Também tenho uma cicatriz de guerra.";
    const text = fieldValue("Talentos", character);
    expect(text).toContain("Vigoroso");
    expect(text).toContain("Também tenho uma cicatriz de guerra.");
  });
});

describe("HABILIDADES.ESPECIE — nunca repete o Talento de Origem do Humano (só os Traços de Espécie, sempre o mesmo texto independente do talento escolhido)", () => {
  it("texto idêntico independente de qual Talento de Origem o Humano escolheu", () => {
    const alerta = fieldValue("HABILIDADES.ESPECIE", humanWith("alerta"));
    const vigoroso = fieldValue("HABILIDADES.ESPECIE", humanWith("vigoroso"));
    const semEscolha = fieldValue("HABILIDADES.ESPECIE", humanWith(null));
    expect(alerta).toBe("Ganha 1 Inspiração Heroica quando terminar um Descanso Longo");
    expect(vigoroso).toBe(alerta);
    expect(semEscolha).toBe(alerta);
  });

  it("nunca contém o nome do talento escolhido", () => {
    const text = fieldValue("HABILIDADES.ESPECIE", humanWith("atacante-selvagem"));
    expect(text).not.toContain("Atacante Selvagem");
  });
});

describe("PROF.ferramentas — Ferramentas/Instrumentos concedidos pelo Talento de Origem do Humano aparecem resolvidos (ex.: Habilidoso)", () => {
  it("Habilidoso escolhido pelo Humano: ferramenta aparece resolvida pelo nome", () => {
    const character = humanWith("habilidoso");
    character.featureChoiceSelections["habilidoso-escolha-species"] = { value: ["ferramentas-ferreiro", "atletismo", "percepcao"] };
    const text = fieldValue("PROF.ferramentas", character);
    expect(text).toContain("Habilidoso: Ferramentas de Ferreiro");
  });
});

describe("Conjunto completo — Humano com Talento de Origem repetível (Iniciado em Magia) convivendo com a mesma concessão do Antecedente, cada aquisição independente", () => {
  it("Humano (Iniciado em Magia, lista própria) + Antecedente Acólito (Iniciado em Magia, Clérigo): 2 entradas distintas, nunca fundidas", () => {
    const character = humanWith("iniciado-em-magia");
    character.backgroundId = "acolito"; // Iniciado em Magia (Clérigo), lista fixa
    character.featureChoiceSelections["iniciado-em-magia-lista-species"] = { value: "Mago" };
    character.featureChoiceSelections["iniciado-em-magia-magia-1-circulo-species"] = { value: "Mãos Mágicas" };
    character.featureChoiceSelections["iniciado-em-magia-magia-1-circulo-background"] = { value: "Curar Ferimentos" };

    const text = fieldValue("Talentos", character);
    const occurrences = (text.match(/Iniciado em Magia/g) ?? []).length;
    expect(occurrences).toBe(2);
    expect(text).toContain("Iniciado em Magia (Mago): Mãos Mágicas sem espaço [__]/DL");
    expect(text).toContain("Iniciado em Magia (Clérigo): Curar Ferimentos sem espaço [__]/DL");
  });
});
