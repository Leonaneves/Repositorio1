import type { Character } from "../domain/character.js";
import { findSpeciesLineageOption } from "../data/speciesLineages.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { getSpellSaveDC } from "./spellcasting.js";

/**
 * Texto compacto para impressão das 4 subclasses de Patrulheiro
 * (fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF")
 * — cada subclasse tem sua PRÓPRIA função com ORDEM FIXA de blocos,
 * nunca um sort genérico por nível de aquisição: "Torrente do
 * Vigilante" (nível 11) precisa aparecer entre "Emboscador das
 * Sombras" e "Visão Umbrosa" (ambos nível 3), e um sort por nível
 * quebraria essa ordem (§ "Não ordenar os blocos exclusivamente pelo
 * nível de aquisição quando isso separar regras relacionadas").
 *
 * "Mente de Ferro" (Vigilante das Sombras) NUNCA aparece aqui — a
 * proficiência final já aparece direto nas Salvaguardas
 * (rules/savingThrows.ts#getMenteDeFerroGrantedAbility).
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

/** `bonusGlamour`/`usosSab` do prompt — mesma fórmula (máximo(1, mod SAB)); cada recurso que a usa tem seu próprio contador impresso, nunca compartilhado. */
function sabFloor1(character: Character): number {
  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  return Math.max(1, wisdomMod);
}

/** `CDPatrulheiro`/`CDdeMagia` do prompt — a mesma CD de conjuração do Patrulheiro (rules/spellcasting.ts), nunca uma fórmula paralela. */
function spellSaveDC(character: Character): number {
  return getSpellSaveDC(character)?.total ?? 0;
}

/**
 * Alcance de Visão no Escuro já concedido por Espécie/Linhagem, em
 * metros, ANTES de "Visão Umbrosa" — os mesmos valores já canônicos do
 * projeto (data/species.ts/rules/speciesLineagePrintedFeatures.ts):
 * Anão e Orc 36m; Draconato, Tiefling, Gnomo e Aasimar 18m; Elfo 18m
 * (36m só na Linhagem Drow); Humano, Halfling e Golias sem Visão no
 * Escuro (0m). Não existe campo numérico próprio para esse alcance no
 * projeto (só texto impresso) — por isso a extração aqui, só para
 * "Visão Umbrosa" somar corretamente sem duplicar a concessão de
 * Espécie (nunca inventa um valor novo, só reaproveita o que já existe).
 */
function baseDarkvisionMeters(character: Character): number {
  if (character.speciesId === "elfo") {
    const lineage = findSpeciesLineageOption("elfo", character.speciesLineageId);
    return lineage?.id === "elfo-drow" ? 36 : 18;
  }
  if (character.speciesId === "anao" || character.speciesId === "orc") return 36;
  if (character.speciesId === "draconato" || character.speciesId === "tiefling" || character.speciesId === "gnomo" || character.speciesId === "aasimar") {
    return 18;
  }
  return 0;
}

// ---------- Andarilho Feérico ----------
function getFeyWandererBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(["# GLAMOUR TRANSCENDENTAL", `> Testes de CAR +${sabFloor1(character)} (já incluso nas perícias)`].join("\n"));

  const golpesTerriveisDie = character.level >= 11 ? "1d6" : "1d4";
  blocks.push(["# GOLPES TERRÍVEIS", `> Acerto com arma: 1/turno +${golpesTerriveisDie} Psíquico`].join("\n"));

  if (character.level >= 7) {
    blocks.push(
      [
        "# DETALHE SEDUTOR",
        "> Vant contra Amedrontado/Enfeitiçado",
        `> Você/criatura à vista a 36m passa nessa Salv: Reação, outra a 36m faz Salv SAB CD ${spellSaveDC(character)}`,
        "> Falha: Amedrontada ou Enfeitiçada 1min; repete Salv ao fim do turno",
      ].join("\n"),
    );
  }

  if (character.level >= 11) {
    blocks.push(["# REFORÇOS FEÉRICOS", "> Convocar Feérico sem espaço [__]/DL", "> Pode ser sem Concentração: dura 1min"].join("\n"));
  }

  if (character.level >= 15) {
    blocks.push(
      [
        "# ANDARILHO NEBULOSO",
        `> Passo Nebuloso ${checkboxes(sabFloor1(character))}/DL`,
        "> pode levar 1 voluntário a 1,5m para a 1,5m do destino",
      ].join("\n"),
    );
  }

  return blocks;
}

// ---------- Caçador ----------
/**
 * Linhas EXTRA que o Caçador acrescenta ao bloco único "Marca do
 * Predador" (fonte "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO
 * PDF" §7: "Para Caçador, integrar ao mesmo bloco as linhas já
 * aprovadas... Não criar dois títulos MARCA DO PREDADOR nem dois
 * contadores de usos"). Nunca inclui o título ou a linha-base do
 * recurso — isso é responsabilidade exclusiva de
 * `rules/rangerClassPrintedFeatures.ts`, que monta o bloco único.
 */
