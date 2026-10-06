import { SPECIES_IDS, type SkillKey } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { species } from "../species.js";

/**
 * Sentidos Aguçados (Elfo, traço básico — fonte "IMPLEMENTAR LINHAGENS
 * E ANCESTRALIDADES NA ETAPA ESPÉCIE" §5): escolha de proficiência
 * entre Intuição/Percepção/Sobrevivência, independente de qual
 * Linhagem Élfica o jogador escolher. `excludeAlreadyProficient` (mesmo
 * mecanismo já usado para Perícias de Classe — nunca duplicado,
 * reaproveitado) evita oferecer uma perícia já concedida por outra
 * fonte (ex.: Antecedente). Lido por `rules/skills.ts#isSkillGrantedBySpeciesChoice`.
 */
export const ELFO_SENTIDOS_AGUCADOS_CHOICE_ID = "elfo-sentidos-acucados-escolha";
const ELFO_SENTIDOS_AGUCADOS_OPTIONS: SkillKey[] = ["intuicao", "percepcao", "sobrevivencia"];

/**
 * Uma feature por espécie, reaproveitando o `traitsText` já confirmado
 * (extraído literalmente do script `ESPECIE` do PDF original — ver
 * `data/species.ts`). Mantido como um bloco único por espécie, e não
 * subdividido em traços individuais, pela mesma razão documentada lá:
 * o texto tem lacunas e sub-itens (ex.: linhagem do Draconato) que
 * seria arriscado reorganizar sem confirmação. Para Draconato/Elfo/
 * Gnomo/Golias/Tiefling, `rules/features.ts#getSpeciesFeatures`
 * sobrescreve `summary` com o texto DINÂMICO de
 * `rules/speciesLineagePrintedFeatures.ts` (resolve nível/linhagem
 * atuais) — o `traitsText` estático aqui nunca é lido para essas 5.
 * Só o Elfo tem `choices` (Sentidos Aguçados) — a escolha de Linhagem
 * Élfica em si fica fora do `FeatureChoice` genérico, com UI própria
 * na etapa Espécie (mesmo padrão de Metamagia/Invocações/ASI).
 */
export const speciesFeatures: FeatureDefinition[] = SPECIES_IDS.map((speciesId) => ({
  id: `especie-${speciesId}-tracos`,
  name: `Traços de ${species[speciesId].name}`,
  sourceType: "species",
  speciesId,
  level: null,
  autoGranted: speciesId !== "elfo",
  summary: species[speciesId].traitsText,
  ...(speciesId === "elfo"
    ? {
        choices: [
          {
            id: ELFO_SENTIDOS_AGUCADOS_CHOICE_ID,
            prompt: "Sentidos Aguçados — escolha 1 perícia",
            effect: { kind: "skillProficiency" as const, options: ELFO_SENTIDOS_AGUCADOS_OPTIONS, count: 1, excludeAlreadyProficient: true },
          },
        ],
      }
    : {}),
}));
