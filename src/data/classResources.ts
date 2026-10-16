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

/** Guerreiro — quantidade de usos de Surto de Ação por Descanso Curto/Longo (fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF" §2). Sem a característica antes do nível 2 — chave ausente, nunca "0". */
export const FIGHTER_ACTION_SURGE_USES: Record<number, number> = {
  2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1,
  11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1,
  17: 2, 18: 2, 19: 2, 20: 2,
};

/**
 * Guerreiro — usos de Indomável (refazer uma Salvaguarda falha) por
 * Descanso Longo (fonte idem §2) — DIFERENTE do "Incansável" do
 * Patrulheiro (`RANGER_...`/`getIndomitableUsesCount`, um recurso de PV
 * Temporários; o nome em português só é parecido). Sem a característica
 * antes do nível 9 — chave ausente, nunca "0".
 */
export const FIGHTER_INDOMITABLE_REROLL_USES: Record<number, number> = {
  9: 1, 10: 1, 11: 1, 12: 1,
  13: 2, 14: 2, 15: 2, 16: 2,
  17: 3, 18: 3, 19: 3, 20: 3,
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

/**
 * Artífice — colunas "Truques Conhecidos"/"Infusões Conhecidas"/"Itens
 * Infundidos" da fonte fornecida (mensagem "DADOS DE CLASSE —
 * ARTÍFICE"). Sem coluna de "Magias Preparadas" na fonte — não
 * inventada, `getSpellsPreparedMax` continua `null` para o Artífice.
 */
export const ARTIFICER_CANTRIPS_KNOWN: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
};

/** Nível 1 não tem Infusões Conhecidas ("0 / indisponível" na fonte). */
export const ARTIFICER_INFUSIONS_KNOWN: Record<number, number> = {
  1: 0, 2: 4, 3: 4, 4: 4, 5: 4, 6: 6, 7: 6, 8: 6, 9: 6, 10: 8,
  11: 8, 12: 8, 13: 8, 14: 10, 15: 10, 16: 10, 17: 10, 18: 12, 19: 12, 20: 12,
};

/** Nível 1 não tem Itens Infundidos ("0 / indisponível" na fonte). */
export const ARTIFICER_INFUSED_ITEMS_MAX: Record<number, number> = {
  1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4,
  11: 4, 12: 4, 13: 4, 14: 5, 15: 5, 16: 5, 17: 5, 18: 6, 19: 6, 20: 6,
};

/**
 * Guerreiro/Cavaleiro Místico — Truques e Magias Preparadas (fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §4) — igual
 * numericamente à progressão padrão de terço-conjurador (mesma usada
 * por Trapaceiro Arcano), mas registrada explicitamente porque a fonte
 * fornecida é a autoridade aqui (mesmo raciocínio de ARTIFICER_SLOT_TABLE
 * acima). Sem conjuração antes do nível 3 — chave ausente, nunca `0`
 * para não confundir com "concedida, mas zero".
 */
export const FIGHTER_ELDRITCH_KNIGHT_CANTRIPS_KNOWN: Record<number, number> = {
  3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2,
  10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3,
};

export const FIGHTER_ELDRITCH_KNIGHT_SPELLS_PREPARED: Record<number, number> = {
  3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7,
  11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 11, 19: 12, 20: 13,
};

/**
 * Guerreiro/Psiônico — tamanho e quantidade de Dados de Energia
 * Psiônica (fonte "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO
 * PDF" §5). Recurso PRÓPRIO desta subclasse — nunca somado/confundido
 * com Dado de Superioridade (DS) do Mestre de Batalha.
 */
export const FIGHTER_PSI_WARRIOR_DIE: Record<number, HitDie> = {
  3: 6, 4: 6,
  5: 8, 6: 8, 7: 8, 8: 8,
  9: 8, 10: 8,
  11: 10, 12: 10,
  13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};

export const FIGHTER_PSI_WARRIOR_DICE_COUNT: Record<number, number> = {
  3: 4, 4: 4,
  5: 6, 6: 6, 7: 6, 8: 6,
  9: 8, 10: 8,
  11: 8, 12: 8,
  13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};

