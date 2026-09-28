/**
 * Catálogo de Armas + Maestria de Armas (D&D 2024), transcrito
 * literalmente da tabela de referência aprovada — nenhum valor aqui foi
 * reconstruído de memória. Usado por `rules/weapons.ts`/`rules/attack.ts`
 * e, no futuro, por `FeatureChoice.weaponPicker`.
 */

export type DamageType = "Cortante" | "Perfurante" | "Contundente";

/** As 8 propriedades de Maestria de Armas do D&D 2024. */
export const WEAPON_MASTERIES = [
  "Ágil",
  "Lentidão",
  "Derrubar",
  "Empurrar",
  "Drenar",
  "Afligir",
  "Trespassar",
  "Garantido",
] as const;
export type WeaponMastery = (typeof WEAPON_MASTERIES)[number];

export type WeaponCategory = "simples" | "marcial";
export type WeaponRangeKind = "corpoACorpo" | "distancia";

/** Alcance em metros: curto/longo (arremesso) ou normal/máximo (munição). */
export interface WeaponRange {
  curto: number;
  longo: number;
}

export interface WeaponProperties {
  acuidade?: boolean;
  leve?: boolean;
  pesada?: boolean;
  duasMaos?: boolean;
  extensao?: boolean;
  recarga?: boolean;
  /** Dado de dano quando usada com as duas mãos (ex.: Lança 1d6 → 1d8 versátil). */
  versatil?: string;
  arremesso?: WeaponRange;
  municao?: WeaponRange & { tipo: string };
  /** Exceção textual que não cabe num booleano (ex.: Lança de Montaria). */
  notes?: string;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  category: WeaponCategory;
  rangeKind: WeaponRangeKind;
  /** Dado de dano (ex.: "1d6", "2d6") ou valor fixo (Zarabatana: "1"). */
  damageDice: string;
  damageType: DamageType;
  properties: WeaponProperties;
  mastery: WeaponMastery;
}

