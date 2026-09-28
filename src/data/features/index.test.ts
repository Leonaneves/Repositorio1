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

  it("subclassFeatures e generalFeats ficam vazios enquanto não houver fonte confirmada (nunca inventar)", () => {
    expect(subclassFeatures).toEqual([]);
    expect(generalFeats).toEqual([]);
  });
});
