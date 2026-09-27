-- ============================================================================
-- Ficha D&D — base de estatísticas anônimas da comunidade
--
-- ⚠️ Esta migração NÃO foi aplicada a nenhum projeto Supabase real —
-- esta sessão não tem credenciais/acesso a uma conta Supabase. Para
-- ativar o backend real:
--
--   1. Crie um projeto em https://supabase.com
--   2. Rode este arquivo no SQL Editor do projeto (ou `supabase db push`
--      com a CLI, se preferir versionar migrações por lá)
--   3. Defina no seu ambiente (ex.: `.env.local`, nunca commitado):
--        VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
--        VITE_SUPABASE_ANON_KEY=<sua chave anon/public>
--
-- Até lá, o app inteiro funciona normalmente com a implementação em
-- memória (`repositories/inMemory/InMemoryBuildStore.ts`).
-- ============================================================================

-- ============================================================================
-- TABELA: character_builds
--
-- Um registro por personagem em construção (upsert por build_id — ver
-- CharacterBuildRepository). Só colunas estruturadas relevantes para
-- analisar escolhas de criação. Nenhum campo pessoal, de texto livre,
-- nome de personagem, IP ou qualquer identificador de conta.
-- ============================================================================

create table if not exists character_builds (
  build_id uuid primary key,

  level integer not null check (level between 1 and 20),
  class_id text,
  subclass_id text,
  species_id text,
  background_id text,

  for_score integer not null check (for_score between 1 and 30),
  dex_score integer not null check (dex_score between 1 and 30),
  con_score integer not null check (con_score between 1 and 30),
  int_score integer not null check (int_score between 1 and 30),
  sab_score integer not null check (sab_score between 1 and 30),
  car_score integer not null check (car_score between 1 and 30),

  skill_proficiencies text[] not null default '{}',
  skill_expertise text[] not null default '{}',
  saving_throw_proficiencies text[] not null default '{}',

  armor_id text, -- null = sem armadura
  shield boolean not null default false,

  spellcasting_ability text, -- null = não conjura

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists character_builds_class_id_idx on character_builds (class_id);
create index if not exists character_builds_class_level_idx on character_builds (class_id, level);

-- ============================================================================
-- PRIVACIDADE / RLS
--
-- A tabela crua NUNCA é exposta por leitura pública — só por escrita
-- (upsert do próprio build anônimo) e por funções agregadas
-- SECURITY DEFINER abaixo, que devolvem apenas contagens, nunca linhas
-- individuais. Isso significa que mesmo sem autenticação de usuário,
-- ninguém consegue ler o build de outra pessoa pela API pública.
-- ============================================================================

alter table character_builds enable row level security;

drop policy if exists "anon pode inserir/atualizar seu próprio build" on character_builds;
create policy "anon pode inserir/atualizar seu próprio build"
  on character_builds
  for insert
  to anon
  with check (true);

drop policy if exists "anon pode atualizar builds (upsert)" on character_builds;
create policy "anon pode atualizar builds (upsert)"
  on character_builds
  for update
  to anon
  using (true)
  with check (true);

-- Nenhuma política de SELECT para "anon": leitura pública direta da
-- tabela fica bloqueada por padrão com RLS habilitado. Toda leitura
-- agregada passa pelas funções abaixo.

-- ============================================================================
-- FUNÇÕES DE AGREGAÇÃO (usadas por SupabaseAnalyticsRepository)
--
-- Todas aceitam os mesmos filtros opcionais (classe, subclasse,
-- espécie, antecedente, faixa de nível) e devolvem só contagens.
-- ============================================================================

create or replace function count_builds(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null
)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from character_builds
  where (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level);
$$;

create or replace function get_subclass_distribution(
  p_class_id text default null,
  p_subclass_id text default null, -- ignorado aqui (não faz sentido filtrar E agrupar pelo mesmo campo), mantido só para manter a mesma assinatura de parâmetros nas 5 funções
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
  select subclass_id as value, count(*) as count
  from character_builds
  where subclass_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by subclass_id
  order by count desc;
$$;

create or replace function get_species_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null, -- idem: ignorado no agrupamento
  p_background_id text default null,
  p_min_level int default null,
  p_max_level int default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select species_id as value, count(*) as count
  from character_builds
  where species_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by species_id
  order by count desc;
$$;

create or replace function get_background_distribution(
  p_class_id text default null,
  p_subclass_id text default null,
  p_species_id text default null,
  p_background_id text default null, -- idem: ignorado no agrupamento
  p_min_level int default null,
  p_max_level int default null
)
returns table(value text, count bigint)
language sql
security definer
stable
as $$
  select background_id as value, count(*) as count
  from character_builds
  where background_id is not null
    and (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by background_id
  order by count desc;
$$;

create or replace function get_armor_distribution(
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
  select coalesce(armor_id, 'unarmed') as value, count(*) as count
  from character_builds
  where (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by coalesce(armor_id, 'unarmed')
  order by count desc;
$$;

-- Empates são resolvidos pela ordem FOR > DEX > CON > INT > SAB > CAR
-- (simplificação documentada — mesma regra usada em
-- repositories/AnalyticsRepository.ts#highestAbility, para o cálculo
-- em memória bater com o cálculo em banco).
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
  with scoped as (
    select *
    from character_builds
    where (p_class_id is null or class_id = p_class_id)
      and (p_subclass_id is null or subclass_id = p_subclass_id)
      and (p_species_id is null or species_id = p_species_id)
      and (p_background_id is null or background_id = p_background_id)
      and (p_min_level is null or level >= p_min_level)
      and (p_max_level is null or level <= p_max_level)
  ),
  ranked as (
    select
      case
        when for_score >= dex_score and for_score >= con_score and for_score >= int_score and for_score >= sab_score and for_score >= car_score then 'FOR'
        when dex_score >= con_score and dex_score >= int_score and dex_score >= sab_score and dex_score >= car_score then 'DEX'
        when con_score >= int_score and con_score >= sab_score and con_score >= car_score then 'CON'
        when int_score >= sab_score and int_score >= car_score then 'INT'
        when sab_score >= car_score then 'SAB'
        else 'CAR'
      end as highest_ability
    from scoped
  )
  select highest_ability as value, count(*) as count
  from ranked
  group by highest_ability
  order by count desc;
$$;

grant execute on function count_builds to anon;
grant execute on function get_subclass_distribution to anon;
grant execute on function get_species_distribution to anon;
grant execute on function get_background_distribution to anon;
grant execute on function get_armor_distribution to anon;
grant execute on function get_highest_ability_distribution to anon;
