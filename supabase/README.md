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
   `migrations/0002_build_ownership_and_talents.sql`,
   `migrations/0003_select_own_builds_for_upsert.sql`,
   `migrations/0004_talent_recommendations.sql`,
   `migrations/0005_confirmed_versions.sql`,
   `migrations/0006_build_choice_recommendations.sql`,
   `migrations/0007_subclass_metamagic_recommendations.sql` e
   `migrations/0008_recommendation_scores.sql` (ou use
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

## Confirmação como versão imutável (migration 0005)

A partir da `0005`, o app **só grava ao confirmar** — rascunhos nunca
saem do navegador — e cada "Confirmar" é um **registro novo**, nunca a
atualização de um registro existente:

- `character_id` liga as versões do mesmo personagem; `confirmed_at` é
  a hora da confirmação, pelo relógio do banco.
- A única política de escrita é INSERT de uma versão `confirmed` da
  própria sessão anônima. As políticas de UPDATE e SELECT da `0002`/`0003`
  foram removidas: nada gravado pode ser alterado nem lido
  individualmente pela API pública.
- As estatísticas (insights e recomendador) leem a view
  `latest_confirmed_character_builds` — só a versão confirmada mais
  recente de cada personagem; confirmar de novo depois de editar
  substitui a versão anterior na contagem, nunca soma. A view não é
  acessível pela API pública (`revoke` explícito).
- Um personagem novo ("Meus personagens" → "Novo personagem") tem
  `character_id` próprio e nunca altera os anteriores.
- Linhas antigas: rascunhos continuam guardados e são ignorados; uma
  linha antiga já confirmada vira a versão única do seu personagem.

## Recomendações por hierarquia de influência (migration 0008)

O site passa a usar `get_build_choice_scores` e `get_talent_choice_scores`
(as funções antigas continuam no banco, sem uso). A CLASSE define a base
— só com 10+ personagens distintos; abaixo disso, nada é devolvido — e
cada fator mais específico a refina por suavização:
`(escolheram_no_contexto + K × base) / (amostra_do_contexto + K)`, com
K = 10 (Espécie: K = 20, a classe pesa mais). Com poucos personagens no
contexto a base quase não muda; com muitos, o contexto decide.

| Escolha | Fatores (do mais ao menos importante) |
|---|---|
| Subclasse | classe ("escolhido por X de 10 {classe}") |
| Espécie | classe → subclasse |
| Antecedente | classe → subclasse; ajuste por regra: atributos que o Antecedente aumenta × atributos que a classe/subclasse deixa como maior e menor |
| Maior / menor atributo | classe → subclasse |
| Perícias / Especialização | classe → maior atributo; ajuste por regra: atributo da perícia × atributos do personagem |
| Talentos | classe e nível → subclasse e maior atributo na hora da escolha |
| Metamagia | classe → Metamagias já escolhidas (o que costuma vir junto) |
| Invocações | classe → subclasse → Invocações já escolhidas |
| Manobras | classe → subclasse → Manobras já escolhidas |

Nenhuma contagem pequena sai do banco: as funções devolvem só a
pontuação e a contagem da classe (amostra 10+). Novas colunas
`invocations` e `maneuvers` (linhas antigas: vazias). **Aplique a `0008`
antes de publicar o site novo.**

## Recomendações de Subclasse e Metamagia (migration 0007)

- Nova coluna `metamagic_options` (text[]): as opções de Metamagia
  conhecidas pelo Feiticeiro. Linhas antigas ficam vazias e não contam.
- `get_build_choice_counts` (mesma assinatura) ganha `p_kind =
  'subclass'` (só a faixa da classe: só personagens que já escolheram
  subclasse) e `'metamagic'`.
- A view `latest_confirmed_character_builds` é recriada de novo (coluna
  nova) e continua sem acesso pela API pública.

Cada opção recomendada mostra o motivo abaixo do seletor, sempre na
proporção "de 10" (ex.: "escolhido por 7 de 10 guerreiros"; com mais de
10 personagens, "cerca de 6 de cada 10").

**Aplique a `0007` antes de publicar o site novo** (o site novo grava
`metamagic_options` ao confirmar).

## Recomendações de Espécie, Antecedente, Perícias, Especialização e atributos (migration 0006)

- Nova coluna `skill_choices` (jsonb): as perícias escolhidas em CADA
  escolha de perícia/Especialização, pelo id da escolha (ex.:
  `classe-guerreiro-pericias`). Linhas antigas ficam com `{}` e não
  contam para Perícias/Especialização.
- `get_build_choice_counts(p_kind, p_class_id, p_subclass_id,
  p_choice_id, p_exclude_character_id)`: só contagens, só dados reais
  (versão confirmada mais recente de cada personagem), mesma classe —
  primeiro mesma subclasse, depois só a classe. Nunca devolve uma
  faixa com menos de 10 personagens distintos. `p_kind`: `species`,
  `background`, `highestAbility`, `dumpAbility` (menor atributo base;
  empate → primeiro em FOR > DEX > CON > INT > SAB > CAR) ou
  `skillChoice`.
- `get_talent_choice_counts`: amostra mínima real 20 → 10.
- A view `latest_confirmed_character_builds` é recriada (para incluir a
  coluna nova) e continua sem acesso pela API pública.

**Aplique a `0006` antes de publicar o site novo**: o site novo grava
`skill_choices` ao confirmar, e sem a coluna a confirmação falha.

## Recomendações de talentos e registros de referência (migration 0004)

`0004` cria a base do recomendador de talentos, **vazia**:

- `reference_sources` → `reference_characters` → `reference_acquisitions`:
  personagens de referência extraídos de fontes externas (guias,
  artigos, vídeos…) ou, no futuro, gerados por uma regra sintética
  aprovada — sempre identificados pela fonte e pelo tipo de conteúdo,
  nunca misturados com personagens reais;
- `reference_character_citations`: o mesmo personagem republicado por
  outra fonte (cópia) — guardado só como citação, nunca contado de novo;
- `reference_mentions`: menções parciais ("o guia recomenda o talento X
  para a classe Y") — não são personagens e nunca entram na contagem;
- `get_talent_choice_counts(...)`: a ÚNICA leitura possível pela API
  pública. Devolve só contagens agregadas (personagens distintos por
  talento, tamanho da amostra, número de fontes independentes) — as
  tabelas acima não têm nenhuma política de leitura para `anon`/
  `authenticated`.

Dados reais (`character_builds`, só a versão confirmada mais recente
de cada personagem) entram na contagem com `p_include_user = true` —
**ligado** no app (`src/recommendations/policy.ts#REAL_RECORDS_ENABLED`)
depois da verificação em produção de: (1) "Confirmar personagem"
gravando `status = 'confirmed'`; (2) estatísticas contando só
confirmados; (3) isolamento entre sessões. A função nunca devolve uma
faixa de contexto real com menos de 10 personagens distintos (era 20
até a `0006`).

As colunas `origin = 'reference'`/`reference_source_id`/
`reference_content_type` de `character_builds` (preparadas na `0002`)
continuam sem uso: referências podem ser parciais (sem atributos, sem
subclasse) e `character_builds` exige atributos/nível preenchidos —
forçar valores ali seria inventar dados.

A importação NÃO usa nenhuma chave: o importador
(`npm run references -- sql <arquivo.json>`) valida o arquivo e gera um
SQL que é colado no SQL Editor do painel (que roda como dono do banco).
Ver `reference-data/README.md`.
