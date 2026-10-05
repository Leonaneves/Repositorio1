import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";

/**
 * Texto compacto para impressão das 4 subclasses de Feiticeiro — mesma
 * arquitetura de `rules/druidSubclassPrintedFeatures.ts`. Nomenclatura
 * de tipos de dano desta fonte (nunca a de outras classes já
 * aprovadas): só Contundente/Cortante/Perfurante são abreviados
 * (Conc/Cort/Perf); todos os demais tipos são escritos por extenso
 * (Fogo, nunca Ígneo; Gelo, nunca Gélido; etc.).
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function charismaModifier(character: Character): number {
  return getAbilityModifier(getEffectiveAbilityScore(character, "CAR"));
}

/** Formata um número decimal com vírgula (convenção do projeto) — números inteiros ficam sem decimal. */
function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toString().replace(".", ",");
}

function getCurrentElementalAffinity(character: Character): string | null {
  const selection = character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value;
  return typeof selection === "string" && selection ? selection : null;
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string | null;
}

const SUBCLASS_BLOCKS: SubclassBlock[] = [
  // ---------- Feitiçaria Aberrante ----------
  {
    subclassFullName: "Feitiçaria Aberrante",
    acquisitionLevel: 3,
    getText: (character) => {
      const range = formatDecimal(Math.max(1.5, 1.5 * charismaModifier(character)));
      const duration = formatDecimal(character.level);
      return ["#Fala Telepática", `AB, alvo 9m: telepatia ${range}km por ${duration}min; idioma comum`].join("\n");
    },
  },
  {
    subclassFullName: "Feitiçaria Aberrante",
    acquisitionLevel: 6,
    getText: () => ["#Defesas Psíquicas", "Res Psíquico; Vant Salv vs Amed/Enfeit"].join("\n"),
  },
  {
    subclassFullName: "Feitiçaria Aberrante",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Revelação em Carne",
        "AB, 10 min; 1 PF por benefício:",
        "> Aquática: Natação = 2x Desl; respira água",
        "> Vermiforme: passa por 2,5cm; 1,5m mov -> escapa restrição não mágica/Imobilizado",
        "> Invisível: vê Invisíveis 18m, exc Cob Total",
        "> Voo: Voo = Desl; paira",
      ].join("\n"),
  },
  {
    subclassFullName: "Feitiçaria Aberrante",
    acquisitionLevel: 18,
    getText: () =>
      [
        "#Implosão de Distorção [__]",
        "Ação: teleporte 36m; criaturas 9m da origem Salv FOR",
        "Falha: 3d10 Energético + puxada p/ espaço; sucesso 1/2",
        "DL ou 5PF",
      ].join("\n"),
  },

  // ---------- Feitiçaria Dracônica ----------
  {
    subclassFullName: "Feitiçaria Dracônica",
    acquisitionLevel: 6,
    getText: (character) => {
      const type = getCurrentElementalAffinity(character);
      if (!type) return null;
      return [`#Afinidade Elemental - ${type}`, `Res ${type}; magia com dano de ${type} -> +CAR em 1 rolagem dano`].join("\n");
    },
  },
  {
    subclassFullName: "Feitiçaria Dracônica",
    acquisitionLevel: 14,
    getText: () => ["#Asas de Dragão [__]", "AB: Voo 18m por 1h", "DL ou 3PF"].join("\n"),
  },

  // ---------- Feitiçaria Mecânica ----------
  {
    subclassFullName: "Feitiçaria Mecânica",
    acquisitionLevel: 3,
    getText: (character) => {
      const count = Math.max(1, charismaModifier(character));
      return [
        `#Restaurar Equilíbrio ${checkboxes(count)}`,
        "Reação: criatura 18m vai rolar d20 com Vant/Desv -> cancela ambas",
        "Todos/DL",
      ].join("\n");
    },
  },
  {
    subclassFullName: "Feitiçaria Mecânica",
    acquisitionLevel: 6,
    getText: () =>
      ["#Bastião da Lei", "Ação, 1-5PF: você/alvo 9m ganha mesmo no. de d8", "Ao sofrer dano, gaste dados -> reduza dano pelo total", "Até DL ou novo uso"].join(
        "\n",
      ),
  },
  {
    subclassFullName: "Feitiçaria Mecânica",
    acquisitionLevel: 14,
    getText: () => ["#Transe da Ordem [__]", "AB, 1 min: Atq contra você sem Vant; Teste d20 9 ou menos = 10", "DL ou 5PF"].join("\n"),
  },
  {
    subclassFullName: "Feitiçaria Mecânica",
    acquisitionLevel: 18,
    getText: () =>
      [
        "#Cavalgada Mecânica [__]",
        "Ação, Cubo 9m:",
        "> distribua até 100 PV",
        "> encerre magias 6o- em criaturas/objetos escolhidos",
        "> repare objetos danificados",
        "DL ou 7PF",
      ].join("\n"),
  },

  // ---------- Feitiçaria Selvagem ----------
  {
    subclassFullName: "Feitiçaria Selvagem",
    acquisitionLevel: 3,
    getText: () =>
      [
        "#Marés do Caos [__]",
        "Antes Teste d20 -> Vant",
        "Recupere ao conjurar magia Feiticeiro com espaço ou DL",
        "Se conjurar com espaço após usar -> Surto automático + recarrega",
      ].join("\n"),
  },
  {
    subclassFullName: "Feitiçaria Selvagem",
    acquisitionLevel: 3,
    getText: (character) => {
      const lines = ["#Surto de Magia Selvagem", "1/turno após magia Feiticeiro com espaço: pode d20"];
      if (character.level >= 14) {
        lines.push("20 -> role 2x na tabela Surto e escolha; magia do Surto não recebe Meta");
      } else {
        lines.push("20 -> tabela Surto; magia do Surto não recebe Meta");
      }
      if (character.level >= 18) {
        lines.push("> [__] Após magia com espaço: escolha efeito da tabela exc última linha. 1/DL");
      }
      return lines.join("\n");
    },
  },
  {
    subclassFullName: "Feitiçaria Selvagem",
    acquisitionLevel: 6,
    getText: () => ["#Distorcer a Sorte", "Reação +1PF: após criatura visível Teste d20 -> + ou -1d4"].join("\n"),
  },
];

/** Blocos próprios das subclasses de Feiticeiro (com ou sem checkbox). */
export function getSorcererSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel)
    .map((block) => ({ level: block.acquisitionLevel, text: block.getText(character) }))
    .filter((b): b is { level: number; text: string } => b.text !== null);
}
