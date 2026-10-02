import type { Character } from "../domain/character.js";
import { getBardicInspirationDie, getBardicInspirationUses } from "./classResources.js";
import { getBardSubclassPrintedBlocks } from "./bardSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Bardo ("Características de Classe",
 * campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte "INTEGRAÇÃO
 * COMPLETA — BARDO E SUBCLASSES". Representação SEPARADA da regra
 * estruturada completa (`data/features/bard.ts` + `rules/classResources.ts`):
 * nunca usada para cálculo, só montada a partir dela (classe/nível/
 * subclasse/CAR/escolhas) — nunca um texto gigante hardcoded por
 * combinação de nível/subclasse.
 *
 * Cada bloco é uma função pura `(character) => string | null` (`null`
 * = ainda não adquirida no nível atual) — quando uma característica
 * evolui (Inspiração de Bardo no 5 e no 18), a MESMA função resolve o
 * texto certo para o nível atual; nunca duas versões impressas ao mesmo
 * tempo. A posição no texto final é fixa pelo nível de AQUISIÇÃO (não
 * pelo nível atual), para a ordem não "pular" quando o texto de uma
 * característica já adquirida muda de conteúdo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

interface PrintedBlock {
  /** Nível de aquisição — só ordenação; não é impresso. */
  acquisitionLevel: number;
  getText: (character: Character) => string | null;
}

const INSPIRACAO_DE_BARDO: PrintedBlock = {
  acquisitionLevel: 1,
  getText: (character) => {
    if (character.classId !== "bardo" || character.level < 1) return null;
    const die = getBardicInspirationDie(character) ?? 6; // {DadoInsp}
    const uses = getBardicInspirationUses(character) ?? 1; // {UsosInsp}
    const header = `#Inspiração de Bardo d${die} ${checkboxes(uses)}`;
    const core = ["AB, alvo a 18m recebe 1 Insp", "Após falhar Teste d20, soma dado; dura 1h"];
    const recovery = character.level >= 5 ? "Todos/DC/DL; 1 espaço = +1 uso" : "Todos/DL";
    const lines = [header, ...core, recovery];
    if (character.level >= 18) lines.push("> Inic: se tiver <2 usos, recupere até 2");
    return lines.join("\n");
  },
};

const CONTRA_ENCANTAMENTO: PrintedBlock = {
  acquisitionLevel: 7,
  getText: (character) =>
    character.level >= 7 ? "#Contra-Encantamento\nReação: você/aliado a 9m falha Salv contra Amed/Enfeit -> refaz com Vant" : null,
};

const PALAVRAS_DE_CRIACAO: PrintedBlock = {
  acquisitionLevel: 20,
  getText: (character) =>
    character.level >= 20 ? "#Palavras de Criação\nPalavra de Poder: Matar/Salvar pode afetar 2º alvo a 3m do 1º" : null,
};

const BASE_CLASS_BLOCKS: PrintedBlock[] = [INSPIRACAO_DE_BARDO, CONTRA_ENCANTAMENTO, PALAVRAS_DE_CRIACAO];

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do Bardo
 * já adquiridos no nível atual — classe + subclasse entrelaçadas pelo
 * nível (`Array.prototype.sort` é estável: em caso de empate, a ordem
 * de declaração é preservada).
 */
export function getBardPrintedBlocks(character: Character): string[] {
  if (character.classId !== "bardo") return [];

  const classBlocks = BASE_CLASS_BLOCKS.map((block) => ({ level: block.acquisitionLevel, text: block.getText(character) })).filter(
    (b): b is { level: number; text: string } => b.text !== null,
  );
  const subclassBlocks = getBardSubclassPrintedBlocks(character);

  return [...classBlocks, ...subclassBlocks]
    .sort((a, b) => a.level - b.level)
    .map((b) => b.text);
}
