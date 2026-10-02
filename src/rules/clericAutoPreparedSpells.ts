import type { Character, SpellPreparedEntry } from "../domain/character.js";
import { ORDEM_DIVINA_CHOICE_ID, TAUMATURGO_TRUQUE_CHOICE_ID } from "../data/features/cleric.js";

/**
 * Magias concedidas automaticamente ao Clérigo — pelas 4 subclasses
 * (Magias de Domínio sempre preparadas por nível) e pelo Truque extra
 * de Taumaturgo (Ordem Divina). Vão para a área de Magias do PDF
 * (`spellsPrepared`), nunca para "Características de Classe" — por
 * isso ficam de fora de `rules/clericPrintedFeatures.ts`/
 * `clericSubclassPrintedFeatures.ts` (fonte "INTEGRAÇÃO COMPLETA —
 * CLÉRIGO E SUBCLASSES").
 *
 * Círculo real de cada magia não foi fornecido pela fonte — não
 * inventado; fica em branco, com a origem/condições registradas em
 * `notes` (mesmo padrão de `rules/warlockAutoPreparedSpells.ts`).
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const DOMAIN_SPELLS_BY_LEVEL: Record<string, { level: number; names: string[] }[]> = {
  "Domínio da Guerra": [
    { level: 3, names: ["Arma Espiritual", "Arma Mágica", "Escudo da Fé", "Raio Guia"] },
    { level: 5, names: ["Guardiões Espirituais", "Manto do Cruzado"] },
    { level: 7, names: ["Escudo Ardente", "Movimentação Livre"] },
    { level: 9, names: ["Golpe de Arço", "Paralisar Monstro"] },
  ],
  "Domínio da Luz": [
    { level: 3, names: ["Fogo das Fadas", "Mãos Ardentes", "Raio Ardente", "Ver o Invisível"] },
    { level: 5, names: ["Bola de Fogo", "Luz do Dia"] },
    { level: 7, names: ["Muralha de Fogo", "Olho Arcano"] },
    { level: 9, names: ["Coluna de Chamas", "Vidência"] },
  ],
  "Domínio da Trapaça": [
    { level: 3, names: ["Disfarçar-se", "Enfeitiçar Pessoa", "Invisibilidade", "Passo Sem Rastro"] },
    { level: 5, names: ["Indetectável", "Padrão Hipnótico"] },
    { level: 7, names: ["Confusão", "Porta Dimensional"] },
    { level: 9, names: ["Dominar Pessoa", "Modificar Memória"] },
  ],
  "Domínio da Vida": [
    { level: 3, names: ["Auxílio", "Bênção", "Curar Ferimentos", "Restauração Menor"] },
    { level: 5, names: ["Palavra Curativa em Massa", "Revivificar"] },
    { level: 7, names: ["Aura de Vida", "Proteção Contra a Morte"] },
    { level: 9, names: ["Curar Ferimentos em Massa", "Restauração Maior"] },
  ],
};

export function getClericAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "clerigo") return [];

  const entries: SpellPreparedEntry[] = [];

  const domainSpells = character.subclassId ? DOMAIN_SPELLS_BY_LEVEL[character.subclassId] : undefined;
  if (domainSpells) {
    for (const tier of domainSpells) {
      if (character.level < tier.level) continue;
      for (const name of tier.names) {
        entries.push(autoEntry(name, `Sempre preparada — ${character.subclassId}`));
      }
    }
  }

  const thaumaturgeCantrip = character.featureChoiceSelections[TAUMATURGO_TRUQUE_CHOICE_ID]?.value;
  if (
    character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID]?.value === "Taumaturgo" &&
    typeof thaumaturgeCantrip === "string" &&
    thaumaturgeCantrip.trim().length > 0
  ) {
    entries.push(autoEntry(thaumaturgeCantrip.trim(), "Sempre preparado — Ordem Divina (Taumaturgo); Truque extra de Clérigo"));
  }

  return entries;
}
