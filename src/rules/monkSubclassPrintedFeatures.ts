import type { Character } from "../domain/character.js";
import { findSpeciesLineageOption } from "../data/speciesLineages.js";
import type { MonkFocusExtraLines } from "./monkClassPrintedFeatures.js";
import {
  getBodyResilienceHealingText,
  getElementalBurstDamageText,
  getHandOfUltimateMercyHealingText,
  getIntegridadeCorporalUsesCount,
  getMartialArtsDie,
  getMercyHandDiceText,
  getMonkFocusCd,
  getTorrenteDeCuraEDoloUsesCount,
} from "./classResources.js";

/**
 * Texto compacto para impressão das 4 subclasses de Monge (fonte
 * "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" §9-§12) —
 * cada subclasse tem sua PRÓPRIA função com ORDEM FIXA de blocos, nunca
 * um sort genérico por nível de aquisição (mesmo princípio de
 * `rules/rangerSubclassPrintedFeatures.ts`).
 *
 * "Implementos de Misericórdia" (perícias/ferramenta) e "Manipular
 * Elementos" (truque de Elementalismo) NUNCA aparecem aqui — já vão
 * para os campos próprios de Perícias/Proficiências/Magias.
 *
 * `nearFocus` reúne os blocos que devem ficar ao lado do bloco "FOCO"
 * da classe base (logo após ele, onde mora "Torrente de Golpes"/"Passo
 * do Vento") — `rules/monkPrintedFeatures.ts` faz essa junção.
 * `focusExtraLines.afterWindStep` injeta a linha de Passo Veloz direto
 * no grupo de Passo do Vento do bloco "FOCO" (nunca um bloco próprio).
 */
export interface MonkSubclassPrintedBlocks {
  nearFocus: string[];
  rest: string[];
  focusExtraLines: MonkFocusExtraLines;
}

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function focusCdText(character: Character): string {
  const cd = getMonkFocusCd(character);
  return cd !== null ? `${cd}` : "—";
}

// ---------- Caminho da Mão Aberta ----------
function getOpenHandBlocks(character: Character): MonkSubclassPrintedBlocks {
  const cd = focusCdText(character);
  const nearFocus: string[] = [];
  const rest: string[] = [];

  nearFocus.push(
    [
      "# TÉCNICA DA MÃO ABERTA",
      `> Acerto de Torrente de Golpes, 1 efeito: Derrubar (Salv DEX CD ${cd}, Caído) / Desorientar (sem Atq de Oport até prxm turno) / Empurrar (Salv FOR CD ${cd}, 4,5m)`,
    ].join("\n"),
  );

  if (character.level >= 6) {
    const healing = getBodyResilienceHealingText(character) ?? "1d6";
    const uses = getIntegridadeCorporalUsesCount(character) ?? 1;
    nearFocus.push(["# INTEGRIDADE CORPORAL", `> AB: cura ${healing} ${checkboxes(uses)}/DL`].join("\n"));
  }

  if (character.level >= 17) {
    rest.push(
      [
        "# PALMA VIBRANTE",
        `> Acerto de Atq Desarmado: 4 Foco, vibrações por ${character.level} dias, 1 criatura por vez, sem dano imediato`,
        `> Encerrar com dano: ação ou substitui 1 Atq; Salv CON CD ${cd}; falha 10d12 Força, sucesso 1/2`,
      ].join("\n"),
    );
  }

  const focusExtraLines: MonkFocusExtraLines = character.level >= 11 ? { afterWindStep: ["> Após outra AB: pode usar Passo do Vento"] } : {};

  return { nearFocus, rest, focusExtraLines };
}

// ---------- Caminho da Misericórdia ----------
function getMercyBlocks(character: Character): MonkSubclassPrintedBlocks {
  const nearFocus: string[] = [];
  const rest: string[] = [];
  const toqueDeMedico = character.level >= 6;

  const healDice = getMercyHandDiceText(character) ?? "1d6";
  const healLines = ["# MÃO DE CURA", `> Usar Magia + toque + 1 Foco: cura ${healDice}`, "> Torrente de Golpes: substitui 1 Atq Desarmado por esta cura, sem Foco adicional"];
  if (toqueDeMedico) healLines.push("> Também encerra Atordoado/Cego/Envenenado/Paralisado/Surdo no curado");
  nearFocus.push(healLines.join("\n"));

  const harmLines = ["# MÃO DE DOLO", `> 1/turno, acerto+dano de Atq Desarmado: 1 Foco, +${healDice} Necrótico`];
  if (toqueDeMedico) harmLines.push("> Também impõe Envenenado no alvo até prxm turno");
  nearFocus.push(harmLines.join("\n"));

  if (character.level >= 11) {
    const uses = getTorrenteDeCuraEDoloUsesCount(character) ?? 1;
    nearFocus.push(
      [
        "# TORRENTE DE CURA E DOLO",
        `> Torrente de Golpes: substitui TODOS os Atq Desarmado por Mão de Cura e usa Mão de Dolo em 1, sem Foco adicional ${checkboxes(uses)}/DL`,
      ].join("\n"),
    );
  }

  if (character.level >= 17) {
    const finalHealing = getHandOfUltimateMercyHealingText(character) ?? "4d10";
    rest.push(
      [
        "# MÃO DA MISERICÓRDIA FINAL",
        `> Usar Magia + toque + 5 Foco: revive morto até 24h, cura ${finalHealing}, remove Atordoado/Cego/Envenenado/Paralisado/Surdo da morte [__]/DL`,
      ].join("\n"),
    );
  }

  return { nearFocus, rest, focusExtraLines: {} };
}

