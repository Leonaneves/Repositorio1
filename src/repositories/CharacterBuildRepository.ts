import type { CharacterBuild } from "../domain/characterBuild.js";

/**
 * Persiste builds anônimos para alimentar as estatísticas da
 * comunidade. Único método: `upsert` — grava (ou atualiza, se o
 * `buildId` já existir) o estado atual daquela construção. Nunca cria
 * um registro novo para o mesmo `buildId` (ver §6 do pedido do
 * usuário: mudar de classe 4 vezes durante a criação conta como 1
 * personagem, não 4).
 *
 * Deliberadamente NÃO há método de leitura de um build individual — o
 * único consumidor de dados é o `AnalyticsRepository`, que só expõe
 * agregados, nunca registros crus.
 */
export interface CharacterBuildRepository {
  upsert(build: CharacterBuild): Promise<void>;
}
