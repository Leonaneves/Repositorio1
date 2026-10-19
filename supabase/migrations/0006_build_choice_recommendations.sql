-- ============================================================================
-- Ficha D&D — recomendações de Espécie, Antecedente, Perícias,
-- Especialização e atributos (maior / "dump stat") + amostra mínima 10
--
-- Migração INCREMENTAL sobre 0001–0005 — não apaga nenhuma linha.
--
--   * nova coluna `skill_choices`: as perícias escolhidas em CADA escolha
--     de perícia/Especialização, pelo id da escolha (linhas antigas: `{}`);
--   * nova função `get_build_choice_counts` (só contagens, só dados reais
--     — a versão confirmada mais recente de cada personagem);
--   * `get_talent_choice_counts`: amostra mínima de dados reais 20 → 10.
--
-- Aplicar ANTES de publicar o site novo: o site novo grava
-- `skill_choices`, e a confirmação falharia sem esta coluna.
-- ============================================================================

-- §1 — COLUNA
alter table character_builds add column if not exists skill_choices jsonb not null default '{}'::jsonb;

-- §2 — VIEW: `b.*` é expandido na criação, então a view é recriada para
-- incluir a coluna nova. As funções que a leem são `language sql` sem
-- corpo atômico (não criam dependência), por isso o drop não precisa de
-- CASCADE. Continua sem acesso pela API pública (REVOKE logo abaixo).
drop view if exists latest_confirmed_character_builds;

create view latest_confirmed_character_builds as
select distinct on (b.character_id)
  b.*,
  character_build_highest_ability(b) as highest_ability
from character_builds b
where b.origin = 'user' and b.status = 'confirmed'
order by b.character_id, b.confirmed_at desc nulls last, b.updated_at desc, b.build_id;

revoke all on latest_confirmed_character_builds from anon, authenticated, public;

-- §3 — MENOR ATRIBUTO ("dump stat"), entre os valores base. Empate → o
-- primeiro na ordem FOR > DEX > CON > INT > SAB > CAR (igual a
-- `lowestAbility` em src/repositories/AnalyticsRepository.ts).
create or replace function character_build_lowest_ability(
  p_for integer,
  p_dex integer,
  p_con integer,
  p_int integer,
  p_sab integer,
  p_car integer
)
returns text
language sql
immutable
as $$
  select case
    when p_for <= p_dex and p_for <= p_con and p_for <= p_int and p_for <= p_sab and p_for <= p_car then 'FOR'
    when p_dex <= p_con and p_dex <= p_int and p_dex <= p_sab and p_dex <= p_car then 'DEX'
    when p_con <= p_int and p_con <= p_sab and p_con <= p_car then 'CON'
    when p_int <= p_sab and p_int <= p_car then 'INT'
    when p_sab <= p_car then 'SAB'
    else 'CAR'
  end;
$$;

-- §4 — CONTAGENS DAS ESCOLHAS DE CRIAÇÃO
-- `p_kind`: species | background | highestAbility | dumpAbility | skillChoice
-- (`p_choice_id` = id da escolha de perícia). Faixas: mesma classe e
-- mesma subclasse (`class_subclass`, só quando `p_subclass_id` é
-- informado), depois só a mesma classe (`class`). Só devolve faixas com
-- 10+ personagens distintos — contagens reais pequenas nunca saem do
-- banco. O próprio personagem (todas as versões) é excluído.
create or replace function get_build_choice_counts(
  p_kind text,
  p_class_id text,
  p_subclass_id text default null,
  p_choice_id text default null,
  p_exclude_character_id text default null
)
returns table (
  tier text,
  value text,
  characters bigint,
  sample_characters bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with builds as (
    select b.*
    from latest_confirmed_character_builds b
    where b.class_id = p_class_id
      and (p_exclude_character_id is null or b.character_id <> p_exclude_character_id)
  ),
  facts as (
    select b.character_id, b.subclass_id, b.species_id as value
    from builds b
    where p_kind = 'species' and b.species_id is not null
    union all
    select b.character_id, b.subclass_id, b.background_id
    from builds b
    where p_kind = 'background' and b.background_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability
    from builds b
    where p_kind = 'highestAbility'
    union all
    select b.character_id, b.subclass_id,
      character_build_lowest_ability(b.for_score, b.dex_score, b.con_score, b.int_score, b.sab_score, b.car_score)
    from builds b
    where p_kind = 'dumpAbility'
    union all
    select b.character_id, b.subclass_id, s.skill
    from builds b
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(b.skill_choices -> p_choice_id) = 'array' then b.skill_choices -> p_choice_id else '[]'::jsonb end
    ) as s (skill)
    where p_kind = 'skillChoice' and p_choice_id is not null
  ),
  tiers (tier, needs_subclass) as (
    values ('class_subclass', true), ('class', false)
  ),
  matched as (
    select t.tier, f.character_id, f.value
    from facts f
    join tiers t
      on not t.needs_subclass or (p_subclass_id is not null and f.subclass_id = p_subclass_id)
  ),
  samples as (
    select m.tier, count(distinct m.character_id) as sample_characters
    from matched m
    group by m.tier
  )
  select m.tier, m.value, count(distinct m.character_id) as characters, s.sample_characters
  from matched m
  join samples s on s.tier = m.tier
  where s.sample_characters >= 10
  group by m.tier, m.value, s.sample_characters;
$$;

grant execute on function get_build_choice_counts(text, text, text, text, text) to anon, authenticated;

-- §5 — TALENTOS: mesma função da 0005 (mesma assinatura), só com a
-- amostra mínima de dados reais 20 → 10.
create or replace function get_talent_choice_counts(
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
  where m.pool <> 'user' or s.sample_characters >= 10
  group by m.pool, m.tier, m.talent_id, s.sample_characters, s.sample_groups;
$$;

grant execute on function get_talent_choice_counts(text, text, integer, text, text, text, boolean) to anon, authenticated;
