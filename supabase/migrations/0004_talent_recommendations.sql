-- ============================================================================
-- Ficha D&D — base de referências e contagens do recomendador de talentos
-- (fonte "IMPLEMENTAR RECOMENDAÇÕES DE TALENTOS", plano aprovado com ajustes)
--
-- Migração INCREMENTAL sobre 0001–0003: só CRIA tabelas e funções novas;
-- não altera nem apaga nenhuma linha de `character_builds`.
--
-- Nesta etapa as tabelas de referência ficam VAZIAS — nenhum dado de
-- exemplo é inserido aqui. Elas só são preenchidas pelo SQL gerado pelo
-- importador (`scripts/reference-import.ts`) a partir de fontes reais,
-- depois de validadas.
--
-- Por que tabelas próprias (e não `character_builds` com
-- `origin = 'reference'`, preparado na 0002)? Uma referência pode ser
-- PARCIAL — sem atributos, sem subclasse, sem nível final — e
-- `character_builds` exige atributos/nível preenchidos (NOT NULL). Forçar
-- valores ali seria inventar dados. As colunas de referência da 0002
-- continuam existindo, sem uso.
-- ============================================================================

-- ============================================================================
-- §1 — TABELAS DE REFERÊNCIA
--
-- Hierarquia: fonte → personagens → aquisições. Cada fonte é importada
-- de UM arquivo JSON; reimportar o mesmo arquivo atualiza as mesmas
-- linhas (chaves determinísticas: `source_id`, `{source_id}/{chave}`,
-- `opportunity_id`) e apaga o que deixou de existir no arquivo — nunca
-- duplica.
-- ============================================================================

create table if not exists reference_sources (
  source_id text primary key check (source_id ~ '^[a-z0-9][a-z0-9-]*$'),
  title text not null,
  kind text not null check (kind in ('guide', 'article', 'video', 'forum', 'book', 'spreadsheet', 'other')),
  citation text not null,
  accessed_at date,
  -- Fontes que copiam/republicam o mesmo conteúdo compartilham o grupo e
  -- contam como UMA fonte independente na amostra mínima.
  independence_group text not null check (length(independence_group) > 0),
  content_type text not null check (content_type in ('extracted', 'synthetic')),
  -- Só para conteúdo sintético: a regra de geração aprovada e as fontes de que derivou.
  generation_rule_id text,
  derived_from_source_ids text[] not null default '{}',
  imported_at timestamptz not null default now(),
  constraint reference_sources_synthetic_rule_check check ((content_type = 'synthetic') = (generation_rule_id is not null))
);

create table if not exists reference_characters (
  character_id text primary key,
  source_id text not null references reference_sources (source_id) on delete cascade,
  character_key text not null check (character_key ~ '^[a-z0-9][a-z0-9-]*$'),
  class_id text not null,
  subclass_id text,
  species_id text,
  background_id text,
  level integer not null check (level between 1 and 20),
  constraint reference_characters_key_unique unique (source_id, character_key),
  constraint reference_characters_id_check check (character_id = source_id || '/' || character_key)
);

create table if not exists reference_acquisitions (
  character_id text not null references reference_characters (character_id) on delete cascade,
  opportunity_id text not null,
  opportunity_kind text not null check (opportunity_kind in ('originFeat', 'generalFeat', 'fightingStyle', 'epicBoon')),
  talent_id text not null,
  -- null só para Talento de Origem (criação).
  acquisition_level integer check (acquisition_level between 1 and 20),
  -- Subclasse NO MOMENTO da aquisição (null = desconhecida ou ainda inexistente).
  subclass_id text,
  -- Os 6 atributos ANTES da aquisição, como a fonte informa — null = desconhecidos (nunca preenchidos com zero ou valor final).
  ability_scores jsonb,
  source_location text,
  primary key (character_id, opportunity_id),
  constraint reference_acquisitions_level_check check ((opportunity_kind = 'originFeat') = (acquisition_level is null))
);

-- Personagem republicado por outra fonte: só a citação, nunca um segundo personagem contável.
create table if not exists reference_character_citations (
  source_id text not null references reference_sources (source_id) on delete cascade,
  character_key text not null,
  canonical_character_id text not null references reference_characters (character_id) on delete cascade,
  source_location text,
  primary key (source_id, character_key)
);

-- Menção parcial ("o guia recomenda o talento X para a classe Y"): não é
-- um personagem e NUNCA entra na contagem de personagens.
create table if not exists reference_mentions (
  source_id text not null references reference_sources (source_id) on delete cascade,
  mention_key text not null,
  opportunity_kind text not null check (opportunity_kind in ('originFeat', 'generalFeat', 'fightingStyle', 'epicBoon')),
  class_id text,
  subclass_id text,
  acquisition_level integer check (acquisition_level between 1 and 20),
  talent_id text not null,
  source_location text,
  primary key (source_id, mention_key)
);

