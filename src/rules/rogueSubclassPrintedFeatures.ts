import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getRogueCunningStrikeCd, getSoulknifePsionicDie, getSoulknifePsionicDiceCount } from "./classResources.js";
import type { CunningStrikeExtraLines } from "./rogueClassPrintedFeatures.js";
import { getSpellSaveDC } from "./spellcasting.js";

/**
 * Texto compacto para impressão das 4 subclasses de Ladino (fonte
 * "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF") — cada
 * subclasse tem sua PRÓPRIA função com ORDEM FIXA de blocos, mesmo
 * padrão de `rules/fighterSubclassPrintedFeatures.ts`. A classe BASE
 * (Ataque Furtivo, Golpe Astuto, Ação Ardilosa, Mira Firme, Esquiva
 * Sobrenatural, Evasão, Talento Confiável, Elusivo, Golpe de Sorte)
 * mora em `rules/rogueClassPrintedFeatures.ts` — este arquivo só
 * acrescenta o que é exclusivo de cada subclasse, inclusive as linhas
 * que se fundem ao bloco "GOLPE ASTUTO"/"MIRA FIRME" da classe base
 * (nunca títulos duplicados).
 */

/** `[__]` com espaço entre marcadores, igual ao padrão já usado para os demais recursos. */
function checkboxes(count: number): string {
  return Array(Math.max(0, count)).fill("[__]").join(" ");
}

// ---------- Lâmina Psíquica (exibida como "Adaga Espiritual") ----------
function getSoulknifeBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const dice = getSoulknifePsionicDie(character);
  const abilityMod = Math.max(
    getAbilityModifier(getEffectiveAbilityScore(character, "FOR")),
    getAbilityModifier(getEffectiveAbilityScore(character, "DEX")),
  );
  const sign = abilityMod >= 0 ? "+" : "";

  const bladeLines = [
    "# LÂMINAS PSÍQUICAS",
    "> Mão livre: lâmina ao Atacar/Atq de Oport; desaparece após atq",
    `> 1ª: 1d6${sign}${abilityMod} Psíquico, Acuidade, Arremesso 18/36m, Afligir | 2ª: 1d4${sign}${abilityMod} Psíquico`,
    "> Após atq com lâmina: AB, 2ª lâmina com outra mão livre",
  ];
  if (character.level >= 9) {
    bladeLines.push("> Errou atq: +DP na jogada, gasta se acertar");
  }
  blocks.push(bladeLines.join("\n"));

  if (dice !== null) {
    const diceCount = getSoulknifePsionicDiceCount(character) ?? 0;
    blocks.push(
      [
        "# ENERGIA PSIÔNICA",
        `> DP d${dice} ${checkboxes(diceCount)} | DC: recupera 1 DL: todos`,
        "> Falhou teste de perícia/ferramenta proficiente: +DP, gasta se passar",
      ].join("\n"),
    );

    blocks.push(
      [
        "# SUSSURROS PSÍQUICOS",
        `> Usar Magia: telepatia com ${getProficiencyBonus(character.level)} criaturas por d${dice} h`,
        "> Sem gasto [__]/DL; demais usos: 1 DP",
      ].join("\n"),
    );
  }

  if (character.level >= 9) {
    blocks.push(["# TELEPORTE PSÍQUICO", "> AB: gastar 1 DP, teleportar 3 vezes o resultado em m"].join("\n"));
  }

  if (character.level >= 13) {
    blocks.push(
      ["# VÉU PSÍQUICO", "> Invisível 1h; encerra ao causar dano/forçar Salv [__]/DL", "> 1 DP recupera uso sem ação"].join("\n"),
    );
  }

  if (character.level >= 17) {
    const cd = getRogueCunningStrikeCd(character);
    const cdText = cd !== null ? `${cd}` : "—";
    blocks.push(
      [
        "# RASGAR MENTE",
        `> Ataque Furtivo: Salv SAB CD${cdText}; Atordoado 1min, repete todo turno [__]/DL`,
        "> 3 DP recuperam uso sem ação",
      ].join("\n"),
    );
  }

  return blocks;
}

// ---------- Assassino ----------
function getAssassinBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const lines = ["# ASSASSINAR", "> Vant em Inic", `> 1ª rodada: Vant contra quem não teve turno; Ataque Furtivo +${character.level} dano`];
  if (character.level >= 17) {
    const cd = getRogueCunningStrikeCd(character);
    const cdText = cd !== null ? `${cd}` : "—";
    lines.push(`> Ataque Furtivo 1ª rodada: Salv CON CD ${cdText}; falha: 2x dano`);
  }
  blocks.push(lines.join("\n"));

  if (character.level >= 9) {
    blocks.push(["# MIMETISMO MAGISTRAL", "> Estudar 1h: imitar fala/caligrafia"].join("\n"));
  }

  return blocks;
}

