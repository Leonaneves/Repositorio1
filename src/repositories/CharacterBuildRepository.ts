import type { CharacterBuild } from "../domain/characterBuild.js";

/**
 * Grava personagens CONFIRMADOS para as estatísticas da comunidade.
 * Único método: `insertConfirmed` — sempre um registro NOVO e imutável
 * por confirmação (`buildId` novo), nunca uma atualização de registro
 * existente: confirmar de novo depois de editar cria outra versão do
 * mesmo `characterId`, e as estatísticas contam só a mais recente de
 * cada personagem. Personagens anteriores nunca são alterados por um
 * personagem novo. Rascunhos nunca passam por aqui.
 *
 * Deliberadamente NÃO há método de leitura de um build individual — o
 * único consumidor de dados é o `AnalyticsRepository`, que só expõe
 * agregados, nunca registros crus.
 */
export interface CharacterBuildRepository {
  insertConfirmed(build: CharacterBuild): Promise<void>;
}
