import type { SpeciesId } from "../domain/ids.js";

/**
 * Catálogo das 5 escolhas de Linhagem/Ancestralidade do PHB 2024 (fonte
 * "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES NA ETAPA ESPÉCIE"): Ancestral
 * Dracônico (Draconato), Linhagem Élfica (Elfo), Linhagem Gnômica
 * (Gnomo), Ancestralidade Gigante (Golias) e Linhagem Infernal
 * (Tiefling). As outras 5 espécies do projeto (Humano/Anão/Halfling/
 * Aasimar/Orc) não têm nenhuma entrada aqui — `getSpeciesLineageOptions`
 * devolve `[]` para elas.
 */
export interface SpeciesLineageOption {
  /** Id globalmente único (nunca reaproveitado entre espécies). */
  id: string;
  speciesId: SpeciesId;
  name: string;
}

export interface DraconicAncestryOption extends SpeciesLineageOption {
  damageType: string;
}

/** Tabela exata pedida — "Veneno" (não "Venenoso") para o Draconato Verde. */
export const DRACONIC_ANCESTRIES: DraconicAncestryOption[] = [
  { id: "draconato-preto", speciesId: "draconato", name: "Preto", damageType: "Ácido" },
  { id: "draconato-azul", speciesId: "draconato", name: "Azul", damageType: "Elétrico" },
  { id: "draconato-latao", speciesId: "draconato", name: "Latão", damageType: "Fogo" },
  { id: "draconato-bronze", speciesId: "draconato", name: "Bronze", damageType: "Elétrico" },
  { id: "draconato-cobre", speciesId: "draconato", name: "Cobre", damageType: "Ácido" },
  { id: "draconato-ouro", speciesId: "draconato", name: "Ouro", damageType: "Fogo" },
  { id: "draconato-verde", speciesId: "draconato", name: "Verde", damageType: "Veneno" },
  { id: "draconato-vermelho", speciesId: "draconato", name: "Vermelho", damageType: "Fogo" },
  { id: "draconato-prata", speciesId: "draconato", name: "Prata", damageType: "Frio" },
  { id: "draconato-branco", speciesId: "draconato", name: "Branco", damageType: "Frio" },
];

export type ElvenLineageName = "Alto Elfo" | "Drow" | "Elfo da Floresta";

/** Não usar "Elfo Silvestre" — nome exigido é "Elfo da Floresta". */
export const ELVEN_LINEAGES: SpeciesLineageOption[] = [
  { id: "elfo-alto-elfo", speciesId: "elfo", name: "Alto Elfo" },
  { id: "elfo-drow", speciesId: "elfo", name: "Drow" },
  { id: "elfo-floresta", speciesId: "elfo", name: "Elfo da Floresta" },
];

/** Não usar "Gnomo do Bosque" — nome exigido é "Gnomo da Floresta". */
export const GNOMISH_LINEAGES: SpeciesLineageOption[] = [
  { id: "gnomo-floresta", speciesId: "gnomo", name: "Gnomo da Floresta" },
  { id: "gnomo-rocha", speciesId: "gnomo", name: "Gnomo da Rocha" },
];

/** O nome "Gigante de Gelo" permanece — aqui é só o rótulo curto "Gelo" da ancestralidade. */
export const GIANT_ANCESTRIES: SpeciesLineageOption[] = [
  { id: "golias-gelo", speciesId: "golias", name: "Gelo" },
  { id: "golias-fogo", speciesId: "golias", name: "Fogo" },
  { id: "golias-pedra", speciesId: "golias", name: "Pedra" },
  { id: "golias-nuvens", speciesId: "golias", name: "Nuvens" },
  { id: "golias-colina", speciesId: "golias", name: "Colina" },
  { id: "golias-tempestade", speciesId: "golias", name: "Tempestade" },
];

export interface InfernalLineageOption extends SpeciesLineageOption {
  damageType: string;
  cantripLevel1: string;
  spellLevel3: string;
  spellLevel5: string;
}

/** "Venenoso" (não "Veneno") para o Tiefling Abissal — tabela exata pedida. */
export const INFERNAL_LINEAGES: InfernalLineageOption[] = [
  { id: "tiefling-abissal", speciesId: "tiefling", name: "Abissal", damageType: "Venenoso", cantripLevel1: "Rajada de Veneno", spellLevel3: "Raio Nauseante", spellLevel5: "Imobilizar Pessoa" },
  { id: "tiefling-ctonico", speciesId: "tiefling", name: "Ctônico", damageType: "Necrótico", cantripLevel1: "Toque Arrepiante", spellLevel3: "Vitalidade Falsa", spellLevel5: "Raio do Enfraquecimento" },
  { id: "tiefling-infernal", speciesId: "tiefling", name: "Infernal", damageType: "Fogo", cantripLevel1: "Raio de Fogo", spellLevel3: "Repreensão Infernal", spellLevel5: "Escuridão" },
];

const SPECIES_LINEAGE_OPTIONS: Partial<Record<SpeciesId, SpeciesLineageOption[]>> = {
  draconato: DRACONIC_ANCESTRIES,
  elfo: ELVEN_LINEAGES,
  gnomo: GNOMISH_LINEAGES,
  golias: GIANT_ANCESTRIES,
  tiefling: INFERNAL_LINEAGES,
};

/** Rótulo da escolha, por espécie — usado como legenda na etapa Espécie e nos textos de bloqueio. */
export const SPECIES_LINEAGE_LABELS: Partial<Record<SpeciesId, string>> = {
  draconato: "Ancestral Dracônico",
  elfo: "Linhagem Élfica",
  gnomo: "Linhagem Gnômica",
  golias: "Ancestralidade Gigante",
  tiefling: "Linhagem Infernal",
};

/** `[]` para qualquer espécie sem linhagem (as outras 5 do projeto). */
export function getSpeciesLineageOptions(speciesId: SpeciesId): SpeciesLineageOption[] {
  return SPECIES_LINEAGE_OPTIONS[speciesId] ?? [];
}

export function hasSpeciesLineage(speciesId: SpeciesId | null): boolean {
  return speciesId !== null && getSpeciesLineageOptions(speciesId).length > 0;
}

export function getSpeciesLineageLabel(speciesId: SpeciesId): string | null {
  return SPECIES_LINEAGE_LABELS[speciesId] ?? null;
}

export function findSpeciesLineageOption(speciesId: SpeciesId, lineageId: string | null): SpeciesLineageOption | null {
  if (!lineageId) return null;
  return getSpeciesLineageOptions(speciesId).find((option) => option.id === lineageId) ?? null;
}
