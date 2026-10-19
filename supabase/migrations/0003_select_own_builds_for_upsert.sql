-- ============================================================================
-- Ficha D&D — leitura restrita ao próprio build (necessária para o upsert)
--
-- Migração INCREMENTAL sobre `0001` e `0002` — não altera nenhum dado nem
-- nenhuma política existente; só ACRESCENTA uma política de SELECT.
--
-- Motivo: `SupabaseCharacterBuildRepository.upsert` grava com
-- `INSERT ... ON CONFLICT (build_id) DO UPDATE` (PostgREST
-- `?on_conflict=build_id`). Com RLS ativo, o Postgres aplica também as
-- políticas de SELECT a esse tipo de comando — e `0002` não definia
-- nenhuma política de SELECT. Resultado: toda gravação era recusada com
-- "new row violates row-level security policy for table character_builds",
-- mesmo com `owner_id = auth.uid()` correto e a sessão anônima válida
-- (verificado em produção: um `INSERT` simples passava; o upsert não).
--
-- A leitura continua restrita ao mínimo: cada sessão só enxerga as linhas
-- que ela mesma gravou (`origin = 'user' and owner_id = auth.uid()`).
-- Nenhuma linha de outro jogador, nenhum registro de referência; o papel
-- `anon` continua sem SELECT nenhum; as estatísticas continuam passando
-- só pelas funções agregadas `SECURITY DEFINER`.
-- ============================================================================

drop policy if exists "usuário autenticado lê só o próprio build" on character_builds;
create policy "usuário autenticado lê só o próprio build"
  on character_builds
  for select
  to authenticated
  using (origin = 'user' and owner_id = auth.uid());
