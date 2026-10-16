import type { Character } from "../domain/character.js";
import type { HitDie } from "../data/classes.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { PACT_MAGIC_TABLE } from "../data/spellProgression.js";
import {
  ARTIFICER_CANTRIPS_KNOWN,
  ARTIFICER_INFUSED_ITEMS_MAX,
  ARTIFICER_INFUSIONS_KNOWN,
  BARBARIAN_RAGE_COUNT,
  BARBARIAN_RAGE_DAMAGE,
  BARBARIAN_WEAPON_MASTERIES,
  BARD_CANTRIPS_KNOWN,
  BARD_SPELLS_PREPARED,
  BARDIC_INSPIRATION_DIE,
  CLERIC_CANTRIPS_KNOWN,
  CLERIC_CHANNEL_DIVINITY_USES,
  CLERIC_SPELLS_PREPARED,
  DRUID_CANTRIPS_KNOWN,
  DRUID_SPELLS_PREPARED,
  DRUID_WILD_SHAPE_USES,
  FIGHTER_ACTION_SURGE_USES,
  FIGHTER_BATTLE_MASTER_MANEUVERS_KNOWN,
  FIGHTER_BATTLE_MASTER_SUPERIORITY_DICE_COUNT,
  FIGHTER_BATTLE_MASTER_SUPERIORITY_DIE,
  FIGHTER_ELDRITCH_KNIGHT_CANTRIPS_KNOWN,
  FIGHTER_ELDRITCH_KNIGHT_SPELLS_PREPARED,
  FIGHTER_INDOMITABLE_REROLL_USES,
  FIGHTER_PSI_WARRIOR_DICE_COUNT,
  FIGHTER_PSI_WARRIOR_DIE,
  FIGHTER_SECOND_WIND_USES,
  FIGHTER_WEAPON_MASTERIES,
  MONK_FOCUS_POINTS,
  MONK_MARTIAL_ARTS_DIE,
  PALADIN_CHANNEL_DIVINITY_USES,
  PALADIN_SPELLS_PREPARED,
  RANGER_FAVORED_ENEMY_COUNT,
  RANGER_SPELLS_PREPARED,
  ROGUE_ARCANE_TRICKSTER_CANTRIPS_KNOWN,
  ROGUE_ARCANE_TRICKSTER_SPELLS_PREPARED,
  ROGUE_SNEAK_ATTACK_DICE,
  ROGUE_SOULKNIFE_PSIONIC_DICE_COUNT,
  ROGUE_SOULKNIFE_PSIONIC_DIE,
  SORCERER_CANTRIPS_KNOWN,
  SORCERER_SORCERY_POINTS,
  SORCERER_SPELLS_PREPARED,
  WARLOCK_CANTRIPS_KNOWN,
  WARLOCK_INVOCATIONS_KNOWN,
  WARLOCK_SPELLS_PREPARED,
  WIZARD_CANTRIPS_KNOWN,
  WIZARD_SPELLS_PREPARED,
} from "../data/classResources.js";

/**
 * Um getter por recurso próprio de classe (§7 da base consolidada de
 * classes) — `null` quando o personagem não é da classe certa, `0`
 * quando é da classe certa mas o recurso ainda não foi concedido
 * naquele nível (a tabela original usa "—"). Nunca deriva o valor de
 * fórmula própria — sempre lê a tabela transcrita em
 * `data/classResources.ts`.
 */

export function getBardicInspirationDie(character: Character): HitDie | null {
  if (character.classId !== "bardo") return null;
  return BARDIC_INSPIRATION_DIE[character.level] ?? null;
}

/** Usos de Inspiração de Bardo por Descanso Longo: modificador de Carisma, mínimo 1 (fonte "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" §1). */
export function getBardicInspirationUses(character: Character): number | null {
  if (character.classId !== "bardo") return null;
  const charismaMod = getAbilityModifier(getEffectiveAbilityScore(character, "CAR"));
  return Math.max(1, charismaMod);
}

export function getRageCount(character: Character): number | null {
  if (character.classId !== "barbaro") return null;
  return BARBARIAN_RAGE_COUNT[character.level] ?? 0;
}

export function getRageDamageBonus(character: Character): number | null {
  if (character.classId !== "barbaro") return null;
  return BARBARIAN_RAGE_DAMAGE[character.level] ?? 0;
}

