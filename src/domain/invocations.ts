/**
 * Invocações Místicas do Bruxo — fonte "INTEGRAÇÃO COMPLETA — BRUXO,
 * INVOCAÇÕES MÍSTICAS E SUBCLASSES". Modelo próprio, separado de
 * `FeatureDefinition`/`FeatureChoice` (domain/features.ts): a
 * quantidade disponível por nível, a elegibilidade cruzada entre
 * invocações/Pactos e a repetibilidade com sub-escolha não cabem na
 * engrenagem genérica de "uma escolha, N opções fixas" já usada para
 * perícias/armas/armaduras. `rules/invocations.ts` é quem resolve
 * tudo isso a partir deste catálogo + `Character.chosenInvocations`.
 */

export interface InvocationPrerequisite {
  /** Nível mínimo de Bruxo — `undefined` = sem exigência de nível. */
  minLevel?: number;
  /** Id de OUTRA invocação desta mesma lista que precisa já estar escolhida (Pacto incluído, já que Pactos também são invocações). */
  requiresInvocationId?: string;
}

/**
 * Algumas invocações exigem uma sub-escolha em texto livre ao serem
 * selecionadas (ex.: qual Truque afeta Explosão Agonizante, qual
 * Talento de Origem concede Lições dos Grandes Antigos) — nunca
 * validada contra um catálogo de magias/talentos (nenhum existe no
 * projeto). `required: true` bloqueia o Builder enquanto vazia;
 * `required: false` é só um campo opcional de "estado atual" para a
 * impressão (ex.: arma de pacto atual), que NUNCA é uma decisão
 * permanente/obrigatória (fonte §69).
 */
export interface InvocationSubChoice {
  label: string;
  required: boolean;
}

export interface InvocationDefinition {
  id: string;
  name: string;
  prerequisite: InvocationPrerequisite;
  /** Pode ser escolhida mais de uma vez — cada ocorrência precisa de um `subChoice` distinto quando `subChoice.required` for true. */
  repeatable: boolean;
  subChoice?: InvocationSubChoice;
  /** Regra mecânica completa — Builder/Ficha Web (nunca o texto compacto do PDF, que mora em rules/warlockPrintedFeatures.ts). */
  summary: string;
}