/**
 * Alcance de Visão no Escuro já concedido por Espécie/Linhagem, em
 * metros, ANTES de "Artes das Sombras" — mesma extração/valores já
 * canônicos usados por "Visão Umbrosa" do Patrulheiro
 * (rules/rangerSubclassPrintedFeatures.ts#baseDarkvisionMeters) — só
 * para a soma correta aqui, nunca duplica a concessão de Espécie.
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

// ---------- Caminho das Sombras ----------
function getShadowBlocks(character: Character): MonkSubclassPrintedBlocks {
  const rest: string[] = [];
  const baseDarkvision = baseDarkvisionMeters(character);
  const effectiveDarkvision = baseDarkvision > 0 ? baseDarkvision + 18 : 18;

  rest.push(
    [
      "# ARTES DAS SOMBRAS",
      "> 1 Foco: Escuridão sem componentes; vê a área; início do turno move a área até 18m",
      "> Concede o truque Ilusão Menor (SAB)",
      `> Visão no Escuro ${effectiveDarkvision}m`,
    ].join("\n"),
  );

  if (character.level >= 6) {
    const stepLines = [
      "# PASSO DA SOMBRA",
      "> AB em Penumbra/Escuridão: teleporta 18m a espaço desocupado à vista em Penumbra/Escuridão; Vant no prxm atq corpo a corpo do turno",
    ];
    if (character.level >= 11) stepLines.push("> Com 1 Foco: ignora iluminação + 1 Atq Desarmado após teleportar");
    rest.push(stepLines.join("\n"));
  }

  if (character.level >= 17) {
    rest.push(
      [
        "# MANTO DA SOMBRA",
        "> Usar Magia em Penumbra/Escuridão + 3 Foco: 1min ou até Incapacitado ou luz plena no fim do turno",
        "> Invisível; espaço ocupado = Terreno Difícil; fim do turno em ocupado: volta ao último desocupado",
        "> Torrente de Golpes não custa Foco",
      ].join("\n"),
    );
  }

  return { nearFocus: [], rest, focusExtraLines: {} };
}

// ---------- Caminho dos Elementos ----------
function getElementalBlocks(character: Character): MonkSubclassPrintedBlocks {
  const nearFocus: string[] = [];
  const rest: string[] = [];
  const die = getMartialArtsDie(character) ?? 6;

  const sintoniaLines = [
    "# SINTONIA ELEMENTAL",
    "> Início do turno: 1 Foco, 10min ou até Incapacitado",
    "> Alcance do Atq Desarmado +3m",
    "> Atq Desarmado pode causar Ácido/Elétrico/Frio/Fogo/Trovão; causando esse dano, Salv FOR ou empurra/puxa 3m",
  ];
  if (character.level >= 11) sintoniaLines.push("> Durante Sintonia: Natação e Voo iguais ao Desl");
  if (character.level >= 17) {
    sintoniaLines.push(`> No seu turno, 1 acerto desarmado: +1d${die} do mesmo tipo`);
    sintoniaLines.push("> Res a 1 tipo elemental, pode trocar no início do turno");
  }
  rest.push(sintoniaLines.join("\n"));

  if (character.level >= 6) {
    const cd = focusCdText(character);
    const burst = getElementalBurstDamageText(character) ?? "3d6";
    rest.push(
      ["# EXPLOSÃO ELEMENTAL", `> Usar Magia + 2 Foco: esfera 6m, ponto à vista a 36m, escolha 1 tipo elemental; Salv DEX CD ${cd}; falha ${burst}, sucesso 1/2`].join(
        "\n",
      ),
    );
  }

  if (character.level >= 17) {
    nearFocus.push(
      [
        "# PASSO DESTRUTIVO",
        "> Ao usar Passo do Vento: +6m de Desl até fim do turno",
        `> Nesse bônus, entrar a 1,5m de 1 criatura: 1d${die} de dano elemental nela, 1x/criatura/turno`,
      ].join("\n"),
    );
  }

  return { nearFocus, rest, focusExtraLines: {} };
}

export function getMonkSubclassPrintedBlocks(character: Character): MonkSubclassPrintedBlocks {
  if (character.classId !== "monge") return { nearFocus: [], rest: [], focusExtraLines: {} };
  if (character.subclassId === "Guerreiro da Mão Aberta") return getOpenHandBlocks(character);
  if (character.subclassId === "Guerreiro da Misericórdia") return getMercyBlocks(character);
  if (character.subclassId === "Guerreiro das Sombras") return getShadowBlocks(character);
  if (character.subclassId === "Guerreiro dos Elementos") return getElementalBlocks(character);
  return { nearFocus: [], rest: [], focusExtraLines: {} };
}
