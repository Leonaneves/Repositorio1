import { describe, expect, it } from "vitest";
import { CLASS_IDS, BACKGROUND_IDS, SPECIES_IDS } from "../../domain/ids.js";
import { backgroundFeatFeatures } from "./backgrounds.js";
import { classFeatures } from "./classes.js";
import { generalFeats } from "./feats.js";
import { speciesFeatures } from "./species.js";
import { subclassFeatures } from "./subclasses.js";

describe("catálogo de features — integridade estrutural", () => {
  it("todo id é único entre TODAS as fontes (nunca colide)", () => {
    const allIds = [...classFeatures, ...subclassFeatures, ...speciesFeatures, ...backgroundFeatFeatures, ...generalFeats].map(
      (f) => f.id,
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("classFeatures: só entradas com classId válido e sourceType 'class'", () => {
    for (const feature of classFeatures) {
      expect(feature.sourceType).toBe("class");
      expect(feature.classId).toBeDefined();
      expect(CLASS_IDS).toContain(feature.classId);
    }
  });

  it("speciesFeatures: uma entrada por espécie, todas com sourceType 'species'", () => {
    expect(speciesFeatures).toHaveLength(SPECIES_IDS.length);
    for (const feature of speciesFeatures) {
      expect(feature.sourceType).toBe("species");
      expect(SPECIES_IDS).toContain(feature.speciesId);
    }
  });

  it("backgroundFeatFeatures: uma entrada por antecedente, todas com sourceType 'feat'", () => {
    expect(backgroundFeatFeatures).toHaveLength(BACKGROUND_IDS.length);
    for (const feature of backgroundFeatFeatures) {
      expect(feature.sourceType).toBe("feat");
      expect(BACKGROUND_IDS).toContain(feature.backgroundId);
    }
  });

  it("generalFeats: os 10 Talentos de Origem + 29 Talentos Gerais do PHB 2024 (39 no total), todos com sourceType 'feat' e level null", () => {
    expect(generalFeats).toHaveLength(39);
    const names = generalFeats.map((feature) => feature.name).sort();
    expect(names).toEqual(
      [
        // Talentos de Origem (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF")
        "Alerta",
        "Artifista",
        "Atacante Selvagem",
        "Curandeiro",
        "Habilidoso",
        "Iniciado em Magia",
        "Músico",
        "Sortudo",
        "Valentão de Taverna",
        "Vigoroso",
        // Talentos Gerais (fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF")
        "Especialista em Armaduras Pesadas",
        "Especialista em Besta",
        "Especialista em Perícia",
        "Exterminador de Conjuradores",
        "Imobilizador",
        "Líder Inspirador",
        "Mente Aguçada",
        "Mestre das Armas",
        "Mestre em Armaduras Médias",
        "Mestre em Armaduras Pesadas",
        "Mestre em Armas de Haste",
        "Mestre em Armas Grandes",
        "Mestre em Escudos",
        "Mestre-Atirador",
        "Perfurador",
        "Resiliente",
        "Resistente",
        "Sentinela",
        "Sorrateiro",
        "Talhador",
        "Telecinético",
        "Telepático",
        "Tocado Pelas Sombras",
        "Tocado Por Fadas",
        "Treinamento com Armas Marciais",
        "Velocista",
        // Pré-requisito: Conjuração ou Magia de Pacto
        "Adepto Elemental",
        "Atirador de Magias",
        "Conjurador de Guerra",
      ].sort(),
    );
    for (const feature of generalFeats) {
      expect(feature.sourceType).toBe("feat");
      expect(feature.level).toBeNull();
    }
  });

  it("subclassFeatures: só as 4 subclasses de Bárbaro + 4 de Bardo + 4 de Bruxo + 4 de Clérigo + 4 de Druida + 4 de Feiticeiro + 4 de Patrulheiro + 4 de Guerreiro + 4 de Ladino + 4 de Mago + 4 de Monge + 4 de Paladino por ora (fontes fornecidas), todas com sourceType 'subclass' e subclassFullName válido", () => {
    expect(subclassFeatures.length).toBeGreaterThan(0);
    const confirmedSubclassNames = [
      "Caminho da Árvore do Mundo",
      "Caminho do Berserker",
      "Caminho do Coração Selvagem",
      "Caminho do Fanático",
      "Colégio da Bravura",
      "Colégio da Dança",
      "Colégio do Conhecimento",
      "Colégio do Glamour",
      "Patrono Arquifada",
      "Patrono Celestial",
      "Patrono Grande Antigo",
      "Patrono Ínfero",
      "Domínio da Guerra",
      "Domínio da Luz",
      "Domínio da Trapaça",
      "Domínio da Vida",
      "Círculo da Lua",
      "Círculo da Terra",
      "Círculo das Estrelas",
      "Círculo do Mar",
      "Feitiçaria Aberrante",
      "Feitiçaria Dracônica",
      "Feitiçaria Mecânica",
      "Feitiçaria Selvagem",
      "Andarilho Feérico",
      "Caçador",
      "Senhor das Feras",
      "Vigilante das Sombras",
      "Campeão",
      "Cavaleiro Místico",
      "Guerreiro Psiônico",
      "Mestre da Batalha",
      // Ladino — "Lâmina Psíquica" é o fullName/valor interno (exibido como "Adaga Espiritual").
      "Lâmina Psíquica",
      "Assassino",
      "Ladrão",
      "Trapaceiro Arcano",
      // Mago — "Adivinho" é o fullName/valor interno (exibido como "Adivinhador").
      "Abjurador",
      "Adivinho",
      "Evocador",
      "Ilusionista",
      // Monge — fullNames preservados por compatibilidade (contaminação "Guerreiro" do
      // copia-e-cola original), exibidos como "Caminho da Mão Aberta/da Misericórdia/das
      // Sombras/dos Elementos".
      "Guerreiro da Mão Aberta",
      "Guerreiro da Misericórdia",
      "Guerreiro das Sombras",
      "Guerreiro dos Elementos",
      "Juramento da Devoção",
      "Juramento da Glória",
      "Juramento da Vingança",
      "Juramento dos Anciões",
    ];
    for (const feature of subclassFeatures) {
      expect(feature.sourceType).toBe("subclass");
      expect(confirmedSubclassNames).toContain(feature.subclassFullName);
    }
  });
});