/** Mira Móvel (nível 9+) — substitui a 2ª linha do bloco "MIRA FIRME" da classe base, nunca soma. */
export function isRogueMobileAimActive(character: Character): boolean {
  return character.subclassId === "Assassino" && character.level >= 9;
}

/** Armas Venenosas (nível 13+) — linha extra IMEDIATAMENTE após Envenenar, no bloco "GOLPE ASTUTO" da classe base. */
function getAssassinCunningStrikeExtraLines(character: Character): CunningStrikeExtraLines {
  if (character.subclassId !== "Assassino" || character.level < 13) return {};
  return { afterPoison: ["> Cada falha nessa Salv: +2d6 Venenoso, ignora Res"] };
}

// ---------- Ladrão ----------
function getThiefBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(["# ANDARILHO DE TELHADOS", "> Saltos podem usar DEX em vez de FOR"].join("\n"));
  blocks.push(["# MÃO LEVE", "> AB: Prestidigitação para fechadura/armadilha ou roubar bolso", "> AB: Usar Objeto para ativar item mágico"].join("\n"));

  if (character.level >= 13) {
    blocks.push(
      [
        "# USAR DISPOSITIVO MÁGICO",
        "> Sintoniza 4 itens",
        "> Gastar cargas: 1d6, no 6 não gasta",
        "> Pergaminhos usam INT; acima do 1º círculo: Arca CD 10+círculo, falha destrói",
      ].join("\n"),
    );
  }

  if (character.level >= 17) {
    blocks.push(["# REFLEXOS DE LADRÃO", "> 1ª rodada: 2 turnos, na Inic e Inic-10"].join("\n"));
  }

  return blocks;
}

/** Ataque Escondido (nível 9+) — opção extra no mesmo bloco "GOLPE ASTUTO" da classe base, nunca título separado. */
function getThiefCunningStrikeExtraLines(character: Character): CunningStrikeExtraLines {
  if (character.subclassId !== "Ladrão" || character.level < 9) return {};
  return { extraOptions: ["> Ataque Escondido 1d6: atq mantém Invisível se terminar turno em 3/4 ou total"] };
}

// ---------- Trapaceiro Arcano ----------
function getArcaneTricksterBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(["# MÃOS MÁGICAS LIGEIRAS", "> AB: conjurar Mãos Mágicas; mão é Invisível e fazer Prestidigi."].join("\n"));

  if (character.level >= 9) {
    blocks.push(["# EMBOSCADA MÁGICA", "> Conjurar Invisível: alvo tem Desv nas Salv contra a magia neste turno"].join("\n"));
  }

  if (character.level >= 17) {
    const spellDC = getSpellSaveDC(character)?.total ?? 0;
    blocks.push(
      [
        "# LADRÃO DE MAGIAS",
        `> Reação à magia: conjurador faz Salv INT CD ${spellDC}; nega efeito em você`,
        "> Se 1º círculo: por 8h, você prepara e conjurador não pode conjurar [__]/DL",
        "> Só gasta uso se ele falhar",
      ].join("\n"),
    );
  }

  return blocks;
}

/** Trapaceiro Versátil (nível 13+) — linha extra no mesmo bloco "GOLPE ASTUTO" da classe base, nunca título separado. */
function getArcaneTricksterCunningStrikeExtraLines(character: Character): CunningStrikeExtraLines {
  if (character.subclassId !== "Trapaceiro Arcano" || character.level < 13) return {};
  return { extraOptions: ["> Pode aplicar a opção em outra criatura a 1,5m de Mãos Mágicas"] };
}

/** Blocos da subclasse ATUAL do Ladino — `[]` sem subclasse escolhida ou para qualquer outra classe. */
export function getRogueSubclassPrintedBlocks(character: Character): string[] {
  if (character.subclassId === "Lâmina Psíquica") return getSoulknifeBlocks(character);
  if (character.subclassId === "Assassino") return getAssassinBlocks(character);
  if (character.subclassId === "Ladrão") return getThiefBlocks(character);
  if (character.subclassId === "Trapaceiro Arcano") return getArcaneTricksterBlocks(character);
  return [];
}

/** Linhas extras de QUALQUER subclasse para o bloco "GOLPE ASTUTO" da classe base — nunca mais de uma origem ativa por vez (subclasse é única). */
export function getRogueCunningStrikeExtraLines(character: Character): CunningStrikeExtraLines {
  return {
    ...getAssassinCunningStrikeExtraLines(character),
    ...getThiefCunningStrikeExtraLines(character),
    ...getArcaneTricksterCunningStrikeExtraLines(character),
  };
}
