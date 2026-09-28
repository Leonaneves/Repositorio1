import { SPECIES_IDS } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { species } from "../species.js";

/**
 * Uma feature por espécie, reaproveitando o `traitsText` já confirmado
 * (extraído literalmente do script `ESPECIE` do PDF original — ver
 * `data/species.ts`). Mantido como um bloco único por espécie, e não
 * subdividido em traços individuais, pela mesma razão documentada lá:
 * o texto tem lacunas e sub-itens (ex.: linhagem do Draconato) que
 * seria arriscado reorganizar sem confirmação.
 */
export const speciesFeatures: FeatureDefinition[] = SPECIES_IDS.map((speciesId) => ({
  id: `especie-${speciesId}-tracos`,
  name: `Traços de ${species[speciesId].name}`,
  sourceType: "species",
  speciesId,
  level: null,
  autoGranted: true,
  summary: species[speciesId].traitsText,
}));
