import { SPECIES_IDS, type SizeId, type SpeciesId } from "../domain/ids.js";

export interface SpeciesDefinition {
  id: SpeciesId;
  name: string;
  size: SizeId;
  /**
   * Deslocamento base em metros (PHB 2024). O PDF original NÃO
   * automatizava este campo (Deslocamento era 100% manual lá); estes
   * valores foram confirmados por você: 9m para as espécies-base em
   * geral, e 10,5m (35 pés) para o Golias — a exceção do grupo.
   * Modificadores de deslocamento por linhagem (ex.: Elfo da Floresta,
   * que sobe para 10,5m) ficam para quando a seleção explícita de
   * linhagem for implementada; por ora as 10 espécies usam apenas o
   * deslocamento base.
   */
  baseSpeed: number;
  /**
   * Texto bruto dos traços, extraído literalmente do script `ESPECIE`
   * do PDF original (inclui lacunas como "CD___" e "___d10" que o
   * próprio PDF deixa em branco para o jogador preencher conforme
   * escolhas — ex.: tipo de ancestralidade dracônica do Draconato).
   * Mantido como texto único (não subdividido em traços estruturados)
   * para não arriscar reorganizar incorretamente os sub-itens de cada
   * bloco.
   */
  traitsText: string;
}

/**
 * Draconato/Elfo/Gnomo/Golias/Tiefling têm Linhagem/Ancestralidade
 * (fonte "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES NA ETAPA ESPÉCIE") —
 * para essas 5, o `traitsText` estático abaixo NUNCA é exibido:
 * `rules/features.ts#getSpeciesFeatures`/`rules/proficiencyText.ts#getSpeciesTraitEntries`/
 * `ui/builder/steps/Step4Species.tsx` usam
 * `rules/speciesLineagePrintedFeatures.ts#getSpeciesTraitsPrintedText`
 * no lugar, que resolve nível/linhagem/atributos atuais a cada
 * chamada. O campo continua aqui só porque `traitsText` é obrigatório
 * no tipo — mantido como estava para não arriscar remover algo usado
 * em outro lugar que ainda não foi conferido.
 */

export const species: Record<SpeciesId, SpeciesDefinition> = {
  humano: {
    id: "humano",
    name: "Humano",
    size: "Médio",
    baseSpeed: 9,
    traitsText: "Ganha 1 Inspiração Heroica quando terminar um Descanso Longo",
  },
  elfo: {
    id: "elfo",
    name: "Elfo",
    size: "Médio",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 18m\n" +
      "# Ancestralidade Fey:\n" +
      "Vantagem contra condição Encantado\n" +
      "# TRANSE:\n" +
      "Descanso Longo = 4h\n" +
      "Você não dorme, nem por meios mágicos\n" +
      "# LINHAGEM ÉLFICA:",
  },
  anao: {
    id: "anao",
    name: "Anão",
    size: "Médio",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 36m\n" +
      "# RESILIÊNCIA ANÃNICA\n" +
      "Resistência a dano de veneno\n" +
      "Vantagem contra a condição Envenenado\n" +
      "# ROBUSTEZ ANÃNICA\n" +
      "+1 HP por nível\n" +
      "# CORTADOR DE PEDRAS\n" +
      "AÇÃO BÔNUS: ganha 9m de Tremorsense por 10 minutos\n" +
      "Só é usável em superfícies de pedra\n" +
      "Usos = Proficiência. Recupera em Descanso Longo",
  },
  halfling: {
    id: "halfling",
    name: "Halfling",
    size: "Pequeno",
    baseSpeed: 9,
    traitsText:
      "# CORAJOSO\n" +
      "Vantagem contra condição Amedrontado\n" +
      "# SORTE\n" +
      "Rerrola os 1 do d20\n" +
      "# FURTIVIDADE NATURAL\n" +
      "Pode usar a ação Esconder-se quando obstruído por uma criatura média ou maior",
  },
  draconato: {
    id: "draconato",
    name: "Draconato",
    size: "Médio",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 18m\n" +
      "# RESISTÊNCIA A DANO _________\n" +
      "# ARMA DE SOPRO\n" +
      "Pode trocar um de seus ataques por um sopro. Linha de 9m ou Cone de 4,5m.\n" +
      "Salvaguarda de CON CD___ para 1/2 do dano\n" +
      "Dano = ___d10. Usos=Prof. Recupera em DL\n" +
      "# VÔO DRACÔNICO (nível 5)\n" +
      "AÇÃO BÔNUS: vôo = deslocamento por 10 minutos\n" +
      "1 uso por Descanso Longo",
  },
  tiefling: {
    id: "tiefling",
    name: "Tiefling",
    size: "Médio",
    baseSpeed: 9,
    traitsText: "# VISÃO NO ESCURO 18m\n# TAUMATURGIA TRUQUE",
  },
  gnomo: {
    id: "gnomo",
    name: "Gnomo",
    size: "Pequeno",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 18m\n" +
      "# ASTÚCIA GNÔMICA\n" +
      "- Vantagem em Salvaguardas de INT, CAR e SAB\n" +
      "# LINHAGEM GNÔMICA:",
  },
  golias: {
    id: "golias",
    name: "Golias",
    size: "Médio",
    baseSpeed: 10.5,
    traitsText:
      "# FORMA GRANDE (nvl 5)\n" +
      "- Dura 10min | Ação Bônus | 1 p/ DL\n" +
      "- Tamanho = Grande: Vantagem em Testes de Força e +3m de desl.\n" +
      "# ANCESTRALIDADE DE GIGANTE:",
  },
  aasimar: {
    id: "aasimar",
    name: "Aasimar",
    size: "Médio",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 18m\n" +
      "# RESISTÊNCIA CELESTIAL: à dano Necrótico e Radiante\n" +
      "# MÃOS CURATIVAS: 3d4 (1 p/ DL)\n" +
      "# TRUQUE LUZ\n" +
      "# REVELAÇÃO CELESTIAL:\n" +
      "- Dura 1min | Ação Bônus | 1 p/ DL\n" +
      "> Asas Celestiais: +3 dano Radiante\n" +
      "Pode voar\n" +
      "> Manto Necrótico: +3 dano Nec\n" +
      "a 3m de vc faz Salvaguarda de CAR CD___ ou fica Amedrontado\n" +
      "> Radiância Interna: +3 rad\n" +
      "todos a 3m sofrem 3 dano radiante",
  },
  orc: {
    id: "orc",
    name: "Orc",
    size: "Médio",
    baseSpeed: 9,
    traitsText:
      "# VISÃO NO ESCURO 36m\n" +
      "# SURTO DE ADRENALINA:\n" +
      "- Ação Bônus | Usos = prof. | Recupera ao Descansar\n" +
      "Disparada como ação Bônus e ganha temp. HP = proficiência\n" +
      "# RESISTÊNCIA INCANSÁVEL:\n" +
      "Quando cair para 0HP, fique com 1HP no lugar\n" +
      "1 uso por Descanso Longo",
  },
};

export const speciesList: SpeciesDefinition[] = SPECIES_IDS.map((id) => species[id]);
