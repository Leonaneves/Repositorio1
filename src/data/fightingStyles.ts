/**
 * Catálogo dos 10 Talentos de Estilo de Luta (PHB 2024) — fonte
 * "IMPLEMENTAR TALENTOS DE ESTILO DE LUTA NO BUILDER E NO PDF" §3-§12.
 * `summary` é a regra mecânica completa, em texto próprio (Builder/Ficha
 * Web); `printedLine` é o texto compacto EXCLUSIVO da caixa "Talentos"
 * do PDF, copiado literalmente do modelo fornecido na fonte — nunca
 * expandido. Nenhum dos 10 estilos tem pré-requisito próprio além de
 * possuir a característica Estilo de Luta que o concede (Guerreiro
 * nível 1, Estilo de Luta Adicional do Campeão nível 7, ou a alternativa
 * de nível 2 do Patrulheiro/Paladino) — nenhum deles é repetível, e
 * nenhuma regra cadastrada permite possuir o mesmo estilo duas vezes por
 * origens diferentes (cross-exclusão em `rules/fightingStyles.ts`).
 *
 * `character.attacks` é texto livre manual (sem tabela estruturada de
 * armas/empunhadura) — por isso os 5 estilos que alterariam uma jogada
 * de ataque ou dano específico (Arquearia, Combate com Armas de
 * Arremesso, Combate com Armas Grandes, Combate com Duas Armas,
 * Duelismo) usam sempre a versão com texto-resumo do `printedLine`,
 * nunca a versão "nome isolado" (que exigiria um campo estruturado de
 * ataques inexistente no projeto). O mesmo vale para Luta às Cegas: não
 * existe campo de "Sentidos" no PDF (Visão no Escuro/às Cegas de outras
 * fontes é só texto dentro de Características de Classe), então também
 * usa sempre a versão com texto-resumo. Defensivo é o único com bônus
 * JÁ representado em campo próprio (CA, `rules/armor.ts`), por isso
 * imprime só o nome. Interceptação e Combate Desarmado guardam
 * placeholders (`{BP}`/`{danoDesarmado}`/`{danoSemArma}`) resolvidos em
 * runtime por `rules/fightingStyles.ts#getFightingStylePrintedLine` —
 * nunca impressos como chave/fórmula literal.
 */
export interface FightingStyleDefinition {
  id: string;
  name: string;
  summary: string;
  printedLine: string;
}

