import type { Character } from "../domain/character.js";

/**
 * Texto compacto para impressão das 4 subclasses de Bárbaro — mesma
 * ideia/arquitetura de `rules/barbarianPrintedFeatures.ts` (que importa
 * e entrelaça este módulo por nível), revisado editorialmente pela
 * fonte "ALTERAÇÃO DOS TEXTOS IMPRESSOS — BÁRBARO" (texto telegráfico,
 * sem ponto após abreviação). Nenhuma mecânica/progressão muda aqui —
 * só a apresentação do texto já resolvido. "Arauto da Fauna"/"Arauto da
 * Natureza" (Coração Selvagem) ficam de fora de propósito: vão para a
 * área de Magias (`rules/spellcasting.ts`), nunca para este campo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string;
}

const ARVORE_DO_MUNDO: SubclassBlock[] = [
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 3,
    getText: (character) => {
      const d6 = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2; // {DanoFúria}, mesma progressão do Dano da Fúria
      return ["#Vitalidade da Árvore", "> Entrar em Fúria: PV Temp = nível", `> Início turno: outra criatura a 3m recebe ${d6}d6 PV Temp`].join("\n");
    },
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 6,
    getText: () =>
      ["#Ramos da Árvore", "Fúria, Reação: criatura a 9m inicia turno -> Salv FOR CD 8+FOR+Prof", "Falha: teleporta até 1,5m de você; pode ficar Desl 0"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 10,
    getText: () => ["#Raízes Devastadoras", "Arma Pesada/Versátil: +3m alcance", "Acerto: Derrubar ou Empurrar + outra Maestria"].join("\n"),
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 14,
    getText: () => ["#Percorrer a Árvore", "Fúria: teleporte 18m ao entrar ou com AB", "> 1x/Fúria: 45m + até 6 criaturas"].join("\n"),
  },
];

const BERSERKER: SubclassBlock[] = [
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 3,
    getText: (character) => {
      const d6 = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2; // {DanoFúria}
      return `#Frenesi\nFúria + Atq Imprudente, o 1º alvo acertado/turno com Atq FOR sofre +${d6}d6 do mesmo tipo`;
    },
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 6,
    getText: () => "#Fúria Irracional\nFúria: Imune a Amedrontado/Enfeitiçado; ao entrar, encerra ambos",
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 10,
    getText: () => "#Retaliação\nReação ao sofrer dano de criatura a 1,5m: 1 Atq corpo a corpo",
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 14,
    getText: () =>
      ["#Presença Intimidante [__]", "AB, 9m: Salv SAB CD 8+FOR+Prof; falha: Amedrontado 1 min", "Repete Salv no fim do turno", "DL ou gaste 1 Fúria"].join(
        "\n",
      ),
  },
];

const CORACAO_SELVAGEM: SubclassBlock[] = [
  {
    subclassFullName: "Caminho do Coração Selvagem",
    acquisitionLevel: 3,
    getText: () =>
      [
        "#Fúria dos Selvagens",
        "Ao entrar em Fúria, escolha:",
        "> Águia: Correr+Desengajar na mesma AB; em Fúria, AB faz ambos",
        "> Lobo: aliados têm Vant em Atq contra inimigos a 1,5m",
        "> Urso: Res a todo dano exc Energ, Necr, Psiq e Rad",
      ].join("\n"),
  },
  {
    subclassFullName: "Caminho do Coração Selvagem",
    acquisitionLevel: 6,
    getText: () =>
      [
        "#Aspecto dos Selvagens",
        "Escolha; pode trocar/DL:",
        "> Coruja: Visão no Escuro 18m ou +18m",
        "> Pantera: Desl Escalada = Desl",
        "> Salmão: Desl Natação = Desl",
      ].join("\n"),
  },
  {
    subclassFullName: "Caminho do Coração Selvagem",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Poder dos Selvagens",
        "Ao entrar em Fúria, escolha:",
        "> Carneiro: Atq corpo a corpo pode deixar alvo Grande ou menor Caído",
        "> Falcão: Desl Voo = Desl, sem armadura",
        "> Leão: inimigos a 1,5m têm Desv em Atq contra outros",
      ].join("\n"),
  },
];

/** Reserva de dados d12 de Campeão dos Deuses — mesma característica (nível 3) em todos os níveis; só a contagem de dados muda. */
function championDice(level: number): number {
  if (level >= 17) return 7;
  if (level >= 12) return 6;
  if (level >= 6) return 5;
  return 4;
}

const FANATICO: SubclassBlock[] = [
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 3,
    getText: (character) => `#Campeão dos Deuses\nd12: ${checkboxes(championDice(character.level))}\nAB: gaste dados e cure o total\nTodos/DL`,
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 3,
    getText: (character) => {
      const bonus = Math.floor(character.level / 2); // {bonusResolvido}
      return `#Fúria Divina\nFúria: 1º acerto/turno +1d6+${bonus} Necr ou Rad`;
    },
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 6,
    getText: () => "#Concentração Fanática\n1x/Fúria, falha Salv: refaça com +Dano da Fúria",
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 10,
    getText: () =>
      ["#Presença Zelosa [__]", "AB: até 10 criaturas a 18m têm Vant em Atq/Salv até próx turno", "DL ou gaste 1 Fúria"].join("\n"),
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Fúria dos Deuses [__]",
        "Entrar em Fúria: forma divina por 1 min. DL",
        "> Res Necr/Psiq/Rad",
        "> Reação: criatura a 9m cairia a 0 PV -> gaste 1 Fúria; PV = seu nível",
        "> Voo = Desl; pode pairar",
      ].join("\n"),
  },
];

const ALL_SUBCLASS_BLOCKS: SubclassBlock[] = [...ARVORE_DO_MUNDO, ...BERSERKER, ...CORACAO_SELVAGEM, ...FANATICO];

/** Blocos da subclasse ATUAL do personagem já adquiridos no nível atual, prontos para entrelaçar com os blocos de classe por nível. */
export function getBarbarianSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return ALL_SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel).map(
    (block) => ({ level: block.acquisitionLevel, text: block.getText(character) }),
  );
}
