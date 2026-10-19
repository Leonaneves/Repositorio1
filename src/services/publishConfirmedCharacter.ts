import type { Character } from "../domain/character.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../repositories/CharacterBuildRepository.js";
import { getCharacterBuildRepository } from "../repositories/index.js";
import { mapCharacterToBuild } from "./mapCharacterToBuild.js";

/** UUID v4 para o id da versão (a coluna `build_id` é `uuid`) — `crypto.randomUUID` quando existe, senão `getRandomValues`. */
export function generateBuildVersionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Registra o personagem ATUAL como uma NOVA versão confirmada nas
 * estatísticas da comunidade (fonte "CONFIRMAR PERSONAGENS SEM ALTERAR
 * OS ANTERIORES"): sempre um registro novo (`buildId` novo, mesmo
 * `characterId`), nunca uma atualização — personagens e versões
 * anteriores ficam intactos, e as estatísticas contam só a versão mais
 * recente de cada personagem. É a ÚNICA gravação do app: rascunhos
 * nunca saem do navegador.
 *
 * Rejeita se a gravação falhar — a Revisão mostra o erro e só marca o
 * personagem como confirmado (`characterStore.confirmCharacter`) depois
 * do sucesso, para nunca exibir "Confirmado" sem o registro existir.
 */
export async function publishConfirmedCharacter(
  character: Character,
  repository: CharacterBuildRepository = getCharacterBuildRepository(),
): Promise<CharacterBuild> {
  const build: CharacterBuild = { ...mapCharacterToBuild(character), buildId: generateBuildVersionId(), status: "confirmed" };
  await repository.insertConfirmed(build);
  return build;
}
