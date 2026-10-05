/**
 * Catálogo de opções de Metamagia do Feiticeiro — fonte "INTEGRAÇÃO
 * COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" §12-21. `summary` é a
 * regra mecânica completa (Builder/Ficha Web); `printedLine` é o texto
 * compacto EXCLUSIVO do PDF (nunca fonte de cálculo — sempre montado a
 * partir da regra completa, aqui já estático porque nenhuma opção
 * depende de valor dinâmico do personagem: "CAR" nos textos é a
 * própria regra escrita por extenso, não uma variável a resolver).
 *
 * Regra geral (§11): normalmente só 1 opção de Metamagia pode
 * modificar a mesma magia — exceto Magia Buscadora e Magia
 * Potencializada, que podem ser usadas mesmo que outra já tenha sido
 * usada na mesma conjuração. Feitiçaria Encarnada (nível 7) e Apoteose
 * Arcana (nível 20) alteram essa regra geral enquanto Feitiçaria Inata
 * estiver ativa — ver `data/features/sorcerer.ts`.
 */
export interface MetamagicOptionDefinition {
  id: string;
  name: string;
  summary: string;
  printedLine: string;
}

export const metamagicOptions: MetamagicOptionDefinition[] = [
  {
    id: "acelerada",
    name: "Magia Acelerada",
    summary:
      "Custo: 2 Pontos de Feitiçaria. Elegível: magia com tempo de conjuração de 1 ação. Efeito: o tempo de conjuração passa a Ação Bônus. Restrições: não pode ser usada se você já tiver conjurado uma magia de 1º círculo ou superior neste turno; depois de usá-la, não pode conjurar outra magia de 1º círculo ou superior neste turno.",
    printedLine: "> Acelerada 2PF: magia 1 ação -> AB; não combine com outra magia 1o+ no turno",
  },
  {
    id: "agravada",
    name: "Magia Agravada",
    summary: "Custo: 2 Pontos de Feitiçaria. Quando uma magia sua força uma salvaguarda, escolha 1 alvo: ele recebe Desvantagem na salvaguarda contra essa magia.",
    printedLine: "> Agravada 2PF: 1 alvo tem Desv nas Salv contra a magia",
  },
  {
    id: "buscadora",
    name: "Magia Buscadora",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Quando um Ataque de magia erra, pode rerrolar o d20 e deve usar obrigatoriamente o novo resultado. Pode ser combinada com outra opção de Metamagia na mesma conjuração — exceção explícita à regra geral de só 1 Metamagia por magia.",
    printedLine: "> Buscadora 1PF: Atq magia erra -> rerrole d20, use novo; combina com outra Meta",
  },
  {
    id: "cautelosa",
    name: "Magia Cautelosa",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Ao conjurar uma magia que force salvaguarda, escolha até um número de criaturas igual ao modificador de Carisma (mínimo 1 criatura): elas passam automaticamente na salvaguarda; se o sucesso normalmente causaria metade do dano, essas criaturas não recebem nenhum dano.",
    printedLine: "> Cautelosa 1PF: até CAR alvos, mín 1, passam Salv; 0 dano se sucesso daria 1/2",
  },
  {
    id: "distante",
    name: "Magia Distante",
    summary: "Custo: 1 Ponto de Feitiçaria. Se a magia tiver alcance de 1,5m ou mais, o alcance dobra. Se a magia tiver alcance Toque, o alcance passa a 9m.",
    printedLine: "> Distante 1PF: alcance >=1,5m x2; Toque -> 9m",
  },
  {
    id: "duplicada",
    name: "Magia Duplicada",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Elegível: magia que pode ser conjurada com um espaço de círculo maior para atingir 1 criatura adicional. Efeito: o círculo efetivo da magia aumenta em 1 para esse propósito.",
    printedLine: "> Duplicada 1PF: magia que ganha +1 alvo em círculo maior -> círculo efetivo +1",
  },
  {
    id: "persistente",
    name: "Magia Persistente",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Elegível: magia com duração de 1 minuto ou mais. Efeito: a duração dobra, até um máximo de 24 horas. Se a magia exigir Concentração, você ganha Vantagem nas salvaguardas para mantê-la.",
    printedLine: "> Persistente 1PF: duração >=1min x2, máx 24h; Vant Salv Concent",
  },
  {
    id: "potencializada",
    name: "Magia Potencializada",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Ao rolar dano de uma magia, pode rerrolar até um número de dados igual ao modificador de Carisma (mínimo 1) e deve usar os novos resultados. Pode ser combinada com outra opção de Metamagia na mesma conjuração — exceção explícita à regra geral de só 1 Metamagia por magia.",
    printedLine: "> Potencializada 1PF: rerrole até CAR dados de dano, mín 1; use novos; combina com outra Meta",
  },
  {
    id: "sutil",
    name: "Magia Sutil",
    summary: "Custo: 1 Ponto de Feitiçaria. Conjura a magia sem componentes Verbais, Somáticos ou Materiais, exceto Material consumido ou com custo especificado.",
    printedLine: "> Sutil 1PF: sem V/S/M, exc M consumido/com custo",
  },
  {
    id: "transmutada",
    name: "Magia Transmutada",
    summary:
      "Custo: 1 Ponto de Feitiçaria. Ao conjurar uma magia que causa dano Ácido, Elétrico, Fogo, Gelo, Trovejante ou Venenoso, pode substituir o tipo de dano por outro tipo dessa mesma lista.",
    printedLine: "> Transmutada 1PF: Ácido/Elétrico/Fogo/Gelo/Trovejante/Venenoso -> outro da lista",
  },
];

export const metamagicOptionsById: Record<string, MetamagicOptionDefinition> = Object.fromEntries(
  metamagicOptions.map((option) => [option.id, option]),
);
