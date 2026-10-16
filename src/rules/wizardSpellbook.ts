import type { Character, SpellPreparedEntry, WizardSpellbookEntry } from "../domain/character.js";
import { SPELL_CIRCLES, type SpellCircle } from "../domain/ids.js";
import { getSpellSlots } from "./spellcasting.js";
import { getSpellsPreparedMax } from "./classResources.js";

/**
 * Livro de Magias do Mago (fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES
 * NO BUILDER E NO PDF" §3) — helpers de validação/derivação sobre
 * `Character.wizardSpellbook`. "Estar no livro" (array inteiro) e
 * "estar preparada" (`entry.prepared`/`isSpellMastery`/
 * `isSignatureSpell`) são conceitos DISTINTOS em todo este arquivo.
 */

/** Maior círculo com ao menos 1 espaço na progressão ATUAL de Mago — usado para filtrar o círculo elegível ao adicionar uma entrada nova (nunca retroativo às já existentes). */
export function getWizardMaxEligibleCircle(character: Character): SpellCircle | null {
  if (character.classId !== "mago") return null;
  const slots = getSpellSlots(character);
  const eligible = SPELL_CIRCLES.filter((circle) => slots[circle] > 0);
  return eligible.length > 0 ? eligible[eligible.length - 1] : null;
}

/**
 * Índices de `wizardSpellbook` com origem "subclassVersado" concedida
 * sob uma subclasse DIFERENTE da atual — sinalizados para revisão do
 * jogador, NUNCA apagados automaticamente (§1: "sinalizar escolhas
 * incompatíveis sem apagar escolhas independentes").
 */
export function getStaleVersadoSpellbookIndices(character: Character): number[] {
  return character.wizardSpellbook
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.origin === "subclassVersado" && entry.grantedUnderSubclass !== character.subclassId)
    .map(({ index }) => index);
}

/** Quantidade de entradas no livro com origem "classProgression" — comparar com `rules/classResources.ts#getWizardSpellbookClassGrantCount` (guia, nunca bloqueio). */
export function getWizardClassProgressionSpellbookCount(character: Character): number {
  return character.wizardSpellbook.filter((entry) => entry.origin === "classProgression").length;
}

/** Quantidade de entradas no livro com origem "subclassVersado" — comparar com `rules/classResources.ts#getWizardVersadoGrantCount` (guia, nunca bloqueio). Conta TODAS, inclusive as desatualizadas (`getStaleVersadoSpellbookIndices`). */
export function getWizardVersadoSpellbookCount(character: Character): number {
  return character.wizardSpellbook.filter((entry) => entry.origin === "subclassVersado").length;
}

/** Quantidade de entradas com `prepared: true` — conta contra `getSpellsPreparedMax` (Maestria/Assinatura ficam FORA deste total, de propósito). */
export function getWizardPreparedCount(character: Character): number {
  return character.wizardSpellbook.filter((entry) => entry.prepared).length;
}

/** `true` se a quantidade preparada já atingiu o máximo da progressão — guia de UI, nunca um bloqueio que impeça salvar. */
export function isWizardPreparedCountAtMax(character: Character): boolean {
  const max = getSpellsPreparedMax(character);
  return max !== null && getWizardPreparedCount(character) >= max;
}

/** Entradas marcadas Maestria de Magias (nível 18, até 2: 1º círculo + 2º círculo). */
export function getWizardSpellMasteryEntries(character: Character): WizardSpellbookEntry[] {
  return character.wizardSpellbook.filter((entry) => entry.isSpellMastery);
}

/** Entradas marcadas Assinatura Mágica (nível 20, até 2, ambas de 3º círculo). */
export function getWizardSignatureSpellEntries(character: Character): WizardSpellbookEntry[] {
  return character.wizardSpellbook.filter((entry) => entry.isSignatureSpell);
}

/**
 * Converte as entradas do livro que devem aparecer na área de Magias
 * (`rules/effectiveSpellsPrepared.ts`) para o formato comum
 * `SpellPreparedEntry` — preparadas normalmente E as de Maestria de
 * Magias/Assinatura Mágica (sempre preparadas, mesmo sem marcar
 * `prepared`). Nunca duplica uma entrada que seja, ao mesmo tempo,
 * preparada E Maestria/Assinatura.
 */
export function getWizardPreparedSpellEntries(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "mago") return [];
  return character.wizardSpellbook
    .filter((entry) => entry.prepared || entry.isSpellMastery || entry.isSignatureSpell)
    .map((entry) => ({
      circle: String(entry.circle),
      name: entry.name,
      castingTime: "",
      range: "",
      concentration: false,
      ritual: false,
      material: false,
      notes: entry.isSpellMastery ? "Maestria de Magias — sem espaço no círculo base" : entry.isSignatureSpell ? "Assinatura Mágica — sem espaço no 3º círculo" : "",
    }));
}