export function getHunterFavoredEnemyExtraLines(character: Character): string[] {
  const lines = ["> Sabe Imunidades, Resistências e Vulnerabilidades do alvo"];
  if (character.level >= 11) {
    lines.push("> 1/turno, ao causar dano ao marcado: dano da marca em outro alvo 9m dele");
  }
  return lines;
}

function getHunterBlocks(character: Character): string[] {
  const blocks: string[] = [];

  blocks.push(
    [
      "# PRESA DO CAÇADOR",
      "> Escolha 1; troca em DC/DL",
      "> 1: Acerto com arma contra alvo abaixo dos PV máximos: +1d8, 1/turno",
      "> 2: 1/turno: +1 atq (mesma arma) contra outro alvo a 1,5m do original que ainda não atacado nesse turno",
    ].join("\n"),
  );

  if (character.level >= 7) {
    blocks.push(
      [
        "# TÁTICAS DEFENSIVAS",
        "> Escolha 1; troca em DC/DL",
        "> 1: Quem acertar você tem Desv nos demais atq contra você nesse turno",
        "> 2: Atq de Oport contra você: Desv",
      ].join("\n"),
    );
  }

  if (character.level >= 15) {
    blocks.push(["# DEFESA DO CAÇADOR SUPERIOR", "> Reação ao sofrer dano: Resistência a esse tipo até fim do turno"].join("\n"));
  }

  return blocks;
}

// ---------- Senhor das Feras ----------
function getBeastmasterBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const lines = ["# COMPANHEIRO PRIMAL", "> Age no seu turno; move e usa Reação; sem comando: Esquivar"];
  lines.push(
    character.level >= 11
      ? "> AB: ordenar ação | Trocar 1 atq da ação Atacar: 2 Golpe da Fera"
      : "> AB: ordenar ação | Trocar 1 atq da ação Atacar: Golpe da Fera",
  );

  if (character.level >= 7) {
    lines.push("> Comando com AB: fera também usa AB para Ajudar/Correr/Desengajar/Esquivar");
    lines.push("> Acerto da fera: pode trocar dano por Energético");
  }
  if (character.level >= 11) {
    lines.push("> 1º acerto/turno no marcado: +dano da Marca do Predador, Energético");
  }

  lines.push("> Você Incapacitado: age sozinha; você morre: desaparece");
  lines.push("> Morta há 1h ou menos: Usar Magia + toque + 1 espaço; revive em 1min, PV completos");
  lines.push("> DL: pode reinvocar a 1,5m");

  blocks.push(lines.join("\n"));

  if (character.level >= 15) {
    blocks.push(["# COMPARTILHAR MAGIAS", "> Magia em si pode também afetar a fera a 9m"].join("\n"));
  }

  return blocks;
}

// ---------- Vigilante das Sombras ----------
function getGloomStalkerBlocks(character: Character): string[] {
  const blocks: string[] = [];

  const golpeTerrivelDie = character.level >= 11 ? "2d8" : "2d6";
  blocks.push(
    [
      "# EMBOSCADOR DAS SOMBRAS",
      "> No 1º turno: desl +3m",
      `> Golpe Terrível: acerto com arma, 1/turno +${golpeTerrivelDie} Psíquico ${checkboxes(sabFloor1(character))}/DL`,
    ].join("\n"),
  );

  if (character.level >= 11) {
    blocks.push(
      [
        "# TORRENTE DO VIGILANTE",
        "> Ao usar Golpe Terrível, escolha 1:",
        "> 1: +1 atq (mesma arma) contra outra criatura a 1,5m do alvo",
        `> 2: alvo e criaturas a 3m dele: Salv SAB CD ${spellSaveDC(character)}; falha: Amedrontados até início do seu prxm turno`,
      ].join("\n"),
    );
  }

  const baseDarkvision = baseDarkvisionMeters(character);
  const effectiveDarkvision = baseDarkvision === 0 ? 18 : baseDarkvision + 18;
  blocks.push(
    ["# VISÃO UMBROSA", `> Visão no Escuro ${effectiveDarkvision}m`, "> Na Escuridão: Invisível pra quem depende de Visão no Escuro"].join(
      "\n",
    ),
  );

  if (character.level >= 15) {
    blocks.push(["# ESQUIVA SOMBRIA", "> Reação ao ser atacado: Desv no atq + pode teleportar 9m"].join("\n"));
  }

  return blocks;
}

/** Blocos da subclasse ATUAL do Patrulheiro — `[]` sem subclasse escolhida ou para qualquer outra classe. */
export function getRangerSubclassPrintedBlocks(character: Character): string[] {
  if (character.subclassId === "Andarilho Feérico") return getFeyWandererBlocks(character);
  if (character.subclassId === "Caçador") return getHunterBlocks(character);
  if (character.subclassId === "Senhor das Feras") return getBeastmasterBlocks(character);
  if (character.subclassId === "Vigilante das Sombras") return getGloomStalkerBlocks(character);
  return [];
}