export const fightingStyles: FightingStyleDefinition[] = [
  {
    id: "arquearia",
    name: "Arquearia",
    summary:
      "+2 na jogada de ataque com armas da categoria À Distância — nunca no dano, nunca em ataques com magia ou em ataques corpo a corpo feitos com arma de Arremesso (esses continuam sem o bônus).",
    printedLine: "Arquearia: +2 Atq com armas à Distância",
  },
  {
    id: "combate-armas-arremesso",
    name: "Combate com Armas de Arremesso",
    summary:
      "+2 no dano de um ataque à distância feito com uma arma de propriedade Arremesso — nunca na jogada de ataque, e nunca quando a mesma arma é usada em um ataque corpo a corpo.",
    printedLine: "Combate com Armas de Arremesso: +2 dano ao arremessar",
  },
  {
    id: "combate-armas-grandes",
    name: "Combate com Armas Grandes",
    summary:
      "Ao rolar dano de uma arma corpo a corpo empunhada com as duas mãos (propriedade Duas Mãos, ou Versátil usada com as duas mãos — nunca Versátil usada com uma mão só), resultados de 1 ou 2 em qualquer dado de dano da arma são tratados como 3. Não exige a propriedade Pesada, e não é uma rerrolagem, nem substitui o dado por um fixo ou maior.",
    printedLine: "Combate com Armas Grandes: arma corpo a corpo Duas Mãos/Versátil em 2 mãos, dano 1/2 vira 3",
  },
  {
    id: "combate-duas-armas",
    name: "Combate com Duas Armas",
    summary:
      "Ao lutar com duas armas, soma o modificador de atributo ao dano do ataque bônus feito com a arma Leve, quando esse modificador ainda não é somado por outra regra — nunca dobra o bônus, e nunca concede um ataque ou Ação Bônus adicional por si só. Integra-se sem duplicar com Especialista em Besta/Especialista Ambidestro, que já cobrem a mesma soma por outra via.",
    printedLine: "Combate com Duas Armas: Atq adicional Leve soma atributo ao dano",
  },
  {
    id: "combate-desarmado",
    name: "Combate Desarmado",
    summary:
      "Seu Ataque Desarmado causa 1d6+mod. de Força de dano Concussivo — ou 1d8+mod. de Força se nenhuma das suas mãos estiver empunhando arma ou escudo. Essa opção nunca sobrepõe um dano melhor concedido por outra fonte, e nunca se acumula com o dano normal do Ataque Desarmado. Além disso, no início de cada um dos seus turnos, uma criatura que você tenha Imobilizado sofre 1d4 de dano Concussivo (sem somar modificador) — sem exigir ação, Ação Bônus ou Reação, e nunca como um uso limitado por descanso.",
    printedLine: "Combate Desarmado: início do turno, 1d4 Conc a 1 criatura Imobilizada por você\nDesarmado {danoDesarmado}; sem arma/Escudo {danoSemArma} Conc",
  },
  {
    id: "defensivo",
    name: "Defensivo",
    summary:
      "+1 na CA enquanto estiver vestindo armadura Leve, Média ou Pesada — nunca desarmado/sem armadura, e nunca um bônus baseado só em escudo. Soma-se normalmente ao bônus de escudo, quando houver.",
    printedLine: "Defensivo",
  },
  {
    id: "duelismo",
    name: "Duelismo",
    summary:
      "+2 no dano enquanto empunhar exatamente uma arma corpo a corpo em uma mão e nenhuma outra arma na outra mão (um escudo na outra mão não desqualifica). Empunhar uma arma Versátil com as duas mãos desqualifica o bônus. Nunca exige a propriedade Leve ou Precisão, e nunca afeta a jogada de ataque.",
    printedLine: "Duelismo: +2 dano com arma corpo a corpo em 1 mão, sem outra arma",
  },
  {
    id: "interceptacao",
    name: "Interceptação",
    summary:
      "Reação quando uma criatura que você pode ver acerta um ataque contra outra criatura a até 1,5m de você (você precisa estar a essa distância do alvo, não do atacante): reduz o dano sofrido por essa outra criatura em 1d10 + seu bônus de proficiência. Exige estar com um Escudo ou uma arma Simples/Marcial equipada. Nunca protege você mesmo, nunca se restringe a ataques corpo a corpo ou com arma, nunca aumenta CA, nunca impõe Desvantagem e nunca se torna Resistência.",
    printedLine: "Interceptação: com arma/Escudo, Reação ao acerto em outro a 1,5m: reduz 1d10+{BP} dano",
  },
  {
    id: "luta-as-cegas",
    name: "Luta às Cegas",
    summary:
      "Concede Visão às Cegas em um raio de 3m. Se outra fonte já concede Visão às Cegas, prevalece o maior alcance entre as duas — nunca somados. Nunca substitui Visão no Escuro ou outro sentido diferente.",
    printedLine: "Luta às Cegas: Visão às Cegas 3m",
  },
  {
    id: "protetivo",
    name: "Protetivo",
    summary:
      "Exige um Escudo equipado. Reação quando você vê uma criatura a até 1,5m de você ser atingida por uma jogada de ataque (o gatilho é a própria jogada de ataque, não o resultado/acerto nem o dano): impõe Desvantagem nessa jogada. Enquanto você permanecer a até 1,5m daquela criatura, também impõe Desvantagem nas jogadas de ataque subsequentes contra ela até o início do seu próximo turno — nunca limitado ao primeiro ataque ou ao primeiro atacante, nunca protege você mesmo, e nunca reduz dano ou aumenta CA.",
    printedLine: "Protetivo: com Escudo, Reação: Desv nos Atq contra outro a 1,5m até início do prxm turno, enquanto próximo",
  },
];

export const fightingStylesById: Record<string, FightingStyleDefinition> = Object.fromEntries(
  fightingStyles.map((style) => [style.id, style]),
);

/** Nomes dos 10 Estilos de Luta, na ordem do catálogo — opções estáticas padrão dos 4 pontos de concessão (`data/features/{fighter,ranger,paladin}.ts`, `data/features/subclasses.ts`). */
export const FIGHTING_STYLE_NAMES: string[] = fightingStyles.map((style) => style.name);

export const fightingStylesByName: Record<string, FightingStyleDefinition> = Object.fromEntries(
  fightingStyles.map((style) => [style.name, style]),
);
