-- ============================================================================
-- Ficha D&D — recomendações: Linhagens, 2º maior atributo, Perícias por
-- fonte e amostra mínima 5
--
-- Migração INCREMENTAL sobre 0001–0008 — não apaga nenhuma linha.
--
--   * nova coluna `species_lineage_id` (Linhagem/Ancestralidade escolhida);
--   * view `latest_confirmed_character_builds` recriada (coluna nova),
--     continua sem acesso pela API pública;
--   * `character_build_second_ability`: 2º maior atributo base;
--   * `get_build_choice_scores` recriada com `p_species_id` e os tipos
--     `lineage` (base: a mesma ESPÉCIE, qualquer classe) e
--     `secondAbility`; `p_class_id` nulo = qualquer classe (Perícias de
--     espécie/antecedente/talento: base = quem tem a mesma escolha);
--   * amostra mínima de dados reais 10 → 5 (também em
--     `get_talent_choice_scores`).
--
-- Aplicar ANTES de publicar o site novo (o site novo grava
-- `species_lineage_id` ao confirmar).
-- ============================================================================

-- §1 — COLUNA
alter table character_builds add column if not exists species_lineage_id text;

-- §2 — VIEW recriada (mesmo motivo da 0006–0008)
drop view if exists latest_confirmed_character_builds;

create view latest_confirmed_character_builds as
select distinct on (b.character_id)
  b.*,
  character_build_highest_ability(b) as highest_ability
from character_builds b
where b.origin = 'user' and b.status = 'confirmed'
order by b.character_id, b.confirmed_at desc nulls last, b.updated_at desc, b.build_id;

revoke all on latest_confirmed_character_builds from anon, authenticated, public;

-- §3 — 2º MAIOR ATRIBUTO (valores base). Empates: o primeiro na ordem
-- FOR > DEX > CON > INT > SAB > CAR, tanto para o maior quanto para o 2º
-- (igual a `secondHighestAbility` em src/repositories/AnalyticsRepository.ts).
create or replace function character_build_second_ability(
  p_for integer,
  p_dex integer,
  p_con integer,
  p_int integer,
  p_sab integer,
  p_car integer
)
returns text
language plpgsql
immutable
as $$
declare
  keys text[] := array['FOR', 'DEX', 'CON', 'INT', 'SAB', 'CAR'];
  vals integer[] := array[p_for, p_dex, p_con, p_int, p_sab, p_car];
  first_i integer := 1;
  second_i integer := null;
  i integer;
begin
  for i in 2..6 loop
    if vals[i] > vals[first_i] then first_i := i; end if;
  end loop;
  for i in 1..6 loop
    if i <> first_i and (second_i is null or vals[i] > vals[second_i]) then second_i := i; end if;
  end loop;
  return keys[second_i];
end;
$$;

-- §4 — ESCOLHAS DE CRIAÇÃO (mesma regra da 0008, com escopo e tipos novos)
-- Base: personagens da mesma classe (`p_class_id`; nulo = qualquer classe)
-- e, se informada, da mesma espécie (`p_species_id`) — só com 5+
-- personagens distintos. Refinos:
--   lineage, subclass               → só a base
--   species (K = 20), background, highestAbility, secondAbility,
--   dumpAbility                     → subclasse
--   skillChoice                     → maior atributo (`p_highest_ability`)
--   metamagic                       → escolhas já feitas (`p_with_values`)
--   invocation, maneuver            → subclasse → escolhas já feitas
-- Remove a versão da 0008 (7 parâmetros) e a desta migração (8), para
-- poder ser reaplicada sem erro.
drop function if exists get_build_choice_scores(text, text, text, text, text, text[], text);
drop function if exists get_build_choice_scores(text, text, text, text, text, text[], text, text);

