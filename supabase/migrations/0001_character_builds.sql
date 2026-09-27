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
--
-- Como nada foi implantado ainda, esta etapa reescreve o arquivo de
-- schema "pré-lançamento" diretamente (em vez de empilhar uma
-- migração 0002 incremental) — a partir do primeiro deploy real, uma
-- mudança de schema como a adição de `p_highest_ability` abaixo (§1.2)
-- viraria sua própria migração numerada.
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
-- HELPER: qual atributo é o maior num build (§1.2)
--
-- Extraído para uma função própria (em vez de repetir o CASE em cada
-- função de agregação) para que o filtro `p_highest_ability` das
-- outras funções e o agrupamento de `get_highest_ability_distribution`
-- usem exatamente a mesma regra de desempate: FOR > DEX > CON > INT >
-- SAB > CAR — igual à função `highestAbility` em
-- repositories/AnalyticsRepository.ts, para o cálculo em banco e em
-- memória serem semanticamente equivalentes.
-- ============================================================================

create or replace function character_build_highest_ability(b character_builds)
returns text
language sql
immutable
as $$
  select case
    when b.for_score >= b.dex_score and b.for_score >= b.con_score and b.for_score >= b.int_score and b.for_score >= b.sab_score and b.for_score >= b.car_score then 'FOR'
    when b.dex_score >= b.con_score and b.dex_score >= b.int_score and b.dex_score >= b.sab_score and b.dex_score >= b.car_score then 'DEX'
    when b.con_score >= b.int_score and b.con_score >= b.sab_score and b.con_score >= b.car_score then 'CON'
    when b.int_score >= b.sab_score and b.int_score >= b.car_score then 'INT'
    when b.sab_score >= b.car_score then 'SAB'
    else 'CAR'
  end;
$$;

-- ============================================================================
-- FUNÇÕES DE AGREGAÇÃO (usadas por SupabaseAnalyticsRepository)
--
-- Todas aceitam os mesmos filtros opcionais (classe, subclasse,
-- espécie, antecedente, faixa de nível, maior atributo) e devolvem só
-- contagens.
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
  where (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability);
$$;

create or replace function get_subclass_distribution(
  p_class_id text default null,
  p_subclass_id text default null, -- ignorado aqui (não faz sentido filtrar E agrupar pelo mesmo campo), mantido só para manter a mesma assinatura de parâmetros nas demais funções
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
  where subclass_id is not null
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
  p_species_id text default null, -- idem: ignorado no agrupamento
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
  where species_id is not null
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
  p_background_id text default null, -- idem: ignorado no agrupamento
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
  where background_id is not null
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
  where (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
    and (p_highest_ability is null or character_build_highest_ability(character_builds) = p_highest_ability)
  group by coalesce(armor_id, 'unarmed')
  order by count desc;
$$;

-- Não recebe `p_highest_ability`: filtrar e agrupar pelo mesmo campo
-- computado não faz sentido (o resultado seria trivialmente 100% para
-- o valor filtrado).
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
  where (p_class_id is null or class_id = p_class_id)
    and (p_subclass_id is null or subclass_id = p_subclass_id)
    and (p_species_id is null or species_id = p_species_id)
    and (p_background_id is null or background_id = p_background_id)
    and (p_min_level is null or level >= p_min_level)
    and (p_max_level is null or level <= p_max_level)
  group by character_build_highest_ability(character_builds)
  order by count desc;
$$;

grant execute on function count_builds to anon;
grant execute on function get_subclass_distribution to anon;
grant execute on function get_species_distribution to anon;
grant execute on function get_background_distribution to anon;
grant execute on function get_armor_distribution to anon;
grant execute on function get_highest_ability_distribution to anon;
grant execute on function character_build_highest_ability to anon;
