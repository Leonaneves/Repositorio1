import type { Character, ChosenInvocation } from "../domain/character.js";
import type { InvocationDefinition } from "../domain/invocations.js";
import { warlockInvocations, warlockInvocationsById } from "../data/invocations.js";
import { getInvocationsKnown } from "./classResources.js";

/**
 * Elegibilidade/repetibilidade/dependências das Invocações Místicas do
 * Bruxo — fonte "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E
 * SUBCLASSES" §5/§6/§7. Modelo PRÓPRIO, separado do `FeatureChoice`
 * genérico (`rules/features.ts`): a elegibilidade cruzada entre
 * invocações/Pactos/nível não cabe em "uma escolha, N opções fixas".
 */

function hasInvocation(character: Character, invocationId: string): boolean {
  return character.chosenInvocations.some((chosen) => chosen.invocationId === invocationId);
}

/** Se a invocação é elegível para o personagem AGORA (nível + pré-requisito de outra invocação) — nunca considera se ela já foi escolhida. */
export function isInvocationEligible(character: Character, invocation: InvocationDefinition): boolean {
  const { minLevel, requiresInvocationId } = invocation.prerequisite;
  if (minLevel !== undefined && character.level < minLevel) return false;
  if (requiresInvocationId !== undefined && !hasInvocation(character, requiresInvocationId)) return false;
  return true;
}

/** Todas as invocações elegíveis para o nível/escolhas atuais do personagem (Bruxo only). */
export function getEligibleInvocations(character: Character): InvocationDefinition[] {
  if (character.classId !== "bruxo") return [];
  return warlockInvocations.filter((invocation) => isInvocationEligible(character, invocation));
}

/** Elegíveis E ainda escolhíveis — repetíveis sempre; não repetíveis só se ainda não escolhidas. */
export function getSelectableInvocations(character: Character): InvocationDefinition[] {
  return getEligibleInvocations(character).filter((invocation) => invocation.repeatable || !hasInvocation(character, invocation.id));
}

export interface InvalidChosenInvocation {
  index: number;
  chosen: ChosenInvocation;
  reason: string;
}

/**
 * Invocações já escolhidas que ficaram em estado inválido — pré-
 * requisito quebrado (nível caiu, ou a invocação-pré-requisito foi
 * removida), id desconhecido, sub-escolha obrigatória vazia, ou 2
 * cópias repetíveis apontando para a MESMA sub-escolha. Nunca removida
 * silenciosamente (fonte §5) — o Builder exige correção explícita.
 */
export function getInvalidChosenInvocations(character: Character): InvalidChosenInvocation[] {
  const invalid: InvalidChosenInvocation[] = [];
  const seenSubChoicePerInvocation = new Map<string, Set<string>>();

  character.chosenInvocations.forEach((chosen, index) => {
    const definition = warlockInvocationsById[chosen.invocationId];
    if (!definition) {
      invalid.push({ index, chosen, reason: "Invocação desconhecida." });
      return;
    }
    if (!isInvocationEligible(character, definition)) {
      invalid.push({ index, chosen, reason: "Pré-requisito deixou de ser atendido (nível ou outra invocação removida)." });
      return;
    }
    if (definition.subChoice?.required && chosen.subChoice.trim() === "") {
      invalid.push({ index, chosen, reason: `Falta preencher: ${definition.subChoice.label}.` });
      return;
    }
    if (definition.repeatable && chosen.subChoice.trim() !== "") {
      const seen = seenSubChoicePerInvocation.get(definition.id) ?? new Set<string>();
      if (seen.has(chosen.subChoice.trim().toLowerCase())) {
        invalid.push({ index, chosen, reason: "Mesma sub-escolha repetida em 2 cópias desta invocação — precisa ser diferente em cada uma." });
      }
      seen.add(chosen.subChoice.trim().toLowerCase());
      seenSubChoicePerInvocation.set(definition.id, seen);
    }
  });

  return invalid;
}

/**
 * Se a etapa "Invocações Místicas" do Builder já está resolvida: nem
 * mais nem menos que a quantidade do nível atual (rules/classResources.ts#getInvocationsKnown),
 * e nenhuma escolhida em estado inválido.
 */
export function isInvocationSelectionComplete(character: Character): boolean {
  if (character.classId !== "bruxo") return true;
  const known = getInvocationsKnown(character) ?? 0;
  return character.chosenInvocations.length === known && getInvalidChosenInvocations(character).length === 0;
}
