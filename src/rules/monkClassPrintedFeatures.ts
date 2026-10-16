import type { Character } from "../domain/character.js";
import {
  getDeflectAttacksReductionText,
  getDeflectAttacksRedirectDamageText,
  getExtraAttacksCount,
  getFocusPoints,
  getImprovedPatientDefenseTempHpText,
  getMonkFocusCd,
  getSlowFallReduction,
  getUnusualMetabolismHealingText,
} from "./classResources.js";

/**
 * Texto compacto para impressão da classe BASE do Monge (fonte
 * "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" §8) — mesmo
 * padrão de `rules/rogueClassPrintedFeatures.ts`/`wizardClassPrintedFeatures.ts`.
 * As 4 SUBCLASSES continuam em `rules/monkSubclassPrintedFeatures.ts`.
 *
 * Nunca aparecem aqui (auto-visíveis em campo próprio, ou resolvidos em
 * outra etapa): "Defesa sem Armadura" (CA já mostrada no campo de CA),
 * "Movimento sem Armadura" (deslocamento já mostrado no campo próprio —
 * `data/features/classes.ts#mechanicalClassFeatures`), "Corpo e Mente"
 * (atributos já mostrados nos próprios campos), "Subclasse de Monge",
 * "Aumento no Valor de Atributo", "Dádiva Épica".
 *
 * "Golpes Potencializados" (6), "Foco Aprimorado" (10), "Defletir
 * Energia" (13) e "Foco Perfeito" (15) NUNCA criam título próprio — só
 * atualizam/inserem linhas nos blocos de Artes Marciais/Foco/Defletir
 * Ataques/Metabolismo Incomum já existentes.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function getMartialArtsBlock(character: Character): string {
  const lines = ["# ARTES MARCIAIS", "> AB: +1 Atq Desarmado", "> Dano: pode usar dado de Artes Marciais", "> Atq/dano e CD Empurrar-Agarrar: pode usar DEX"];
  if (character.level >= 6) lines.push("> Atq Desarmado: pode causar Energético");
  return lines.join("\n");
}

export interface MonkFocusExtraLines {
  /** Passo Veloz (Caminho da Mão Aberta, nível 11) — entra logo após o grupo de Passo do Vento (§13: "Passo do Vento+Passo Veloz juntos"). */
  afterWindStep?: string[];
}

function getFocusBlock(character: Character, extraLines: MonkFocusExtraLines): string {
  const focusPoints = getFocusPoints(character) ?? 0;
  const improved = character.level >= 10;
  const tempHp = getImprovedPatientDefenseTempHpText(character) ?? "2d6";
  const torrenteCount = improved ? 3 : 2;

  const patientDefense = improved
    ? `> Defesa Paciente: AB Desengajar; com Foco +Esquivar e ${tempHp} PV Temp`
    : "> Defesa Paciente: AB Desengajar; com Foco +Esquivar";
  const windStep = improved
    ? "> Passo do Vento: AB Disparada; com Foco +Desengajar e salto dobrado; leva 1 voluntário Grande/menor 1,5m sem Atq de Oport"
    : "> Passo do Vento: AB Disparada; com Foco +Desengajar e salto dobrado";

  const lines = ["# FOCO", `> ${checkboxes(focusPoints)}/DC ou DL`, patientDefense, windStep];
  lines.push(...(extraLines.afterWindStep ?? []));
  lines.push(`> Torrente de Golpes: AB+1 Foco: ${torrenteCount} Atq Desarmado`);
  return lines.join("\n");
}

function getUnusualMetabolismBlock(character: Character): string {
  const healing = getUnusualMetabolismHealingText(character) ?? "1d6";
  const lines = ["# METABOLISMO INCOMUM", `> Inic: recupera Foco gasto + cura ${healing} [__]/DL`];
  if (character.level >= 15) lines.push("> Inic sem Metabolismo: recupera Foco até 4 se tiver menos");
  return lines.join("\n");
}

