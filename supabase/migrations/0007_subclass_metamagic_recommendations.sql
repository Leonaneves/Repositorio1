-- ============================================================================
-- Ficha D&D — recomendações de Subclasse e Metamagia
--
-- Migração INCREMENTAL sobre 0001–0006 — não apaga nenhuma linha.
--
--   * nova coluna `metamagic_options`: as opções de Metamagia conhecidas
--     pelo Feiticeiro (linhas antigas: vazia);
--   * `get_build_choice_counts` (mesma assinatura) ganha os tipos
--     `subclass` e `metamagic`.
--
-- Aplicar ANTES de publicar o site novo: o site novo grava
-- `metamagic_options`, e a confirmação falharia sem esta coluna.
-- ============================================================================

-- §1 — COLUNA
alter table character_builds add column if not exists metamagic_options text[] not null default '{}';

-- §2 — VIEW recriada para incluir a coluna nova (mesmo motivo da 0006);
-- continua sem acesso pela API pública.
drop view if exists latest_confirmed_character_builds;

create view latest_confirmed_character_builds as
select distinct on (b.character_id)
  b.*,
  character_build_highest_ability(b) as highest_ability
from character_builds b
where b.origin = 'user' and b.status = 'confirmed'
order by b.character_id, b.confirmed_at desc nulls last, b.updated_at desc, b.build_id;

revoke all on latest_confirmed_character_builds from anon, authenticated, public;

-- §3 — CONTAGENS DAS ESCOLHAS DE CRIAÇÃO
-- `p_kind`: species | background | highestAbility | dumpAbility |
-- skillChoice (`p_choice_id` = id da escolha de perícia) | subclass |
-- metamagic. Faixas: mesma classe e mesma subclasse (`class_subclass`,
-- só quando `p_subclass_id` é informado e nunca para a própria
-- Subclasse), depois só a mesma classe (`class`). Só devolve faixas com
-- 10+ personagens distintos. O próprio personagem (todas as versões) é
-- excluído.
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
    union all
    select b.character_id, b.subclass_id, b.subclass_id
    from builds b
    where p_kind = 'subclass' and b.subclass_id is not null
    union all
    select b.character_id, b.subclass_id, m.option
    from builds b
    cross join lateral unnest(b.metamagic_options) as m (option)
    where p_kind = 'metamagic'
  ),
  tiers (tier, needs_subclass) as (
    values ('class_subclass', true), ('class', false)
  ),
  matched as (
    select t.tier, f.character_id, f.value
    from facts f
    join tiers t
      on not t.needs_subclass
      or (p_kind <> 'subclass' and p_subclass_id is not null and f.subclass_id = p_subclass_id)
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
