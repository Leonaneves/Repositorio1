import type { Character } from "../domain/character.js";
import { getDefesaGloriosaBonus, getResplendorSagradoDamage, getSacredWeaponAttackBonus, getSentinelaImortalHealing } from "./classResources.js";

/**
 * Texto compacto para impressão dos 4 Juramentos de Paladino — mesma
 * arquitetura de `rules/clericSubclassPrintedFeatures.ts`: várias
 * características de subclasse (Arma Sagrada, Atleta Inigualável,
 * Destruição Inspiradora, Voto de Inimizade + Alma Vingativa, A Ira da
 * Natureza) NUNCA têm checkbox próprio — são apenas linhas `>` anexadas
 * ao MESMO bloco "# CANALIZAR DIVINDADE" da classe
 * (`rules/paladinClassPrintedFeatures.ts`), que consome o recurso
 * compartilhado. Aura de Devoção/Vivacidade/Resistência e Destruição
 * Protetora também nunca criam bloco próprio — só linhas extras nos
 * blocos "Aura de Proteção"/"Destruição do Paladino" já existentes. Por
 * isso este módulo exporta funções separadas por destino: linhas de
 * Canalizar Divindade, linhas extras de Aura de Proteção (imunidade e
 * outras), linha extra de Destruição do Paladino, e os blocos PRÓPRIOS
 * das subclasses (com checkbox quando aplicável).
 *
 * "Magias de Juramento" ficam de fora de propósito: vão para a área de
 * Magias (`rules/paladinAutoPreparedSpells.ts`), nunca para este campo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

interface ChannelDivinityOptionLine {
  subclassFullName: string;
  acquisitionLevel: number;
  getLines: (character: Character) => string[];
}

const CHANNEL_DIVINITY_OPTION_LINES: ChannelDivinityOptionLine[] = [
  // ---------- Juramento da Devoção ----------
  {
    subclassFullName: "Juramento da Devoção",
    acquisitionLevel: 3,
    getLines: (character) => {
      const bonus = getSacredWeaponAttackBonus(character) ?? 1;
      return [
        `> Arma Sagrada: ao Atacar, arma Corpo a Corpo ganha +${bonus} Atq por 10min`,
        "> Pode causar Radiante; Luz Plena 6m + Meia-luz 6m",
        "> Encerra ao deixar de carregar a arma ou usar novamente",
      ];
    },
  },
  // ---------- Juramento da Glória ----------
  {
    subclassFullName: "Juramento da Glória",
    acquisitionLevel: 3,
    getLines: () => ["> Atleta Inigualável: AB, Vant em Atlet/Acrobacia e saltos +3m por 1h"],
  },
  {
    subclassFullName: "Juramento da Glória",
    acquisitionLevel: 3,
    getLines: (character) => [`> Destruição Inspiradora: após Destruição Divina, distribui 2d8+${character.level} PV Temp a 9m`],
  },
  // ---------- Juramento da Vingança (Alma Vingativa continua o mesmo lugar no nível 15) ----------
  {
    subclassFullName: "Juramento da Vingança",
    acquisitionLevel: 3,
    getLines: () => [
      "> Voto de Inimizade: ao Atacar, Vant contra 1 alvo a 9m por 1min",
      "> Alvo cai a 0 PV: pode transferir a outro a 9m sem ação",
    ],
  },
  {
    subclassFullName: "Juramento da Vingança",
    acquisitionLevel: 15,
    getLines: () => ["> Alvo do Voto acerta/erra Atq: Reação para Atq corpo a corpo contra ele"],
  },
  // ---------- Juramento dos Anciões ----------
  {
    subclassFullName: "Juramento dos Anciões",
    acquisitionLevel: 3,
    getLines: () => ["> A Ira da Natureza: Usar Magia, criaturas escolhidas a 4,5m, Salv FOR", "> Falha: Contido 1min, repete no fim do turno"],
  },
];

/** Linhas que entram DENTRO do bloco "# CANALIZAR DIVINDADE" da classe — nunca um checkbox separado. */
export function getPaladinChannelDivinityOptionLines(character: Character): string[] {
  if (!character.subclassId) return [];
  return CHANNEL_DIVINITY_OPTION_LINES.filter(
    (entry) => entry.subclassFullName === character.subclassId && character.level >= entry.acquisitionLevel,
  )
    .sort((a, b) => a.acquisitionLevel - b.acquisitionLevel)
    .flatMap((entry) => entry.getLines(character));
}

/**
 * Condição extra de imunidade a somar à linha de imunidade do bloco
 * "Aura de Proteção" (Aura de Devoção, Juramento da Devoção, nível 7+)
 * — nunca uma linha própria: a classe já une esta condição com
 * Amedrontado (Aura de Coragem, nível 10+) numa ÚNICA linha quando as
 * duas estão ativas ao mesmo tempo.
 */
