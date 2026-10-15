/**
 * Catálogo das 20 Manobras do Mestre de Batalha (Guerreiro) — fonte
 * "IMPLEMENTAR SUBCLASSES DO GUERREIRO NO BUILDER E NO PDF" §7/§8.
 * `summary` é a regra mecânica completa, em texto próprio (Builder/Ficha
 * Web); `printedLine` é o texto compacto EXCLUSIVO do PDF, copiado
 * literalmente do modelo fornecido na fonte — nunca expandido. Duas
 * entradas (`aparar`/`recuperar-energia`) guardam placeholders
 * (`{FOR ou DEX, o que for maior}`/`{metadeNivel}`) resolvidos em
 * runtime por `rules/maneuvers.ts#getManeuverPrintedLine` — nunca
 * impressos como chave/fórmula literal.
 *
 * Todas gastam 1 Dado de Superioridade (DS) ao usar, salvo quando o
 * personagem usa Implacável (nível 15) — esse custo é mostrado uma
 * única vez no bloco "SUPERIORIDADE EM COMBATE", nunca repetido por
 * manobra (§6/§8).
 */
export interface ManeuverDefinition {
  id: string;
  name: string;
  summary: string;
  printedLine: string;
}

export const maneuvers: ManeuverDefinition[] = [
  {
    id: "aparar",
    name: "Aparar",
    summary:
      "Reação quando você sofre dano de um ataque corpo a corpo de outra criatura: reduz o dano recebido pelo DS + modificador de FOR ou DEX, escolhido no momento do uso — essa escolha é independente do atributo escolhido para a CD de Manobras.",
    printedLine: "> Aparar: Reação ao sofrer dano corpo a corpo: reduz DS+{FOR ou DEX, o que for maior}",
  },
  {
    id: "ataque-ameacador",
    name: "Ataque Ameaçador",
    summary:
      "Ao acertar uma criatura com uma jogada de ataque, soma o DS ao dano. A criatura faz uma salvaguarda de Sabedoria; se falhar, fica Amedrontada até o fim do próximo turno do personagem.",
    printedLine: "> Ataque Ameaçador: acerto, +DS dano; Salv SAB falha: Amedrontado até fim do prxm turno",
  },
  {
    id: "ataque-de-varredura",
    name: "Ataque de Varredura",
    summary:
      "Ao acertar com ataque corpo a corpo com arma ou Ataque Desarmado, escolhe outra criatura a até 1,5m do alvo original e ao alcance; se a mesma jogada de ataque também atingiria a CA dessa segunda criatura, ela sofre dano igual ao DS, do mesmo tipo do ataque original — nunca o dano completo do ataque.",
    printedLine: "> Ataque de Varredura: acerto corpo a corpo com arma/desarmado; se mesma jogada acertar outro a 1,5m do alvo: DS dano",
  },
  {
    id: "ataque-estendido",
    name: "Ataque Estendido",
    summary:
      "Ação Bônus para usar a ação Correr. Se mover pelo menos 1,5m em linha reta imediatamente antes de um ataque corpo a corpo feito na ação Atacar naquele turno, soma o DS ao dano desse ataque — não aumenta alcance.",
    printedLine: "> Ataque Estendido: AB Correr; mover 1,5m em linha reta antes de atq corpo a corpo da ação Atacar: +DS dano",
  },
  {
    id: "ataque-para-distrair",
    name: "Ataque para Distrair",
    summary:
      "Ao acertar uma criatura, soma o DS ao dano. O próximo ataque de outra criatura contra o alvo tem Vantagem, se ocorrer antes do início do próximo turno do personagem.",
    printedLine: "> Ataque para Distrair: acerto, +DS dano; prxm atq de outro contra alvo: Vant até início do prxm turno",
  },
  {
    id: "ataque-preciso",
    name: "Ataque Preciso",
    summary: "Depois de errar uma jogada de ataque, soma o DS a essa jogada, podendo transformar o erro em acerto.",
    printedLine: "> Ataque Preciso: errou atq: +DS na jogada",
  },
  {
    id: "ataque-provocante",
    name: "Ataque Provocante",
    summary:
      "Ao acertar uma criatura, soma o DS ao dano. A criatura faz uma salvaguarda de Sabedoria; se falhar, fica com Desvantagem nos ataques contra outros alvos até o fim do próximo turno do personagem.",
    printedLine: "> Ataque Provocante: acerto, +DS dano; Salv SAB falha: Desv contra outros até fim do prxm turno",
  },
  {
    id: "avaliacao-tatica",
    name: "Avaliação Tática",
    summary:
      "Soma o DS a um teste de INT (História ou Investigação) ou SAB (Intuição) — não aumenta permanentemente o bônus dessas perícias.",
    printedLine: "> Avaliação Tática: +DS em História/Investigação/Intuição",
  },
  {
    id: "contra-ataque",
    name: "Contra-ataque",
    summary:
      "Quando uma criatura erra um ataque corpo a corpo contra o personagem, Reação para fazer um ataque corpo a corpo com arma ou Ataque Desarmado contra ela; se acertar, soma o DS ao dano.",
    printedLine: "> Contra-ataque: errou atq corpo a corpo contra você: Reação, atq corpo a corpo com arma/desarmado +DS dano",
  },
  {
    id: "desarme",
    name: "Desarme",
    summary:
      "Ao acertar uma criatura, soma o DS ao dano. A criatura faz uma salvaguarda de Força; se falhar, solta um objeto que esteja segurando, escolhido pelo personagem, que cai no espaço do alvo.",
    printedLine: "> Desarme: acerto, +DS dano; Salv FOR falha: solta 1 objeto escolhido",
  },
  {
    id: "emboscada",
    name: "Emboscada",
    summary:
      "Soma o DS a um teste de DEX (Furtividade) ou a uma rolagem de Iniciativa, salvo se o personagem estiver Incapacitado.",
    printedLine: "> Emboscada: +DS em Furtividade/Iniciativa salvo Incapacitado",
  },
  {
    id: "encontrao",
    name: "Encontrão",
    summary:
      "Ao acertar com arma ou Ataque Desarmado, soma o DS ao dano. Se o alvo for Grande ou menor, faz uma salvaguarda de Força; se falhar, é empurrado até 4,5m para longe do personagem — o dano adicional não depende do tamanho do alvo, só a tentativa de empurrar depende.",
    printedLine: "> Encontrão: acerto com arma/desarmado, +DS dano; Grande ou menor: Salv FOR falha, empurra 4,5m",
  },
  {
    id: "finta",
    name: "Finta",
    summary:
      "Ação Bônus: escolhe uma criatura a até 1,5m. Tem Vantagem no próximo ataque contra ela naquele turno; se acertar, soma o DS ao dano.",
    printedLine: "> Finta: AB, alvo a 1,5m; Vant no prxm atq contra ele neste turno +DS dano",
  },
  {
    id: "gato-por-lebre",
    name: "Gato Por Lebre",
    summary:
      "No próprio turno, gastando pelo menos 1,5m de deslocamento, troca de posição com uma criatura voluntária e não Incapacitada a até 1,5m, sem provocar Ataque de Oportunidade. O personagem ou a outra criatura, à escolha, recebe o DS como bônus na CA até o início do próximo turno do personagem.",
    printedLine: "> Gato Por Lebre: no seu turno, gastar 1,5m de movimento: trocar com voluntário não Incapacitado a 1,5m sem Atq de Oport; você ou ele +DS CA até prxm turno",
  },
  {
    id: "golpe-do-comandante",
    name: "Golpe do Comandante",
    summary:
      "Na ação Atacar do próprio turno, substitui um dos ataques: escolhe uma criatura voluntária que possa vê-lo ou ouvi-lo, que pode usar imediatamente a própria Reação para fazer um ataque com arma ou Ataque Desarmado; se acertar, soma o DS ao dano. Não exige Ação Bônus do personagem.",
    printedLine: "> Golpe do Comandante: trocar 1 atq: aliado usa Reação para atq com arma/desarmado +DS dano",
  },
  {
    id: "manobrar",
    name: "Manobrar",
    summary:
      "Ao acertar uma criatura, soma o DS ao dano. Escolhe uma criatura voluntária que possa vê-lo ou ouvi-lo; ela pode usar a própria Reação para se mover até metade do deslocamento sem provocar Ataque de Oportunidade do alvo atingido — a proteção não se estende a outras criaturas.",
    printedLine: "> Manobrar: acerto, +DS dano; aliado usa Reação: mover 1/2 desl sem Atq de Oport do alvo",
  },
  {
    id: "movimentacao-evasiva",
    name: "Movimentação Evasiva",
    summary: "Ação Bônus para usar a ação Desengajar. Soma o DS à CA até o início do próximo turno do personagem.",
    printedLine: "> Movimentação Evasiva: AB Desengajar +DS CA até início do prxm turno",
  },
  {
    id: "presenca-de-autoridade",
    name: "Presença de Autoridade",
    summary: "Soma o DS a um teste de CAR (Atuação, Intimidação ou Persuasão).",
    printedLine: "> Presença de Autoridade: +DS em Atuação/Intimidação/Persuasão",
  },
  {
    id: "prostrar",
    name: "Prostrar",
    summary:
      "Ao acertar com arma ou Ataque Desarmado, soma o DS ao dano. Se o alvo for Grande ou menor, faz uma salvaguarda de Força; se falhar, fica Caído — o dano adicional não depende do tamanho do alvo.",
    printedLine: "> Prostrar: acerto com arma/desarmado, +DS dano; Grande ou menor: Salv FOR falha, Caído",
  },
  {
    id: "recuperar-energia",
    name: "Recuperar Energia",
    summary:
      "Ação Bônus: escolhe um aliado a até 9m que possa vê-lo ou ouvi-lo. O aliado recebe Pontos de Vida Temporários iguais ao DS + metade do nível de Guerreiro do personagem, arredondada para baixo. Não é cura nem recupera DS.",
    printedLine: "> Recuperar Energia: AB, aliado a 9m recebe DS+{metadeNivel} PV Temporários",
  },
];

export const maneuversById: Record<string, ManeuverDefinition> = Object.fromEntries(
  maneuvers.map((maneuver) => [maneuver.id, maneuver]),
);
