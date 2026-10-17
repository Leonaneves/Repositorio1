import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { getPsiWarriorDie, getPsiWarriorDiceCount, getSuperiorityDie, getSuperiorityDiceCount } from "./classResources.js";
import { getKineticThrustCd, getPsionicDieWithIntText, getPsionicLeapFlySpeed, getEnergyBastionTargetCount } from "./psionics.js";
import { getManeuversCd } from "./maneuvers.js";

/**
 * Texto compacto para impressão das 4 subclasses de Guerreiro (fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF") — cada
 * subclasse tem sua PRÓPRIA função com ORDEM FIXA de blocos, mesmo
 * padrão de `rules/rangerSubclassPrintedFeatures.ts`. A classe BASE do
 * Guerreiro (Estilo de Luta, Maestria em Arma, Recuperar Fôlego, Mente
 * Tática, Surto de Ação, Ajuste Tático, Ataque Extra, Indomável, Mestre
 * Tático, Ataques Estudados) agora tem conteúdo mecânico completo em
 * `rules/fighterClassPrintedFeatures.ts` (fonte "COMPLETAR A CLASSE
 * GUERREIRO NO BUILDER E NO PDF") — este arquivo continua intocado em
 * conteúdo, exceto pela extração de `getEldritchKnightActionSurgeExtraLines`
 * (ver abaixo).
 *
 * As Manobras CONHECIDAS do Mestre de Batalha e o Estilo de Luta
 * Adicional do Campeão NÃO aparecem mais aqui (fonte "COMPLETAR A
 * CLASSE PATRULHEIRO NO BUILDER E NO PDF" §8) — foram movidos para a
 * caixa de Talentos (`rules/fighterTalentEntries.ts`), saindo de
 * "Características de Classe". "SUPERIORIDADE EM COMBATE" continua
 * aqui com quantidade/tipo de Dado de Superioridade, CD e Implacável.
 */

/** `[__]` com espaço entre marcadores, igual ao exemplo literal da fonte ("quatro dados: `[__] [__] [__] [__]`"). */
function checkboxes(count: number): string {
  return Array(Math.max(0, count)).fill("[__]").join(" ");
}

// ---------- Campeão ----------
function getChampionBlocks(character: Character): string[] {
  const blocks: string[] = [];

  // Nível 15 (Crítico Superior) substitui por completo o intervalo anterior — nunca os dois juntos.
  const criticalRange = character.level >= 15 ? "18–20" : "19–20";
  blocks.push(["# ATLETA EXTRAORDINÁRIO", "> Vant em Iniciativa e Atletismo", "> Após crítico: mover 1/2 desl sem Atq de Oport"].join("\n"));
  blocks.push(["# CRÍTICO", `> Armas e desarmados: ${criticalRange}`].join("\n"));

  if (character.level >= 10) {
    blocks.push(["# COMBATENTE HEROICO", "> Início do turno em combate sem Inspiração Heroica: pode recebê-la"].join("\n"));
  }

  if (character.level >= 18) {
    const survivorHealing = 5 + getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
    blocks.push(
      [
        "# SOBREVIVENTE",
        "> Salv Contra Morte: Vant; 18–20 vale 20",
        `> Início do turno Sangrando e com 1+ PV: recupera ${survivorHealing} PV`,
      ].join("\n"),
    );
  }

  // "Estilo de Luta Adicional" (nível 7) nunca aparece aqui — vai para a caixa de Talentos
  // (rules/fightingStyles.ts#getFightingStyleTalentEntries), nunca em Características de Classe.

  return blocks;
}

// ---------- Cavaleiro Místico ----------
function getEldritchKnightBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(
    [
      "# VÍNCULO COM ARMA",
      "> Ritual 1h/DC: vincula até 2 armas; não podem ser desarmadas salvo Incapacitado",
      "> AB: invocar 1 arma vinculada",
    ].join("\n"),
  );

  if (character.level >= 18) {
    blocks.push(["# MAGIA DE GUERRA", "> Ação Atacar: trocar 1 atq por truque ou 2 por magia de 1º/2º círculo, de Mago e de 1 ação"].join("\n"));
  } else if (character.level >= 7) {
    blocks.push(["# MAGIA DE GUERRA", "> Ação Atacar no seu turno: trocar 1 atq por truque de Mago de 1 ação"].join("\n"));
  }

  if (character.level >= 10) {
    blocks.push(["# GOLPE MÍSTICO", "> Acerto com arma: alvo tem Desv na prxm Salv contra sua magia até fim do seu prxm turno"].join("\n"));
  }

  // Investida Mística (nível 15) NUNCA cria um bloco/título próprio aqui — entra na MESMA linha do
  // bloco "# SURTO DE AÇÃO" da classe BASE (fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO
  // PDF" §10), via `getEldritchKnightActionSurgeExtraLines` abaixo, consumida só por
  // `rules/fighterClassPrintedFeatures.ts` — nunca duplica nem inventa os usos de Surto de Ação.

  return blocks;
}

