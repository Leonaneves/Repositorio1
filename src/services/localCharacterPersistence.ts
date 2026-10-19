import type { Character } from "../domain/character.js";

/**
 * Persistência local do personagem em edição — fonte "IMPLEMENTAR A
 * BASE DE DADOS PARA FUTURAS RECOMENDAÇÕES" §5. Só o NAVEGADOR deste
 * dispositivo (`localStorage`) — nunca cria conta, nunca promete
 * recuperar o personagem em outro dispositivo/navegador (isso exigiria
 * um backend com identidade de usuário, fora do escopo desta etapa).
 *
 * Versionado por `SCHEMA_VERSION`: um payload de outra versão é tratado
 * como ausente (nunca uma tentativa de migração parcial — não existe
 * versão anterior a migrar nesta etapa). Toda leitura é defensiva —
 * `loadStoredCharacter` NUNCA lança, mesmo com JSON inválido, campos
 * faltando, tipos trocados ou `localStorage` indisponível (modo
 * privado, cookies bloqueados, ambiente sem `window`) — um dado local
 * corrompido nunca pode quebrar a abertura do Builder, só faz o
 * personagem começar em branco de novo.
 */

const STORAGE_KEY = "ficha-dnd:character";
const SCHEMA_VERSION = 1;

export interface StoredCharacterPayload {
  schemaVersion: number;
  character: Character;
  /** Ver `services/buildConfirmation.ts` — persistido junto do personagem para que recarregar a página não desfaça uma confirmação já registrada sem nenhuma mudança real nas escolhas. */
  confirmedBuildSnapshot: string | null;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    // Alguns navegadores lançam só ao ACESSAR `localStorage` (modo privado/cookies bloqueados) — nunca propaga.
    return null;
  }
}

const ABILITY_KEYS_FOR_VALIDATION = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const;

/**
 * Checagem estrutural LEVE — não valida campo a campo todo o tipo
 * `Character` (grande demais para compensar escrever/manter à mão sem
 * uma biblioteca de schema, que o projeto não usa em nenhum outro
 * lugar); só o suficiente para nunca deixar passar algo que quebraria
 * o Builder ao ler os campos mais lidos logo na abertura
 * (`abilities`/`asiSelections`/`featureChoiceSelections`).
 */
function isValidCharacter(value: unknown): value is Character {
  if (typeof value !== "object" || value === null) return false;
  const character = value as Record<string, unknown>;
  if (typeof character.id !== "string" || character.id.length === 0) return false;
  if (typeof character.level !== "number") return false;
  if (typeof character.abilities !== "object" || character.abilities === null) return false;
  const abilities = character.abilities as Record<string, unknown>;
  for (const key of ABILITY_KEYS_FOR_VALIDATION) {
    const ability = abilities[key];
    if (typeof ability !== "object" || ability === null || typeof (ability as { score?: unknown }).score !== "number") return false;
  }
  if (typeof character.featureChoiceSelections !== "object" || character.featureChoiceSelections === null) return false;
  if (typeof character.asiSelections !== "object" || character.asiSelections === null) return false;
  return true;
}

function isValidPayload(value: unknown): value is StoredCharacterPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  if (payload.schemaVersion !== SCHEMA_VERSION) return false;
  if (!isValidCharacter(payload.character)) return false;
  if (payload.confirmedBuildSnapshot !== null && typeof payload.confirmedBuildSnapshot !== "string") return false;
  return true;
}

/** `null` sem dado local, com dado corrompido/de outra versão/outra forma, ou sem acesso a `localStorage` — nunca lança. */
export function loadStoredCharacter(): StoredCharacterPayload | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Nunca lança (quota excedida, modo privado etc.) — uma falha aqui só significa que o personagem não sobrevive a um recarregamento, nunca impede continuar editando nem exportar o PDF. */
export function saveStoredCharacter(character: Character, confirmedBuildSnapshot: string | null): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    const payload: StoredCharacterPayload = { schemaVersion: SCHEMA_VERSION, character, confirmedBuildSnapshot };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Silencioso de propósito — ver docstring do módulo.
  }
}
