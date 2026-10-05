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

  it("generalFeats fica vazio enquanto não houver fonte confirmada (nunca inventar)", () => {
    expect(generalFeats).toEqual([]);
  });

  it("subclassFeatures: só as 4 subclasses de Bárbaro + 4 de Bardo + 4 de Bruxo + 4 de Clérigo + 4 de Druida + 4 de Feiticeiro por ora (fontes fornecidas), todas com sourceType 'subclass' e subclassFullName válido", () => {
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
    ];
    for (const feature of subclassFeatures) {
      expect(feature.sourceType).toBe("subclass");
      expect(confirmedSubclassNames).toContain(feature.subclassFullName);
    }
  });
});
