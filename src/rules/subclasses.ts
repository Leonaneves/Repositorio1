import type { ClassId } from "../domain/ids.js";
import { subclasses, type SubclassDefinition } from "../data/subclasses.js";

/** Lista de subclasses disponíveis para a classe informada. */
export function getAvailableSubclasses(classId: ClassId): SubclassDefinition[] {
  return subclasses[classId];
}
