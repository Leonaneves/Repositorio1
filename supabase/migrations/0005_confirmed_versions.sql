-- ============================================================================
-- Ficha D&D — confirmação como versão IMUTÁVEL + vários personagens
-- (fonte "CONFIRMAR PERSONAGENS SEM ALTERAR OS ANTERIORES")
--
-- Migração INCREMENTAL sobre 0001–0004 — não apaga nenhuma linha.
--
-- Antes: o app gravava o personagem continuamente (inclusive rascunhos)
-- e ATUALIZAVA sempre o mesmo registro; confirmar só mudava o status
-- dessa linha. Agora:
--   * rascunhos nunca saem do navegador;
--   * cada "Confirmar" é um INSERT de um registro NOVO (`build_id` novo),
--     nunca alterado depois — um personagem novo, ou uma nova versão do
--     mesmo, nunca altera os anteriores;
--   * `character_id` liga as versões do MESMO personagem; as estatísticas
--     (insights e recomendador) contam só a versão confirmada mais
--     recente de cada personagem, nunca somam versões.
--
-- Linhas antigas: rascunhos continuam guardados e ignorados; uma linha
-- antiga já confirmada vira a versão única do seu personagem
-- (`character_id` = `build_id`).
-- ============================================================================

-- §1 — COLUNAS
alter table character_builds add column if not exists character_id text;
alter table character_builds add column if not exists confirmed_at timestamptz;
update character_builds set character_id = build_id::text where character_id is null;
update character_builds set confirmed_at = updated_at where status = 'confirmed' and confirmed_at is null;
alter table character_builds alter column character_id set not null;
-- Hora da confirmação definida pelo banco (nunca pelo navegador).
alter table character_builds alter column confirmed_at set default now();

create index if not exists character_builds_character_version_idx on character_builds (character_id, confirmed_at desc);

-- §2 — ACESSO: só INSERT de versão confirmada da própria sessão.
-- Sem UPDATE e sem SELECT: nada gravado pode ser alterado nem lido
-- individualmente pela API pública (o INSERT usa "return=minimal", que
-- dispensa política de SELECT).
drop policy if exists "usuário autenticado insere seu próprio build" on character_builds;
drop policy if exists "usuário autenticado atualiza só o próprio build" on character_builds;
drop policy if exists "usuário autenticado lê só o próprio build" on character_builds;
drop policy if exists "usuário autenticado insere versão confirmada" on character_builds;
create policy "usuário autenticado insere versão confirmada"
  on character_builds
  for insert
  to authenticated
  with check (origin = 'user' and status = 'confirmed' and owner_id = auth.uid());

-- §3 — VERSÃO MAIS RECENTE DE CADA PERSONAGEM
-- Base única de todas as estatísticas de escolhas reais. Nunca exposta
-- diretamente: o Supabase concede leitura de objetos novos a
-- anon/authenticated por padrão, por isso o REVOKE logo abaixo.
create or replace view latest_confirmed_character_builds as
select distinct on (b.character_id)
  b.*,
  character_build_highest_ability(b) as highest_ability
from character_builds b
where b.origin = 'user' and b.status = 'confirmed'
order by b.character_id, b.confirmed_at desc nulls last, b.updated_at desc, b.build_id;

revoke all on latest_confirmed_character_builds from anon, authenticated, public;

-- §4 — FUNÇÕES DE AGREGAÇÃO (mesmas assinaturas) lendo só a versão mais recente
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
set search_path = public
as $$
  select count(*)
  from latest_confirmed_character_builds
  where true
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or highest_ability = p_highest_ability);
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
set search_path = public
as $$
  select subclass_id as value, count(*) as count
  from latest_confirmed_character_builds
  where true
    and subclass_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or highest_ability = p_highest_ability)
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
set search_path = public
as $$
  select species_id as value, count(*) as count
  from latest_confirmed_character_builds
  where true
    and species_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or highest_ability = p_highest_ability)
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
set search_path = public
as $$
  select background_id as value, count(*) as count
  from latest_confirmed_character_builds
  where true
    and background_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or highest_ability = p_highest_ability)
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
set search_path = public
as $$
  select coalesce(armor_id, 'unarmed') as value, count(*) as count
  from latest_confirmed_character_builds
  where true
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or highest_ability = p_highest_ability)
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
set search_path = public
as $$
  select highest_ability as value, count(*) as count
  from latest_confirmed_character_builds
  where true
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by highest_ability
  order by count desc;