create function get_build_choice_scores(
  p_kind text,
  p_class_id text,
  p_subclass_id text default null,
  p_choice_id text default null,
  p_highest_ability text default null,
  p_with_values text[] default null,
  p_exclude_character_id text default null,
  p_species_id text default null
)
returns table (
  value text,
  score double precision,
  class_characters bigint,
  class_sample bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with builds as (
    select b.*
    from latest_confirmed_character_builds b
    where (p_class_id is null or b.class_id = p_class_id)
      and (p_species_id is null or b.species_id = p_species_id)
      and (p_exclude_character_id is null or b.character_id <> p_exclude_character_id)
  ),
  facts as (
    select b.character_id, b.subclass_id, b.highest_ability, array[b.species_id] as vals, b.species_id as value
    from builds b where p_kind = 'species' and b.species_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.species_lineage_id], b.species_lineage_id
    from builds b where p_kind = 'lineage' and b.species_lineage_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.background_id], b.background_id
    from builds b where p_kind = 'background' and b.background_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.highest_ability], b.highest_ability
    from builds b where p_kind = 'highestAbility'
    union all
    select b.character_id, b.subclass_id, b.highest_ability,
      array[character_build_second_ability(b.for_score, b.dex_score, b.con_score, b.int_score, b.sab_score, b.car_score)],
      character_build_second_ability(b.for_score, b.dex_score, b.con_score, b.int_score, b.sab_score, b.car_score)
    from builds b where p_kind = 'secondAbility'
    union all
    select b.character_id, b.subclass_id, b.highest_ability,
      array[character_build_lowest_ability(b.for_score, b.dex_score, b.con_score, b.int_score, b.sab_score, b.car_score)],
      character_build_lowest_ability(b.for_score, b.dex_score, b.con_score, b.int_score, b.sab_score, b.car_score)
    from builds b where p_kind = 'dumpAbility'
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[]::text[], s.skill
    from builds b
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(b.skill_choices -> p_choice_id) = 'array' then b.skill_choices -> p_choice_id else '[]'::jsonb end
    ) as s (skill)
    where p_kind = 'skillChoice' and p_choice_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.subclass_id], b.subclass_id
    from builds b where p_kind = 'subclass' and b.subclass_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, b.metamagic_options, m.v
    from builds b cross join lateral unnest(b.metamagic_options) as m (v)
    where p_kind = 'metamagic'
    union all
    select b.character_id, b.subclass_id, b.highest_ability, b.invocations, i.v
    from builds b cross join lateral unnest(b.invocations) as i (v)
    where p_kind = 'invocation'
    union all
    select b.character_id, b.subclass_id, b.highest_ability, b.maneuvers, x.v
    from builds b cross join lateral unnest(b.maneuvers) as x (v)
    where p_kind = 'maneuver'
  ),
  settings as (
    select
      (p_kind in ('species', 'background', 'highestAbility', 'secondAbility', 'dumpAbility', 'invocation', 'maneuver') and p_subclass_id is not null) as use_sub,
      (p_kind = 'skillChoice' and p_highest_ability is not null) as use_ability,
      (p_kind in ('metamagic', 'invocation', 'maneuver') and coalesce(cardinality(p_with_values), 0) > 0) as use_with,
      case when p_kind = 'species' then 20.0 else 10.0 end as k_sub,
      10.0 as k
  ),
  class_sample as (select count(distinct f.character_id)::double precision as n from facts f),
  class_counts as (select f.value, count(distinct f.character_id)::double precision as c from facts f group by f.value),
  sub_sample as (select count(distinct f.character_id)::double precision as n from facts f where f.subclass_id = p_subclass_id),
  sub_counts as (select f.value, count(distinct f.character_id)::double precision as c from facts f where f.subclass_id = p_subclass_id group by f.value),
  ability_sample as (select count(distinct f.character_id)::double precision as n from facts f where f.highest_ability = p_highest_ability),
  ability_counts as (select f.value, count(distinct f.character_id)::double precision as c from facts f where f.highest_ability = p_highest_ability group by f.value),
  with_list as (select distinct w.x from unnest(coalesce(p_with_values, array[]::text[])) as w (x)),
  with_samples as (
    select w.x, count(distinct f.character_id)::double precision as n
    from with_list w left join facts f on w.x = any (f.vals)
    group by w.x
  ),
  with_counts as (
    select w.x, f.value, count(distinct f.character_id)::double precision as c
    from with_list w join facts f on w.x = any (f.vals) and f.value <> w.x
    group by w.x, f.value
  ),
  base as (
    select
      cc.value,
      cc.c as class_c,
      cs.n as class_n,
      case
        when st.use_sub then (coalesce(sc.c, 0) + st.k_sub * (cc.c / cs.n)) / (ss.n + st.k_sub)
        else cc.c / cs.n
      end as p_base
    from class_counts cc
    cross join class_sample cs
    cross join settings st
    cross join sub_sample ss
    left join sub_counts sc on sc.value = cc.value
  ),
  refined as (
    select
      b.value,
      b.class_c,
      b.class_n,
      case
        when st.use_ability then (coalesce(ac.c, 0) + st.k * b.p_base) / (asp.n + st.k)
        else b.p_base
      end as p_refined
    from base b
    cross join settings st
    cross join ability_sample asp
    left join ability_counts ac on ac.value = b.value
  ),
  scored as (
    select
      r.value,
      r.class_c,
      r.class_n,
      case
        when st.use_with then (
          select avg((coalesce(wc.c, 0) + st.k * r.p_refined) / (ws.n + st.k))
          from with_samples ws
          left join with_counts wc on wc.x = ws.x and wc.value = r.value
        )
        else r.p_refined
      end as score
    from refined r
    cross join settings st
  )
  select s.value, s.score, s.class_c::bigint, s.class_n::bigint
  from scored s
  where s.class_n >= 5
    and not (s.value = any (coalesce(p_with_values, array[]::text[])));
