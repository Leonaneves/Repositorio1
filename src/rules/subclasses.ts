import type { ClassId } from "../domain/ids.js";
import { subclasses, type SubclassDefinition } from "../data/subclasses.js";

/** Lista de subclasses disponíveis para a classe informada. */
export function getAvailableSubclasses(classId: ClassId): SubclassDefinition[] {
  return subclasses[classId];
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