create index if not exists reference_characters_class_idx on reference_characters (class_id);
create index if not exists reference_acquisitions_kind_idx on reference_acquisitions (opportunity_kind);

-- Nenhuma política: com RLS ligado e sem política, `anon`/`authenticated`
-- não leem nem gravam nada aqui. Escrita só pelo SQL Editor do painel
-- (papel `postgres`); leitura só agregada, pela função do §3.
alter table reference_sources enable row level security;
alter table reference_characters enable row level security;
alter table reference_acquisitions enable row level security;
alter table reference_character_citations enable row level security;
alter table reference_mentions enable row level security;

revoke all on reference_sources, reference_characters, reference_acquisitions, reference_character_citations, reference_mentions from anon, authenticated;

-- ============================================================================
-- §2 — FUNÇÕES AUXILIARES (mesmas regras de `src/recommendations/*.ts`)
-- ============================================================================

-- Maior atributo de um objeto {FOR,DEX,CON,INT,SAB,CAR} — desempate
-- FOR > DEX > CON > INT > SAB > CAR (igual a `character_build_highest_ability`
-- da 0001). null se faltar qualquer um dos 6 ou se algum não for número.
create or replace function ability_scores_highest(scores jsonb)
returns text
language plpgsql
immutable
as $$
declare
  keys text[] := array['FOR', 'DEX', 'CON', 'INT', 'SAB', 'CAR'];
  best_key text;
  best_value numeric;
  current_key text;
begin
  if scores is null or jsonb_typeof(scores) <> 'object' then
    return null;
  end if;
  foreach current_key in array keys loop
    if jsonb_typeof(scores -> current_key) is distinct from 'number' then
      return null;
    end if;
    if best_key is null or (scores ->> current_key)::numeric > best_value then
      best_key := current_key;
      best_value := (scores ->> current_key)::numeric;
    end if;
  end loop;
  return best_key;
end;
$$;

-- Faixa de nível ("tier of play"): criação → 0, 1–4 → 1, 5–10 → 2, 11–16 → 3, 17–20 → 4.
create or replace function talent_level_band(p_level integer)
returns integer
language sql
immutable
as $$
  select case
    when p_level is null then 0
    when p_level <= 4 then 1
    when p_level <= 10 then 2
    when p_level <= 16 then 3
    else 4
  end;
$$;

-- Tipo de oportunidade de um registro de `character_builds.talent_acquisitions`
-- — registros anteriores ao campo `opportunityKind` são derivados do `opportunityId`.
create or replace function talent_record_opportunity_kind(rec jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    rec ->> 'opportunityKind',
    case
      when rec ->> 'opportunityId' in ('species', 'background') then 'originFeat'
      when rec ->> 'opportunityId' ~ '^asi-[0-9]+$' then 'generalFeat'
      when rec ->> 'opportunityId' like '%-dadiva-epica-escolha' then 'epicBoon'
      else 'fightingStyle'
    end
  );
$$;

-- ============================================================================
-- §3 — CONTAGENS PARA O RECOMENDADOR
--
-- Para um tipo de oportunidade + classe + contexto do personagem atual,
-- devolve, por (conjunto, faixa, talento): personagens DISTINTOS que o
-- escolheram, grupos independentes, e o tamanho da amostra da faixa.
-- Só contagens — nenhuma linha individual sai daqui. A decisão do que
-- recomendar (amostra mínima, ordem dos conjuntos, desempate, máximo de
-- 3, elegibilidade) é do app (`src/recommendations/policy.ts`).
--
-- Dados reais só entram com `p_include_user = true` (o app mantém isso
-- desligado até a verificação de confirmação/contagens/isolamento em
-- produção), e mesmo assim só faixas com >= 20 personagens distintos
-- saem da função (contagens reais pequenas nunca são expostas).
-- ============================================================================

create or replace function get_talent_choice_counts(
  p_opportunity_kind text,
  p_class_id text,
  p_level integer default null,
  p_subclass_id text default null,
  p_highest_ability text default null,
  p_exclude_build_id text default null,
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
      b.build_id::text as character_key,
      b.build_id::text as group_key,
      case when jsonb_typeof(a.rec -> 'acquisitionLevel') = 'number' then (a.rec ->> 'acquisitionLevel')::integer end as level,
      case
        when jsonb_typeof(a.rec -> 'context' -> 'subclassId') = 'string' and a.rec -> 'context' ->> 'subclassId' <> 'desconhecido'
          then a.rec -> 'context' ->> 'subclassId'
      end as subclass_id,
      ability_scores_highest(a.rec -> 'context' -> 'abilityScores') as highest,
      a.rec ->> 'talentId' as talent_id
    from character_builds b
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(b.talent_acquisitions) = 'array' then b.talent_acquisitions else '[]'::jsonb end
    ) as a (rec)
    where p_include_user
      and b.origin = 'user'
      and b.status = 'confirmed'
      and (p_exclude_build_id is null or b.build_id::text <> p_exclude_build_id)
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
