import type { AutoTextEntry, Character } from "../domain/character.js";

/**
 * Texto automático de "Lições dos Grandes Antigos" para a área de
 * Talentos — cada cópia desta invocação concede 1 Talento de Origem
 * diferente (fonte "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E
 * SUBCLASSES" §17); sem catálogo de talentos gerais no projeto
 * (`data/features/feats.ts` continua vazio por decisão já aprovada), o
 * nome do talento é a `subChoice` em texto livre da invocação — nunca
 * imprimida em "Características de Classe" porque já fica
 * adequadamente representada aqui.
 */
export function getWarlockLessonsOfTheOldOnesTalentEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "bruxo") return [];
  const lessons = character.chosenInvocations.filter((chosen) => chosen.invocationId === "licoes-dos-grandes-antigos" && chosen.subChoice.trim() !== "");
  if (lessons.length === 0) return [];

  const names = lessons.map((chosen) => chosen.subChoice.trim()).join("; ");
  return [{ text: `Lições dos Grandes Antigos: ${names}`, source: "class" }];
}
