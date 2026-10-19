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
2. Abra o SQL Editor do projeto e rode, NESTA ORDEM,
   `migrations/0001_character_builds.sql`,
   `migrations/0002_build_ownership_and_talents.sql` e
   `migrations/0003_select_own_builds_for_upsert.sql` (ou use
   `supabase db push` com a CLI, se preferir versionar por lá — ela já
   respeita a ordem numérica).
3. Ative o login anônimo: Authentication → Providers → **Anonymous
   Sign-Ins** → Enable. Sem isso, a sincronização de personagens para
   as estatísticas falha (de forma silenciosa para o jogador — ver
   "Propriedade dos registros" abaixo) porque `ensureOwnedSession`
   (`src/repositories/supabase/client.ts`) não consegue abrir uma
   sessão.
4. Copie `.env.example` (na raiz do projeto) para `.env.local` e
   preencha com a URL e a chave `anon` do seu projeto:
   ```
   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<sua chave anon/public>
   ```
   Nunca a chave `service_role` aqui nem em qualquer variável
   `VITE_*` — ela dá acesso total ao banco, ignorando toda política de
   RLS, e qualquer `VITE_*` é embutida no bundle do navegador, ou seja,
   publicamente legível. A chave `service_role` só teria uso num
   backend separado, que esta etapa não implementa (ver "Registros de
   referência" abaixo).
5. Reinicie `npm run dev`. A fábrica em `src/repositories/index.ts`
   detecta essas variáveis automaticamente e passa a usar
   `SupabaseCharacterBuildRepository`/`SupabaseAnalyticsRepository` em
   vez da implementação em memória — nenhum outro código muda.

Sem essas variáveis definidas, o app inteiro (ficha + insights)
continua funcionando normalmente com dados em memória (perdidos ao
recarregar a página) — útil para desenvolvimento e obrigatório para os
testes automatizados, que nunca tocam um banco real.

## Propriedade dos registros (migration 0002)

A migration `0001` deixava QUALQUER cliente atualizar QUALQUER linha
(`anon ... for update ... using (true)`) — corrigido em `0002`: cada
personagem só pode ser alterado pela mesma sessão (Supabase Anonymous
Auth, `signInAnonymously()`) que o criou. Isso não exige nenhuma tela
de cadastro/login nem nenhuma chave nova — continua a mesma chave
`anon` pública — mas exige o passo 3 acima ativado no painel do seu
projeto; sem isso, `ensureOwnedSession` rejeita e a sincronização
falha silenciosamente (o personagem continua editável e exportável
normalmente — só não entra nas estatísticas da comunidade enquanto o
provedor não estiver ativo).

`0003` acrescenta uma política de SELECT restrita ao próprio build
(`owner_id = auth.uid()`). Ela é necessária porque o app grava com
upsert (`INSERT ... ON CONFLICT DO UPDATE`), e o Postgres aplica as
políticas de SELECT também a esse comando — sem ela, toda gravação é
recusada com "new row violates row-level security policy". Cada sessão
continua sem conseguir ler o build de qualquer outra pessoa.

## Registros de referência (preparado, mas NÃO implementado nesta etapa)

A tabela já tem `origin`, `reference_source_id` e
`reference_content_type` para, numa etapa futura, guardar personagens
de referência importados de fontes externas — identificados
separadamente dos personagens reais (`origin = 'reference'`) e da
origem do próprio conteúdo (extraído vs. sintético). Nenhum código
desta etapa grava um registro de referência: a importação em si, e o
"caminho administrativo" que a faria (rodando server-side com a chave
`service_role`, nunca pelo navegador), ficam para quando o
recomendador for implementado.
