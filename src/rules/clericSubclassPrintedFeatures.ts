import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";

/**
 * Texto compacto para impressão das 4 subclasses de Clérigo — mesma
 * arquitetura de `rules/barbarianSubclassPrintedFeatures.ts`, mas com
 * uma camada extra: várias características de subclasse (Ataque
 * Direcionado, Bênção do Deus da Guerra, Brilho do Amanhecer, Invocar
 * Duplicidade, Preservar a Vida) NUNCA têm checkbox próprio — são
 * apenas linhas `>` anexadas ao MESMO bloco "#Canalizar Divindade" da
 * classe (`rules/clericPrintedFeatures.ts`), que consome o recurso
 * compartilhado. Por isso este módulo exporta duas listas separadas:
 * `getClericChannelDivinityOptionLines` (linhas que entram no bloco de
 * Canalizar Divindade) e `getClericSubclassPrintedBlocks` (blocos
 * próprios, com ou sem checkbox independente).
 *
 * "Magias de Domínio" ficam de fora de propósito: vão para a área de
 * Magias (`rules/clericAutoPreparedSpells.ts`), nunca para este campo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function wisdomModifier(character: Character): number {
  return getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
}

interface ChannelDivinityOptionLine {
  subclassFullName: string;
  acquisitionLevel: number;
  getLine: (character: Character) => string;
}

const CHANNEL_DIVINITY_OPTION_LINES: ChannelDivinityOptionLine[] = [
  // ---------- Domínio da Guerra ----------
  {
    subclassFullName: "Domínio da Guerra",
    acquisitionLevel: 3,
    getLine: () => "> Atq Direcionado: você/aliado 9m erra Atq -> +10; Reação se for aliado",
  },
  {
    subclassFullName: "Domínio da Guerra",
    acquisitionLevel: 6,
    getLine: () => "> Bênção Guerra: 1 uso -> Arma Espiritual/Escudo da Fé sem espaço/Concent, 1 min",
  },
  // ---------- Domínio da Luz ----------
  {
    subclassFullName: "Domínio da Luz",
    acquisitionLevel: 3,
    getLine: (character) => `> Brilho Amanhecer: Emanação 9m, dissipa Escuridão mágica; escolhidos Salv CON -> 2d10+${character.level} Rad, sucesso 1/2`,
  },
  // ---------- Domínio da Trapaça (Invocar Duplicidade evolui no mesmo lugar nos níveis 3/6/17) ----------
  {
    subclassFullName: "Domínio da Trapaça",
    acquisitionLevel: 3,
    getLine: (character) => {
      const movimento = character.level >= 6 ? "AB move 9m, até 36m, e pode trocar de lugar" : "AB move 9m, até 36m";
      if (character.level >= 17) {
        return [
          `> Invocar Duplicidade: AB, ilusão a 9m por 1 min; conjure do espaço dela; Atq contra alvo a 1,5m dela têm Vant; ${movimento}`,
          `> Ao terminar: você/alvo a 1,5m cura ${character.level} PV`,
        ].join("\n");
      }
      return `> Invocar Duplicidade: AB, ilusão a 9m por 1 min; conjure do espaço dela; se ambos a 1,5m do alvo, Vant Atq; ${movimento}`;
    },
  },
  // ---------- Domínio da Vida ----------
  {
    subclassFullName: "Domínio da Vida",
    acquisitionLevel: 3,
    getLine: (character) => `> Preservar Vida: distribua ${5 * character.level} PV entre criaturas Sangrando a 9m; máx 1/2 PV de cada`,
  },
];

/** Linhas que entram DENTRO do bloco "#Canalizar Divindade" da classe — nunca um checkbox separado. */
export function getClericChannelDivinityOptionLines(character: Character): string[] {
  if (!character.subclassId) return [];
  return CHANNEL_DIVINITY_OPTION_LINES.filter(
    (entry) => entry.subclassFullName === character.subclassId && character.level >= entry.acquisitionLevel,
  )
    .sort((a, b) => a.acquisitionLevel - b.acquisitionLevel)
    .map((entry) => entry.getLine(character));
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string;
}

const SUBCLASS_BLOCKS: SubclassBlock[] = [
  // ---------- Domínio da Guerra ----------
  {
    subclassFullName: "Domínio da Guerra",
    acquisitionLevel: 3,
    getText: (character) => {
      const count = Math.max(1, wisdomModifier(character));
      return [`#Sacerdote da Guerra ${checkboxes(count)}`, "AB -> 1 Atq arma/Desarmado", "Todos/DC/DL"].join("\n");
    },
  },
  {
    subclassFullName: "Domínio da Guerra",
    acquisitionLevel: 17,
    getText: () => ["#Avatar da Guerra", "Res Conc/Cort/Perf"].join("\n"),
  },

  // ---------- Domínio da Luz (Labareda Protetora evolui no mesmo lugar no nível 6) ----------
  {
    subclassFullName: "Domínio da Luz",
    acquisitionLevel: 3,
    getText: (character) => {
      const count = Math.max(1, wisdomModifier(character));
      const lines = [`#Labareda Protetora ${checkboxes(count)}`, "Reação: Atq visível a 9m recebe Desv"];
      if (character.level >= 6) {
        lines.push("Alvo do Atq ganha 2d6+SAB PV Temp", "Todos/DC/DL");
      } else {
        lines.push("Todos/DL");
      }
      return lines.join("\n");
    },
  },
  {
    subclassFullName: "Domínio da Luz",
    acquisitionLevel: 17,
    getText: (character) => {
      const count = Math.max(1, wisdomModifier(character));
      return [
        `#Coroa de Luz ${checkboxes(count)}`,
        "Ação: aura 1 min, Luz 18m + Meia-luz 9m",
        "Inimigos na Luz têm Desv Salv vs Brilho e magias Íg/Rad",
        "Todos/DL",
      ].join("\n");
    },
  },

  // ---------- Domínio da Trapaça ----------
  {
    subclassFullName: "Domínio da Trapaça",
    acquisitionLevel: 3,
    getText: () =>
      ["#Bênção do Trapaceiro", "Ação: você/alvo voluntário 9m ganha Vant em Furt", "Até DL ou novo uso"].join("\n"),
  },

  // ---------- Domínio da Vida (Discípulo da Vida funde Curandeiro Abençoado no nível 6) ----------
  {
    subclassFullName: "Domínio da Vida",
    acquisitionLevel: 3,
    getText: (character) => {
      const lines = ["#Discípulo da Vida", "Magia com espaço que cura -> alvo +2+círculo PV"];
      if (character.level >= 6) lines.push("> Se curar outro -> você cura 2+círculo");
      return lines.join("\n");
    },
  },
  {
    subclassFullName: "Domínio da Vida",
    acquisitionLevel: 17,
    getText: () => ["#Cura Suprema", "Cura por magia/Canalizar -> dados usam resultado máx"].join("\n"),
  },
];

/** Blocos próprios das subclasses (com ou sem checkbox independente) — nunca inclui as opções de Canalizar Divindade acima. */
export function getClericSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel).map(
    (block) => ({ level: block.acquisitionLevel, text: block.getText(character) }),
  );
}
