import { BACKGROUND_IDS } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { backgrounds } from "../backgrounds.js";

/**
 * O talento de origem de cada antecedente (`originFeat`, já confirmado
 * — extraído do script `ANTECEDENTE` do PDF original) modelado como uma
 * feature `sourceType: "feat"` concedida automaticamente pela fonte
 * "background" (decisão aprovada §8: o talento de origem entra no
 * mesmo sistema estrutural dos talentos gerais). Sem catálogo de
 * talentos por trás (decisão §7/§8), então o "efeito mecânico"
 * detalhado (ex.: quais truques/magias do "Iniciado em Magia") continua
 * como texto — pendente até existir um catálogo de magias.
 */
export const backgroundFeatFeatures: FeatureDefinition[] = BACKGROUND_IDS.map((backgroundId) => ({
  id: `antecedente-${backgroundId}-talento-origem`,
  name: `Talento de Origem — ${backgrounds[backgroundId].name}`,
  sourceType: "feat",
  backgroundId,
  level: null,
  autoGranted: true,
  summary: backgrounds[backgroundId].originFeat,
}));
