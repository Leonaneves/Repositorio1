import type { Character, SpellPreparedEntry } from "../domain/character.js";
import { getBarbarianRitualSpells } from "./barbarianRitualSpells.js";
import { getBardAutoPreparedSpells } from "./bardAutoPreparedSpells.js";
import { getClericAutoPreparedSpells } from "./clericAutoPreparedSpells.js";
import { getDruidAutoPreparedSpells } from "./druidAutoPreparedSpells.js";
import { getSorcererAutoPreparedSpells } from "./sorcererAutoPreparedSpells.js";
import { getWarlockAutoPreparedSpells } from "./warlockAutoPreparedSpells.js";
import { getSpeciesGrantedSpells } from "./speciesLineageSpells.js";

/**
 * Todas as magias concedidas automaticamente por classe/subclasse
 * (Arauto da Fauna/Natureza do Caminho do Coração Selvagem —
 * `getBarbarianRitualSpells`; Magia Fascinante/Manto de Majestade do
 * Colégio do Glamour e Palavras de Criação do Bardo base —
 * `getBardAutoPreparedSpells`; Magias de Domínio das 4 subclasses +
 * Truque extra de Taumaturgo do Clérigo — `getClericAutoPreparedSpells`;
 * Falar com Animais/Convocar Familiar/Magias de Círculo/Mapa Estelar/
 * Truque de Xamã do Druida — `getDruidAutoPreparedSpells`; Magias das 4
 * subclasses de Feiticeiro — `getSorcererAutoPreparedSpells`; magias
 * sempre preparadas dos 4 Patronos + Contatar Patrono + invocações que
 * concedem magia do Bruxo — `getWarlockAutoPreparedSpells`; truque/
 * magias de Linhagem Élfica/Gnômica/Infernal — `getSpeciesGrantedSpells`,
 * a única fonte aqui que não depende de classe, então pode aparecer
 * mesmo num personagem sem conjuração), sem a lista manual do jogador —
 * usada tanto pelo PDF (`pdf/fieldMap.ts`) quanto pela etapa de
 * Conjuração do Builder/Ficha Web, para nunca duplicar a regra em dois
 * lugares.
 */
export function getAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  return [
    ...getBarbarianRitualSpells(character),
    ...getBardAutoPreparedSpells(character),
    ...getClericAutoPreparedSpells(character),
    ...getDruidAutoPreparedSpells(character),
    ...getSorcererAutoPreparedSpells(character),
    ...getWarlockAutoPreparedSpells(character),
    ...getSpeciesGrantedSpells(character),
  ];
}

/**
 * Lista efetiva de magias preparadas: as automáticas primeiro, seguidas
 * da lista manual do jogador (`character.spellsPrepared`). Nunca grava
 * as automáticas de volta no Character — só compõe no momento do uso
 * (PDF ou tela), igual ao padrão já usado para texto automático em
 * `rules/proficiencyText.ts`.
 */
export function getEffectiveSpellsPrepared(character: Character): SpellPreparedEntry[] {
  return [...getAutoPreparedSpells(character), ...character.spellsPrepared];
}