export const weapons: WeaponDefinition[] = [
  // Armas Simples Corpo a Corpo
  {
    id: "adaga",
    name: "Adaga",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d4",
    damageType: "Perfurante",
    properties: { acuidade: true, leve: true, arremesso: { curto: 6, longo: 18 } },
    mastery: "Ágil",
  },
  {
    id: "azagaia",
    name: "Azagaia",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Perfurante",
    properties: { arremesso: { curto: 9, longo: 36 } },
    mastery: "Lentidão",
  },
  {
    id: "cajado",
    name: "Cajado",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Contundente",
    properties: { versatil: "1d8" },
    mastery: "Derrubar",
  },
  {
    id: "clava",
    name: "Clava",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d4",
    damageType: "Contundente",
    properties: { leve: true },
    mastery: "Lentidão",
  },
  {
    id: "clavaGrande",
    name: "Clava Grande",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Contundente",
    properties: { duasMaos: true },
    mastery: "Empurrar",
  },
  {
    id: "foice",
    name: "Foice",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d4",
    damageType: "Cortante",
    properties: { leve: true },
    mastery: "Ágil",
  },
  {
    id: "lanca",
    name: "Lança",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Perfurante",
    properties: { arremesso: { curto: 6, longo: 18 }, versatil: "1d8" },
    mastery: "Drenar",
  },
  {
    id: "maca",
    name: "Maça",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Contundente",
    properties: {},
    mastery: "Drenar",
  },
  {
    id: "machadinha",
    name: "Machadinha",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Cortante",
    properties: { leve: true, arremesso: { curto: 6, longo: 18 } },
    mastery: "Afligir",
  },
  {
    id: "marteloLeve",
    name: "Martelo Leve",
    category: "simples",
    rangeKind: "corpoACorpo",
    damageDice: "1d4",
    damageType: "Contundente",
    properties: { leve: true, arremesso: { curto: 6, longo: 18 } },
    mastery: "Ágil",
  },

  // Armas Simples à Distância
  {
    id: "arcoCurto",
    name: "Arco Curto",
    category: "simples",
    rangeKind: "distancia",
    damageDice: "1d6",
    damageType: "Perfurante",
    properties: { duasMaos: true, municao: { curto: 24, longo: 96, tipo: "Flecha" } },
    mastery: "Afligir",
  },
  {
    id: "bestaLeve",
    name: "Besta Leve",
    category: "simples",
    rangeKind: "distancia",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: { duasMaos: true, recarga: true, municao: { curto: 24, longo: 96, tipo: "Virote" } },
    mastery: "Lentidão",
  },
  {
    id: "dardo",
    name: "Dardo",
    category: "simples",
    rangeKind: "distancia",
    damageDice: "1d4",
    damageType: "Perfurante",
    properties: { acuidade: true, arremesso: { curto: 6, longo: 18 } },
    mastery: "Afligir",
  },
  {
    id: "funda",
    name: "Funda",
    category: "simples",
    rangeKind: "distancia",
    damageDice: "1d4",
    damageType: "Contundente",
    properties: { municao: { curto: 9, longo: 36, tipo: "Bala" } },
    mastery: "Lentidão",
  },

  // Armas Marciais Corpo a Corpo
  {
    id: "alabarda",
    name: "Alabarda",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d10",
    damageType: "Cortante",
    properties: { duasMaos: true, extensao: true, pesada: true },
    mastery: "Trespassar",
  },
  {
    id: "chicote",
    name: "Chicote",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d4",
    damageType: "Cortante",
    properties: { acuidade: true, extensao: true },
    mastery: "Lentidão",
  },
  {
    id: "cimitarra",
    name: "Cimitarra",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Cortante",
    properties: { acuidade: true, leve: true },
    mastery: "Ágil",
  },
  {
    id: "espadaCurta",
    name: "Espada Curta",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d6",
    damageType: "Perfurante",
    properties: { acuidade: true, leve: true },
    mastery: "Afligir",
  },
  {
    id: "espadaGrande",
    name: "Espada Grande",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "2d6",
    damageType: "Cortante",
    properties: { duasMaos: true, pesada: true },
    mastery: "Garantido",
  },
  {
    id: "espadaLonga",
    name: "Espada Longa",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Cortante",
    properties: { versatil: "1d10" },
    mastery: "Drenar",
  },
  {
    id: "glaive",
    name: "Glaive",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d10",
    damageType: "Cortante",
    properties: { duasMaos: true, extensao: true, pesada: true },
    mastery: "Garantido",
  },
  {
    id: "lancaDeMontaria",
    name: "Lança de Montaria",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d10",
    damageType: "Perfurante",
    properties: { duasMaos: true, extensao: true, pesada: true, notes: "Duas Mãos a menos que montado" },
    mastery: "Derrubar",
  },
  {
    id: "lancaLonga",
    name: "Lança Longa",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d10",
    damageType: "Perfurante",
    properties: { duasMaos: true, extensao: true, pesada: true },
    mastery: "Empurrar",
  },
  {
    id: "macaEstrela",
    name: "Maça Estrela",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: {},
    mastery: "Drenar",
  },
  {
    id: "machadoDeBatalha",
    name: "Machado de Batalha",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Cortante",
    properties: { versatil: "1d10" },
    mastery: "Derrubar",
  },
  {
    id: "machadoGrande",
    name: "Machado Grande",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d12",
    damageType: "Cortante",
    properties: { duasMaos: true, pesada: true },
    mastery: "Trespassar",
  },
  {
    id: "malho",
    name: "Malho",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "2d6",
    damageType: "Contundente",
    properties: { duasMaos: true, pesada: true },
    mastery: "Derrubar",
  },
  {
    id: "mangual",
    name: "Mangual",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Contundente",
    properties: {},
    mastery: "Drenar",
  },
  {
    id: "marteloDeGuerra",
    name: "Martelo de Guerra",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Contundente",
    properties: { versatil: "1d10" },
    mastery: "Empurrar",
  },
  {
    id: "picaretaDeGuerra",
    name: "Picareta de Guerra",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: { versatil: "1d10" },
    mastery: "Drenar",
  },
  {
    id: "rapieira",
    name: "Rapieira",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: { acuidade: true },
    mastery: "Afligir",
  },
  {
    id: "tridente",
    name: "Tridente",
    category: "marcial",
    rangeKind: "corpoACorpo",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: { arremesso: { curto: 6, longo: 18 }, versatil: "1d10" },
    mastery: "Derrubar",
  },

  // Armas Marciais à Distância
  {
    id: "arcoLongo",
    name: "Arco Longo",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1d8",
    damageType: "Perfurante",
    properties: { duasMaos: true, pesada: true, municao: { curto: 45, longo: 180, tipo: "Flecha" } },
    mastery: "Lentidão",
  },
  {
    id: "bestaDeMao",
    name: "Besta de Mão",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1d6",
    damageType: "Perfurante",
    properties: { leve: true, recarga: true, municao: { curto: 9, longo: 36, tipo: "Virote" } },
    mastery: "Afligir",
  },
  {
    id: "bestaPesada",
    name: "Besta Pesada",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1d10",
    damageType: "Perfurante",
    properties: { duasMaos: true, pesada: true, recarga: true, municao: { curto: 30, longo: 120, tipo: "Virote" } },
    mastery: "Empurrar",
  },
  {
    id: "mosquete",
    name: "Mosquete",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1d12",
    damageType: "Perfurante",
    properties: { duasMaos: true, recarga: true, municao: { curto: 12, longo: 36, tipo: "Bala" } },
    mastery: "Lentidão",
  },
  {
    id: "pistola",
    name: "Pistola",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1d10",
    damageType: "Perfurante",
    properties: { recarga: true, municao: { curto: 9, longo: 27, tipo: "Bala" } },
    mastery: "Afligir",
  },
  {
    id: "zarabatana",
    name: "Zarabatana",
    category: "marcial",
    rangeKind: "distancia",
    damageDice: "1",
    damageType: "Perfurante",
    properties: { recarga: true, municao: { curto: 7.5, longo: 30, tipo: "Agulha" } },
    mastery: "Afligir",
  },
];

export const weaponsById: Record<string, WeaponDefinition> = Object.fromEntries(
  weapons.map((weapon) => [weapon.id, weapon]),
);
