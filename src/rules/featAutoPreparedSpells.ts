import type { Character, SpellPreparedEntry } from "../domain/character.js";
import {
  INICIADO_EM_MAGIA_FEAT_ID,
  MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID,
  MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
} from "../data/features/feats.js";
import { getFeatAcquisitions, getFeatChoiceId, getMagicInitiateList } from "./feats.js";

/**
 * Truques e magia de 1º círculo de Iniciado em Magia — sempre
 * preparados, fora do limite normal de Magias Preparadas da classe
 * (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF" §9: "não
 * consome o limite de magias preparadas da classe"), independente de o
 * personagem ter ou não conjuração de classe — igual a
 * `getSpeciesGrantedSpells`, a única outra fonte não ligada a classe.
 * Cada aquisição (Antecedente OU ASI, possivelmente repetida com listas
 * diferentes) contribui suas PRÓPRIAS 3 entradas, nunca fundidas com as
 * de outra aquisição — sem catálogo de magias no projeto, os nomes vêm
 * direto do texto digitado pelo jogador (`manualText`), nunca
 * inventados; uma entrada só aparece quando o campo já foi preenchido.
 */
export function getFeatAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  const entries: SpellPreparedEntry[] = [];

  for (const acquisition of getFeatAcquisitions(character)) {
    if (acquisition.featId !== INICIADO_EM_MAGIA_FEAT_ID) continue;

    const list = getMagicInitiateList(character, acquisition.acquisitionKey);
    if (!list) continue;
    const notes = `Sempre preparada — Iniciado em Magia (${list})`;

    for (const baseId of [MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID, MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID, MAGIC_INITIATE_SPELL_CHOICE_BASE_ID]) {
      const selection = character.featureChoiceSelections[getFeatChoiceId(baseId, acquisition.acquisitionKey)]?.value;
      const name = typeof selection === "string" ? selection.trim() : "";
      if (name) {
        entries.push({ circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes });
      }
    }
  }

  return entries;
}