/**
 * Guerreiro/Mestre de Batalha — Manobras Conhecidas e Dado de
 * Superioridade (DS), fonte "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO
 * BUILDER E NO PDF" §6. "Manobras Conhecidas" permanece em 9 do nível
 * 15 ao 20 (só o tipo de DS muda, para d12, no nível 18) — transcrito
 * literalmente, nunca simplificado para uma progressão contínua.
 */
export const FIGHTER_BATTLE_MASTER_MANEUVERS_KNOWN: Record<number, number> = {
  3: 3, 4: 3, 5: 3, 6: 3,
  7: 5, 8: 5, 9: 5,
  10: 7, 11: 7, 12: 7, 13: 7, 14: 7,
  15: 9, 16: 9, 17: 9, 18: 9, 19: 9, 20: 9,
};

export const FIGHTER_BATTLE_MASTER_SUPERIORITY_DIE: Record<number, HitDie> = {
  3: 8, 4: 8, 5: 8, 6: 8,
  7: 8, 8: 8, 9: 8,
  10: 10, 11: 10, 12: 10, 13: 10, 14: 10,
  15: 10, 16: 10, 17: 10,
  18: 12, 19: 12, 20: 12,
};

export const FIGHTER_BATTLE_MASTER_SUPERIORITY_DICE_COUNT: Record<number, number> = {
  3: 4, 4: 4, 5: 4, 6: 4,
  7: 5, 8: 5, 9: 5,
  10: 5, 11: 5, 12: 5, 13: 5, 14: 5,
  15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6,
};

/**
 * Ladino/Trapaceiro Arcano — Truques e Magias Preparadas (fonte
 * "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §11) —
 * mesma progressão numérica de terço-conjurador já usada por
 * `FIGHTER_ELDRITCH_KNIGHT_CANTRIPS_KNOWN`/`..._SPELLS_PREPARED` acima,
 * mas registrada com nome próprio porque a fonte fornecida é a
 * autoridade aqui (mesmo raciocínio já aplicado ao Cavaleiro Místico).
 * "Truques" aqui é só a quantidade ESCOLHIDA pelo jogador (2 do nível
 * 3-9, 3 do 10-20) — a que pode ser substituída ao subir de nível.
 * Mãos Mágicas é um truque ADICIONAL, sempre concedido
 * (rules/rogueAutoPreparedSpells.ts), que nunca entra nesta tabela, mas
 * que `rules/classResources.ts#getCantripsKnown` SEMPRE soma +1 por
 * cima dela para formar a quantidade TOTAL de truques conhecidos
 * exibida ao jogador (nunca ao limite de Magias Preparadas de 1º
 * círculo ou superior — essa é outra tabela, `..._SPELLS_PREPARED`
 * abaixo). Sem conjuração antes do nível 3 — chave ausente, nunca `0`.
 */
export const ROGUE_ARCANE_TRICKSTER_CANTRIPS_KNOWN: Record<number, number> = {
  3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2,
  10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3,
};

export const ROGUE_ARCANE_TRICKSTER_SPELLS_PREPARED: Record<number, number> = {
  3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7,
  11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 11, 19: 12, 20: 13,
};

/**
 * Ladino/Adaga Espiritual — tamanho e quantidade de Dados de Energia
 * Psiônica (fonte idem §8) — recurso PRÓPRIO desta subclasse, nunca
 * somado/confundido com os DP do Guerreiro Psiônico
 * (`FIGHTER_PSI_WARRIOR_DIE`/`..._DICE_COUNT`), mesmo elas
 * compartilharem o nome em português.
 */
export const ROGUE_SOULKNIFE_PSIONIC_DIE: Record<number, HitDie> = {
  3: 6, 4: 6,
  5: 8, 6: 8, 7: 8, 8: 8,
  9: 8, 10: 8,
  11: 10, 12: 10,
  13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};

export const ROGUE_SOULKNIFE_PSIONIC_DICE_COUNT: Record<number, number> = {
  3: 4, 4: 4,
  5: 6, 6: 6, 7: 6, 8: 6,
  9: 8, 10: 8,
  11: 8, 12: 8,
  13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};
