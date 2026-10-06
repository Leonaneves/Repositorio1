import { describe, expect, it } from "vitest";
import { SPECIES_IDS } from "../domain/ids.js";
import {
  DRACONIC_ANCESTRIES,
  ELVEN_LINEAGES,
  findSpeciesLineageOption,
  GIANT_ANCESTRIES,
  getSpeciesLineageLabel,
  getSpeciesLineageOptions,
  GNOMISH_LINEAGES,
  hasSpeciesLineage,
  INFERNAL_LINEAGES,
} from "./speciesLineages.js";

describe("catálogo de Linhagens/Ancestralidades — contagens exatas pedidas", () => {
  it("Draconato: 10 ancestrais", () => expect(DRACONIC_ANCESTRIES).toHaveLength(10));
  it("Elfo: 3 linhagens (Alto Elfo/Drow/Elfo da Floresta — nunca 'Elfo Silvestre')", () => {
    expect(ELVEN_LINEAGES).toHaveLength(3);
    expect(ELVEN_LINEAGES.map((l) => l.name)).toEqual(["Alto Elfo", "Drow", "Elfo da Floresta"]);
  });
  it("Gnomo: 2 linhagens (nunca 'Gnomo do Bosque')", () => {
    expect(GNOMISH_LINEAGES).toHaveLength(2);
    expect(GNOMISH_LINEAGES.map((l) => l.name)).toEqual(["Gnomo da Floresta", "Gnomo da Rocha"]);
  });
  it("Golias: 6 ancestralidades", () => expect(GIANT_ANCESTRIES).toHaveLength(6));
  it("Tiefling: 3 linhagens", () => expect(INFERNAL_LINEAGES).toHaveLength(3));
});

describe("hasSpeciesLineage — só as 5 espécies da fonte têm linhagem", () => {
  it.each(SPECIES_IDS.map((id) => [id]))("%s", (id) => {
    const expected = ["draconato", "elfo", "gnomo", "golias", "tiefling"].includes(id);
    expect(hasSpeciesLineage(id)).toBe(expected);
  });

  it("null é sempre false (sem espécie escolhida)", () => expect(hasSpeciesLineage(null)).toBe(false));
});

describe("getSpeciesLineageLabel — rótulo exato por espécie", () => {
  it("bate com a tabela da fonte", () => {
    expect(getSpeciesLineageLabel("draconato")).toBe("Ancestral Dracônico");
    expect(getSpeciesLineageLabel("elfo")).toBe("Linhagem Élfica");
    expect(getSpeciesLineageLabel("gnomo")).toBe("Linhagem Gnômica");
    expect(getSpeciesLineageLabel("golias")).toBe("Ancestralidade Gigante");
    expect(getSpeciesLineageLabel("tiefling")).toBe("Linhagem Infernal");
  });

  it("null para qualquer espécie sem linhagem", () => expect(getSpeciesLineageLabel("humano")).toBeNull());
});

describe("findSpeciesLineageOption / getSpeciesLineageOptions — ids únicos e tipos de dano exatos", () => {
  it("Draconato Verde → Veneno; Vermelho/Ouro/Latão → Fogo; Azul/Bronze → Elétrico; Preto/Cobre → Ácido; Prata/Branco → Frio", () => {
    expect(findSpeciesLineageOption("draconato", "draconato-verde")).toMatchObject({ name: "Verde", damageType: "Veneno" });
    expect(findSpeciesLineageOption("draconato", "draconato-vermelho")).toMatchObject({ damageType: "Fogo" });
    expect(findSpeciesLineageOption("draconato", "draconato-azul")).toMatchObject({ damageType: "Elétrico" });
    expect(findSpeciesLineageOption("draconato", "draconato-preto")).toMatchObject({ damageType: "Ácido" });
    expect(findSpeciesLineageOption("draconato", "draconato-prata")).toMatchObject({ damageType: "Frio" });
  });

  it("Tiefling Abissal → Venenoso (nunca 'Veneno', diferente do Draconato Verde)", () => {
    expect(findSpeciesLineageOption("tiefling", "tiefling-abissal")).toMatchObject({ damageType: "Venenoso" });
  });

  it("todos os ids são globalmente únicos entre as 5 espécies", () => {
    const allIds = [...DRACONIC_ANCESTRIES, ...ELVEN_LINEAGES, ...GNOMISH_LINEAGES, ...GIANT_ANCESTRIES, ...INFERNAL_LINEAGES].map(
      (o) => o.id,
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("null quando o id não pertence à espécie informada (nunca mistura catálogos)", () => {
    expect(findSpeciesLineageOption("elfo", "draconato-vermelho")).toBeNull();
  });

  it("getSpeciesLineageOptions devolve [] para espécie sem linhagem", () => {
    expect(getSpeciesLineageOptions("humano")).toEqual([]);
  });
});
