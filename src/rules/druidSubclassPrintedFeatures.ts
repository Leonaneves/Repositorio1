import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";

/**
 * Texto compacto para impressão das 4 subclasses de Druida — mesma
 * arquitetura de `rules/clericSubclassPrintedFeatures.ts`, com uma
 * camada extra: as características do Círculo da Lua que modificam
 * Forma Selvagem (ND/CA/PV Temp/linhas "> Lua:") NUNCA formam um bloco
 * próprio — entram dentro do MESMO bloco "#Forma Selvagem" montado por
 * `rules/druidPrintedFeatures.ts`, que importa
 * `getDruidWildShapeLuaModifications` daqui. As demais características
 * "gasta 1 FS" (Auxílio da Terra, Forma Estrelada, Ira do Mar) são
 * blocos PRÓPRIOS sem checkbox (o custo já é rastreado pelos
 * checkboxes de Forma Selvagem).
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function wisdomModifier(character: Character): number {
  return getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
}

/** Terreno atualmente escolhido (Círculo da Terra) — `null` se nenhum escolhido ainda. */
function getCurrentTerrain(character: Character): string | null {
  const selection = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
  return typeof selection === "string" && selection ? selection : null;
}

const TERRAIN_RESISTANCE: Record<string, string> = {
  Árido: "Ígneo",
  Polar: "Gélido",
  Temperado: "Elétrico",
  Tropical: "Venenoso",
};

/**
 * Modificações de Forma Selvagem do Círculo da Lua (níveis 3/6/14) —
 * `null` para qualquer outra subclasse/sem subclasse. Usado por
 * `rules/druidPrintedFeatures.ts` para montar o MESMO bloco
 * "#Forma Selvagem", nunca um bloco próprio.
 */
export interface DruidWildShapeLuaModifications {
  pvTempLine: string;
  usaBlocoLine: string;
  extraLines: string[];
}

export function getDruidWildShapeLuaModifications(character: Character): DruidWildShapeLuaModifications | null {
  if (character.subclassId !== "Círculo da Lua" || character.level < 3) return null;

  const ndLua = Math.floor(character.level / 3);
  const extraLines: string[] = [];
  if (character.level >= 6) extraLines.push("> Lua: Atq Fera normal/Radiante; +SAB Salv CON");
  if (character.level >= 14) extraLines.push("> Lua: 1/turno, Atq Fera -> +2d10 Radiante");

  return {
    pvTempLine: `PV Temp = 3 x nível; ND máx ${ndLua}; CA 13+SAB se maior`,
    usaBlocoLine: "Usa bloco Fera, mantém tipo/PV/DV, INT/SAB/CAR, classe, idiomas, talentos e Prof perícias/Salv",
    extraLines,
  };
}

interface SubclassBlock {
  subclassFullName: string;
  acquisitionLevel: number;
  getText: (character: Character) => string | null;
}