export function getWeaponMasteryCount(character: Character): number | null {
  if (character.classId === "barbaro") return BARBARIAN_WEAPON_MASTERIES[character.level] ?? 0;
  if (character.classId === "guerreiro") return FIGHTER_WEAPON_MASTERIES[character.level] ?? 0;
  return null;
}

export function getInvocationsKnown(character: Character): number | null {
  if (character.classId !== "bruxo") return null;
  return WARLOCK_INVOCATIONS_KNOWN[character.level] ?? 0;
}

/**
 * Quantidade TOTAL de espaços de Magia de Pacto no nível atual (todos
 * do mesmo círculo — rules/spellcasting.ts#getSpellSlots já resolve
 * isso corretamente para `casterKind: "pact"`; esta função só expõe o
 * total numérico para textos impressos que precisam dele, ex.: Astúcia
 * Mágica — "metade arredondada para cima").
 */
export function getPactMagicSlotCount(character: Character): number | null {
  if (character.classId !== "bruxo") return null;
  return PACT_MAGIC_TABLE[character.level]?.slotCount ?? 0;
}

export function getChannelDivinityUses(character: Character): number | null {
  if (character.classId === "clerigo") return CLERIC_CHANNEL_DIVINITY_USES[character.level] ?? 0;
  if (character.classId === "paladino") return PALADIN_CHANNEL_DIVINITY_USES[character.level] ?? 0;
  return null;
}

export function getWildShapeUses(character: Character): number | null {
  if (character.classId !== "druida") return null;
  return DRUID_WILD_SHAPE_USES[character.level] ?? 0;
}

export function getSorceryPoints(character: Character): number | null {
  if (character.classId !== "feiticeiro") return null;
  return SORCERER_SORCERY_POINTS[character.level] ?? 0;
}

export function getSecondWindUses(character: Character): number | null {
  if (character.classId !== "guerreiro") return null;
  return FIGHTER_SECOND_WIND_USES[character.level] ?? 0;
}

/**
 * Texto da cura de Recuperar Fôlego: `1d10 + nível de Guerreiro` —
 * resolvido numericamente (`1d10+5`, `1d10+12`...), nunca uma fórmula
 * literal. Usa o NÍVEL DE GUERREIRO, nunca BP nem nível total do
 * personagem.
 */
export function getSecondWindHealingText(character: Character): string | null {
  if (character.classId !== "guerreiro") return null;
  return `1d10+${character.level}`;
}

/**
 * Usos de Surto de Ação (nível 2+): 1 uso dos níveis 2–16, 2 usos a
 * partir do 17 (fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO
 * PDF" §2). Recupera todos em Descanso Curto ou Longo.
 */
export function getActionSurgeUsesCount(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.level < 2) return null;
  return FIGHTER_ACTION_SURGE_USES[character.level] ?? 0;
}

/**
 * Usos de Indomável — refazer uma Salvaguarda falha (nível 9+): 1 uso
 * dos níveis 9–12, 2 dos 13–16, 3 dos 17–20 (fonte idem §2). Recupera
 * todos em Descanso Longo (nunca Descanso Curto). Recurso DIFERENTE do
 * "Incansável" do Patrulheiro (`getIndomitableUsesCount` abaixo, um
 * recurso de PV Temporários) — nome em português só parecido, nunca a
 * mesma função/fórmula.
 */
export function getFighterIndomitableRerollUsesCount(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.level < 9) return null;
  return FIGHTER_INDOMITABLE_REROLL_USES[character.level] ?? 0;
}

export function getSneakAttackDice(character: Character): string | null {
  if (character.classId !== "ladino") return null;
  return ROGUE_SNEAK_ATTACK_DICE[character.level] ?? null;
}

/**
 * CD de Golpe Astuto/Rasgar Mente/Golpe Mortal = `8 + mod DEX + BP`
 * (fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §3:
 * "Calcular esse valor automaticamente, sem seleção de atributo") —
 * fórmula PRÓPRIA, independente da CD de magia do personagem (Ladrão
 * de Magias do Trapaceiro Arcano usa a CD de magia normal, nunca esta).
 * Reaproveitada pelas 3 características (Golpe Astuto é base, nível 5+;
 * Rasgar Mente é da Adaga Espiritual, nível 17+; Golpe Mortal é do
 * Assassino, nível 17+) — nunca 3 fórmulas separadas. Calculada mesmo
 * sem conjuração, nunca persistida como cópia.
 */
