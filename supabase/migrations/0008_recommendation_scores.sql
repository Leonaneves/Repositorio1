-- ============================================================================
-- Ficha D&D — recomendações por HIERARQUIA DE INFLUÊNCIA
--
-- Migração INCREMENTAL sobre 0001–0007 — não apaga nenhuma linha e não
-- altera as funções antigas (o site anterior continua funcionando).
--
--   * novas colunas `invocations` e `maneuvers` (ids escolhidos);
--   * view `latest_confirmed_character_builds` recriada (colunas novas),
--     continua sem acesso pela API pública;
--   * `get_build_choice_scores`: pontuação de cada opção de Espécie,
--     Antecedente, atributos, Perícias, Subclasse, Metamagia, Invocações
--     e Manobras;
--   * `get_talent_choice_scores`: o mesmo para Talentos.
--
-- PONTUAÇÃO (mesma regra de src/recommendations/scoring.ts):
-- a CLASSE define a base (só com 10+ personagens distintos — abaixo
-- disso, nada é devolvido); cada fator mais específico (subclasse,
-- atributo, escolhas já feitas) REFINA a base por suavização:
--     refinado(v) = (escolheram_no_contexto(v) + K × base(v)) / (amostra_do_contexto + K)
-- Com poucos personagens no contexto, a base quase não muda; com muitos,
-- o contexto passa a decidir. Nenhuma contagem individual sai do banco —
-- só a pontuação e a contagem da classe (já exposta antes, amostra 10+).
--
-- Aplicar ANTES de publicar o site novo (o site novo grava
-- `invocations`/`maneuvers` ao confirmar).
-- ============================================================================

-- §1 — COLUNAS
alter table character_builds add column if not exists invocations text[] not null default '{}';
alter table character_builds add column if not exists maneuvers text[] not null default '{}';

-- §2 — VIEW recriada (mesmo motivo da 0006/0007)
drop view if exists latest_confirmed_character_builds;

create view latest_confirmed_character_builds as
select distinct on (b.character_id)
  b.*,
  character_build_highest_ability(b) as highest_ability
from character_builds b
where b.origin = 'user' and b.status = 'confirmed'
order by b.character_id, b.confirmed_at desc nulls last, b.updated_at desc, b.build_id;

revoke all on latest_confirmed_character_builds from anon, authenticated, public;

-- §3 — ESCOLHAS DE CRIAÇÃO
-- Fatores por tipo (`p_kind`):
--   subclass                       → classe
--   species (K = 20: a classe pesa mais), background, highestAbility,
--   dumpAbility                    → classe → subclasse
--   skillChoice                    → classe → maior atributo (`p_highest_ability`)
--   metamagic                      → classe → cada Metamagia já escolhida (`p_with_values`)
--   invocation, maneuver           → classe → subclasse → cada escolha já feita (`p_with_values`)
-- Uma opção já escolhida (`p_with_values`) nunca é devolvida.
create or replace function get_build_choice_scores(
  p_kind text,
  p_class_id text,
  p_subclass_id text default null,
  p_choice_id text default null,
  p_highest_ability text default null,
  p_with_values text[] default null,
  p_exclude_character_id text default null
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
    where b.class_id = p_class_id
      and (p_exclude_character_id is null or b.character_id <> p_exclude_character_id)
  ),
  -- Um fato por (personagem, valor escolhido); `vals` = todos os valores do personagem (para os tipos com várias escolhas).
  facts as (
    select b.character_id, b.subclass_id, b.highest_ability, array[b.species_id] as vals, b.species_id as value
    from builds b where p_kind = 'species' and b.species_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.background_id], b.background_id
    from builds b where p_kind = 'background' and b.background_id is not null
    union all
    select b.character_id, b.subclass_id, b.highest_ability, array[b.highest_ability], b.highest_ability
    from builds b where p_kind = 'highestAbility'
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
      (p_kind in ('species', 'background', 'highestAbility', 'dumpAbility', 'invocation', 'maneuver') and p_subclass_id is not null) as use_sub,
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
  where s.class_n >= 10
    and not (s.value = any (coalesce(p_with_values, array[]::text[])));
$$;

grant execute on function get_build_choice_scores(text, text, text, text, text, text[], text) to anon, authenticated;

-- §4 — TALENTOS
-- Mesmos fatos de `get_talent_choice_counts` (0006), mas devolve a
-- pontuação por conjunto (jogadores reais / referências): base = mesma
-- classe e mesmo nível (ou mesma faixa de nível, se o nível exato ainda
-- não tem amostra) → refinada pela subclasse e pelo maior atributo no
-- momento da escolha → refinada pelos dois juntos.
-- Amostra mínima da base: reais 10 personagens; referências 3 personagens
-- de 2 fontes independentes.
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
            and (case when p.pool = 'user' then s.n >= 10 else s.n >= 3 and s.groups >= 2 end)
        ) then 'level'
        when exists (
          select 1 from samples s where s.pool = p.pool and s.tier = 'level_band'
            and (case when p.pool = 'user' then s.n >= 10 else s.n >= 3 and s.groups >= 2 end)
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