function getDeflectMissilesBlock(character: Character): string {
  const reduction = getDeflectAttacksReductionText(character) ?? "1d10";
  const redirect = getDeflectAttacksRedirectDamageText(character) ?? "2d6";
  const cd = getMonkFocusCd(character) ?? "—";
  const firstLine = character.level >= 13 ? `> Reação ao sofrer Atq: reduz ${reduction}` : `> Reação ao sofrer Atq Conc/Cort/Perf: reduz ${reduction}`;
  return [
    "# DEFLETIR ATAQUES",
    firstLine,
    `> Reduziu a 0: 1 Foco redireciona (corpo a corpo 1,5m/à distância 18m sem Cobertura Total); Salv DEX CD ${cd}; falha ${redirect} mesmo tipo`,
  ].join("\n");
}

function getSlowFallBlock(character: Character): string {
  const reduction = getSlowFallReduction(character) ?? 0;
  return ["# QUEDA LENTA", `> Reação em queda: reduz dano em ${reduction}`].join("\n");
}

function getExtraAttackBlock(character: Character): string {
  const totalAttacks = 1 + getExtraAttacksCount(character);
  return ["# ATAQUE EXTRA", `> Ação Atacar = ${totalAttacks} Atq`].join("\n");
}

function getStunningStrikeBlock(character: Character): string {
  const cd = getMonkFocusCd(character) ?? "—";
  return [
    "# GOLPE ATORDOANTE",
    `> 1/turno, acerto com Monge/Atq Desarmado: 1 Foco, Salv CON CD ${cd}; falha Atordoado até prxm turno; sucesso 1/2 Desl, prxm atq com Vant`,
  ].join("\n");
}

function getEvasionBlock(): string {
  return ["# EVASÃO", "> Salv DEX para 1/2 dano: sucesso 0, falha 1/2; indisponível se Incapacitado"].join("\n");
}

function getAcrobaticMovementBlock(): string {
  return ["# MOVIMENTO ACROBÁTICO", "> Sem armadura/escudo: move em superfícies verticais/líquidos sem cair"].join("\n");
}

function getSelfRestorationBlock(): string {
  return ["# RESTAURO PESSOAL", "> Fim do turno: remove Atordoado/Enfeitiçado/Envenenado de si; imune a Exaustão por fome/sede"].join("\n");
}

function getDisciplinedSurvivorBlock(): string {
  return ["# SOBREVIVENTE DISCIPLINADO", "> Prof em todas as Salv; falhou Salv: 1 Foco refaz a rolagem"].join("\n");
}

function getPerfectDefenseBlock(): string {
  return ["# DEFESA SUPERIOR", "> Início do turno: 3 Foco, Res a todo dano exceto Energético, 1min ou Incapacitado"].join("\n");
}

/**
 * Blocos da classe BASE do Monge já adquiridos no nível atual, em
 * ordem de aquisição — `focusExtraLines` deixa
 * `rules/monkSubclassPrintedFeatures.ts` injetar a linha de Passo Veloz
 * (Caminho da Mão Aberta) no MESMO bloco "FOCO", nunca duplicando o
 * título.
 */
export function getMonkClassPrintedBlocks(character: Character, focusExtraLines: MonkFocusExtraLines = {}): string[] {
  if (character.classId !== "monge") return [];

  const blocks: string[] = [getMartialArtsBlock(character)];
  if (character.level >= 2) {
    blocks.push(getFocusBlock(character, focusExtraLines));
    blocks.push(getUnusualMetabolismBlock(character));
  }
  if (character.level >= 3) blocks.push(getDeflectMissilesBlock(character));
  if (character.level >= 4) blocks.push(getSlowFallBlock(character));
  if (character.level >= 5) {
    blocks.push(getExtraAttackBlock(character));
    blocks.push(getStunningStrikeBlock(character));
  }
  if (character.level >= 7) blocks.push(getEvasionBlock());
  if (character.level >= 9) blocks.push(getAcrobaticMovementBlock());
  if (character.level >= 10) blocks.push(getSelfRestorationBlock());
  if (character.level >= 14) blocks.push(getDisciplinedSurvivorBlock());
  if (character.level >= 18) blocks.push(getPerfectDefenseBlock());

  return blocks;
}
