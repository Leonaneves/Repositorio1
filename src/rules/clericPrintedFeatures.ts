import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { getChannelDivinityUses } from "./classResources.js";
import { GOLPES_ABENCOADOS_CHOICE_ID } from "../data/features/cleric.js";
import { getClericChannelDivinityOptionLines, getClericSubclassPrintedBlocks } from "./clericSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Clérigo ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte
 * "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES". Representação SEPARADA
 * da regra estruturada completa (`data/features/cleric.ts` +
 * `rules/classResources.ts`): nunca usada para cálculo, só montada a
 * partir dela — nunca um texto gigante hardcoded por combinação de
 * nível/subclasse.
 *
 * "Canalizar Divindade" é um recurso ÚNICO: o bloco impresso sempre
 * começa com as linhas-base (Centelha Divina/Expulsar Mortos-Vivos) e
 * depois anexa as linhas da subclasse (`getClericChannelDivinityOptionLines`)
 * — nunca um segundo conjunto de checkboxes. "Fulminar Mortos-Vivos"
 * nunca cria bloco próprio: atualiza a linha de Expulsar Mortos-Vivos
 * a partir do nível 5. "Golpes Abençoados" só imprime a opção
 * escolhida (Conjuração Poderosa OU Golpe Divino); o upgrade do nível
 * 14 atualiza o MESMO bloco. "Intervenção Divina Maior" (nível 20)
 * também atualiza o bloco de Intervenção Divina, nunca um bloco
 * separado.
 *
 * Nunca aparecem aqui (ficam em Perícias/Proficiências/Magias ou no
 * sistema de Talentos/ASI): Conjuração, Ordem Divina, Protetor,
 * Taumaturgo, Subclasse de Clérigo, Aumento no Valor de Atributo,
 * Dádiva Épica, e as 4 listas de Magias de Domínio.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

/** Dados de Centelha Divina por nível: 2-6=>1d8, 7-12=>2d8, 13-17=>3d8, 18-20=>4d8. */
function getCentelhaDiceCount(level: number): number {
  if (level >= 18) return 4;
  if (level >= 13) return 3;
  if (level >= 7) return 2;
  return 1;
}

function getCanalizarDivindadeText(character: Character): string | null {
  if (character.classId !== "clerigo" || character.level < 2) return null;

  const uses = getChannelDivinityUses(character) ?? 0;
  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
  const centelhaDiceCount = getCentelhaDiceCount(character.level);

  const centelhaLine = `> Centelha: alvo 9m, ${centelhaDiceCount}d8+SAB PV ou Salv CON -> Necrótico/Radiante; sucesso 1/2 dano`;
  const expulsarLine =
    character.level >= 5
      ? `> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min + ${Math.max(1, wisdomMod)}d8 Radiante; este dano não encerra`
      : "> Expulsar Mortos-Vivos: 9m Salv SAB; falha Amed+Incap 1 min; dano encerra";

  const subclassLines = getClericChannelDivinityOptionLines(character);

  return [`#Canalizar Divindade ${checkboxes(uses)}`, "DC: +1 uso; DL: todos", centelhaLine, expulsarLine, ...subclassLines].join("\n");
}

function getGolpesAbencoadosText(character: Character): string | null {
  if (character.level < 7) return null;

  const choice = character.featureChoiceSelections[GOLPES_ABENCOADOS_CHOICE_ID]?.value;
  const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));

  if (choice === "Conjuração Poderosa") {
    const lines = ["#Conjuração Poderosa", "Truques de Clérigo +SAB dano"];
    if (character.level >= 14) {
      lines.push(`Ao causar dano -> você/alvo 18m ganha ${2 * wisdomMod} PV Temp`);
    }
    return lines.join("\n");
  }

  if (choice === "Golpe Divino") {
    const dice = character.level >= 14 ? "2d8" : "1d8";
    return ["#Golpe Divino", `1/turno, acerto com arma -> +${dice} Necrótico/Radiante`].join("\n");
  }

  return null;
}

function getIntervencaoDivinaText(character: Character): string | null {
  if (character.level < 10) return null;

  const lines = ["#Intervenção Divina [__]", "Ação: conjure magia Clérigo até 5º, exc Reação, sem espaço/Material. 1/DL"];
  if (character.level >= 20) {
    lines.push("> Pode escolher Desejo; se usar, recarga após 2d4 DL");
  }
  return lines.join("\n");
}

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do
 * Clérigo já adquiridos no nível atual — classe + subclasse
 * entrelaçadas pelo nível, mesmo padrão de
 * `rules/barbarianPrintedFeatures.ts`. O bloco de Canalizar Divindade
 * fica fixo no nível 2 (nível de aquisição da classe) mesmo contendo
 * linhas de subclasse de nível maior — a posição no texto final é
 * sempre a do recurso-base, nunca a da opção mais recente.
 */
export function getClericPrintedBlocks(character: Character): string[] {
  if (character.classId !== "clerigo") return [];

  const blocks: { level: number; text: string }[] = [];

  const canalizarDivindade = getCanalizarDivindadeText(character);
  if (canalizarDivindade) blocks.push({ level: 2, text: canalizarDivindade });

  const golpesAbencoados = getGolpesAbencoadosText(character);
  if (golpesAbencoados) blocks.push({ level: 7, text: golpesAbencoados });

  const intervencaoDivina = getIntervencaoDivinaText(character);
  if (intervencaoDivina) blocks.push({ level: 10, text: intervencaoDivina });

  blocks.push(...getClericSubclassPrintedBlocks(character));

  return blocks.sort((a, b) => a.level - b.level).map((b) => b.text);
}