/** Linha extra de "Investida Mística" (Cavaleiro Místico, nível 15+) para o bloco "SURTO DE AÇÃO" da classe BASE — nunca cria contador separado, reaproveita os usos já existentes da característica do Guerreiro. */
export function getEldritchKnightActionSurgeExtraLines(character: Character): string[] {
  if (character.subclassId !== "Cavaleiro Místico" || character.level < 15) return [];
  return ["> Pode teleportar 9m antes/depois da ação adicional"];
}

// ---------- Guerreiro Psiônico ----------
function getPsiWarriorBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const die = getPsiWarriorDie(character);
  const active = die !== null;

  if (active) {
    const diceCount = getPsiWarriorDiceCount(character) ?? 0;
    blocks.push(
      ["# ENERGIA PSIÔNICA", `> DP d${die} ${checkboxes(diceCount)} | DC: recupera 1 DL: todos`, "> Recuperar uso de poder: 1 DP, sem ação"].join(
        "\n",
      ),
    );

    const dieWithInt = getPsionicDieWithIntText(character) ?? "";
    const golpePsionicoLines = ["# GOLPE PSIÔNICO", `> Acerto com arma a 9m: 1/no seu turno, gastar 1 DP: +${dieWithInt} Energético`];
    const kineticThrustCd = getKineticThrustCd(character);
    if (kineticThrustCd !== null) {
      golpePsionicoLines.push(`> Alvo faz Salv FOR CD ${kineticThrustCd}; falha: Caído ou mover 3m horizontal`);
    }
    blocks.push(golpePsionicoLines.join("\n"));

    blocks.push(["# VÍNCULO PROTETIVO", `> Reação ao sofrer dano, você/criatura a 9m: gastar 1 DP, -${dieWithInt}`].join("\n"));

    blocks.push(
      [
        "# MOVIMENTO TELECINÉTICO",
        "> mover 9m objeto Grande ou menor/outra criatura voluntária a 9m [__]/DC ou DL",
        "> Objeto Minúsculo: pode mover de/para sua mão",
      ].join("\n"),
    );
  }

  const leapFlySpeed = getPsionicLeapFlySpeed(character);
  if (leapFlySpeed !== null) {
    blocks.push(["# SALTO COM IMPULSÃO PSÍQUICA", `> AB: voo ${leapFlySpeed}m até fim do turno [__]/DC ou DL`].join("\n"));
  }

  if (character.level >= 10) {
    blocks.push(["# RESGUARDO MENTAL", "> Resistência a Psíquico", "> Início do turno: 1 DP encerra Amedrontado/Enfeitiçado"].join("\n"));
  }

  const bastionTargets = getEnergyBastionTargetCount(character);
  if (bastionTargets !== null) {
    blocks.push(["# BALUARTE DE ENERGIA", `> AB: ${bastionTargets} criaturas a 9m, Cobertura Parcial 1min[__]/DL`].join("\n"));
  }

  if (character.level >= 18) {
    blocks.push(["# MESTRE TELECINÉTICO", "> Telecinese sem espaço [__]/DL", "> Enquanto mantém Concentração: AB para 1 atq com arma"].join("\n"));
  }

  return blocks;
}

// ---------- Mestre da Batalha ----------
function getBattleMasterBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const die = getSuperiorityDie(character);
  if (die !== null) {
    const diceCount = getSuperiorityDiceCount(character) ?? 0;
    const cd = getManeuversCd(character);
    const cdText = cd !== null ? `${cd}` : "—";
    const secondLine = character.level >= 15 ? "> 1 manobra/atq; gasta 1 DS ou, 1/turno, usa 1d8 sem gastar" : "> 1 manobra/atq; cada uso gasta 1 DS";
    blocks.push(["# SUPERIORIDADE EM COMBATE", `> DS d${die} ${checkboxes(diceCount)}/DC ou DL | CD ${cdText}`, secondLine].join("\n"));

    // As Manobras CONHECIDAS saíram daqui para a caixa de Talentos (fonte "COMPLETAR A CLASSE
    // PATRULHEIRO NO BUILDER E NO PDF" §8 — ver `rules/fighterTalentEntries.ts`); este bloco
    // mantém só quantidade/tipo de Dado de Superioridade, CD e Implacável.
  }

  if (character.level >= 7) {
    blocks.push(
      [
        "# CONHEÇA SEU INIMIGO",
        "> AB: sabe Imunidades, Resistências e Vulnerabilidades de criatura a 9m [__]/DL",
        "> 1 DS recupera uso",
      ].join("\n"),
    );
  }

  // Implacável (nível 15) já aparece na segunda linha de SUPERIORIDADE EM COMBATE acima — nunca
  // um título "Superioridade Aprimorada/Suprema" separado (§6).

  return blocks;
}

/** Blocos da subclasse ATUAL do Guerreiro — `[]` sem subclasse escolhida ou para qualquer outra classe. */
export function getFighterSubclassPrintedBlocks(character: Character): string[] {
  if (character.subclassId === "Campeão") return getChampionBlocks(character);
  if (character.subclassId === "Cavaleiro Místico") return getEldritchKnightBlocks(character);
  if (character.subclassId === "Guerreiro Psiônico") return getPsiWarriorBlocks(character);
  if (character.subclassId === "Mestre da Batalha") return getBattleMasterBlocks(character);
  return [];
}