export function getRogueCunningStrikeCd(character: Character): number | null {
  if (character.classId !== "ladino" || character.level < 5) return null;
  const modifier = getAbilityModifier(getEffectiveAbilityScore(character, "DEX"));
  return 8 + getProficiencyBonus(character.level) + modifier;
}

/**
 * Quantidade MÁXIMA de efeitos de Golpe Astuto combináveis no mesmo
 * Ataque Furtivo: 1 do nível 5 ao 10 (Golpe Astuto), 2 a partir do 11
 * (Golpe Astuto Aprimorado) — nunca uma reserva de usos por descanso,
 * só o limite de opções que podem ser pagas de uma vez com os dados do
 * próprio Ataque Furtivo.
 */
export function getCunningStrikeMaxEffects(character: Character): number | null {
  if (character.classId !== "ladino" || character.level < 5) return null;
  return character.level >= 11 ? 2 : 1;
}

/**
 * Dado de Energia Psiônica (Ladino/Adaga Espiritual) — recurso PRÓPRIO
 * desta subclasse, nunca somado/confundido com o do Guerreiro Psiônico
 * (fonte idem §8).
 */
export function getSoulknifePsionicDie(character: Character): HitDie | null {
  if (character.classId !== "ladino" || character.subclassId !== "Lâmina Psíquica") return null;
  return ROGUE_SOULKNIFE_PSIONIC_DIE[character.level] ?? null;
}

/** Quantidade de Dados de Energia Psiônica (reserva total, não "restantes"). */
export function getSoulknifePsionicDiceCount(character: Character): number | null {
  if (character.classId !== "ladino" || character.subclassId !== "Lâmina Psíquica") return null;
  return ROGUE_SOULKNIFE_PSIONIC_DICE_COUNT[character.level] ?? 0;
}

export function getMartialArtsDie(character: Character): HitDie | null {
  if (character.classId !== "monge") return null;
  return MONK_MARTIAL_ARTS_DIE[character.level] ?? null;
}

export function getFocusPoints(character: Character): number | null {
  if (character.classId !== "monge") return null;
  return MONK_FOCUS_POINTS[character.level] ?? 0;
}

export function getFavoredEnemyCount(character: Character): number | null {
  if (character.classId !== "patrulheiro") return null;
  return RANGER_FAVORED_ENEMY_COUNT[character.level] ?? 0;
}

/**
 * Dado de dano da Marca do Predador (Inimigo Favorito) — `1d6` até o
 * nível 19; `1d10` a partir do nível 20 (Matador de Inimigos
 * Favoritos). Única fonte deste valor no projeto — toda referência ao
 * dano adicional da magia (Presa do Caçador Superior, Fúria Bestial)
 * deve consultar esta função, nunca duplicar o número.
 */
export function getFavoredEnemyDie(character: Character): string | null {
  if (character.classId !== "patrulheiro") return null;
  return character.level >= 20 ? "1d10" : "1d6";
}

/** `1dN` + modificador formatado — `+N`/`-N` quando o modificador é diferente de zero, só `1dN` quando é zero (nunca `1dN+0`). */
function formatDieWithModifier(die: number, modifier: number): string {
  if (modifier > 0) return `1d${die}+${modifier}`;
  if (modifier < 0) return `1d${die}${modifier}`;
  return `1d${die}`;
}

/**
 * Usos de Incansável (nível 10+): máximo(1, modificador de Sabedoria).
 * Recurso SEPARADO de Véu da Natureza (`getNatureVeilUsesCount`), mesmo
 * compartilhando a fórmula.
 */
export function getIndomitableUsesCount(character: Character): number | null {
  if (character.classId !== "patrulheiro" || character.level < 10) return null;
  return Math.max(1, getAbilityModifier(getEffectiveAbilityScore(character, "SAB")));
}

/**
 * `{pvTemporarios}` de Incansável: `1d8` + modificador de Sabedoria,
 * resolvido como texto (`1d8+3`/`1d8-1`/`1d8`) — nunca uma fórmula
 * literal. O mínimo 1 do total obtido é uma regra de uso (aplicada ao
 * resultado da rolagem), não uma alteração desta fórmula.
 */
