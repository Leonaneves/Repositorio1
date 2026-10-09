import type { Character } from "../domain/character.js";
import { getWildShapeUses } from "./classResources.js";
import { FURIA_ELEMENTAL_CHOICE_ID } from "../data/features/druid.js";
import { getDruidSubclassPrintedBlocks, getDruidWildShapeLuaModifications } from "./druidSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Druida ("Características de
 * Classe", campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte
 * "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES". Representação SEPARADA
 * da regra estruturada completa (`data/features/druid.ts` +
 * `rules/classResources.ts`): nunca usada para cálculo, só montada a
 * partir dela — nunca um texto gigante hardcoded por combinação de
 * nível/subclasse.
 *
 * "Forma Selvagem" (abreviada "FS") é o recurso central: o bloco
 * impresso sempre começa pelas linhas-base e depois recebe, na ordem
 * de aquisição, as atualizações da própria classe (Ressurgimento
 * Selvagem no 5, Magias Bestiais no 18, Arquidruida no 20) e do
 * Círculo da Lua (`getDruidWildShapeLuaModifications`) — nunca um
 * segundo bloco/checkbox. "Fúria Elemental" só imprime a opção
 * escolhida (Ataque Primal OU Conjuração Poderosa); o upgrade do nível
 * 15 atualiza o MESMO bloco, nunca "Fúria Elemental Aprimorada".
 *
 * Nunca aparecem aqui (ficam em Perícias/Proficiências/Magias/
 * Deslocamento ou no sistema de Talentos/ASI): Conjuração, Ordem
 * Primal, Protetor, Xamã, Subclasse de Druida, Aumento no Valor de
 * Atributo, Dádiva Épica, Companheiro Selvagem, Mapa Estelar e as
 * listas de Magias de Círculo.
 */

function checkboxes(count: number): string {
  return "[__]".repeat(Math.max(0, count));
}

function getDruidIdiomaDruidicoText(): string {
  return ["#Idioma Druídico", "Mensagens ocultas; outros detectam com Invest CD15, mas não decifram sem magia"].join("\n");
}

function getDruidFormaSelvagemText(character: Character): string | null {
  if (character.level < 2) return null;

  const uses = getWildShapeUses(character) ?? 0;
  const lines: string[] = [`#Forma Selvagem ${checkboxes(uses)}`, "AB: Fera conhecida por 1/2 nível h; sair AB"];

  const luaMod = getDruidWildShapeLuaModifications(character);
  if (luaMod) {
    lines.push(luaMod.pvTempLine, luaMod.usaBlocoLine);
  } else {
    lines.push("PV Temp = nível; usa bloco Fera, mantém tipo/PV/DV, INT/SAB/CAR, classe, idiomas, talentos e Prof perícias/Salv");
  }

  lines.push(character.level >= 18 ? "Pode conjurar em FS, exc Material com custo/consumido; Concent mantém" : "Sem conjurar; Concent mantém");

  if (luaMod) lines.push(...luaMod.extraLines);

  if (character.level >= 5) {
    lines.push("> 1/turno, 0 FS: 1 espaço -> +1 FS", "> [__] 1 FS -> +1 espaço 1o. 1/DL");
  }

  if (character.level >= 20) {
    lines.push("> Inic com 0 FS -> +1 FS", "> [__] Converta FS em 1 espaço: círculo = 2 x FS gastos. 1/DL");
  }

  lines.push("DC: +1 uso; DL: todos");
  return lines.join("\n");
}

function getDruidFuriaElementalText(character: Character): string | null {
  if (character.level < 7) return null;

  const choice = character.featureChoiceSelections[FURIA_ELEMENTAL_CHOICE_ID]?.value;

  if (choice === "Ataque Primal") {
    const dice = character.level >= 15 ? "2d8" : "1d8";
    return ["#Ataque Primal", `1/turno, Atq arma/Fera em FS -> +${dice} Elétrico/Frio/Fogo/Trovão`].join("\n");
  }

  if (choice === "Conjuração Poderosa") {
    const lines = ["#Conjuração Poderosa", "Truques Druida +SAB dano"];
    if (character.level >= 15) lines.push("Alcance >=3m -> 90m");
    return lines.join("\n");
  }

  return null;
}

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do
 * Druida já adquiridos no nível atual — classe + subclasse
 * entrelaçadas pelo nível, mesmo padrão de
 * `rules/clericPrintedFeatures.ts`. "Forma Selvagem" fica fixa no
 * nível 2 (nível de aquisição da classe) mesmo contendo modificações
 * de subclasse de nível maior.
 */
export function getDruidPrintedBlocks(character: Character): string[] {
  if (character.classId !== "druida") return [];

  const blocks: { level: number; text: string }[] = [{ level: 1, text: getDruidIdiomaDruidicoText() }];

  const formaSelvagem = getDruidFormaSelvagemText(character);
  if (formaSelvagem) blocks.push({ level: 2, text: formaSelvagem });

  const furiaElemental = getDruidFuriaElementalText(character);
  if (furiaElemental) blocks.push({ level: 7, text: furiaElemental });

  blocks.push(...getDruidSubclassPrintedBlocks(character));

  return blocks.sort((a, b) => a.level - b.level).map((b) => b.text);
}
