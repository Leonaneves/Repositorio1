import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";

/**
 * Texto compacto para impressão das 4 subclasses de Bruxo — mesma
 * ideia/arquitetura de `rules/warlockPrintedFeatures.ts` (que importa
 * e entrelaça este módulo por nível). As listas de magias sempre
 * preparadas de cada Patrono ficam de fora de propósito: vão para a
 * área de Magias (`rules/warlockAutoPreparedSpells.ts`), nunca para
 * este campo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function charismaModifier(character: Character): number {
  return getAbilityModifier(getEffectiveAbilityScore(character, "CAR"));
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string;
}

const ARQUIFADA: SubclassBlock[] = [
  {
    subclassFullName: "Patrono Arquifada",
    acquisitionLevel: 3,
    getText: (character) => {
      const carMod = Math.max(1, charismaModifier(character));
      const header = `#Passos Feéricos ${checkboxes(carMod)}`;
      if (character.level >= 6) {
        return [
          header,
          "Passo Nebuloso sem espaço; pode Reação ao sofrer dano. Todos/DL",
          "> Provocante: origem 1,5m Salv SAB ou Desv Atq vs outros",
          "> Revigorante: você/alvo 3m ganha 1d10 PV Temp",
          "> Desvanecedor: Invisível até próx turno/Atq/dano/magia",
          "> Terrível: origem ou destino 1,5m Salv SAB; falha 2d10 Psiq",
        ].join("\n");
      }
      return [
        header,
        "Passo Nebuloso sem espaço. Todos/DL",
        "> Provocante: criaturas a 1,5m da origem Salv SAB ou Desv Atq vs outros até próx turno",
        "> Revigorante: você/alvo a 3m ganha 1d10 PV Temp",
      ].join("\n");
    },
  },
  {
    subclassFullName: "Patrono Arquifada",
    acquisitionLevel: 10,
    getText: () =>
      ["#Defesas Sedutoras [__]", "Imune Enfeit", "Reação ao ser atingido: 1/2 dano; atacante Salv SAB ou sofre Psiq = dano sofrido", "DL ou 1 espaço Pacto"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Patrono Arquifada",
    acquisitionLevel: 14,
    getText: () => "#Magia Sedutora\nApós magia Enc/Ilusão de 1 ação + espaço -> Passo Nebuloso grátis na mesma ação",
  },
];

const CELESTIAL: SubclassBlock[] = [
  {
    subclassFullName: "Patrono Celestial",
    acquisitionLevel: 3,
    getText: (character) =>
      [`#Luz Medicinal`, `d6: ${checkboxes(character.level + 1)}`, "AB: cure você/alvo 18m; gaste até CAR dados e cure o total", "Todos/DL"].join("\n"),
  },
  {
    subclassFullName: "Patrono Celestial",
    acquisitionLevel: 6,
    getText: () => "#Alma Radiante\nRes Rad; 1/turno magia Íg/Rad -> +CAR dano em 1 alvo",
  },
  {
    subclassFullName: "Patrono Celestial",
    acquisitionLevel: 10,
    getText: (character) => {
      const carMod = charismaModifier(character);
      const pvYou = character.level + carMod;
      const pvAlly = Math.floor(character.level / 2) + carMod;
      return `#Resiliência Celestial\nAstúcia Mágica/DC/DL: você ganha ${pvYou} PV Temp\nAté 5 criaturas vistas ganham ${pvAlly} PV Temp`;
    },
  },
  {
    subclassFullName: "Patrono Celestial",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Vingança Calcinante [__]",
        "Você/aliado 18m faria Salv Morte -> recupera 1/2 PV máx e pode encerrar Caído",
        "Escolhidos a 9m: 2d8+CAR Rad e Cego até fim turno. DL",
      ].join("\n"),
  },
];

const GRANDE_ANTIGO: SubclassBlock[] = [
  {
    subclassFullName: "Patrono Grande Antigo",
    acquisitionLevel: 3,
    getText: () => "#Magias Psíquicas\nMagia Bruxo com dano pode virar Psiq\nEnc/Ilus de Bruxo sem V/S",
  },
  {
    subclassFullName: "Patrono Grande Antigo",
    acquisitionLevel: 3,
    getText: (character) => {
      const range = (1.5 * Math.max(1, charismaModifier(character))).toLocaleString("pt-BR");
      return `#Mente Desperta\nAB alvo 9m: telepatia ${range}km por ${character.level} min; requer idioma comum`;
    },
  },
  {
    subclassFullName: "Patrono Grande Antigo",
    acquisitionLevel: 6,
    getText: () =>
      ["#Combatente Clarividente [__]", "Mente Desperta: alvo Salv SAB; falha -> Desv Atq contra você e você Vant Atq contra ele", "DC/DL ou 1 espaço Pacto"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Patrono Grande Antigo",
    acquisitionLevel: 10,
    getText: () => "#Escudo Mental\nMente não pode ser lida sem permissão; Res Psiq\nQuem causa dano Psiq em você sofre o mesmo dano",
  },
];

const INFERO: SubclassBlock[] = [
  {
    subclassFullName: "Patrono Ínfero",
    acquisitionLevel: 3,
    getText: (character) => {
      const pvTemp = Math.max(1, charismaModifier(character) + character.level);
      return `#Bênção do Tenebroso\nInimigo cai a 0 PV por você ou a 3m -> ${pvTemp} PV Temp`;
    },
  },
  {
    subclassFullName: "Patrono Ínfero",
    acquisitionLevel: 6,
    getText: (character) => {
      const carMod = Math.max(1, charismaModifier(character));
      return [`#Sorte do Próprio Tenebroso ${checkboxes(carMod)}`, "Teste/Salv: após rolar, antes do efeito -> +1d10", "Todos/DL"].join("\n");
    },
  },
  {
    subclassFullName: "Patrono Ínfero",
    acquisitionLevel: 10,
    getText: () => "#Resistência Ínfera\nDC/DL: escolha dano exc Energ -> Res até nova escolha",
  },
  {
    subclassFullName: "Patrono Ínfero",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Lançar no Inferno [__]",
        "1/turno, acerto -> Salv CAR; falha: desaparece, não-Ínfero 8d10 Psiq + Incap até fim próx turno",
        "DL ou 1 espaço Pacto",
      ].join("\n"),
  },
];

const ALL_SUBCLASS_BLOCKS: SubclassBlock[] = [...ARQUIFADA, ...CELESTIAL, ...GRANDE_ANTIGO, ...INFERO];

/** Blocos da subclasse ATUAL do personagem já adquiridos no nível atual, prontos para entrelaçar com os blocos de classe por nível. */
export function getWarlockSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return ALL_SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel).map(
    (block) => ({ level: block.acquisitionLevel, text: block.getText(character) }),
  );
}
