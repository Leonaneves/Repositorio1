import type { Character } from "../domain/character.js";
import { species } from "../data/species.js";
import { findSpeciesLineageOption, INFERNAL_LINEAGES } from "../data/speciesLineages.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "./abilities.js";
import { getSpeed } from "./speed.js";
import { getSpeciesLineageDamageType } from "./speciesLineage.js";

/**
 * Texto impresso (PDF/Ficha Web) das 5 espécies com Linhagem/
 * Ancestralidade (Draconato/Elfo/Gnomo/Golias/Tiefling — fonte
 * "IMPLEMENTAR LINHAGENS..."), substituindo `species[id].traitsText`
 * (estático) por um texto DINÂMICO que resolve nível/atributos/
 * linhagem atuais a cada chamada — nunca persiste uma cópia (mesma
 * regra de ouro de `rules/barbarianPrintedFeatures.ts` etc.). As
 * outras 5 espécies do projeto (sem linhagem) continuam devolvendo o
 * `traitsText` estático de sempre, sem nenhuma mudança de
 * comportamento.
 */
export function getSpeciesTraitsPrintedText(character: Character): string {
  if (!character.speciesId) return "";
  const speciesId = character.speciesId;
  if (speciesId === "draconato") return getDraconatoPrintedText(character);
  if (speciesId === "elfo") return getElvenPrintedText(character);
  if (speciesId === "gnomo") return getGnomishPrintedText(character);
  if (speciesId === "golias") return getGoliathPrintedText(character);
  if (speciesId === "tiefling") return getTieflingPrintedText(character);
  return species[speciesId].traitsText;
}

/** Arredonda para 1 casa decimal e usa vírgula (convenção pt-BR já usada no projeto, ex.: "10,5m"). */
function formatMeters(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return `${text}m`;
}

/** 1-4:1d10 · 5-10:2d10 · 11-16:3d10 · 17+:4d10 (tabela exata pedida). */
function getDraconicBreathDiceCount(level: number): number {
  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

function getDraconatoPrintedText(character: Character): string {
  const damageType = getSpeciesLineageDamageType(character) ?? "(Ancestral Dracônico não escolhido)";
  const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
  const cd = 8 + conMod + getProficiencyBonus(character.level);
  const diceCount = getDraconicBreathDiceCount(character.level);

  const lines = [
    "# VISÃO NO ESCURO 18m",
    `# Resistência a dano ${damageType}`,
    "# ARMA DE SOPRO",
    "Pode trocar um atq por um sopro.",
    "Linha de 9m/Cone de 4,5m.",
    `Salv. de DES CD ${cd} para 1/2 do dano`,
    `Dano = ${diceCount}d10 ${damageType}`,
    "Usos=Prof. Recupera em DL",
  ];

  if (character.level >= 5) {
    lines.push("# VÔO DRACÔNICO (1 uso/DL)", `AB: vôo = ${formatMeters(getSpeed(character).total)} por 10 min`);
  }

  return lines.join("\n");
}

function getElvenPrintedText(character: Character): string {
  const lineage = findSpeciesLineageOption("elfo", character.speciesLineageId);
  const visaoNoEscuro = lineage?.id === "elfo-drow" ? "36m" : "18m";
  const linhagemEscolhida = lineage?.name ?? "(ainda não escolhida)";

  return [
    `# VISÃO NO ESCURO ${visaoNoEscuro}`,
    "# ANCESTRALIDADE FEY:",
    "Vant. contra condição Encantado",
    "# TRANSE:",
    "Descanso Longo = 4h",
    "Não dorme, nem por magias",
    "# LINHAGEM ÉLFICA:",
    linhagemEscolhida,
  ].join("\n");
}

function getGnomishPrintedText(character: Character): string {
  const lineage = findSpeciesLineageOption("gnomo", character.speciesLineageId);
  const lines = [
    "# VISÃO NO ESCURO 18m",
    "# ASTÚCIA GNÔMICA:",
    "> Vantagem em Salvaguardas de INT, CAR e SAB",
    `# ${lineage ? lineage.name.toUpperCase() : "(linhagem gnômica não escolhida)"}:`,
  ];

  if (lineage?.id === "gnomo-floresta") {
    const freeUses = getProficiencyBonus(character.level);
    lines.push("> Falar com Animais", `${freeUses} usos grátis / DL`, "> Ilusão Menor");
  } else if (lineage?.id === "gnomo-rocha") {
    lines.push(
      ">Remendo",
      ">Prestidigitação",
      "10 min produzindo: Cria objeto pequeno com 1 efeito do truque",
      "AB p/ ativar. Dura 8h",
      "Max de 3 itens p/ vez",
    );
  }

  return lines.join("\n");
}

const GOLIATH_ANCESTRY_TEXT: Record<string, string> = {
  "golias-gelo": "Ao acertar atq e causar dano: +1d6 Frio e -3m de desl. do alvo até início do seu próximo turno.",
  "golias-fogo": "Ao acertar atq e causar dano: +1d10 Fogo.",
  "golias-pedra": "Reação ao sofrer dano: reduza em 1d12{CON.mod}.",
  "golias-nuvens": "AB: teleporte até 9m para espaço desocupado à vista.",
  "golias-colina": "Ao acertar atq e causar dano em criatura Grande ou menor: pode deixá-la Caída.",
  "golias-tempestade": "Reação ao sofrer dano de criatura a até 18m: cause 1d8 Trovejante nela.",
};

function getGoliathPrintedText(character: Character): string {
  const ancestry = findSpeciesLineageOption("golias", character.speciesLineageId);
  const lines: string[] = [];

  if (character.level >= 5) {
    lines.push("# FORMA GRANDE", "> Dura 10min | Ação Bônus | 1 p/ DL", "> Tamanho = Grande: Vantagem em Testes de Força e +3m de desl.");
  }

  lines.push(`# GIGANTE ${ancestry ? ancestry.name : "(ainda não escolhida)"}:`);
  if (ancestry) {
    const conMod = getAbilityModifier(getEffectiveAbilityScore(character, "CON"));
    // Conector com sinal embutido (" + 2" / " - 1") — nunca concatena um "+" fixo com
    // `formatSigned` (que já devolve "-1"), senão dá "+ -1" (evitado por instrução explícita).
    const connector = conMod >= 0 ? ` + ${conMod}` : ` - ${Math.abs(conMod)}`;
    const template = GOLIATH_ANCESTRY_TEXT[ancestry.id].replace("{CON.mod}", connector);
    lines.push(`> ${template}`, `Usos: ${getProficiencyBonus(character.level)}/DL`);
  }

  return lines.join("\n");
}

function getTieflingPrintedText(character: Character): string {
  const lineage = findSpeciesLineageOption("tiefling", character.speciesLineageId);
  const infernal = lineage ? INFERNAL_LINEAGES.find((option) => option.id === lineage.id) : undefined;

  const lines = ["# VISÃO NO ESCURO 18m", "# TAUMATURGIA", `# LINHAGEM ${infernal ? infernal.name : "(ainda não escolhida)"}:`];
  if (infernal) {
    lines.push(`> Resistência a dano ${infernal.damageType}`, `>${infernal.cantripLevel1}`);
    if (character.level >= 3) lines.push(`>${infernal.spellLevel3}`);
    if (character.level >= 5) lines.push(`>${infernal.spellLevel5}`);
  }

  return lines.join("\n");
}
