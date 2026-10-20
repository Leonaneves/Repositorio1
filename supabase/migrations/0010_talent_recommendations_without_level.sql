-- ============================================================================
-- Ficha D&D — recomendações de talentos SEM influência do nível
--
-- Migração INCREMENTAL sobre 0001–0009 — não apaga nenhuma linha e pode
-- ser aplicada mais de uma vez.
--
-- O nível nunca é fator de recomendação: `get_talent_choice_counts` e
-- `get_talent_choice_scores` são recriadas com a MESMA assinatura (o
-- site antigo continua funcionando), mas `p_level` passa a ser ignorado.
-- Base = mesma classe e mesmo tipo de oportunidade (Talento de Origem,
-- Talento Geral, Estilo de Luta, Dádiva Épica), refinada pela subclasse
-- e pelo maior atributo no momento da escolha. Faixas renomeadas:
-- class_subclass_ability, class_subclass, class_ability, class.
-- ============================================================================

-- §1 — CONTAGENS (mesma regra da 0006, sem nível; amostra mínima real 10)
create or replace function get_talent_choice_counts(
  p_opportunity_kind text,
  p_class_id text,
  p_level integer default null, -- ignorado: o nível nunca influencia
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
      ra.subclass_id,
      ability_scores_highest(ra.ability_scores),
      ra.talent_id
    from reference_acquisitions ra
    join reference_characters c on c.character_id = ra.character_id
    join reference_sources s on s.source_id = c.source_id
    where c.class_id = p_class_id
      and ra.opportunity_kind = p_opportunity_kind
  ),
  tiers (tier, needs_subclass, needs_ability) as (
    values
      ('class_subclass_ability', true, true),
      ('class_subclass', true, false),
      ('class_ability', false, true),
      ('class', false, false)
  ),
  matched as (
    select t.tier, f.pool, f.character_key, f.group_key, f.talent_id
    from facts f
    join tiers t
      on (not t.needs_subclass or (p_subclass_id is not null and f.subclass_id = p_subclass_id))
      and (not t.needs_ability or (p_highest_ability is not null and f.highest = p_highest_ability))
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

-- §2 — PONTUAÇÃO (mesma regra da 0009, sem nível; amostra mínima real 5)
create or replace function get_talent_choice_scores(
  p_opportunity_kind text,
  p_class_id text,
  p_level integer default null, -- ignorado: o nível nunca influencia
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
      ra.subclass_id,
      ability_scores_highest(ra.ability_scores),
      ra.talent_id
    from reference_acquisitions ra
    join reference_characters c on c.character_id = ra.character_id
    join reference_sources s on s.source_id = c.source_id
    where c.class_id = p_class_id
      and ra.opportunity_kind = p_opportunity_kind
  ),
  tiers (tier, needs_subclass, needs_ability) as (
    values
      ('class_subclass_ability', true, true),
      ('class_subclass', true, false),
      ('class_ability', false, true),
      ('class', false, false)
  ),
  matched as (
    select t.tier, f.pool, f.character_key, f.group_key, f.talent_id
    from facts f
    join tiers t
      on (not t.needs_subclass or (p_subclass_id is not null and f.subclass_id = p_subclass_id))
      and (not t.needs_ability or (p_highest_ability is not null and f.highest = p_highest_ability))
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
  -- Base de cada conjunto: a mesma classe, se já tem amostra mínima.
  base as (
    select c.pool, c.talent_id, c.c as base_c, c.groups as base_g, s.n as base_n
    from counts c
    join samples s on s.pool = c.pool and s.tier = c.tier
    where c.tier = 'class'
      and (case when c.pool = 'user' then s.n >= 5 else s.n >= 3 and s.groups >= 2 end)
  ),
  refined as (
    select
      b.*,
      (coalesce(cs.c, 0) + 10.0 * (b.base_c / b.base_n)) / (coalesce(ss.n, 0) + 10.0) as p_sub,
      (coalesce(ca.c, 0) + 10.0 * (b.base_c / b.base_n)) / (coalesce(sa.n, 0) + 10.0) as p_ability
    from base b
    left join counts cs on cs.pool = b.pool and cs.tier = 'class_subclass' and cs.talent_id = b.talent_id
    left join samples ss on ss.pool = b.pool and ss.tier = 'class_subclass'
    left join counts ca on ca.pool = b.pool and ca.tier = 'class_ability' and ca.talent_id = b.talent_id
    left join samples sa on sa.pool = b.pool and sa.tier = 'class_ability'
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
  left join counts cb on cb.pool = m.pool and cb.tier = 'class_subclass_ability' and cb.talent_id = m.talent_id
  left join samples sb on sb.pool = m.pool and sb.tier = 'class_subclass_ability';
$$;

grant execute on function get_talent_choice_scores(text, text, integer, text, text, text, boolean) to anon, authenticated;
