import type { HitDie } from "./classes.js";

/**
 * Progressões numéricas por nível (1–20) dos recursos PRÓPRIOS de cada
 * classe, transcritas literalmente da base consolidada de classes
 * fornecida (§7 "Recursos de classe" das regras de integração) — nunca
 * derivadas do nome/descrição da feature. `0` = recurso ainda não
 * concedido naquele nível (a tabela original usa "—").
 */

/** Bardo — tamanho do dado de Inspiração de Bardo (a quantidade de usos vem do modificador de Carisma, fora do escopo desta tabela). */
export const BARDIC_INSPIRATION_DIE: Record<number, HitDie> = {
  1: 6, 2: 6, 3: 6, 4: 6,
  5: 8, 6: 8, 7: 8, 8: 8, 9: 8,
  10: 10, 11: 10, 12: 10, 13: 10, 14: 10,
  15: 12, 16: 12, 17: 12, 18: 12, 19: 12, 20: 12,
};

/** Bárbaro — quantidade de usos de Fúria por Descanso Longo. */
export const BARBARIAN_RAGE_COUNT: Record<number, number> = {
  1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4,
  11: 4, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 6, 18: 6, 19: 6, 20: 6,
};

/** Bárbaro — bônus de dano da Fúria. */
export const BARBARIAN_RAGE_DAMAGE: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};

/** Bárbaro — quantidade de Maestrias de Arma. */
export const BARBARIAN_WEAPON_MASTERIES: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4,
  11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};

/** Bruxo — quantidade de Invocações Místicas conhecidas. */
export const WARLOCK_INVOCATIONS_KNOWN: Record<number, number> = {
  1: 1, 2: 3, 3: 3, 4: 3, 5: 5, 6: 5, 7: 6, 8: 6, 9: 7, 10: 7,
  11: 7, 12: 8, 13: 8, 14: 8, 15: 9, 16: 9, 17: 9, 18: 10, 19: 10, 20: 10,
};

/** Clérigo — quantidade de usos de Canalizar Divindade por Descanso Curto/Longo. */
export const CLERIC_CHANNEL_DIVINITY_USES: Record<number, number> = {
  1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 4, 19: 4, 20: 4,
};

/** Druida — quantidade de usos de Forma Selvagem por Descanso Curto/Longo. */
export const DRUID_WILD_SHAPE_USES: Record<number, number> = {
  1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 4, 18: 4, 19: 4, 20: 4,
};

/** Feiticeiro — Pontos de Feitiçaria. */
export const SORCERER_SORCERY_POINTS: Record<number, number> = {
  1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20,
};

/** Guerreiro — quantidade de usos de Recuperar Fôlego por Descanso Curto/Longo. */
export const FIGHTER_SECOND_WIND_USES: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4,
  11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};

/** Guerreiro — quantidade de Maestrias de Arma. */
export const FIGHTER_WEAPON_MASTERIES: Record<number, number> = {
  1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5,
  11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6,
};

/** Ladino — dado de dano do Ataque Furtivo (ex.: "3d6"). */
export const ROGUE_SNEAK_ATTACK_DICE: Record<number, string> = {
  1: "1d6", 2: "1d6", 3: "2d6", 4: "2d6", 5: "3d6", 6: "3d6", 7: "4d6", 8: "4d6", 9: "5d6", 10: "5d6",
  11: "6d6", 12: "6d6", 13: "7d6", 14: "7d6", 15: "8d6", 16: "8d6", 17: "9d6", 18: "9d6", 19: "10d6", 20: "10d6",
};

/** Monge — dado de dano das Artes Marciais. */
export const MONK_MARTIAL_ARTS_DIE: Record<number, HitDie> = {
  1: 6, 2: 6, 3: 6, 4: 6,
  5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};

/** Monge — Pontos de Foco. */
export const MONK_FOCUS_POINTS: Record<number, number> = {
  1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20,
};

/** Paladino — quantidade de usos de Canalizar Divindade por Descanso Curto/Longo. */
export const PALADIN_CHANNEL_DIVINITY_USES: Record<number, number> = {
  1: 0, 2: 0, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3,
};

/** Patrulheiro — quantidade de Inimigos Favoritos conhecidos. */
export const RANGER_FAVORED_ENEMY_COUNT: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 4, 10: 4,
  11: 4, 12: 4, 13: 5, 14: 5, 15: 5, 16: 5, 17: 6, 18: 6, 19: 6, 20: 6,
};

/**
 * Truques (cantrips) conhecidos e Magias Preparadas por nível, para
 * cada classe conjuradora — colunas "Truques"/"Magias Preparadas" das
 * tabelas de progressão fornecidas (não derivadas de fórmula própria).
 * Paladino e Patrulheiro não têm coluna de Truques (meio-conjuradores
 * sem truques de classe no PHB 2024) — ausentes de propósito, não "0".
 */

export const BARD_CANTRIPS_KNOWN: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4,
  11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};
export const BARD_SPELLS_PREPARED: Record<number, number> = {
  1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22,
};

export const WARLOCK_CANTRIPS_KNOWN: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4,
  11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};
export const WARLOCK_SPELLS_PREPARED: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10,
  11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15,
};

export const CLERIC_CANTRIPS_KNOWN: Record<number, number> = {
  1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5,
  11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5,
};
export const CLERIC_SPELLS_PREPARED: Record<number, number> = {
  1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22,
};

export const DRUID_CANTRIPS_KNOWN: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 4, 18: 4, 19: 4, 20: 4,
};
export const DRUID_SPELLS_PREPARED: Record<number, number> = {
  1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22,
};

export const SORCERER_CANTRIPS_KNOWN: Record<number, number> = {
  1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6,
  11: 6, 12: 6, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6,
};
export const SORCERER_SPELLS_PREPARED: Record<number, number> = {
  1: 2, 2: 4, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22,
};

export const WIZARD_CANTRIPS_KNOWN: Record<number, number> = {
  1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5,
  11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5,
};
export const WIZARD_SPELLS_PREPARED: Record<number, number> = {
  1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 16, 12: 16, 13: 17, 14: 18, 15: 19, 16: 21, 17: 22, 18: 23, 19: 24, 20: 25,
};

/** Paladino — sem coluna de Truques (meio-conjurador sem truques de classe). */
export const PALADIN_SPELLS_PREPARED: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9, 10: 9,
  11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12, 17: 14, 18: 14, 19: 15, 20: 15,
};

/** Patrulheiro — sem coluna de Truques (meio-conjurador sem truques de classe). */
export const RANGER_SPELLS_PREPARED: Record<number, number> = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9, 10: 9,
  11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12, 17: 14, 18: 14, 19: 15, 20: 15,
};
