/**
 * Tabela de progressão de espaços de magia para CONJURADOR COMPLETO,
 * indexada por nível de conjurador efetivo (0–20; índice 0 = nenhum
 * espaço). Cada linha tem 9 posições (círculos 1–9). Extraída
 * literalmente de `tabelaCompleta` no script `Esp.mag.*` do PDF
 * original — fonte de verdade em `docs/referencia/scripts-acrobat/por-campo/Esp.mag.1__calculate.js`.
 *
 * Usada também por meio-conjuradores (nível efetivo = ceil(nível/2)) e
 * por terço-conjuradores via subclasse (nível efetivo = ceil(nível/3)).
 */
export const FULL_CASTER_SLOT_TABLE: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // nível 0 (sem conjuração)
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // nível 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // nível 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // nível 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // nível 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // nível 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // nível 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // nível 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // nível 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // nível 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // nível 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // nível 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // nível 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // nível 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // nível 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // nível 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // nível 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // nível 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // nível 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // nível 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // nível 20
];

/**
 * Progressão de espaços de magia do ARTÍFICE — indexada diretamente
 * pelo NÍVEL DO PERSONAGEM (não "nível de conjurador efetivo"), com 5
 * posições (círculos 1–5, o Artífice nunca ultrapassa o 5º). Transcrita
 * literalmente da fonte fornecida (mensagem "DADOS DE CLASSE —
 * ARTÍFICE"). Numericamente, esta tabela coincide em todos os 20
 * níveis com a fórmula genérica de meio-conjurador (`ceil(nível/2)`
 * em `FULL_CASTER_SLOT_TABLE`, truncada aos 5 primeiros círculos) —
 * mas fica registrada explicitamente, e não derivada da fórmula,
 * porque a fonte fornecida é a autoridade aqui: uma tabela própria não
 * corre o risco de divergir silenciosamente se a fórmula genérica for
 * ajustada no futuro por causa de outra classe.
 */
export const ARTIFICER_SLOT_TABLE: Record<number, readonly number[]> = {
  1: [2, 0, 0, 0, 0],
  2: [2, 0, 0, 0, 0],
  3: [3, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0],
  5: [4, 2, 0, 0, 0],
  6: [4, 2, 0, 0, 0],
  7: [4, 3, 0, 0, 0],
  8: [4, 3, 0, 0, 0],
  9: [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0],
  11: [4, 3, 3, 0, 0],
  12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0],
  14: [4, 3, 3, 1, 0],
  15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
};

export interface PactMagicState {
  /** Círculo em que os espaços de Magia de Pacto do Bruxo operam neste nível (0 = nenhum). */
  slotCircle: number;
  /** Quantidade de espaços de Magia de Pacto neste nível. */
  slotCount: number;
}

/**
 * Progressão de Magia de Pacto do Bruxo, independente de
 * `FULL_CASTER_SLOT_TABLE` — todos os espaços ficam concentrados num
 * único círculo. Extraída literalmente do mesmo script.
 */
export const PACT_MAGIC_TABLE: Record<number, PactMagicState> = {
  1: { slotCircle: 1, slotCount: 1 },
  2: { slotCircle: 1, slotCount: 2 },
  3: { slotCircle: 2, slotCount: 2 },
  4: { slotCircle: 2, slotCount: 2 },
  5: { slotCircle: 3, slotCount: 2 },
  6: { slotCircle: 3, slotCount: 2 },
  7: { slotCircle: 4, slotCount: 2 },
  8: { slotCircle: 4, slotCount: 2 },
  9: { slotCircle: 5, slotCount: 2 },
  10: { slotCircle: 5, slotCount: 2 },
  11: { slotCircle: 5, slotCount: 3 },
  12: { slotCircle: 5, slotCount: 3 },
  13: { slotCircle: 5, slotCount: 3 },
  14: { slotCircle: 5, slotCount: 3 },
  15: { slotCircle: 5, slotCount: 3 },
  16: { slotCircle: 5, slotCount: 3 },
  17: { slotCircle: 5, slotCount: 4 },
  18: { slotCircle: 5, slotCount: 4 },
  19: { slotCircle: 5, slotCount: 4 },
  20: { slotCircle: 5, slotCount: 4 },
};
