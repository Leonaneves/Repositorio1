# Backend de estatísticas (Supabase/Postgres)

Este projeto usa Supabase (Postgres gerenciado) só para a base de
estatísticas anônimas da comunidade (`character_builds` + funções de
agregação). Nada relacionado à ficha em si (personagem em edição)
depende de backend — essa parte continua só no navegador nesta etapa.

## Por que Supabase + Postgres (e não outra coisa)

A sua preferência inicial já era essa, e para este escopo específico
não vi vantagem técnica em trocar:

- As perguntas que o sistema de insights precisa responder são
  fundamentalmente `GROUP BY` + `COUNT` com filtros combináveis — SQL
  relacional é o encaixe natural, mais simples de raciocinar e de
  auditar do que agregações client-side sobre um banco de documentos.
- Postgres deixa a agregação pesada morar no banco (funções
  `SECURITY DEFINER`), então o navegador nunca baixa builds individuais
  — só os números já somados. Isso também é o que permite bloquear
  leitura pública da tabela crua com RLS e mesmo assim servir
  estatísticas agregadas.
- Supabase dá um SDK JS pronto, sem servidor próprio para manter, com
  um free tier suficiente para esta fase.

Uma alternativa como Firebase/Firestore (NoSQL) exigiria ou trazer
todos os builds para o cliente para agregar (não escala e vaza mais
dado por request) ou escrever Cloud Functions/BigQuery à parte para as
agregações — mais peça móvel para o mesmo resultado. Se um dia o volume
justificar um data warehouse dedicado (dbt, BigQuery etc.), a troca é
isolada: só `repositories/supabase/*` muda, graças à interface
`AnalyticsRepository`.

## Como ativar (nenhum projeto foi criado a partir desta sessão)

Esta sessão não tem conta/credenciais Supabase, então não criei nem
apliquei nada a um banco real. Para ativar:

1. Crie um projeto em https://supabase.com.
2. Abra o SQL Editor do projeto e rode `migrations/0001_character_builds.sql`
   (ou use `supabase db push` com a CLI, se preferir versionar por lá).
3. Copie `.env.example` (na raiz do projeto) para `.env.local` e
   preencha com a URL e a chave `anon` do seu projeto:
   ```
   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<sua chave anon/public>
   ```
4. Reinicie `npm run dev`. A fábrica em `src/repositories/index.ts`
   detecta essas variáveis automaticamente e passa a usar
   `SupabaseCharacterBuildRepository`/`SupabaseAnalyticsRepository` em
   vez da implementação em memória — nenhum outro código muda.

Sem essas variáveis definidas, o app inteiro (ficha + insights)
continua funcionando normalmente com dados em memória (perdidos ao
recarregar a página) — útil para desenvolvimento e obrigatório para os
testes automatizados, que nunca tocam um banco real.
