-- ============================================================================
-- Ficha D&D — propriedade de build, confirmação, registros de referência
-- e histórico de talentos (fonte "IMPLEMENTAR A BASE DE DADOS PARA
-- FUTURAS RECOMENDAÇÕES")
--
-- Migração INCREMENTAL sobre `0001_character_builds.sql` — nunca altera
-- aquele arquivo, nunca apaga dados existentes. Toda linha já gravada
-- continua existindo, com `origin = 'user'` e `status = 'draft'` (os
-- valores padrão abaixo) — nenhuma confirmação é presumida para quem já
-- existia antes desta migração.
--
-- ⚠️ Mesmo aviso do arquivo anterior: esta migração não foi aplicada a
-- nenhum projeto Supabase real a partir desta sessão (sem credenciais
-- aqui). Para aplicar, ver `supabase/README.md`.
--
-- ⚠️ Esta etapa introduz um mecanismo de propriedade (`owner_id`) que
-- exige "Enable anonymous sign-ins" ativado em Authentication →
-- Providers no painel do seu projeto Supabase — configuração externa
-- que este arquivo SQL não consegue ativar por si só. Sem isso,
-- `signInAnonymously()` (ver `repositories/supabase/client.ts`) falha, e
-- a sincronização de build fica só registrada como erro (nunca bloqueia
-- criação/exportação do personagem, ver `services/buildSync.ts`).
-- ============================================================================

-- ============================================================================
-- §1 — NOVAS COLUNAS
--
-- origin/status: já existiam como conceito implícito (toda linha era
-- sempre um personagem real "em algum estado"); agora ficam explícitos.
-- Default 'user'/'draft' preserva o comportamento de toda linha já
-- existente.
--
-- owner_id: prova de propriedade (§6) — o `auth.uid()` da sessão
-- (Supabase Anonymous Auth) que gravou o registro. Nunca preenchido para
-- linhas que já existiam (não há como descobrir quem as criou
-- retroativamente) — essas ficam, de propósito, sem dono reconhecido, e
-- por isso não podem mais ser atualizadas por ninguém a partir desta
-- migração (ver política de UPDATE em §3) — não há perda de dado, só a
-- impossibilidade de editá-las de novo, o que é aceitável para registros
-- que já eram rascunhos abertos antes de existir qualquer dono.
--
-- reference_source_id/reference_content_type: só preenchidos em
-- `origin = 'reference'` (§2) — a importação em si é de uma etapa
-- futura; isto só prepara onde ela vai gravar.
--
-- talent_acquisitions: histórico estruturado de aquisições de talento
-- (§3) — ver `domain/characterBuild.ts#TalentAcquisitionRecord` e
-- `rules/talentAcquisitionHistory.ts`. `[]` para linhas existentes (não
-- há como reconstruir o histórico retroativamente a partir só do estado
-- final já gravado).
-- ============================================================================

alter table character_builds
  add column if not exists origin text not null default 'user',
  add column if not exists status text not null default 'draft',
  add column if not exists owner_id uuid,
  add column if not exists reference_source_id text,
  add column if not exists reference_content_type text,
  add column if not exists talent_acquisitions jsonb not null default '[]'::jsonb;

alter table character_builds drop constraint if exists character_builds_origin_check;
alter table character_builds
  add constraint character_builds_origin_check check (origin in ('user', 'reference'));

alter table character_builds drop constraint if exists character_builds_status_check;
alter table character_builds
  add constraint character_builds_status_check check (status in ('draft', 'confirmed'));

alter table character_builds drop constraint if exists character_builds_reference_content_type_check;
alter table character_builds
  add constraint character_builds_reference_content_type_check
  check (reference_content_type is null or reference_content_type in ('extracted', 'synthetic'));

-- Registro de referência nunca tem dono de usuário (só existe pelo caminho administrativo — ver §3).
alter table character_builds drop constraint if exists character_builds_reference_has_no_owner_check;
alter table character_builds
  add constraint character_builds_reference_has_no_owner_check
  check (origin <> 'reference' or owner_id is null);

-- Metadado de fonte só existe (e é obrigatório) em registros de referência — nunca num build real de usuário.
alter table character_builds drop constraint if exists character_builds_reference_metadata_check;
alter table character_builds
  add constraint character_builds_reference_metadata_check
  check (
    (origin = 'reference' and reference_source_id is not null and reference_content_type is not null)
    or (origin = 'user' and reference_source_id is null and reference_content_type is null)
  );

create index if not exists character_builds_owner_id_idx on character_builds (owner_id);
create index if not exists character_builds_origin_status_idx on character_builds (origin, status);

-- ============================================================================
-- §2 — ACESSO AO BANCO (fonte §6)
--
-- A política anterior ("anon pode atualizar builds (upsert)") permitia
-- QUALQUER cliente atualizar QUALQUER linha — corrigido aqui.
--
-- Mecanismo escolhido: Supabase Anonymous Auth (`signInAnonymously()`).
-- Continua sem nenhuma tela de cadastro/login e sem nenhuma chave
-- privilegiada no frontend (usa a MESMA chave `anon` pública já
-- configurada) — mas agora cada sessão anônima tem um `auth.uid()` real,
-- verificável pelo banco (`auth.uid()` só pode ser o da sessão que o
-- Supabase Auth de fato autenticou — nunca um UUID que o navegador
-- simplesmente diz ter).
--
-- Por isso as políticas passam de `to anon` para `to authenticated`
-- (papel que o Supabase atribui a QUALQUER sessão autenticada, inclusive
-- anônima) e exigem `owner_id = auth.uid()` tanto para ENTRAR quanto
-- para SAIR da linha (`using`/`with check`) — ninguém grava uma linha
-- "dando" ela para outro dono, e ninguém consegue atualizar uma linha
-- cujo dono não é a sua própria sessão. `origin = 'user'` nas mesmas
-- políticas impede que esse caminho (cliente comum) grave ou altere
-- qualquer registro de referência — esses só entram por um caminho
-- administrativo (service role key, usada só server-side numa etapa
-- futura de importação, NUNCA em `VITE_*`/frontend), que ignora RLS por
-- natureza e por isso não precisa de política própria aqui.
--
-- Continua sem política de SELECT (nenhuma foi adicionada): leitura
-- direta da tabela crua continua bloqueada para `anon` e `authenticated`
-- — toda consulta agregada continua passando só pelas funções
-- `SECURITY DEFINER` do §4, que nunca devolvem linhas individuais.
-- ============================================================================

drop policy if exists "anon pode inserir/atualizar seu próprio build" on character_builds;
drop policy if exists "anon pode atualizar builds (upsert)" on character_builds;

drop policy if exists "usuário autenticado insere seu próprio build" on character_builds;
create policy "usuário autenticado insere seu próprio build"
  on character_builds
  for insert
  to authenticated
  with check (origin = 'user' and owner_id = auth.uid());

drop policy if exists "usuário autenticado atualiza só o próprio build" on character_builds;
create policy "usuário autenticado atualiza só o próprio build"
  on character_builds
  for update
  to authenticated
  using (origin = 'user' and owner_id = auth.uid())
  with check (origin = 'user' and owner_id = auth.uid());

-- ============================================================================
-- §3 — ESTATÍSTICAS SÓ DE ESCOLHAS REAIS CONFIRMADAS (fonte §7)
--
-- As 6 funções de agregação de `0001` são redefinidas aqui
-- (`create or replace function`, mesma assinatura — nunca uma função
-- nova) só para acrescentar `origin = 'user' and status = 'confirmed'`
-- ao filtro: rascunhos e registros de referência somem das estatísticas
-- de escolhas reais (a combinação deliberada com referências é da etapa
-- futura do recomendador, não desta). `character_build_highest_ability`
-- não muda — é só um cálculo por linha, já usado dentro do filtro das
-- demais.
-- ============================================================================

create or replace function count_builds(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null,
  p_highest_ability text default null
)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability);
$$;