export function getIndomitableTempHpText(character: Character): string | null {
  if (character.classId !== "patrulheiro" || character.level < 10) return null;
  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  return formatDieWithModifier(8, wisdomMod);
}

/**
 * Usos de Véu da Natureza (nível 14+): máximo(1, modificador de
 * Sabedoria). Recurso SEPARADO de Incansável (`getIndomitableUsesCount`),
 * mesmo compartilhando a fórmula — nunca o mesmo contador.
 */
export function getNatureVeilUsesCount(character: Character): number | null {
  if (character.classId !== "patrulheiro" || character.level < 14) return null;
  return Math.max(1, getAbilityModifier(getEffectiveAbilityScore(character, "SAB")));
}

const CANTRIPS_KNOWN_TABLES = {
  artifice: ARTIFICER_CANTRIPS_KNOWN,
  bardo: BARD_CANTRIPS_KNOWN,
  bruxo: WARLOCK_CANTRIPS_KNOWN,
  clerigo: CLERIC_CANTRIPS_KNOWN,
  druida: DRUID_CANTRIPS_KNOWN,
  feiticeiro: SORCERER_CANTRIPS_KNOWN,
  mago: WIZARD_CANTRIPS_KNOWN,
} as const;

const SPELLS_PREPARED_TABLES = {
  bardo: BARD_SPELLS_PREPARED,
  bruxo: WARLOCK_SPELLS_PREPARED,
  clerigo: CLERIC_SPELLS_PREPARED,
  druida: DRUID_SPELLS_PREPARED,
  feiticeiro: SORCERER_SPELLS_PREPARED,
  mago: WIZARD_SPELLS_PREPARED,
  paladino: PALADIN_SPELLS_PREPARED,
  patrulheiro: RANGER_SPELLS_PREPARED,
} as const;

/**
 * Truques conhecidos, por nível — coluna "Truques" da tabela da
 * classe. Paladino e Patrulheiro não têm essa coluna (meio-conjuradores
 * sem truques de classe no PHB 2024): `null`, nunca `0`. Cavaleiro
 * Místico (Guerreiro) é um caso especial — conjuração vem da subclasse,
 * não da classe, então a tabela não é indexada por `classId` (fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §4).
 */
export function getCantripsKnown(character: Character): number | null {
  if (character.classId === "guerreiro") {
    if (character.subclassId !== "Cavaleiro Místico") return null;
    return FIGHTER_ELDRITCH_KNIGHT_CANTRIPS_KNOWN[character.level] ?? 0;
  }
  if (character.classId === "ladino") {
    if (character.subclassId !== "Trapaceiro Arcano") return null;
    const chosen = ROGUE_ARCANE_TRICKSTER_CANTRIPS_KNOWN[character.level];
    // +1 por Mãos Mágicas: concedida automaticamente e SEMPRE somada à quantidade TOTAL de
    // truques conhecidos (nunca ao limite de magias preparadas de 1º círculo ou superior,
    // que é outra tabela — getSpellsPreparedMax); nunca entra na lista de truques ESCOLHIDOS
    // (ROGUE_ARCANE_TRICKSTER_CANTRIPS_KNOWN), que o jogador pode trocar ao subir de nível.
    return chosen !== undefined ? chosen + 1 : 0;
  }
  if (!character.classId || !(character.classId in CANTRIPS_KNOWN_TABLES)) return null;
  const table = CANTRIPS_KNOWN_TABLES[character.classId as keyof typeof CANTRIPS_KNOWN_TABLES];
  return table[character.level] ?? 0;
}

/**
 * Magias Preparadas máximas, por nível — coluna "Magias Preparadas" da
 * tabela da classe. Mesmo caso especial do Cavaleiro Místico de
 * `getCantripsKnown` acima.
 */
export function getSpellsPreparedMax(character: Character): number | null {
  if (character.classId === "guerreiro") {
    if (character.subclassId !== "Cavaleiro Místico") return null;
    return FIGHTER_ELDRITCH_KNIGHT_SPELLS_PREPARED[character.level] ?? 0;
  }
  if (character.classId === "ladino") {
    if (character.subclassId !== "Trapaceiro Arcano") return null;
    return ROGUE_ARCANE_TRICKSTER_SPELLS_PREPARED[character.level] ?? 0;
  }
  if (!character.classId || !(character.classId in SPELLS_PREPARED_TABLES)) return null;
  const table = SPELLS_PREPARED_TABLES[character.classId as keyof typeof SPELLS_PREPARED_TABLES];
  return table[character.level] ?? 0;
}

