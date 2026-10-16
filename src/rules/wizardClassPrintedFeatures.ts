import type { Character } from "../domain/character.js";
import { getArcaneRecoveryLimit } from "./classResources.js";
import { getWizardSignatureSpellEntries } from "./wizardSpellbook.js";

/**
 * Texto compacto para impressão da classe BASE do Mago (fonte
 * "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" §6) — mesmo
 * padrão de `rules/rogueClassPrintedFeatures.ts`. Mostra só os blocos
 * liberados pelo nível atual; Acadêmico/Conjuração/concessões ao livro/
 * oportunidades de Talento nunca aparecem aqui (ficam em Perícias/
 * Magias/Talentos).
 */

function getRitualAdeptBlock(): string {
  return ["# ADEPTO DE RITUAL", "> Ritual do livro sem preparar; exige ler o livro"].join("\n");
}

function getArcaneRecoveryBlock(character: Character): string {
  const limit = getArcaneRecoveryLimit(character) ?? 0;
  return ["# RECUPERAÇÃO ARCANA", `> Após DC: recupera espaços somando ${limit} círculos, até 5º cada [__]/DL`].join("\n");
}

function getMemorizeSpellBlock(): string {
  return ["# MEMORIZAR MAGIA", "> DC com livro: troca 1 magia preparada por outra do livro"].join("\n");
}

function getSpellMasteryBlock(): string {
  return [
    "# MAESTRIA DE MAGIAS",
    "> 1 magia de 1º e 1 de 2º, de 1 ação: sempre preparadas, sem espaço no círculo base",
    "> DL: troca 1 por outra do mesmo círculo do livro",
  ].join("\n");
}

function getSignatureSpellBlock(character: Character): string {
  const entries = getWizardSignatureSpellEntries(character);
  const name1 = entries[0]?.name || "—";
  const name2 = entries[1]?.name || "—";
  return ["# ASSINATURA MÁGICA", `> ${name1}: sem espaço no 3º [__]/DC ou DL`, `> ${name2}: sem espaço no 3º [__]/DC ou DL`].join("\n");
}

export function getWizardClassPrintedBlocks(character: Character): string[] {
  if (character.classId !== "mago") return [];
  const blocks: string[] = [getRitualAdeptBlock(), getArcaneRecoveryBlock(character)];
  if (character.level >= 5) blocks.push(getMemorizeSpellBlock());
  if (character.level >= 18) blocks.push(getSpellMasteryBlock());
  if (character.level >= 20) blocks.push(getSignatureSpellBlock(character));
  return blocks;
}
