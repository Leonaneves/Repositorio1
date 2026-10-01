import type { ClassId } from "../domain/ids.js";

export interface SubclassDefinition {
  /** Nome curto, usado em listas de seleção. */
  shortName: string;
  /** Valor canônico/completo — é o que o motor de regras compara (ex.: casos especiais de conjuração). */
  fullName: string;
}

/**
 * Subclasses por classe: D&D 2024 (PHB) + Artífice (Eberron: Forge of
 * the Artificer) + Ravenloft: The Horrors Within + Arcana Unleashed —
 * sem Forgotten Realms, exatamente como no script de documento
 * `SubclassesPorClasse.js` do PDF original (fonte de verdade; os dois
 * scripts do PDF — o de `SubclassesPorClasse` e o embutido na ação do
 * campo `CLASSE` — foram conferidos e são consistentes entre si).
 */
export const subclasses: Record<ClassId, SubclassDefinition[]> = {
  artifice: [
    { shortName: "Alquimista", fullName: "Alquimista" },
    { shortName: "Armeiro", fullName: "Armeiro" },
    { shortName: "Artilheiro", fullName: "Artilheiro" },
    { shortName: "Ferreiro", fullName: "Ferreiro de Batalha" },
    { shortName: "Cartógrafo", fullName: "Cartógrafo" },
    { shortName: "Reanimador", fullName: "Reanimador" },
  ],
  // Nomes de exibição normalizados para "Caminho do/da X" pela fonte "INTEGRAÇÃO
  // COMPLETA — BÁRBARO E SUBCLASSES" (substitui "Trilha do/da X"/"Trilha do Zelote" —
  // mesmas 4 subclasses, sem adicionar nem remover nenhuma).
  barbaro: [
    { shortName: "Berserker", fullName: "Caminho do Berserker" },
    { shortName: "Coração Selvagem", fullName: "Caminho do Coração Selvagem" },
    { shortName: "Árvore do Mundo", fullName: "Caminho da Árvore do Mundo" },
    { shortName: "Fanático", fullName: "Caminho do Fanático" },
  ],
  bardo: [
    { shortName: "Dança", fullName: "Colégio da Dança" },
    { shortName: "Glamour", fullName: "Colégio do Glamour" },
    { shortName: "Conhecimento", fullName: "Colégio do Conhecimento" },
    { shortName: "Bravura", fullName: "Colégio da Bravura" },
    { shortName: "Espíritos", fullName: "Colégio dos Espíritos" },
  ],
  bruxo: [
    { shortName: "Arquifada", fullName: "Patrono Arquifada" },
    { shortName: "Celestial", fullName: "Patrono Celestial" },
    { shortName: "Corruptor", fullName: "Patrono Corruptor" },
    { shortName: "Grande Antigo", fullName: "Patrono do Grande Antigo" },
    { shortName: "Morto-Vivo", fullName: "Patrono Morto-Vivo" },
    { shortName: "Vestígio", fullName: "Patrono do Vestígio" },
  ],
  clerigo: [
    { shortName: "da Vida", fullName: "Domínio da Vida" },
    { shortName: "da Luz", fullName: "Domínio da Luz" },
    { shortName: "da Trapaça", fullName: "Domínio da Trapaça" },
    { shortName: "da Guerra", fullName: "Domínio da Guerra" },
    { shortName: "da Sepultura", fullName: "Domínio da Sepultura" },
    { shortName: "Arcano", fullName: "Domínio Arcano" },
  ],
  druida: [
    { shortName: "da Terra", fullName: "Círculo da Terra" },
    { shortName: "da Lua", fullName: "Círculo da Lua" },
    { shortName: "do Mar", fullName: "Círculo do Mar" },
    { shortName: "das Estrelas", fullName: "Círculo das Estrelas" },
  ],
  feiticeiro: [
    { shortName: "Aberrante", fullName: "Feitiçaria Aberrante" },
    { shortName: "Mecânica", fullName: "Feitiçaria Mecânica" },
    { shortName: "Dracônica", fullName: "Feitiçaria Dracônica" },
    { shortName: "Magia Selvagem", fullName: "Feitiçaria Selvagem" },
    { shortName: "Sombras", fullName: "Feitiçaria das Sombras" },
  ],
  guerreiro: [
    { shortName: "Mestre da Batalha", fullName: "Mestre da Batalha" },
    { shortName: "Campeão", fullName: "Campeão" },
    // Valor interno NÃO encurtado: a progressão de espaços de magia
    // (rules/spellcasting.ts) reconhece exatamente "Cavaleiro Místico".
    { shortName: "Cavaleiro Místico", fullName: "Cavaleiro Místico" },
    { shortName: "Psiônico", fullName: "Guerreiro Psiônico" },
    { shortName: "Arqueiro Arcano", fullName: "Arqueiro Arcano" },
  ],
  ladino: [
    // Visualmente "Arcano", mas o valor interno continua "Trapaceiro
    // Arcano" para casar com a progressão de espaços de magia.
    { shortName: "Arcano", fullName: "Trapaceiro Arcano" },
    { shortName: "Assassino", fullName: "Assassino" },
    { shortName: "Lâmina Psíquica", fullName: "Lâmina Psíquica" },
    { shortName: "Ladrão", fullName: "Ladrão" },
    { shortName: "Fantasma", fullName: "Fantasma" },
  ],
  mago: [
    { shortName: "Abjurador", fullName: "Abjurador" },
    { shortName: "Adivinho", fullName: "Adivinho" },
    { shortName: "Evocador", fullName: "Evocador" },
    { shortName: "Ilusionista", fullName: "Ilusionista" },
    { shortName: "Conjurador", fullName: "Conjurador" },
    { shortName: "Encantador", fullName: "Encantador" },
    { shortName: "Necromante", fullName: "Necromante" },
    { shortName: "Transmutador", fullName: "Transmutador" },
  ],
  monge: [
    { shortName: "da Misericórdia", fullName: "Guerreiro da Misericórdia" },
    { shortName: "das Sombras", fullName: "Guerreiro das Sombras" },
    { shortName: "dos Elementos", fullName: "Guerreiro dos Elementos" },
    { shortName: "da Mão Aberta", fullName: "Guerreiro da Mão Aberta" },
    { shortName: "das Artes Místicas", fullName: "Guerreiro das Artes Místicas" },
  ],
  paladino: [
    { shortName: "da Devoção", fullName: "Juramento da Devoção" },
    { shortName: "da Glória", fullName: "Juramento da Glória" },
    { shortName: "dos Anciões", fullName: "Juramento dos Anciões" },
    { shortName: "da Vingança", fullName: "Juramento da Vingança" },
  ],
  patrulheiro: [
    { shortName: "Senhor das Feras", fullName: "Senhor das Feras" },
    { shortName: "Andarilho Feérico", fullName: "Andarilho Feérico" },
    // Valor interno NÃO encurtado: reconhecido pela progressão de conjuração de meio-conjurador (igual às demais subclasses de Patrulheiro).
    { shortName: "das Sombras", fullName: "Perseguidor das Sombras" },
    { shortName: "Caçador", fullName: "Caçador" },
    { shortName: "Guardião Oco", fullName: "Guardião Oco" },
  ],
};

