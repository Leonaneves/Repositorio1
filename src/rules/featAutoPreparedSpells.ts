import type { Character, SpellPreparedEntry } from "../domain/character.js";
import {
  INICIADO_EM_MAGIA_FEAT_ID,
  MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID,
  MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
  TELECINETICO_FEAT_ID,
  TELEPATICO_FEAT_ID,
  TOCADO_PELAS_SOMBRAS_FEAT_ID,
  TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID,
  TOCADO_POR_FADAS_FEAT_ID,
  TOCADO_POR_FADAS_SPELL_CHOICE_ID,
} from "../data/features/feats.js";
import { getFeatAbilityIncreaseChoice, getFeatAcquisitions, getFeatChoiceId, getMagicInitiateList } from "./feats.js";

/**
 * Truques/magias sempre preparados concedidos por Talento, fora do
 * limite normal de Magias Preparadas da classe, independente de o
 * personagem ter ou não conjuração de classe — igual a
 * `getSpeciesGrantedSpells`, a única outra fonte não ligada a classe.
 *
 * Iniciado em Magia (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E
 * NO PDF" §9): cada aquisição (Antecedente OU ASI, possivelmente
 * repetida com listas diferentes) contribui suas PRÓPRIAS entradas,
 * nunca fundidas com as de outra aquisição.
 *
 * Telecinético/Telepático/Tocado Pelas Sombras/Tocado Por Fadas (fonte
 * "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §23/§24/§25/§26):
 * nomes FIXOS (Mãos Mágicas, Detectar Pensamentos, Invisibilidade, Passo
 * Nebuloso — nunca texto manual, ao contrário de Iniciado em Magia, que
 * não tem catálogo), mais 1 magia escolhida pelo jogador nos dois
 * últimos (catálogo pendente — `manualText`). Cada entrada usa o
 * atributo ESCOLHIDO NESSA AQUISIÇÃO (`getFeatAbilityIncreaseChoice`,
 * nunca o de conjuração de classe) só para fins de registro — a nota
 * nunca repete o marcador `[__]/DL` (fica só no texto de Talentos,
 * `rules/featTalentEntries.ts`, fonte: "Nos usos gratuitos de magias,
 * imprimir somente nome, marcadores e recuperação" — mesmo padrão já
 * usado para Iniciado em Magia abaixo, cuja nota também nunca leva
 * marcador).
 */
export function getFeatAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  const entries: SpellPreparedEntry[] = [];

  for (const acquisition of getFeatAcquisitions(character)) {
    if (acquisition.featId === INICIADO_EM_MAGIA_FEAT_ID) {
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
      continue;
    }

    if (acquisition.featId === TELECINETICO_FEAT_ID) {
      if (!getFeatAbilityIncreaseChoice(character, acquisition)) continue;
      entries.push({ circle: "", name: "Mãos Mágicas", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "Sempre preparada — Telecinético" });
      continue;
    }

    if (acquisition.featId === TELEPATICO_FEAT_ID) {
      if (!getFeatAbilityIncreaseChoice(character, acquisition)) continue;
      entries.push({ circle: "", name: "Detectar Pensamentos", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "Sempre preparada — Telepático" });
      continue;
    }

    if (acquisition.featId === TOCADO_PELAS_SOMBRAS_FEAT_ID) {
      if (!getFeatAbilityIncreaseChoice(character, acquisition)) continue;
      const notes = "Sempre preparada — Tocado Pelas Sombras";
      entries.push({ circle: "", name: "Invisibilidade", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes });
      const chosen = character.featureChoiceSelections[getFeatChoiceId(TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID, acquisition.acquisitionKey)]?.value;
      const chosenName = typeof chosen === "string" ? chosen.trim() : "";
      if (chosenName) entries.push({ circle: "", name: chosenName, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes });
      continue;
    }

    if (acquisition.featId === TOCADO_POR_FADAS_FEAT_ID) {
      if (!getFeatAbilityIncreaseChoice(character, acquisition)) continue;
      const notes = "Sempre preparada — Tocado Por Fadas";
      entries.push({ circle: "", name: "Passo Nebuloso", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes });
      const chosen = character.featureChoiceSelections[getFeatChoiceId(TOCADO_POR_FADAS_SPELL_CHOICE_ID, acquisition.acquisitionKey)]?.value;
      const chosenName = typeof chosen === "string" ? chosen.trim() : "";
      if (chosenName) entries.push({ circle: "", name: chosenName, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes });
      continue;
    }
  }

  return entries;
}
