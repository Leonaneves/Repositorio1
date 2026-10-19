import type { Character } from "../domain/character.js";
import { mapCharacterToBuild } from "./mapCharacterToBuild.js";

/**
 * "Confirmar o personagem" (fonte "IMPLEMENTAR A BASE DE DADOS PARA
 * FUTURAS RECOMENDAÇÕES" §4) é uma ação explícita na Revisão, nunca
 * presumida só por não haver mais pendências. O que fica registrado
 * (`state/characterStore.ts#confirmedBuildSnapshot`) não é um booleano
 * solto: é uma serialização ESTÁVEL das escolhas estruturadas do
 * personagem no momento da confirmação — assim, qualquer mudança
 * posterior a uma escolha relevante (classe, atributos, talentos etc.)
 * muda essa serialização, e a Revisão volta a oferecer "Confirmar"
 * (que grava uma NOVA versão — `services/publishConfirmedCharacter.ts`)
 * — nunca um booleano que ficaria "preso" em `true` mesmo depois de uma
 * edição.
 *
 * `buildId` entra na serialização (via `mapCharacterToBuild`), então
 * trocar de personagem (`resetCharacter`, novo id) invalida sozinho
 * qualquer confirmação anterior, mesmo sem limpeza explícita — o novo
 * personagem nunca "herda" a confirmação de outro.
 */

const VOLATILE_BUILD_FIELDS = ["updatedAt", "origin", "status"] as const;

/** Serialização estável das escolhas relevantes de um personagem — nunca persistida como está, só usada para comparação. */
function relevantChoicesSnapshot(character: Character): string {
  const build = mapCharacterToBuild(character, "");
  const relevant: Record<string, unknown> = { ...build };
  for (const field of VOLATILE_BUILD_FIELDS) delete relevant[field];
  return JSON.stringify(relevant);
}

/** Captura o snapshot a ser gravado no momento da confirmação — ver `state/characterStore.ts#confirmCharacter`. */
export function captureConfirmationSnapshot(character: Character): string {
  return relevantChoicesSnapshot(character);
}

/** Se o personagem ATUAL ainda corresponde exatamente ao que foi confirmado — `false` sem nenhuma confirmação registrada (`null`) ou após qualquer mudança relevante desde então. */
export function isConfirmationStillValid(character: Character, confirmedSnapshot: string | null): boolean {
  if (confirmedSnapshot === null) return false;
  return relevantChoicesSnapshot(character) === confirmedSnapshot;
}