/** Subclasses cuja conjuração NÃO vem da classe, mas é concedida pela própria subclasse (INT). */
export const SUBCLASS_SPELLCASTERS: ReadonlyArray<{ classId: ClassId; fullName: string; grantedFromLevel: number }> = [
  { classId: "guerreiro", fullName: "Cavaleiro Místico", grantedFromLevel: 3 },
  { classId: "ladino", fullName: "Trapaceiro Arcano", grantedFromLevel: 3 },
];

/**
 * Níveis em que cada classe recebe uma "Característica de Subclasse"
 * (linhas marcadas assim nas tabelas de progressão da base consolidada
 * de classes — sempre incluindo o nível 3, quando a subclasse em si é
 * adquirida). O CONTEÚDO de cada característica (o que ela faz, por
 * subclasse) ainda não foi confirmado — só o "quando" já é conhecido.
 * Guardado à parte de `subclassFeatures` (`data/features/subclasses.ts`,
 * ainda vazio) para não fabricar uma feature sem saber o que ela é;
 * serve de guia para quando o conteúdo real chegar.
 */
export const SUBCLASS_FEATURE_LEVELS: Partial<Record<ClassId, number[]>> = {
  artifice: [3, 5, 9, 15],
  bardo: [3, 6, 14],
  barbaro: [3, 6, 10, 14],
  bruxo: [3, 6, 10, 14],
  clerigo: [3, 6, 17],
  druida: [3, 6, 10, 14],
  feiticeiro: [3, 6, 14, 18],
  guerreiro: [3, 7, 10, 15, 18],
  ladino: [3, 9, 13, 17],
  mago: [3, 6, 10, 14],
  monge: [3, 6, 11, 17],
  paladino: [3, 7, 15, 20],
  patrulheiro: [3, 7, 11, 15],
};