/**
 * Dado de Energia Psiônica (Guerreiro/Psiônico) — recurso próprio desta
 * subclasse, nunca confundido com DS do Mestre de Batalha (fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §5).
 */
export function getPsiWarriorDie(character: Character): HitDie | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Guerreiro Psiônico") return null;
  return FIGHTER_PSI_WARRIOR_DIE[character.level] ?? null;
}

/** Quantidade de Dados de Energia Psiônica (reserva total, não "restantes"). */
export function getPsiWarriorDiceCount(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Guerreiro Psiônico") return null;
  return FIGHTER_PSI_WARRIOR_DICE_COUNT[character.level] ?? 0;
}

/**
 * Manobras Conhecidas (Guerreiro/Mestre de Batalha) — quantidade
 * exigida pela subetapa "Manobras" (fonte idem §6). `fullName` da
 * subclasse permanece "Mestre da Batalha" por compatibilidade de IDs
 * (`data/subclasses.ts`) mesmo com a exibição corrigida para "Mestre de
 * Batalha".
 */
export function getBattleMasterManeuversKnownCount(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha") return null;
  return FIGHTER_BATTLE_MASTER_MANEUVERS_KNOWN[character.level] ?? 0;
}

/** Dado de Superioridade (DS) — tipo do dado, por nível. */
export function getSuperiorityDie(character: Character): HitDie | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha") return null;
  return FIGHTER_BATTLE_MASTER_SUPERIORITY_DIE[character.level] ?? null;
}

/** Quantidade de Dados de Superioridade (reserva total, não "restantes"). */
export function getSuperiorityDiceCount(character: Character): number | null {
  if (character.classId !== "guerreiro" || character.subclassId !== "Mestre da Batalha") return null;
  return FIGHTER_BATTLE_MASTER_SUPERIORITY_DICE_COUNT[character.level] ?? 0;
}

/** Infusões Conhecidas do Artífice, por nível — `null` para as demais classes, `0` no nível 1 (indisponível na fonte). */
export function getInfusionsKnown(character: Character): number | null {
  if (character.classId !== "artifice") return null;
  return ARTIFICER_INFUSIONS_KNOWN[character.level] ?? 0;
}

/** Itens Infundidos (máximo simultâneo) do Artífice, por nível — `null` para as demais classes, `0` no nível 1 (indisponível na fonte). */
export function getInfusedItemsMax(character: Character): number | null {
  if (character.classId !== "artifice") return null;
  return ARTIFICER_INFUSED_ITEMS_MAX[character.level] ?? 0;
}

/**
 * Quantidade de ataques extras concedidos por "Ataque Extra"/"Dois
 * Ataques Extras"/"Três Ataques Extras" — níveis confirmados
 * diretamente nas tabelas de características por classe (nunca a
 * regra genérica "nível 5" de memória): Guerreiro recebe 3 vezes (5,
 * 11, 20); Bárbaro, Monge, Paladino e Patrulheiro só uma vez (5). As
 * demais classes da base consolidada (Bardo, Bruxo, Clérigo, Druida,
 * Feiticeiro, Ladino, Mago) nunca têm essa feature — devolve 0.
 */
export function getExtraAttacksCount(character: Character): number {
  if (character.classId === "guerreiro") {
    if (character.level >= 20) return 3;
    if (character.level >= 11) return 2;
    if (character.level >= 5) return 1;
    return 0;
  }
  if (
    character.classId === "barbaro" ||
    character.classId === "monge" ||
    character.classId === "paladino" ||
    character.classId === "patrulheiro"
  ) {
    return character.level >= 5 ? 1 : 0;
  }
  return 0;
}

/**
 * Limite de Recuperação Arcana (fonte "IMPLEMENTAR MAGO E SUAS
 * SUBCLASSES NO BUILDER E NO PDF" §5) — soma dos círculos recuperados
 * (nunca a QUANTIDADE de espaços), metade do nível de Mago arredondada
 * para cima. Nível 1 = 1, nível 5 = 3, nível 20 = 10 (exemplos da
 * própria fonte, confirmados aqui).
 */
