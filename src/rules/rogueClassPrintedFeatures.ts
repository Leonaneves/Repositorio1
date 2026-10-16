import type { Character } from "../domain/character.js";
import { getCunningStrikeMaxEffects, getRogueCunningStrikeCd, getSneakAttackDice } from "./classResources.js";

/**
 * Texto compacto para impressão da classe BASE do Ladino (fonte
 * "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" §7) — as 4
 * SUBCLASSES continuam em `rules/rogueSubclassPrintedFeatures.ts`.
 *
 * Nunca aparecem aqui (ficam na etapa própria "Perícias", no campo de
 * Idiomas, ou no sistema de ASI/Dádiva Épica genérico): Especialista
 * (nível 1/6), Gíria dos Ladrões, Subclasse de Ladino, Aumento no Valor
 * de Atributo, Dádiva Épica.
 */

function getSneakAttackBlock(character: Character): string {
  const dice = getSneakAttackDice(character) ?? "1d6";
  return ["# ATAQUE FURTIVO", `> 1/turno: +${dice}`, "> Vant ou aliado a 1,5m do alvo e sem Desv no atq"].join("\n");
}

export interface CunningStrikeExtraLines {
  /** Armas Venenosas (Assassino, nível 13+) — entra IMEDIATAMENTE após a linha de Envenenar. */
  afterPoison?: string[];
  /** Ataque Escondido (Ladrão, nível 9+) — entra junto das demais opções, antes de Golpes Sujos. */
  extraOptions?: string[];
}

/**
 * Bloco único "Golpe Astuto" — já inclui Golpe Astuto Aprimorado
 * (limite de efeitos) e Golpes Sujos (opções extras do nível 14),
 * nunca títulos separados (fonte §7: "Golpe Astuto deve ficar
 * imediatamente após Ataque Furtivo... Não criar títulos separados
 * para suas melhorias"). As opções de melhoria de subclasse (Armas
 * Venenosas do Assassino, Ataque Escondido do Ladrão) entram no MESMO
 * bloco via `extraLines` (rules/rogueSubclassPrintedFeatures.ts), nunca
 * duplicadas aqui.
 */
function getCunningStrikeBlock(character: Character, extraLines: CunningStrikeExtraLines): string {
  const cd = getRogueCunningStrikeCd(character);
  const cdText = cd !== null ? `${cd}` : "—";
  const maxEffects = getCunningStrikeMaxEffects(character) ?? 1;
  // Nunca imprime "efeito(s)" literal (fonte §7) — resolve para singular/plural real.
  const effectsLabel = maxEffects === 1 ? "1 efeito" : `${maxEffects} efeitos`;

  const lines = ["# GOLPE ASTUTO", `> Retire dados do Ataque Furtivo: até ${effectsLabel}, CD ${cdText}`];
  lines.push("> Envenenar 1d6: Salv CON falha: Envenenado 1min, repete no fim do turno");
  lines.push(...(extraLines.afterPoison ?? []));
  lines.push("> Retirada 1d6: 1/2 desl sem Atq de Oport");
  lines.push("> Tropeço 1d6: Salv DEX; falha: Caído");
  lines.push(...(extraLines.extraOptions ?? []));

  if (character.level >= 14) {
    lines.push("> Aturdir 2d6: Salv CON; prxm turno do alvo: mover ou ação ou AB");
    lines.push("> Nocaute 6d6: Salv CON; Inconsciente 1min ou dano, repete todo turno");
    lines.push("> Obscurecer 3d6: Salv DEX; Cego até fim do prxm turno do alvo");
  }

  return lines.join("\n");
}

function getCunningActionBlock(): string {
  return ["# AÇÃO ARDILOSA", "> AB: Correr/Desengajar/Esconder"].join("\n");
}

/** Mira Móvel (Assassino, nível 9+) substitui a 2ª linha — nunca soma, nunca bloco separado (fonte §9). */
function getSteadyAimBlock(mobileAimActive: boolean): string {
  const secondLine = mobileAimActive
    ? "> Sem mover no turno: AB, Vant no prxm atq deste turno; pode mover depois"
    : "> Sem mover no turno: AB, Vant no prxm atq; desl 0 até fim do turno";
  return ["# MIRA FIRME", secondLine].join("\n");
}

function getUncannyDodgeBlock(): string {
  return ["# ESQUIVA SOBRENATURAL", "> Reação: 1/2 dano do atq"].join("\n");
}

function getEvasionBlock(): string {
  return ["# EVASÃO", "> Salv DEX para 1/2 dano: sucesso 0, falha 1/2; salvo Incapacitado"].join("\n");
}

function getReliableTalentBlock(): string {
  return ["# TALENTO CONFIÁVEL", "> Teste com BP em perícia/ferramenta: d20 de 1-9 = 10"].join("\n");
}

function getElusiveBlock(): string {
  return ["# ELUSIVO", "> Atq contra você sem Vant"].join("\n");
}

function getStrokeOfLuckBlock(): string {
  return ["# GOLPE DE SORTE", "> Falhou Teste: resultado vira 20 [__]/DC ou DL"].join("\n");
}

/**
 * Blocos da classe BASE do Ladino já adquiridos no nível atual, em
 * ordem de aquisição — `cunningStrikeExtraLines` deixa
 * `rules/roguePrintedFeatures.ts` injetar as opções de subclasse
 * (Armas Venenosas/Ataque Escondido) no MESMO bloco "Golpe Astuto",
 * nunca duplicando o título.
 */
export function getRogueClassPrintedBlocks(
  character: Character,
  cunningStrikeExtraLines: CunningStrikeExtraLines = {},
  mobileAimActive = false,
): string[] {
  if (character.classId !== "ladino") return [];

  const blocks: string[] = [getSneakAttackBlock(character)];

  if (character.level >= 5) blocks.push(getCunningStrikeBlock(character, cunningStrikeExtraLines));
  blocks.push(getCunningActionBlock());
  blocks.push(getSteadyAimBlock(mobileAimActive));
  if (character.level >= 5) blocks.push(getUncannyDodgeBlock());
  if (character.level >= 7) {
    blocks.push(getEvasionBlock());
    blocks.push(getReliableTalentBlock());
  }
  if (character.level >= 18) blocks.push(getElusiveBlock());
  if (character.level >= 20) blocks.push(getStrokeOfLuckBlock());

  return blocks;
}
