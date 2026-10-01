import type { Character } from "../domain/character.js";

/**
 * Texto compacto para impressão das 4 subclasses de Bárbaro — mesma
 * ideia/arquitetura de `rules/barbarianPrintedFeatures.ts` (que importa
 * e entrelaça este módulo por nível). "Arauto da Fauna"/"Arauto da
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
      const d6 = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2; // mesma progressão do Dano da Fúria (2/3/4)
      return [
        "#Vitalidade da Árvore",
        "> Surto: ao entrar em Fúria, ganhe PV Temp. = nível Bárbaro.",
        `> Força Revigorante: início do turno em Fúria, outra criatura a 3m recebe PV Temp. = ${d6}d6.`,
      ].join("\n");
    },
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 6,
    getText: () =>
      "#Ramos da Árvore\nEm Fúria, Reação quando criatura visível inicia turno a 9m: Salv. FOR CD 8+FOR+Prof.; falha → teleporte-a para espaço livre até 1,5m de você; opcional Desl. 0 até fim do turno.",
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 10,
    getText: () =>
      "#Raízes Devastadoras\nNo seu turno, alcance +3m com arma corpo a corpo Pesada/Versátil. Ao acertar, use Derrubar ou Empurrar além da outra Maestria da arma.",
  },
  {
    subclassFullName: "Caminho da Árvore do Mundo",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Percorrer a Árvore",
        "Ao entrar em Fúria e como AB durante ela: teleporte 18m.",
        "> 1×/Fúria: alcance 45m e leve até 6 criaturas voluntárias a 3m; surgem até 3m do seu destino.",
      ].join("\n"),
  },
];

const BERSERKER: SubclassBlock[] = [
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 3,
    getText: (character) => {
      const d6 = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2;
      return `#Frenesi\nEm Fúria + Atq Imprudente, o 1º alvo acertado/turno com Atq FOR sofre +${d6}d6 do mesmo tipo.`;
    },
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 6,
    getText: () => "#Fúria Irracional\nEm Fúria: Imune a Amedrontado/Enfeitiçado; ao entrar em Fúria, encerra essas condições.",
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 10,
    getText: () => "#Retaliação\nAo sofrer dano de criatura a 1,5m, Reação → 1 Atq corpo a corpo contra ela.",
  },
  {
    subclassFullName: "Caminho do Berserker",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Presença Intimidante [__]",
        "AB; criaturas escolhidas até 9m: Salv. SAB CD 8+FOR+Prof.; falha → Amedrontado 1 min, repetindo Salv. ao fim do turno.",
        "DL; recupere o uso gastando 1 Fúria.",
      ].join("\n"),
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
        "> Águia: ao entrar, Correr+Desengajar na mesma AB; em Fúria, AB → ambos.",
        "> Lobo: aliados têm Vant. em Atq contra seus inimigos a 1,5m.",
        "> Urso: Res. a todo dano exc. Energético, Necrótico, Psíquico e Radiante.",
      ].join("\n"),
  },
  {
    subclassFullName: "Caminho do Coração Selvagem",
    acquisitionLevel: 6,
    getText: () =>
      [
        "#Aspecto dos Selvagens",
        "Escolha; pode trocar após DL:",
        "> Coruja: Visão no Escuro 18m; se já tiver, +18m.",
        "> Pantera: Desl. Escalada = Desl.",
        "> Salmão: Desl. Natação = Desl.",
      ].join("\n"),
  },
  {
    subclassFullName: "Caminho do Coração Selvagem",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Poder dos Selvagens",
        "Ao entrar em Fúria, escolha:",
        "> Carneiro: ao acertar Atq corpo a corpo, pode deixar criatura Grande ou menor Caída.",
        "> Falcão: Desl. Voo = Desl. enquanto sem armadura.",
        "> Leão: inimigos a 1,5m têm Desv. em Atq contra outros alvos que não você ou outro Bárbaro com esta opção.",
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
    getText: (character) => `#Campeão dos Deuses\nReserva d12: ${checkboxes(championDice(character.level))}\nAB: gaste quaisquer dados; cure PV = total rolado. Recupera todos/DL.`,
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 3,
    getText: (character) => {
      const bonus = Math.floor(character.level / 2);
      return `#Fúria Divina\nEm Fúria, 1º alvo acertado/turno com arma ou Atq Desarmado: +1d6+${bonus}, Necrótico ou Radiante.`;
    },
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 6,
    getText: () => "#Concentração Fanática\n1×/Fúria, ao falhar Salv.: repita com +Dano da Fúria; use o novo resultado.",
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 10,
    getText: () =>
      ["#Presença Zelosa [__]", "AB: até 10 outras criaturas a 18m têm Vant. em Atq e Salv. até seu próx. turno.", "DL; recupere o uso gastando 1 Fúria."].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Caminho do Fanático",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Fúria dos Deuses [__]",
        "Ao entrar em Fúria, forma divina por 1 min ou até 0 PV. DL.",
        "> Res.: Necrótico, Psíquico e Radiante.",
        "> Revivificação: Reação; criatura a 9m cairia a 0 PV → gaste 1 Fúria; PV dela = seu nível Bárbaro.",
        "> Voo: Desl. Voo = Desl.; pode pairar.",
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