$$;

grant execute on function get_build_choice_scores(text, text, text, text, text, text[], text, text) to anon, authenticated;

-- §5 — TALENTOS: mesma função da 0008 (mesma assinatura), amostra mínima
-- real 10 → 5.
create or replace function get_talent_choice_scores(
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
  talent_id text,
  score double precision,
  base_characters bigint,
  base_groups bigint,
  base_sample bigint
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
    select m.pool, m.tier, count(distinct m.character_key)::double precision as n, count(distinct m.group_key) as groups
    from matched m
    group by m.pool, m.tier
  ),
  counts as (
    select m.pool, m.tier, m.talent_id, count(distinct m.character_key)::double precision as c, count(distinct m.group_key) as groups
    from matched m
    group by m.pool, m.tier, m.talent_id
  ),
  pools as (select distinct s.pool from samples s),
  -- Base de cada conjunto: nível exato se já tem amostra; senão a faixa de nível.
  base_tier as (
    select
      p.pool,
      case
        when exists (
          select 1 from samples s where s.pool = p.pool and s.tier = 'level'
            and (case when p.pool = 'user' then s.n >= 5 else s.n >= 3 and s.groups >= 2 end)
        ) then 'level'
        when exists (
          select 1 from samples s where s.pool = p.pool and s.tier = 'level_band'
            and (case when p.pool = 'user' then s.n >= 5 else s.n >= 3 and s.groups >= 2 end)
        ) then 'level_band'
      end as tier
    from pools p
  ),
  base as (
    select bt.pool, c.talent_id, c.c as base_c, c.groups as base_g, s.n as base_n
    from base_tier bt
    join counts c on c.pool = bt.pool and c.tier = bt.tier
    join samples s on s.pool = bt.pool and s.tier = bt.tier
    where bt.tier is not null
  ),
  refined as (
    select
      b.*,
      (coalesce(cs.c, 0) + 10.0 * (b.base_c / b.base_n)) / (coalesce(ss.n, 0) + 10.0) as p_sub,
      (coalesce(ca.c, 0) + 10.0 * (b.base_c / b.base_n)) / (coalesce(sa.n, 0) + 10.0) as p_ability
    from base b
    left join counts cs on cs.pool = b.pool and cs.tier = 'level_subclass' and cs.talent_id = b.talent_id
    left join samples ss on ss.pool = b.pool and ss.tier = 'level_subclass'
    left join counts ca on ca.pool = b.pool and ca.tier = 'level_ability' and ca.talent_id = b.talent_id
    left join samples sa on sa.pool = b.pool and sa.tier = 'level_ability'
  ),
  mid as (
    select
      r.*,
      case
        when p_subclass_id is not null and p_highest_ability is not null then (r.p_sub + r.p_ability) / 2
        when p_subclass_id is not null then r.p_sub
        when p_highest_ability is not null then r.p_ability
        else r.base_c / r.base_n
      end as p_mid
    from refined r
  )
  select
    m.pool,
    m.talent_id,
    case
      when p_subclass_id is not null and p_highest_ability is not null
        then (coalesce(cb.c, 0) + 10.0 * m.p_mid) / (coalesce(sb.n, 0) + 10.0)
      else m.p_mid
    end as score,
    m.base_c::bigint,
    m.base_g,
    m.base_n::bigint
  from mid m
  left join counts cb on cb.pool = m.pool and cb.tier = 'level_subclass_ability' and cb.talent_id = m.talent_id
  left join samples sb on sb.pool = m.pool and sb.tier = 'level_subclass_ability';
$$;

grant execute on function get_talent_choice_scores(text, text, integer, text, text, text, boolean) to anon, authenticated;