create or replace function get_subclass_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null,
  p_highest_ability text default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select subclass_id as value, count(*) as count
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and subclass_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability)
  group by subclass_id
  order by count desc;
$$;

create or replace function get_species_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null,
  p_highest_ability text default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select species_id as value, count(*) as count
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and species_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability)
  group by species_id
  order by count desc;
$$;

create or replace function get_background_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null,
  p_highest_ability text default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select background_id as value, count(*) as count
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and background_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability)
  group by background_id
  order by count desc;
$$;

create or replace function get_armor_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null,
  p_highest_ability text default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select coalesce(armor_id, 'unarmed') as value, count(*) as count
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability)
  group by coalesce(armor_id, 'unarmed')
  order by count desc;
$$;

create or replace function get_highest_ability_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select character_build_highest_ability(character_builds) as value, count(*) as count
  from character_builds
  where origin = 'user' and status = 'confirmed'
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by character_build_highest_ability(character_builds)
  order by count desc;
$$;

-- As funções já eram SECURITY DEFINER e já eram concedidas a `anon`
-- (continua valendo para quem ainda não entrou numa sessão anônima); com
-- a sincronização agora autenticando a sessão antes de gravar, as
-- leituras agregadas (insights) passam a rodar como `authenticated` na
-- mesma sessão — por isso o grant abaixo acrescenta esse papel, nunca
-- substitui o de `anon`.
grant execute on function count_builds to authenticated;
grant execute on function get_subclass_distribution to authenticated;
grant execute on function get_species_distribution to authenticated;
grant execute on function get_background_distribution to authenticated;
grant execute on function get_armor_distribution to authenticated;
grant execute on function get_highest_ability_distribution to authenticated;
grant execute on function character_build_highest_ability to authenticated;