export function getArcaneRecoveryLimit(character: Character): number | null {
  if (character.classId !== "mago" || character.level < 1) return null;
  return Math.ceil(character.level / 2);
}

/**
 * Quantidade de magias concedidas ao Livro de Magias SÓ pela
 * progressão da CLASSE (fonte §3): 6 no nível 1, +2 a cada nível de
 * Mago posterior — `6 + 2*(nível-1)`. NUNCA um limite máximo do livro
 * (magias de subclasse/outras regras são concessões separadas, ver
 * `domain/character.ts#WizardSpellbookEntry.origin`) — só o total
 * esperado desta origem específica, usado como guia na UI (nunca um
 * bloqueio rígido).
 */
export function getWizardSpellbookClassGrantCount(character: Character): number | null {
  if (character.classId !== "mago" || character.level < 1) return null;
  return 6 + 2 * (character.level - 1);
}

/**
 * Níveis em que cada subclasse de Mago concede mais 1 magia de Versado
 * ao livro, além das 2 iniciais do nível 3 (fonte §7: "sempre que a
 * progressão de Mago liberar um novo círculo de espaços" — 5, 7, 9, 11,
 * 13, 15 e 17, conforme a tabela de espaços de Mago).
 */
const WIZARD_VERSADO_EXTRA_GRANT_LEVELS = [5, 7, 9, 11, 13, 15, 17] as const;

/**
 * Quantidade total de magias de Versado concedidas ao livro (2 no
 * nível 3 + 1 a cada nível de `WIZARD_VERSADO_EXTRA_GRANT_LEVELS` já
 * alcançado) — mesmo raciocínio de guia (nunca bloqueio rígido) de
 * `getWizardSpellbookClassGrantCount`. `null` sem nenhuma das 4
 * subclasses (Abjurador/Adivinho/Evocador/Ilusionista) ainda escolhida,
 * ou antes do nível 3.
 */
export function getWizardVersadoGrantCount(character: Character): number | null {
  if (character.classId !== "mago" || character.level < 3) return null;
  if (!["Abjurador", "Adivinho", "Evocador", "Ilusionista"].includes(character.subclassId ?? "")) return null;
  const extraGrants = WIZARD_VERSADO_EXTRA_GRANT_LEVELS.filter((level) => character.level >= level).length;
  return 2 + extraGrants;
}

/**
 * PV máximos da Proteção Arcana do Abjurador (fonte §8): duas vezes o
 * nível de Mago + mod INT. Reserva PRÓPRIA (nunca PV Temp, nunca soma
 * ao PV máximo do personagem) — só o VALOR MÁXIMO; os PV atuais são
 * estado de sessão (mesmo princípio de `Character.hp.current`), fora
 * do escopo de criação.
 */
export function getAbjurerArcaneWardMaxHp(character: Character): number | null {
  if (character.classId !== "mago" || character.subclassId !== "Abjurador" || character.level < 3) return null;
  const intModifier = getAbilityModifier(getEffectiveAbilityScore(character, "INT"));
  return 2 * character.level + intModifier;
}

/**
 * Bônus de mod INT somado a UMA jogada de dano por Evocação
 * Potencializada (Evocador, nível 10 — fonte §10). Pode ser negativo
 * (mod INT negativo) — nunca um mínimo +1 artificial, conforme a
 * própria fonte exige.
 */
export function getEvocationPotentIntBonus(character: Character): number | null {
  if (character.classId !== "mago" || character.subclassId !== "Evocador" || character.level < 10) return null;
  return getAbilityModifier(getEffectiveAbilityScore(character, "INT"));
}

/**
 * Quantidade de resultados de d20 do Prodígio (Adivinho, fonte §9): 2
 * dos níveis 3-13, 3 a partir do nível 14 (Prodígio Maior — nunca um
 * título impresso separado, só atualiza o mesmo bloco).
 */
export function getDivinationProdigyDiceCount(character: Character): number | null {
  if (character.classId !== "mago" || character.subclassId !== "Adivinho" || character.level < 3) return null;
  return character.level >= 14 ? 3 : 2;
}
