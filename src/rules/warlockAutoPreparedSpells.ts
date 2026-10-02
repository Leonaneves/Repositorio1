import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias concedidas automaticamente ao Bruxo — pelas 4 subclasses
 * (listas sempre preparadas por nível), por Invocações Místicas que
 * concedem uma magia sem espaço, e por Contatar Patrono/Danação
 * Mística/Criar Servo. Vão para a área de Magias do PDF
 * (`spellsPrepared`), nunca para "Características de Classe" — por
 * isso ficam de fora de `rules/warlockPrintedFeatures.ts`/
 * `warlockSubclassPrintedFeatures.ts` (fonte "INTEGRAÇÃO COMPLETA —
 * BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES" §66/§67).
 *
 * Círculo real de cada magia não foi fornecido pela fonte — não
 * inventado; fica em branco, com a origem/condições registradas em
 * `notes` (os únicos campos pedidos pela fonte).
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const PATRON_SPELLS_BY_LEVEL: Record<string, { level: number; names: string[] }[]> = {
  "Patrono Arquifada": [
    { level: 3, names: ["Acalmar Emoções", "Fogo das Fadas", "Força Espectral", "Passo Nebuloso", "Sono"] },
    { level: 5, names: ["Crescimento de Plantas", "Piscar"] },
    { level: 7, names: ["Dominar Fera", "Invisibilidade Maior"] },
    { level: 9, names: ["Dominar Pessoa", "Similaridade"] },
  ],
  "Patrono Celestial": [
    { level: 3, names: ["Auxílio", "Chama Sagrada", "Curar Ferimentos", "Luz", "Raio Guia", "Restauração Menor"] },
    { level: 5, names: ["Luz do Dia", "Revivificar"] },
    { level: 7, names: ["Defensor da Fé", "Muralha de Fogo"] },
    { level: 9, names: ["Convocar Celestial", "Restauração Maior"] },
  ],
  "Patrono Grande Antigo": [
    { level: 3, names: ["Detectar Pensamentos", "Força Espectral", "Gargalhada Nefasta de Tasha", "Sussurros Dissonantes"] },
    { level: 5, names: ["Clarividência", "Fome de Hadar"] },
    { level: 7, names: ["Confusão", "Invocar Aberração"] },
    { level: 9, names: ["Modificar Memória", "Telecinese"] },
  ],
  "Patrono Ínfero": [
    { level: 3, names: ["Comando", "Mãos Flamejantes", "Raio Ardente", "Sugestão"] },
    { level: 5, names: ["Bola de Fogo", "Nuvem Fétida"] },
    { level: 7, names: ["Escudo Ardente", "Muralha de Fogo"] },
    { level: 9, names: ["Missão", "Praga de Insetos"] },
  ],
};

/** Invocações não repetíveis que concedem 1 magia sem gastar espaço — nome da magia + nota (origem/condição especial). */
const SPELL_GRANTING_INVOCATIONS: Record<string, { spellName: string; notes: string }> = {
  "armadura-de-sombras": { spellName: "Armadura Arcana", notes: "Sempre preparada — Armadura de Sombras; alvo: si mesmo; sem espaço" },
  "lamento-das-sepulturas": { spellName: "Falar com Mortos", notes: "Sempre preparada — Lamento das Sepulturas; sem espaço" },
  "mascara-das-muitas-faces": { spellName: "Disfarçar-se", notes: "Sempre preparada — Máscara das Muitas Faces; sem espaço" },
  "mestre-das-infindaveis-formas": { spellName: "Alterar-se", notes: "Sempre preparada — Mestre das Infindáveis Formas; sem espaço" },
  "passo-ascendente": { spellName: "Levitação", notes: "Sempre preparada — Passo Ascendente; alvo: si mesmo; sem espaço" },
  "presente-das-profundezas": { spellName: "Respirar na Água", notes: "Sempre preparada — Presente das Profundezas; alvo: si mesmo; 1×/DL, sem espaço" },
  "salto-sobrenatural": { spellName: "Salto", notes: "Sempre preparada — Salto Sobrenatural; alvo: si mesmo; sem espaço" },
  "uno-com-as-sombras": { spellName: "Invisibilidade", notes: "Sempre preparada — Uno com as Sombras; alvo: si mesmo; sem espaço; só em Meia-luz/Escuridão" },
  "vigor-infero": { spellName: "Vitalidade Vazia", notes: "Sempre preparada — Vigor Ínfero; alvo: si mesmo; sem espaço; nunca rola o dado de PV Temp, recebe o máximo automaticamente" },
  "visoes-de-reinos-distantes": { spellName: "Olho Arcano", notes: "Sempre preparada — Visões de Reinos Distantes; sem espaço" },
  "visoes-nebulosas": { spellName: "Imagem Silenciosa", notes: "Sempre preparada — Visões Nebulosas; sem espaço" },
  "pacto-da-corrente": { spellName: "Convocar Familiar", notes: "Sempre preparada — Pacto da Corrente; sem espaço" },
};

export function getWarlockAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "bruxo") return [];

  const entries: SpellPreparedEntry[] = [];

  const patronSpells = character.subclassId ? PATRON_SPELLS_BY_LEVEL[character.subclassId] : undefined;
  if (patronSpells) {
    for (const tier of patronSpells) {
      if (character.level < tier.level) continue;
      for (const name of tier.names) {
        const isInvocarAberracao = character.subclassId === "Patrono Grande Antigo" && name === "Invocar Aberração" && character.level >= 14;
        entries.push(
          autoEntry(
            name,
            isInvocarAberracao
              ? `Sempre preparada — ${character.subclassId}; Criar Servo: sem Concent., 1 min, PV Temp = nível+CAR; 1º acerto/turno em alvo sob sua Danação soma dano Psíq = bônus de Danação`
              : `Sempre preparada — ${character.subclassId}`,
          ),
        );
      }
    }
  }

  if (character.subclassId === "Patrono Grande Antigo" && character.level >= 10) {
    entries.push(autoEntry("Danação", "Sempre preparada — Danação Mística; ao escolher o atributo, alvo também tem Desv. nas Salv. desse atributo pela duração"));
  }

  if (character.level >= 9) {
    entries.push(
      autoEntry("Contato Extraplanar", "Sempre preparada — Contatar Patrono; 1×/DL, sem espaço; sucesso automático na Salv.; finalidade: contato com o patrono"),
    );
  }

  for (const chosen of character.chosenInvocations) {
    const granted = SPELL_GRANTING_INVOCATIONS[chosen.invocationId];
    if (granted) entries.push(autoEntry(granted.spellName, granted.notes));
  }

  return entries;
}
