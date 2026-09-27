/**
 * `= floor((valor - 10) / 2)` — extraído literalmente dos scripts
 * `<ATR>.MOD` do PDF original.
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Bônus de proficiência por nível (1–20). Extraído literalmente do
 * script `PROFICIENCIA` do PDF original.
 *
 * Por decisão do projeto, este valor NÃO aceita ajuste manual (não há
 * forma de alterá-lo pelas regras do D&D) — por isso retorna `number`
 * puro, e não `ComputedValue` como os demais valores derivados.
 */
export function getProficiencyBonus(level: number): number {
  if (level >= 1 && level <= 4) return 2;
  if (level >= 5 && level <= 8) return 3;
  if (level >= 9 && level <= 12) return 4;
  if (level >= 13 && level <= 16) return 5;
  if (level >= 17 && level <= 20) return 6;
  throw new RangeError(`Nível inválido: ${level}. Esperado um inteiro entre 1 e 20.`);
}
