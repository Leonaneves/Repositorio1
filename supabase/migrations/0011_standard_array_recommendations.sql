-- ============================================================================
-- Ficha D&D — recomendação do Array Padrão: valor mais escolhido por atributo
--
-- Migração INCREMENTAL sobre 0001–0010 — não apaga nenhuma linha e pode
-- ser aplicada mais de uma vez.
--
-- `get_build_choice_scores` recriada com a MESMA assinatura da 0009 e um
-- tipo novo, `abilityScore`: para o atributo em `p_choice_id` ("FOR",
-- "DEX", "CON", "INT", "SAB" ou "CAR"), o valor BASE que cada personagem
-- da mesma classe escolheu (refinado pela subclasse, como o maior/menor
-- atributo). Mesma amostra mínima (5 personagens) e mesmo acesso: só a
-- função é executável pela API pública.
-- ============================================================================

create or replace function get_build_choice_scores(
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
    select b.character_id, b.subclass_id, b.highest_ability, array[]::text[],
      (case p_choice_id
        when 'FOR' then b.for_score when 'DEX' then b.dex_score when 'CON' then b.con_score
        when 'INT' then b.int_score when 'SAB' then b.sab_score when 'CAR' then b.car_score
      end)::text
    from builds b where p_kind = 'abilityScore' and p_choice_id in ('FOR', 'DEX', 'CON', 'INT', 'SAB', 'CAR')
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
      (p_kind in ('species', 'background', 'highestAbility', 'secondAbility', 'dumpAbility', 'abilityScore', 'invocation', 'maneuver') and p_subclass_id is not null) as use_sub,
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