export function getPaladinAuraImmunityConditions(character: Character): string[] {
  if (character.subclassId === "Juramento da Devoção" && character.level >= 7) return ["Enfeitiçado"];
  return [];
}

/** Linhas extras (não-imunidade) do bloco "Aura de Proteção" — Aura de Vivacidade (Glória) e Aura de Resistência (Anciões). */
export function getPaladinAuraExtraLines(character: Character): string[] {
  if (character.subclassId === "Juramento da Glória" && character.level >= 7) {
    return ["> Aliado entra/inicia turno na aura: Desl +3m até fim do prxm turno dele"];
  }
  if (character.subclassId === "Juramento dos Anciões" && character.level >= 7) {
    return ["> Res a Necrótico/Psíquico/Radiante na aura"];
  }
  return [];
}

/** Linha extra do bloco "Destruição do Paladino" — Destruição Protetora (Juramento da Devoção, nível 15+). */
export function getPaladinDivineSmiteExtraLines(character: Character): string[] {
  if (character.subclassId === "Juramento da Devoção" && character.level >= 15) {
    return ["> Conjurar Destruição Divina: Cobertura Parcial na aura até início do prxm turno"];
  }
  return [];
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string;
}

const SUBCLASS_BLOCKS: SubclassBlock[] = [
  // ---------- Juramento da Devoção ----------
  {
    subclassFullName: "Juramento da Devoção",
    acquisitionLevel: 20,
    getText: (character) => {
      const damage = getResplendorSagradoDamage(character) ?? 0;
      return [
        "# RESPLENDOR SAGRADO",
        "> AB: 10min [__]/DL; espaço de 5º recupera uso sem ação",
        `> Inimigo inicia turno na aura: ${damage} Radiante`,
        "> Aura com luz solar; Vant em Salv impostas por Ínferos/Mortos-Vivos",
      ].join("\n");
    },
  },
  // ---------- Juramento da Glória ----------
  {
    subclassFullName: "Juramento da Glória",
    acquisitionLevel: 15,
    getText: (character) => {
      const bonus = getDefesaGloriosaBonus(character) ?? 1;
      return [
        "# DEFESA GLORIOSA",
        `> Reação a acerto em você/criatura a 3m: +${bonus} CA contra Atq ${checkboxes(bonus)}/DL`,
        "> Se errar: pode Atq com arma contra atacante",
      ].join("\n");
    },
  },
  {
    subclassFullName: "Juramento da Glória",
    acquisitionLevel: 20,
    getText: () =>
      [
        "# LENDA VIVA",
        "> AB: 10min [__]/DL; espaço de 5º recupera uso sem ação",
        "> Vant em testes CAR; 1/no seu turno: erro com arma vira acerto",
        "> Falhou Salv: Reação para repetir, usa novo resultado",
      ].join("\n"),
  },
  // ---------- Juramento da Vingança ----------
  {
    subclassFullName: "Juramento da Vingança",
    acquisitionLevel: 7,
    getText: () => ["# VINGADOR IMPLACÁVEL", "> Acerto de Atq de Oport: Desl do alvo 0 no turno, pode mover 1/2 Desl sem Atq de Oport"].join("\n"),
  },
  {
    subclassFullName: "Juramento da Vingança",
    acquisitionLevel: 20,
    getText: () =>
      [
        "# ANJO VINGADOR",
        "> AB: 10min [__]/DL; espaço de 5º recupera uso sem ação",
        "> Voo 18m, pode pairar",
        "> Inimigo inicia turno na aura: Salv SAB, falha Amedrontado 1min ou dano",
        "> Atq contra esse Amedrontado têm Vant",
      ].join("\n"),
  },
  // ---------- Juramento dos Anciões ----------
  {
    subclassFullName: "Juramento dos Anciões",
    acquisitionLevel: 15,
    getText: (character) => {
      const healing = getSentinelaImortalHealing(character) ?? 0;
      return ["# SENTINELA IMORTAL", `> Cai a 0 PV sem morrer: fica com 1 PV e cura ${healing} PV [__]/DL`, "> Sem envelhecimento mágico ou da aparência"].join(
        "\n",
      );
    },
  },
  {
    subclassFullName: "Juramento dos Anciões",
    acquisitionLevel: 20,
    getText: () =>
      [
        "# CAMPEÃO ANCESTRAL",
        "> AB: 1min [__]/DL; espaço de 5º recupera uso sem ação",
        "> Inimigos na aura: Desv nas Salv contra suas magias/Canalizar Divindade",
        "> Magia de 1 ação pode usar AB",
        "> Início do turno: recupera 10 PV",
      ].join("\n"),
  },
];

/** Blocos próprios das subclasses (com ou sem checkbox independente) — nunca inclui as opções de Canalizar Divindade/linhas de Aura/Destruição do Paladino acima. */
export function getPaladinSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel).map(
    (block) => ({ level: block.acquisitionLevel, text: block.getText(character) }),
  );
}
