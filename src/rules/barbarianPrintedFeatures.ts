import type { Character } from "../domain/character.js";
import { getRageCount, getRageDamageBonus } from "./classResources.js";
import { getBarbarianSubclassPrintedBlocks } from "./barbarianSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Bárbaro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte
 * "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" + revisão editorial
 * "ALTERAÇÃO DOS TEXTOS IMPRESSOS — BÁRBARO" (texto telegráfico, sem
 * ponto após abreviação, título sozinho quando já é autoexplicativo).
 * Representação SEPARADA da regra estruturada completa
 * (`data/features/barbarian.ts` + `rules/classResources.ts`): nunca
 * usada para cálculo, só montada a partir dela (classe/nível/
 * subclasse/escolhas/progressões) — nunca um texto gigante hardcoded
 * por combinação de nível/subclasse. A revisão editorial NUNCA muda
 * regra, nível de aquisição, progressão ou escolha do Builder — só a
 * forma como o texto já resolvido é apresentado neste campo.
 *
 * Cada bloco é uma função pura `(character) => string | null` (`null`
 * = ainda não adquirida no nível atual) — quando uma característica
 * evolui (Fúria no 15, Golpe Brutal no 13/17), a MESMA função resolve
 * o texto certo para o nível atual; nunca duas versões impressas ao
 * mesmo tempo. A posição no texto final é fixa pelo nível de
 * AQUISIÇÃO (não pelo nível atual), para a ordem não "pular" quando o
 * texto de uma característica já adquirida muda de conteúdo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

interface PrintedBlock {
  /** Nível de aquisição — só ordenação; não é impresso (decisão §19: "não imprimir o número do nível antes de cada característica"). */
  acquisitionLevel: number;
  getText: (character: Character) => string | null;
}

const FURIA: PrintedBlock = {
  acquisitionLevel: 1,
  getText: (character) => {
    if (character.classId !== "barbaro" || character.level < 1) return null;
    const uses = getRageCount(character) ?? 0;
    const damage = getRageDamageBonus(character) ?? 2; // {DanoFúria}
    const header = `#Fúria ${checkboxes(uses)}`;
    const core = `AB, Res Conc/Cort/Perf; +${damage} de dano\nVant testes/Salv`;
    if (character.level >= 15) {
      return [header, core, "Dura 10 min; termina Inconsciente ou Arm Pesada", "+1 uso/DC, todos/DL", "> [__] Inic: recupere todos os usos, 1/DL"].join(
        "\n",
      );
    }
    return [header, core, "Até fim do próx turno; estende se: Atacar, forçar Salv ou usar AB; máx de 10 min", "+1 uso/DC, todos/DL"].join("\n");
  },
};

const ATAQUE_IMPRUDENTE: PrintedBlock = {
  acquisitionLevel: 2,
  getText: (character) => (character.level >= 2 ? "#Ataque Imprudente\nVant em atqs para e contra você" : null),
};

const SENTIDO_DE_PERIGO: PrintedBlock = {
  acquisitionLevel: 2,
  getText: (character) => (character.level >= 2 ? "#Sentido de Perigo\nVant em Salv DEX, exceto Incapacitado" : null),
};

const CONHECIMENTO_PRIMORDIAL: PrintedBlock = {
  acquisitionLevel: 3,
  getText: (character) => (character.level >= 3 ? "#Conhecimento Primordial\nFúria: Acro, Furt, Int, Perc e Sobr usam FOR" : null),
};

const ATAQUE_EXTRA: PrintedBlock = {
  acquisitionLevel: 5,
  getText: (character) => (character.level >= 5 ? "#Ataque Extra" : null),
};

const BOTE_INSTINTIVO: PrintedBlock = {
  acquisitionLevel: 7,
  getText: (character) => (character.level >= 7 ? "#Bote Instintivo\nEntrar em Fúria: mova até ½ Desl" : null),
};

const INSTINTOS_PRIMITIVOS: PrintedBlock = {
  acquisitionLevel: 7,
  getText: (character) => (character.level >= 7 ? "#Instintos Primitivos\nVant em Inic" : null),
};

const GOLPE_BRUTAL_EFFECTS = [
  "> Debilitador: Desl -4,5m",
  "> Poderoso: empurra 4,5m; mova ½ Desl até alvo sem Atq Oport",
  "> Atordoante: Desv na próx Salv; sem Atq Oport",
  "> Destruidor: próx Atq de outra criatura contra alvo +5",
];

const GOLPE_BRUTAL: PrintedBlock = {
  acquisitionLevel: 9,
  getText: (character) => {
    if (character.level < 9) return null;
    const dice = character.level >= 17 ? "+2d10 e escolha 2" : "+1d10 e escolha";
    const effects = character.level >= 13 ? GOLPE_BRUTAL_EFFECTS : GOLPE_BRUTAL_EFFECTS.slice(0, 2);
    return ["#Golpe Brutal", `Atq Imprudente: abra mão da Vant em 1 Atq FOR; acerto ${dice}:`, ...effects].join("\n");
  },
};

const FURIA_IMPLACAVEL: PrintedBlock = {
  acquisitionLevel: 11,
  getText: (character) =>
    character.level >= 11 ? "#Fúria Implacável\nFúria, 0 PV: Salv CON CD10; sucesso PV = 2× nível\nNovo uso: CD +5; DC/DL: CD10" : null,
};

const FORCA_INDOMAVEL: PrintedBlock = {
  acquisitionLevel: 18,
  getText: (character) => (character.level >= 18 ? "#Força Indomável\nTeste/Salv FOR < FOR: use FOR" : null),
};

const BASE_CLASS_BLOCKS: PrintedBlock[] = [
  FURIA,
  ATAQUE_IMPRUDENTE,
  SENTIDO_DE_PERIGO,
  CONHECIMENTO_PRIMORDIAL,
  ATAQUE_EXTRA,
  BOTE_INSTINTIVO,
  INSTINTOS_PRIMITIVOS,
  GOLPE_BRUTAL,
  FURIA_IMPLACAVEL,
  FORCA_INDOMAVEL,
];

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do
 * Bárbaro já adquiridos no nível atual — classe + subclasse
 * entrelaçadas pelo nível (`Array.prototype.sort` é estável: em caso
 * de empate, a ordem de declaração é preservada, então "Conhecimento
 * Primordial" sempre vem antes do bloco da subclasse no nível 3).
 */
export function getBarbarianPrintedBlocks(character: Character): string[] {
  if (character.classId !== "barbaro") return [];

  const classBlocks = BASE_CLASS_BLOCKS.map((block) => ({ level: block.acquisitionLevel, text: block.getText(character) })).filter(
    (b): b is { level: number; text: string } => b.text !== null,
  );
  const subclassBlocks = getBarbarianSubclassPrintedBlocks(character);

  return [...classBlocks, ...subclassBlocks]
    .sort((a, b) => a.level - b.level)
    .map((b) => b.text);
}
