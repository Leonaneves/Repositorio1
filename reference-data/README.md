# Referências do recomendador de talentos

Esta pasta guarda os arquivos JSON de **fontes reais** (guias, artigos,
vídeos, planilhas…) que alimentam as recomendações de talentos enquanto
ainda não há volume suficiente de personagens reais confirmados.

**Regras desta pasta**

- Um arquivo = uma fonte.
- Nunca colocar aqui exemplos fictícios. Exemplos de teste ficam só em
  `src/references/testFixtures.ts` e nunca são importados.
- Conteúdo sintético só depois de você aprovar a regra de geração
  (hoje nenhuma está aprovada, e o validador recusa qualquer arquivo
  `"contentType": "synthetic"`).
- O que a fonte não informa fica `null`. Nunca preencher com zero, com o
  valor final do personagem ou com uma subclasse escolhida depois.

## Como importar (depois de aplicar a migration 0004)

1. Valide: `npm run references -- validate reference-data/<arquivo>.json`
   - **INVÁLIDO** (id inexistente, incompatibilidade comprovada pelas
     regras): o arquivo inteiro é recusado e nada é gerado.
   - **DADOS INSUFICIENTES**: o registro entra, mas só participa das
     comparações para as quais tem dados (ou é ignorado, quando o aviso
     diz isso).
2. Gere o SQL: `npm run references -- sql reference-data/<arquivo>.json --out <arquivo>.sql`
3. Cole o conteúdo do `.sql` no **SQL Editor** do Supabase e clique em
   **Run**. Reimportar o mesmo arquivo (mesmo `source.id`) atualiza os
   registros e remove o que saiu do arquivo, sem duplicar nada. Se
   qualquer comando falhar, nada é gravado.
4. Para remover uma fonte inteira: `npm run references -- delete <source-id>`
   e cole o SQL gerado no SQL Editor.
5. Para consultar os ids aceitos (classes, subclasses, espécies,
   antecedentes, talentos): `npm run references -- ids`.

## Modelo do arquivo (formatVersion 1)

Os valores entre `<…>` são marcadores de formato. Este exemplo não é
importável.

```json
{
  "formatVersion": 1,
  "source": {
    "id": "<id-estavel-da-fonte>",
    "title": "<título da fonte>",
    "kind": "guide",
    "citation": "<URL ou referência bibliográfica>",
    "accessedAt": "<AAAA-MM-DD ou null>",
    "independenceGroup": "<grupo-de-independencia>",
    "contentType": "extracted"
  },
  "characters": [
    {
      "key": "<chave-do-personagem>",
      "sourceLocation": "<onde aparece na fonte, ou null>",
      "classId": "<id da classe>",
      "subclassId": "<nome completo da subclasse, ou null>",
      "speciesId": "<id da espécie, ou null>",
      "backgroundId": "<id do antecedente, ou null>",
      "level": 0,
      "acquisitions": [
        {
          "opportunityKind": "<originFeat | generalFeat | fightingStyle | epicBoon>",
          "level": 0,
          "talentId": "<id do talento>",
          "abilityScoresBefore": { "FOR": 0, "DEX": 0, "CON": 0, "INT": 0, "SAB": 0, "CAR": 0 },
          "sourceLocation": "<onde aparece na fonte, ou null>"
        }
      ]
    },
    {
      "key": "<chave-da-copia>",
      "sameAs": { "sourceId": "<id da fonte original>", "characterKey": "<chave do personagem original>" }
    }
  ],
  "mentions": [
    {
      "key": "<chave-da-mencao>",
      "opportunityKind": "<originFeat | generalFeat | fightingStyle | epicBoon>",
      "talentId": "<id do talento>",
      "classId": "<id da classe, ou null>",
      "subclassId": "<nome completo da subclasse, ou null>",
      "level": null,
      "sourceLocation": "<onde aparece na fonte, ou null>"
    }
  ]
}
```

### Fonte (`source`)

| Campo | Obrigatório | Significado |
| --- | --- | --- |
| `id` | sim | Identificador estável (minúsculas, números, hífens). Reimportar com o mesmo id atualiza a fonte. |
| `title` | sim | Título da fonte. |
| `kind` | sim | `guide`, `article`, `video`, `forum`, `book`, `spreadsheet` ou `other`. |
| `citation` | sim | URL ou referência de onde o conteúdo foi extraído. |
| `accessedAt` | não | Data de acesso, `AAAA-MM-DD`. |
| `independenceGroup` | sim | Fontes que copiam ou republicam o mesmo conteúdo usam o **mesmo** grupo e contam como uma fonte independente só. |
| `contentType` | sim | `extracted` (extraído de fonte real) ou `synthetic` (gerado por regra aprovada — bloqueado por enquanto). |
| `synthetic` | só sintético | `{ "generationRuleId": "...", "derivedFromSourceIds": ["..."] }`. |

### Personagem (`characters[]`)

Um personagem é um build concreto apresentado pela fonte, com as
escolhas de talento que ele fez.

| Campo | Obrigatório | Significado |
| --- | --- | --- |
| `key` | sim | Chave estável dentro da fonte. |
| `classId` | sim | Id da classe (`npm run references -- ids`). |
| `level` | sim | Nível do personagem como apresentado (1–20). |
| `subclassId` | não | Nome completo da subclasse (ex.: `Campeão`, `Caminho do Berserker`). Só existe a partir do nível 3. |
| `speciesId`, `backgroundId` | não | Ids do catálogo. Sem a espécie, um Talento de Origem não pode ser confirmado como escolha do Humano e é ignorado. |
| `acquisitions` | sim | As escolhas de talento (pode ser lista vazia). |
| `sameAs` | não | Use **em vez** dos campos acima quando o personagem é cópia de um já importado de outra fonte. Fica guardado só como citação e nunca é contado de novo. |

### Escolha de talento (`acquisitions[]`)

| Campo | Obrigatório | Significado |
| --- | --- | --- |
| `opportunityKind` | sim | `originFeat` (Talento de Origem do Humano, na criação), `generalFeat` (talento num nível de Aumento de Atributo), `fightingStyle` ou `epicBoon`. |
| `level` | sim | Nível em que a escolha foi feita; `null` para `originFeat`. Precisa existir essa oportunidade para a classe nesse nível. |
| `talentId` | sim | Id do catálogo daquele tipo. |
| `abilityScoresBefore` | não | Os 6 atributos **imediatamente antes** desta escolha, como a fonte informa. Se a fonte não trouxer os 6, use `null`. |

O Talento de Origem concedido pelo Antecedente não é listado aqui: ele
é automático (vem do `backgroundId`) e serve só de contexto.

### Menção parcial (`mentions[]`)

Para quando a fonte só diz algo como "o talento X é bom para a classe Y",
sem um personagem concreto. Fica guardada separadamente e **nunca** conta
como personagem.

## Como as referências viram recomendação

- Comparação sempre com o mesmo tipo de oportunidade e a mesma classe;
  depois, da mais parecida para a mais ampla: mesmo nível + subclasse +
  maior atributo antes da escolha → mesmo nível + subclasse → mesmo
  nível + maior atributo → mesmo nível → mesma faixa de nível (1–4,
  5–10, 11–16, 17–20).
- Amostra mínima de referências: 3 personagens distintos de pelo menos
  2 grupos de independência.
- Ordem de uso: dados reais (quando liberados e com 20+ personagens) →
  referências extraídas → referências sintéticas aprovadas. Nunca
  mistura os três rankings.
- No máximo 3 opções por seletor, sempre entre as elegíveis para o
  personagem atual. Desempate: mais personagens → mais grupos de
  independência → ordem do seletor.
