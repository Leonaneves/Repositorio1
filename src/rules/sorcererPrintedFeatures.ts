import type { Character } from "../domain/character.js";
import { getSorceryPoints, getSorceryPointRecovery } from "./sorceryPoints.js";
import { getKnownMetamagicOptions } from "./metamagic.js";
import { getSorcererSubclassPrintedBlocks } from "./sorcererSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Feiticeiro ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte
 * "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES".
 * Representação SEPARADA da regra estruturada completa
 * (`data/features/sorcerer.ts` + `rules/classResources.ts` +
 * `rules/sorceryPoints.ts`): nunca usada para cálculo, só montada a
 * partir dela.
 *
 * "Feitiçaria Inata" recebe as atualizações de Feitiçaria Encarnada
 * (nível 7) e Apoteose Arcana (nível 20) no MESMO bloco, nunca
 * separados. "Fonte de Magia" recebe Restauração Feiticeira (nível 5)
 * no mesmo bloco. "Metamagia" só imprime as opções conhecidas, num
 * único bloco (`> ...` por opção). Pontos de Feitiçaria (PF) nunca
 * geram um checkbox por ponto — aparecem como contador
 * "PF: ___/{PFMax}", com o máximo resolvido numericamente.
 *
 * Nunca aparecem aqui (ficam em Proficiências/PV/CA/Resistências/
 * Deslocamento/Magias ou no sistema de Talentos/ASI): Conjuração,
 * Subclasse de Feiticeiro, Aumento no Valor de Atributo, Dádiva Épica,
 * Resiliência Dracônica (motor apenas), Feitiçaria Psiônica/
 * Companheiro Dracônico (notas nas próprias magias) e as listas de
 * Magias das 4 subclasses.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

const INNATE_SORCERY_USES = 2;

function getInnateSorceryText(character: Character): string | null {
  if (character.level < 1) return null;

  const lines = [`#Feitiçaria Inata ${checkboxes(INNATE_SORCERY_USES)}`, "AB, 1 min: CD magia +1; Vant Atq magia"];

  if (character.level >= 7) {
    lines.push("Sem usos: 2PF -> ativar");
    lines.push(character.level >= 20 ? "Ativa: até 2 Meta por magia; 1 Meta/turno = 0 PF" : "Ativa: até 2 Meta por magia");
  }

  lines.push("Todos/DL");
  return lines.join("\n");
}

function getSorcerousRestorationLine(character: Character): string | null {
  const recovery = getSorceryPointRecovery(character);
  if (recovery === null) return null;
  return `> [__] DC: recupere até ${recovery} PF. 1/DL`;
}

function getFontOfMagicText(character: Character): string | null {
  if (character.level < 2) return null;

  const pfMax = getSorceryPoints(character) ?? 0;
  const lines = [
    "#Fonte de Magia",
    `PF: ___/${pfMax}; todos/DL`,
    "Espaço -> PF = círculo",
    "AB, PF -> espaço: 1o=2, 2o=3, 3o=5, 4o=6, 5o=7; conforme Nv",
    "Espaços criados somem/DL",
  ];

  const restorationLine = getSorcerousRestorationLine(character);
  if (restorationLine) lines.push(restorationLine);

  return lines.join("\n");
}

function getMetamagicText(character: Character): string | null {
  const known = getKnownMetamagicOptions(character);
  if (known.length === 0) return null;
  return ["#Metamagia", ...known.map((option) => option.printedLine)].join("\n");
}

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do
 * Feiticeiro já adquiridos no nível atual — classe + subclasse
 * entrelaçadas pelo nível, mesmo padrão de
 * `rules/druidPrintedFeatures.ts`.
 */
export function getSorcererPrintedBlocks(character: Character): string[] {
  if (character.classId !== "feiticeiro") return [];

  const blocks: { level: number; text: string }[] = [];

  const innateSorcery = getInnateSorceryText(character);
  if (innateSorcery) blocks.push({ level: 1, text: innateSorcery });

  const fontOfMagic = getFontOfMagicText(character);
  if (fontOfMagic) blocks.push({ level: 2, text: fontOfMagic });

  const metamagic = getMetamagicText(character);
  if (metamagic) blocks.push({ level: 2, text: metamagic });

  blocks.push(...getSorcererSubclassPrintedBlocks(character));

  return blocks.sort((a, b) => a.level - b.level).map((b) => b.text);
}