const SUBCLASS_BLOCKS: SubclassBlock[] = [
  // ---------- Círculo da Lua — Passo Lunar (3-13 base; 14+ com Luar Compartilhado fundido) ----------
  {
    subclassFullName: "Círculo da Lua",
    acquisitionLevel: 10,
    getText: (character) => {
      const count = Math.max(1, wisdomModifier(character));
      const lines = [`#Passo Lunar ${checkboxes(count)}`, "AB: teleporte 9m; Vant no próx Atq deste turno"];
      if (character.level >= 14) lines.push("Pode levar 1 aliado voluntário a 3m; surge até 3m do destino");
      lines.push("Todos/DL; espaço 2o+ -> +1 uso");
      return lines.join("\n");
    },
  },

  // ---------- Círculo da Terra ----------
  {
    subclassFullName: "Círculo da Terra",
    acquisitionLevel: 3,
    getText: (character) => {
      const dice = character.level >= 14 ? "4d6" : character.level >= 10 ? "3d6" : "2d6";
      return ["#Auxílio da Terra", "1 FS, Ação, ponto 18m/raio 3m", `Escolhidos Salv CON -> ${dice} Necrótico, sucesso 1/2; 1 alvo cura ${dice}`].join("\n");
    },
  },
  {
    subclassFullName: "Círculo da Terra",
    acquisitionLevel: 6,
    getText: (character) => {
      const circulos = Math.ceil(character.level / 2);
      return [
        "#Recuperação Natural",
        "> [__] 1 magia do Círculo 1o+ sem espaço. 1/DL",
        `> [__] DC: recupere até ${circulos} círculos de espaços, máx 5o. 1/DL`,
      ].join("\n");
    },
  },
  {
    subclassFullName: "Círculo da Terra",
    acquisitionLevel: 10,
    getText: (character) => {
      const terrain = getCurrentTerrain(character);
      if (!terrain) return null;
      const resistance = TERRAIN_RESISTANCE[terrain];
      return [`#Proteção Natural - ${terrain}`, `Imune Enven; Res ${resistance}`].join("\n");
    },
  },
  {
    subclassFullName: "Círculo da Terra",
    acquisitionLevel: 14,
    getText: () =>
      [
        "#Santuário Natural",
        "1 FS, Ação: Cubo 4,5m até 36m por 1 min",
        "Você/aliados: Cob Parc; aliados ganham sua Res do terreno",
        "AB -> move Cubo 18m, mantendo até 36m",
      ].join("\n"),
  },

  // ---------- Círculo das Estrelas ----------
  {
    subclassFullName: "Círculo das Estrelas",
    acquisitionLevel: 3,
    getText: (character) => {
      const dice = character.level >= 10 ? "2d8" : "1d8";
      const header = character.level >= 10 ? "1 FS, AB, 10 min; escolha; início turno pode trocar:" : "1 FS, AB, 10 min; escolha:";
      const dragao =
        character.level >= 10
          ? "> Dragão: testes INT/SAB e Salv CON Concent, d20 9 ou menos = 10; Voo 6m, paira"
          : "> Dragão: testes INT/SAB e Salv CON Concent, d20 9 ou menos = 10";
      const lines = [
        "#Forma Estrelada",
        header,
        `> Arqueiro: ao ativar e AB -> Atq mágico 18m, ${dice}+SAB Radiante`,
        dragao,
        `> Taça: magia com espaço que cura -> você/alvo 9m cura ${dice}+SAB`,
      ];
      if (character.level >= 14) lines.push("> Res Conc/Cort/Perf");
      return lines.join("\n");
    },
  },
  {
    subclassFullName: "Círculo das Estrelas",
    acquisitionLevel: 6,
    getText: (character) => {
      const count = Math.max(1, wisdomModifier(character));
      return [
        `#Presságio Cósmico ${checkboxes(count)}`,
        "Após DL: par=Prosperidade, ímpar=Infortúnio",
        "Reação, Teste d20 a 9m -> +1d6 ou -1d6",
        "Todos/DL",
      ].join("\n");
    },
  },

  // ---------- Círculo do Mar ----------
  {
    subclassFullName: "Círculo do Mar",
    acquisitionLevel: 3,
    getText: (character) => {
      const wisdomMod = wisdomModifier(character);
      const dice = Math.max(1, wisdomMod);
      const emanacao = character.level >= 6 ? "3m" : "1,5m";
      const header =
        character.level >= 14
          ? `1 FS, AB: Emanação ${emanacao} por 10 min em você ou aliado voluntário a 18m`
          : `1 FS, AB: Emanação ${emanacao} por 10 min`;
      const lines = ["#Ira do Mar", header, `Ao ativar e AB: alvo na área Salv CON; falha ${dice}d6 Frio e Grande- empurra 4,5m`];
      if (character.level >= 10) lines.push("> Ativa: Voo = Desl; Res Elétrico/Frio/Trovão");
      if (character.level >= 14) lines.push("> 2 FS: manifeste em você + aliado simultaneamente");
      return lines.join("\n");
    },
  },
];

/** Blocos próprios das subclasses de Druida (com ou sem checkbox) — nunca inclui as modificações de Forma Selvagem (Círculo da Lua), que ficam no composer da classe. */
export function getDruidSubclassPrintedBlocks(character: Character): { level: number; text: string }[] {
  if (!character.subclassId) return [];
  return SUBCLASS_BLOCKS.filter((block) => block.subclassFullName === character.subclassId && character.level >= block.acquisitionLevel)
    .map((block) => ({ level: block.acquisitionLevel, text: block.getText(character) }))
    .filter((b): b is { level: number; text: string } => b.text !== null);
}
