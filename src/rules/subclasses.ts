import type { ClassId } from "../domain/ids.js";
import { subclasses, type SubclassDefinition } from "../data/subclasses.js";

/** Lista de subclasses disponíveis para a classe informada. */
export function getAvailableSubclasses(classId: ClassId): SubclassDefinition[] {
  return subclasses[classId];
}

/**
 * Nome de EXIBIÇÃO de uma subclasse já escolhida — resolve `fullName`
 * (o valor interno armazenado em `character.subclassId`, nunca
 * alterado por uma correção de nome, para preservar compatibilidade
 * com personagens já salvos) de volta ao `shortName` correspondente no
 * catálogo (fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO
 * PDF" §1 — mesma necessidade por trás da correção "Mestre da
 * Batalha"/"Mestre de Batalha", mas agora propagada também à Revisão,
 * ao PDF e à apresentação de personagens salvos, nunca só aos
 * seletores). Devolve o próprio `fullName` quando não há diferença
 * (todas as demais subclasses hoje) ou quando `classId`/`fullName` não
 * casam com nenhuma entrada — nunca lança erro, nunca esconde o nome.
 */
export function getSubclassDisplayName(classId: ClassId | null, fullName: string | null): string | null {
  if (!classId || !fullName) return fullName;
  const match = subclasses[classId].find((s) => s.fullName === fullName);
  return match ? match.shortName : fullName;
}

/**
 * Nível mínimo em que a escolha de subclasse aparece — regra fixa para
 * TODAS as classes no D&D 2024 (aprovado; substitui qualquer variação
 * por classe). Níveis 1–2: sem etapa/escolha de subclasse.
 */
export const SUBCLASS_LEVEL = 3;

/** Se a escolha de subclasse já está disponível no nível do personagem. */
export function canChooseSubclass(level: number): boolean {
  return level >= SUBCLASS_LEVEL;
}
