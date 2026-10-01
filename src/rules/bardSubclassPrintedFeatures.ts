import type { Character } from "../domain/character.js";

/**
 * Texto compacto para impressão das 4 subclasses de Bardo — mesma
 * ideia/arquitetura de `rules/bardPrintedFeatures.ts` (que importa e
 * entrelaça este módulo por nível). "Treinamento Marcial" (Bravura),
 * "Proficiências Bônus" e "Descobertas Mágicas" (Conhecimento) ficam de
 * fora de propósito: a primeira vai para Proficiências/Armas
 * (`rules/bardSubclassProficiencies.ts`), as outras duas para
 * Perícias/Magias — nunca para este campo.
 */

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string;
}

const BRAVURA: SubclassBlock[] = [
  {
    subclassFullName: "Colégio da Bravura",
    acquisitionLevel: 3,
    getText: () =>
      ["#Inspiração em Combate", "Alvo com Insp pode:", "> Def: Reação ao ser atingido → +dado na CA contra Atq", "> Ofens: após acertar → +dado no dano"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Colégio da Bravura",
    acquisitionLevel: 6,
    getText: () => "#Ataque Extra\n1 Atq pode ser trocado por Truque de 1 ação",
  },
  {
    subclassFullName: "Colégio da Bravura",
    acquisitionLevel: 14,
    getText: () => "#Magia de Batalha\nApós magia de 1 ação: AB → 1 Atq com arma",
  },
];

const DANCA: SubclassBlock[] = [
  {
    subclassFullName: "Colégio da Dança",
    acquisitionLevel: 3,
    getText: () => "#Ginga Fascinante\nSem Arm/Esc: Vant em Atua com dança\nAo gastar Insp em ação/AB/Reação → 1 Atq Desarmado junto",
  },
  {
    subclassFullName: "Colégio da Dança",
    acquisitionLevel: 6,
    getText: () => "#Gingado Coordenado\nInic: gaste 1 Insp; você + aliados a 9m somam dado à Inic",
  },
  {
    subclassFullName: "Colégio da Dança",
    acquisitionLevel: 6,
    getText: () =>
      ["#Movimento Inspirador", "Reação +1 Insp: inimigo encerra turno a 1,5m → você move ½ Desl", "Aliado a 9m pode Reação → ½ Desl; sem Atq Oport"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Colégio da Dança",
    acquisitionLevel: 14,
    getText: () => ["#Evasão Liderada", "Salv DES p/½ dano: sucesso 0, falha ½", "Aliados a 1,5m também recebem; não funciona Incapacitado"].join("\n"),
  },
];

const CONHECIMENTO: SubclassBlock[] = [
  {
    subclassFullName: "Colégio do Conhecimento",
    acquisitionLevel: 3,
    getText: () => "#Palavras de Interrupção\nReação +1 Insp, alvo a 18m: subtraia dado de dano ou teste/Atq bem-sucedido",
  },
  {
    subclassFullName: "Colégio do Conhecimento",
    acquisitionLevel: 14,
    getText: () => "#Perícia Inigualável\nFalha em teste/Atq: use Insp e some dado ao d20\nSe ainda falhar, Insp não é gasta",
  },
];

const GLAMOUR: SubclassBlock[] = [
  {
    subclassFullName: "Colégio do Glamour",
    acquisitionLevel: 3,
    getText: () =>
      [
        "#Magia Fascinante [__]",
        "Após magia Enc/Ilusão com espaço: alvo 18m Salv SAB",
        "Falha: Amed ou Enfeit 1 min; repete Salv/fim turno",
        "DL ou gaste 1 Insp",
      ].join("\n"),
  },
  {
    subclassFullName: "Colégio do Glamour",
    acquisitionLevel: 3,
    getText: () =>
      ["#Manto de Inspiração", "AB +1 Insp: até CAR criaturas a 18m ganham PV Temp = 2× dado", "Cada uma pode Reação → mover Desl sem Atq Oport"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Colégio do Glamour",
    acquisitionLevel: 6,
    getText: () =>
      [
        "#Manto de Majestade [__]",
        "AB: Comando grátis + forma por 1 min/Concent",
        "Durante: AB → Comando grátis; Enfeit por você falham Salv",
        "DL ou espaço 3º+",
      ].join("\n"),
  },
  {
    subclassFullName: "Colégio do Glamour",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Majestade Inquebrável [__]",
        "AB: presença 1 min",
        "1º acerto/turno contra você: atacante Salv CAR vs CD magia; falha → Atq falha",
        "DC/DL",
      ].join("\n"),
  },
];

const ALL_SUBCLASS_BLOCKS: SubclassBlock[] = [...BRAVURA, ...DANCA, ...CONHECIMENTO, ...GLAMOUR];

/** Blocos da subclasse ATUAL do personagem já adquiridos no nível atual, prontos para entrelaçar com os blocos de classe por nível. */
export function getBardSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return ALL_SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel).map(
    (block) => ({ level: block.acquisitionLevel, text: block.getText(character) }),
  );
}