$$;

-- §5 — RECOMENDADOR: dados reais pela versão mais recente de cada
-- personagem; o próprio personagem (todas as versões) é excluído por
-- `p_exclude_character_id`. O nome do parâmetro mudou, por isso a função
-- é recriada (drop + create), não só substituída.
drop function if exists get_talent_choice_counts(text, text, integer, text, text, text, boolean);

create function get_talent_choice_counts(
  p_opportunity_kind text,
  p_class_id text,
  p_level integer default null,
  p_subclass_id text default null,
  p_highest_ability text default null,
  p_exclude_character_id text default null,
  p_include_user boolean default false
)
returns table (
  pool text,
  tier text,
  talent_id text,
  characters bigint,
  independent_groups bigint,
  sample_characters bigint,
  sample_groups bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with facts as (
    select
      'user'::text as pool,
      b.character_id as character_key,
      b.character_id as group_key,
      case when jsonb_typeof(a.rec -> 'acquisitionLevel') = 'number' then (a.rec ->> 'acquisitionLevel')::integer end as level,
      case
        when jsonb_typeof(a.rec -> 'context' -> 'subclassId') = 'string' and a.rec -> 'context' ->> 'subclassId' <> 'desconhecido'
          then a.rec -> 'context' ->> 'subclassId'
      end as subclass_id,
      ability_scores_highest(a.rec -> 'context' -> 'abilityScores') as highest,
      a.rec ->> 'talentId' as talent_id
    from latest_confirmed_character_builds b
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(b.talent_acquisitions) = 'array' then b.talent_acquisitions else '[]'::jsonb end
    ) as a (rec)
    where p_include_user
      and (p_exclude_character_id is null or b.character_id <> p_exclude_character_id)
      and b.class_id = p_class_id
      and (a.rec ->> 'voluntary')::boolean is true
      and talent_record_opportunity_kind(a.rec) = p_opportunity_kind

    union all

    select
      case s.content_type when 'extracted' then 'reference_extracted' else 'reference_synthetic' end,
      c.character_id,
      s.independence_group,
      ra.acquisition_level,
      ra.subclass_id,
      ability_scores_highest(ra.ability_scores),
      ra.talent_id
    from reference_acquisitions ra
    join reference_characters c on c.character_id = ra.character_id
    join reference_sources s on s.source_id = c.source_id
    where c.class_id = p_class_id
      and ra.opportunity_kind = p_opportunity_kind
  ),
  tiers (tier, needs_subclass, needs_ability, exact_level) as (
    values
      ('level_subclass_ability', true, true, true),
      ('level_subclass', true, false, true),
      ('level_ability', false, true, true),
      ('level', false, false, true),
      ('level_band', false, false, false)
  ),
  matched as (
    select t.tier, f.pool, f.character_key, f.group_key, f.talent_id
    from facts f
    join tiers t
      on (not t.needs_subclass or (p_subclass_id is not null and f.subclass_id = p_subclass_id))
      and (not t.needs_ability or (p_highest_ability is not null and f.highest = p_highest_ability))
      and (
        case
          when t.exact_level then f.level is not distinct from p_level
          else talent_level_band(f.level) = talent_level_band(p_level)
        end
      )
  ),
  samples as (
    select m.pool, m.tier, count(distinct m.character_key) as sample_characters, count(distinct m.group_key) as sample_groups
    from matched m
    group by m.pool, m.tier
  )
  select
    m.pool,
    m.tier,
    m.talent_id,
    count(distinct m.character_key) as characters,
    count(distinct m.group_key) as independent_groups,
    s.sample_characters,
    s.sample_groups
  from matched m
  join samples s on s.pool = m.pool and s.tier = m.tier
  where m.pool <> 'user' or s.sample_characters >= 20
  group by m.pool, m.tier, m.talent_id, s.sample_characters, s.sample_groups;
$$;

grant execute on function get_talent_choice_counts(text, text, integer, text, text, text, boolean) to anon, authenticated;
