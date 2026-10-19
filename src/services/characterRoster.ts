import type { Character } from "../domain/character.js";
import { hasGeneratedBaseAbilityScores } from "../rules/abilities.js";
import { getLocalStorage, isValidCharacter, loadStoredCharacter } from "./localCharacterPersistence.js";

/**
 * "Meus personagens" (fonte "CONFIRMAR PERSONAGENS SEM ALTERAR OS
 * ANTERIORES"): vários personagens guardados NESTE navegador
 * (`localStorage`), um deles ativo no Builder/Ficha. Sem conta, sem
 * servidor — trocar de navegador/aparelho ou usar janela anônima não
 * traz a lista junto. Confirmar um personagem continua sendo a única
 * coisa que vai para as estatísticas (`services/publishConfirmedCharacter.ts`);
 * criar, abrir ou excluir personagens aqui nunca altera nada já
 * confirmado.
 *
 * Mesma postura defensiva de `localCharacterPersistence.ts`: leitura
 * nunca lança; entrada inválida é descartada individualmente (nunca
 * derruba a lista inteira); na primeira leitura, o personagem único do
 * formato antigo (`ficha-dnd:character`) vira a primeira entrada.
 */

const ROSTER_KEY = "ficha-dnd:characters";
const ROSTER_SCHEMA_VERSION = 1;

export interface RosterEntry {
  character: Character;
  /** Ver `services/buildConfirmation.ts`. */
  confirmedBuildSnapshot: string | null;
  /** ISO 8601 — quando esta entrada deixou de ser a ativa (ordena a lista, mais recente primeiro). */
  savedAt: string;
}

export interface StoredRoster {
  activeCharacterId: string | null;
  entries: RosterEntry[];
}

function isValidEntry(value: unknown): value is RosterEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (!isValidCharacter(entry.character)) return false;
  if (entry.confirmedBuildSnapshot !== null && typeof entry.confirmedBuildSnapshot !== "string") return false;
  return typeof entry.savedAt === "string";
}

/** `null` sem nada salvo (nem no formato antigo) ou sem acesso a `localStorage` — nunca lança. */
export function loadRoster(): StoredRoster | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed?.schemaVersion === ROSTER_SCHEMA_VERSION && Array.isArray(parsed.entries)) {
        const entries = parsed.entries.filter(isValidEntry);
        const activeCharacterId = typeof parsed.activeCharacterId === "string" ? parsed.activeCharacterId : null;
        return { activeCharacterId, entries };
      }
    }
  } catch {
    // Dado corrompido: cai para o formato antigo/vazio abaixo.
  }
  const legacy = loadStoredCharacter();
  if (!legacy) return null;
  return {
    activeCharacterId: legacy.character.id,
    entries: [{ character: legacy.character, confirmedBuildSnapshot: legacy.confirmedBuildSnapshot, savedAt: new Date().toISOString() }],
  };
}

/** Nunca lança (quota excedida, modo privado etc.). */
export function saveRoster(roster: StoredRoster): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(ROSTER_KEY, JSON.stringify({ schemaVersion: ROSTER_SCHEMA_VERSION, ...roster }));
  } catch {
    // Silencioso de propósito — ver docstring do módulo.
  }
}

/**
 * Personagem que o jogador ainda não começou (sem nome, classe, espécie,
 * antecedente nem atributos gerados) — nunca entra na lista ao trocar de
 * personagem, para "Novo personagem" repetido não acumular entradas vazias.
 */
export function isBlankCharacter(character: Character): boolean {
  return (
    character.name.trim() === "" &&
    character.classId === null &&
    character.speciesId === null &&
    character.backgroundId === null &&
    !hasGeneratedBaseAbilityScores(character)
  );
}
