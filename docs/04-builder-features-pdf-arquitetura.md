# Redefinição de etapa — Builder, Features e PDF Exporter

> Documento de diagnóstico e arquitetura. **Nenhuma implementação foi feita nesta etapa**, conforme pedido. Cobre os 24 itens da sua lista de entrega, organizados nos mesmos 5 blocos.

---

## 0. Leitura rápida

- O PDF que você enviou (`Ficha_A4_PTBR_Impress_o.pdf`) **não tem AcroForm nem JavaScript** — é um export puramente gráfico do InDesign, 2 páginas A4. Visualmente é a MESMA arte do PDF interativo da Fase 1 (mesmas caixas, mesmos rótulos, mesmo tamanho de página, a menos de <0,1pt de arredondamento).
- Isso muda a estratégia técnica: eu recomendo **usar o PDF interativo da Fase 1 (com os 450 campos nomeados que já mapeei) como o arquivo-molde real do exportador**, preenchendo por nome de campo em vez de por coordenada, e depois "achatar" (flatten) o formulário e remover o JavaScript do documento antes de entregar o arquivo final ao usuário. O resultado visual é idêntico ao PDF de impressão que você acabou de enviar — mas o caminho de engenharia é muito mais robusto (sem "chutar" posição de texto, sem remontar do zero o que a Acrobat já formatou). Isto é a **Decisão #1** da seção 15 — meu recomendado, mas preciso da sua confirmação antes de seguir por ele.
- Boa notícia prática: como eu já extraí os 450 campos com nome, tipo e retângulo exato na Fase 1 (`docs/referencia/campos-completos.json`), **a maior parte do trabalho de mapeamento de coordenadas já está feita**. O que falta é decidir a estratégia (acima) e escrever o `PdfFieldMap` que liga `Character`/`Features` a esses nomes de campo.

---

## 1–6. Diagnóstico do PDF

### 1–4. Diagnóstico técnico

| Item | Valor |
|---|---|
| Páginas | 2 |
| Tamanho de página | 595,276 × 841,89 pt (A4) — igual ao PDF interativo (595,2 × 841,92 pt), diferença desprezível |
| AcroForm | **Nenhum** (`Form: none`) |
| JavaScript | Nenhum |
| Campos de formulário | 0 |
| Texto real extraível | Parcial — alguns rótulos (ex.: "NÍVEL", "APARÊNCIA", "ESPAÇOS DE MAGIAS") são texto de verdade; a maioria dos rótulos e todo o traço decorativo são arte vetorial, não texto |
| Checkboxes/radios | Nenhum widget — são só quadrados desenhados, sem função |
| Campos multiline visíveis | Talentos, Traços de Espécie, Características de Classe (2 colunas), notas de arma, proficiência de armas/ferramentas |
| Áreas com pouco espaço | Linhas de perícia (~16pt de altura), coluna "Bônus Atq/CD" (~75pt de largura), nome de magia na tabela de truques |
| Informações sem posição correspondente | Nenhuma — a ficha de impressão não tem nada que a interativa da Fase 1 não tenha; é a mesma arte sem os widgets |
| Áreas que exigiriam overlay por coordenada, se este arquivo for o molde direto | Todas — sem AcroForm, 100% do preenchimento neste arquivo específico seria por coordenada |

### 5–6. Estratégia de preenchimento e biblioteca

**Biblioteca recomendada: `pdf-lib`.** Roda em TypeScript puro, funciona no navegador (sem backend) e no Node, lê/preenche/`flatten()`s AcroForm, e desenha texto/formas em coordenadas quando preciso. Não precisa de dependências nativas (diferente de alternativas baseadas em Puppeteer/Chromium, que eu quero evitar de qualquer forma — você já pediu para não gerar o PDF via screenshot/impressão web).

**Estratégia recomendada — híbrida, dependendo da Decisão #1:**

- **Se usarmos o PDF interativo como molde** (minha recomendação): preencher ~440 dos 450 campos **por nome**, usando os tipos/retângulos já extraídos na Fase 1. Dois campos exigem tratamento especial porque sua lista de opções é montada em tempo real pelo JavaScript do Acrobat, não fica gravada no PDF: `SUBCLASSE` e `ARMADURA.ATUAL`. Para esses dois, em vez de tentar usar a API de dropdown do pdf-lib (que valida contra a lista de opções existente no arquivo), eu desenho o texto final diretamente por cima da posição do campo — mesmo efeito visual, sem depender de uma lista de opções que o PDF não tem de verdade. Depois de preencher, chamo `form.flatten()` (congela os valores como aparência estática, os campos deixam de ser editáveis) e removo as entradas de JavaScript do documento — o arquivo final não tem nenhum campo interativo nem script, funciona em qualquer leitor (item 26 do seu pedido).
- **Se preferir manter o PDF de impressão que você acabou de enviar como o arquivo-fonte**: o preenchimento vira 100% overlay por coordenada, usando os mesmos retângulos da Fase 1 como referência de posição (já validei que os dois arquivos compartilham o mesmo sistema de coordenadas). Funciona igual, mas exige que eu declare manualmente fonte/tamanho/alinhamento para cada um dos ~440 campos no `PdfFieldMap`, em vez de herdar o que a Acrobat já tinha configurado em cada campo.

Ambos os caminhos usam a mesma biblioteca e o mesmo `PdfFieldMap` conceitual — a diferença é só `fieldName` (preenchimento nomeado) vs. `x/y/width/height` (desenho por coordenada) em cada entrada.

---

## 7–9. Auditoria `PDF ↔ Character`

Agrupada por bloco da ficha. "Fonte" aponta para o dado do `Character`/motor de regras que alimentaria o campo.

| Bloco do PDF | Fonte no Character/rules | Status |
|---|---|---|
| Nome, Antecedente, Classe, Subclasse, Espécie, Nível | `character.name/backgroundId/classId/subclassId/speciesId/level` | OK |
| Atributos (valor/modificador ×6) | `abilities`, `getAbilityModifier` | OK |
| Perícias (18) | `getSkillBonus`, `getSkillProficiency` | OK |
| Salvaguardas (6) | `getSavingThrow` | OK |
| Bônus de Proficiência | `getProficiencyBonus` | OK |
| Iniciativa, Deslocamento, Tamanho, Percepção Passiva | `getInitiative/getSpeed/getSize/getPassivePerception` | OK |
| CA, Armadura equipada, Escudo, Treinamento em armadura | `getArmorClass`, `armor.*` | OK |
| Atributo/Mod./CD/Ataque de conjuração, Espaços de magia (total) | `rules/spellcasting.ts` | OK |
| Espaços de magia (gastos) | `spellcasting.slots[n].expended` | OK (checkbox no PDF vira número, conversão trivial) |
| **PV atual/máximo/temporário** | `character.hp` | **Campo existe no domínio, mas sem ação de store nem UI — FALTA wiring** |
| **Dado de Vida (máximo/gasto)** | `character.hp.hitDiceMax/hitDiceSpent` | **Idem — FALTA wiring.** O "máximo" de dados de vida é trivial (= nível); o **tipo** do dado (d6/d8/d10/d12) depende da classe e ainda não está em `data/classes.ts` — ver §8 |
| **Salvaguarda contra Morte (sucessos/falhas)** | `character.deathSaves` | **Campo existe, sem wiring** |
| **Inspiração Heroica** | `character.heroicInspiration` | **Campo existe, sem wiring** |
| **Armas e Truques de Dano** (6 linhas) | `character.attacks` | Existe só como **texto livre manual** (nome/bônus/dano/notas todos string) — sem ligação com `getAttackBonus` nem com um catálogo de armas. Precisa de modelagem real (ver §8, Weapon Mastery) |
| **Características de Classe** (2 colunas) | `character.classFeatures` | Hoje é **textarea livre** — deveria ser substituído pela camada de Features (§10) |
| Treinamento: Armas/Ferramentas (texto) | `weaponProficienciesNotes` + `getClassWeaponProficiencyEntries` | OK como texto por classe, mas **escolhas internas** (“3 instrumentos à sua escolha”) não são capturadas — viram Feature Choice (§11) |
| **Traços de Espécie** | `speciesTraitsNotes` + `getSpeciesTraitEntries` | Hoje é um bloco de texto único por espécie (decisão consciente da Fase 1) — deveria virar Features estruturadas |
| **Talentos** | `talentsNotes` + `getBackgroundFeatEntries` | Só cobre o talento de origem do antecedente. **Talentos gerais (ASI/Feat em níveis 4/8/12…) não existem no sistema ainda** |
| **Aparência, Idiomas** | `character.appearance/languages` | Campo existe, sem wiring |
| **Moedas** | `character.inventory.coins` | Campo existe, sem wiring |
| **Equipamentos** | `character.inventory.equipment` | Campo existe, sem wiring |
| **Itens Mágicos Sintonizados** (máx. 3) | `character.inventory.attunedItems` | Campo existe, sem wiring nem validação de limite |
| **Truques e Magias Preparadas** (tabela) | `character.spellsPrepared` | Campo existe como linhas de texto livre — sem catálogo de magias (explicitamente adiado por você no item 8: "posteriormente, magias") |

### Classificação dos dados que faltam (item 9)

| Dado | Classificação |
|---|---|
| PV atual, PV temporário | manual, recurso rastreável |
| PV máximo | **automático + ajuste** — mas a fórmula (nível 1 = máximo do dado + CON; níveis seguintes = média fixa ou rolagem + CON) depende de uma regra que quero confirmar com você antes de codificar (ver pendências) |
| Dado de Vida — máximo | derivado (= nível) |
| Dado de Vida — tipo (d6/d8/d10/d12) | dado estático por classe — tenho valores assumidos, quero sua confirmação antes de gravar (ver pendências) |
| Dado de Vida — gasto | manual, recurso rastreável |
| Salvaguarda contra Morte (sucessos/falhas) | manual, recurso rastreável |
| Inspiração Heroica | manual, recurso rastreável (boolean) |
| Ataques — arma usada | **escolha** (de um catálogo `data/weapons.ts` a criar) |
| Ataques — bônus/dano | automático (via `getAttackBonus` + dado de dano da arma), com ajuste manual |
| Características de Classe/Subclasse/Espécie/Talentos | **texto automático** (gerado por `getCharacterFeatures`), cada uma podendo conter uma **escolha** interna |
| Proficiência de ferramenta "à escolha" | escolha |
| Aparência, Idiomas, Equipamentos | texto livre |
| Moedas | manual |
| Itens Mágicos Sintonizados | texto livre + manual, com regra de limite (máx. 3 — essa eu já sei com segurança, é regra estável do 5e) |
| Magias preparadas | texto livre por linha, nesta fase (catálogo de magias fica para depois, como você definiu) |

---

## 10–14. Camada de Features

### 10. `FeatureDefinition` proposto

Separado em duas peças, exatamente como você pediu no item 13 — uma computável, uma explicativa:

```ts
// domain/features.ts — formato computável (vive em data/features/)
export type FeatureSourceType = "class" | "subclass" | "species" | "background" | "feat";

export interface FeatureUses {
  type: "fixed" | "proficiencyBonus" | "abilityModifier";
  amount?: number;       // usado com "fixed"
  ability?: AbilityKey;  // usado com "abilityModifier"
  minimum?: number;      // ex.: "no mínimo 1 uso"
}

export type FeatureRecharge = "shortRest" | "longRest" | "turn" | "dawn" | "other";

export type FeatureChoiceEffect =
  | { kind: "grantSkillProficiency" }
  | { kind: "grantToolProficiency"; toolId: string }
  | { kind: "grantLanguage" }
  | { kind: "selectWeaponMasteries"; count: number }
  | { kind: "none" }; // opção só narrativa, sem efeito mecânico

export interface FeatureChoiceOption {
  id: string;
  label: string;
  effect?: FeatureChoiceEffect;
}

export interface FeatureChoice {
  id: string;
  prompt: string; // "Escolha uma perícia", "Escolha um estilo de luta"
  type: "select" | "selectMultiple" | "skillPicker" | "toolPicker" | "weaponPicker";
  count?: number; // default 1
  options?: FeatureChoiceOption[];
}

export interface FeatureDefinition {
  id: string;              // "guerreiro.estilo-de-luta"
  name: string;
  sourceType: FeatureSourceType;
  sourceId: string;        // classId / subclassId / speciesId / backgroundId / featId
  level?: number;          // nível em que é concedida (class/subclass); ausente = sempre presente
  category?: string;       // agrupamento leve pra UI: "combate", "defesa", "magia"...
  uses?: FeatureUses;
  recharge?: FeatureRecharge;
  choice?: FeatureChoice;  // no máx. 1 escolha por feature — decisões compostas viram 2 features
}
```

```ts
// content/features/classes/guerreiro.ts — formato explicativo, indexado pelo mesmo id
export interface FeatureContent {
  id: string;
  summary: string;   // resumo curto e próprio, nunca cópia de livro
  pending?: true;     // marca quando eu ainda não tenho a fonte pra escrever o resumo
}
```

Uma função de apresentação (`rules/features.ts#getFeatureView(id)`) junta as duas metades só na hora de exibir — a UI nunca varre texto pra achar uma regra, e o motor de regras nunca guarda prosa.

### 11. Progressão por nível

```ts
getClassFeatures(character)     // data/features/classes/<classId>, filtra level <= character.level
getSubclassFeatures(character)  // idem, só depois de subclassId escolhido
getSpeciesFeatures(character)   // sem filtro de nível (a maioria é concedida ao criar)
getBackgroundFeatures(character)
getFeatFeatures(character)      // talentos gerais escolhidos (novo sistema, ver pendências)
getCharacterFeatures(character) // união de todas, ordenada por origem e nível
```
Guerreiro nível 5 recebe automaticamente as features de nível 1, 2, 3, 4 e 5 já cadastradas — nada precisa ser "lembrado" manualmente ao subir de nível.

### 12. Escolhas

Novo campo em `Character`: `featureChoices: Record<string, string[]>` (id da feature → ids das opções escolhidas). Uma feature com `.choice` definida e sem entrada correspondente em `featureChoices` é uma **decisão pendente** — o Builder detecta isso automaticamente (não há lista hard-coded de "quais classes perguntam o quê") e gera o controle certo conforme `choice.type`. Efeitos como `grantSkillProficiency` se somam à mesma união de fontes que corrigimos no antecedente (classe ∪ antecedente ∪ **escolha de feature** ∪ manual) — mesmo padrão, sem duplicar a lógica.

### 13. Usos/recarga

`FeatureUses`/`FeatureRecharge` guardam o SHAPE agora. Tracking de uso corrente (`featureUsage: Record<string, number>`) fica **modelado mas não implementado em UI** nesta etapa, como você pediu — só a Ficha Web (uso em mesa) vai precisar disso de verdade.

### 14. Regras computáveis × conteúdo explicativo

- `rules/` nunca importa `content/`.
- `content/` nunca é lido por `rules/` nem por `state/`.
- A única ligação é o `id` compartilhado entre `data/features/*` (o "o que faz") e `content/features/*` (o "como explicar"), montada por uma função de apresentação em `rules/features.ts` (ou um helper de UI equivalente) — nunca dentro de um componente React.
- Efeito mecânico (ex.: "aumenta o deslocamento") **sempre** vive em `rules/`, mesmo quando a feature também tem um resumo em `content/`. Já fizemos isso para o Movimento sem Armadura do Monge (`rules/speed.ts`) — o padrão se repete aqui, só formalizado.

---

## 15–19. Character Builder

### 15. Fluxo proposto (com uma alteração pequena, justificada abaixo)

```
1. Informações básicas (nome; nível inicial de criação)
2. Classe
3. Subclasse — condicional por nível (ver pendência: nível de acesso varia por classe)
4. Espécie
5. Antecedente
6. Atributos
7. Perícias e Proficiências
8. Características e Talentos  ← NOVA, ver justificativa
9. Equipamento / Combate
10. Conjuração — condicional
11. Revisão
```

**Por que uma etapa 8 nova:** Features com escolha interna (estilo de luta, Maestria de Armas, etc.) só podem ser resolvidas com segurança depois que classe + subclasse + espécie + antecedente + nível já estão definidos (uma feature de subclasse, por exemplo, não existe antes da etapa 3). Colocar essas escolhas dentro da etapa 7 misturaria "proficiência de perícia" com "escolhas mecânicas de combate/magia", que são conceitualmente diferentes. Uma etapa dedicada, gerada dinamicamente a partir de `getCharacterFeatures(character).filter(f => f.choice)`, mantém a promessa do item 11 (nenhuma escolha obrigatória escondida) sem forçar um "encaixe" nas etapas que você já definiu. Se preferir manter só 10 etapas, dá pra embutir isso como uma sub-seção dentro da etapa 7 — mas separar deixa mais claro o que é proficiência e o que é mecânica de personagem.

### 16. Etapas obrigatórias × condicionais

| Etapa | Sempre aparece? |
|---|---|
| 1–2, 5–7, 9, 11 | Sempre |
| 3. Subclasse | Só quando o nível atual já dá acesso a ela |
| 4. Espécie | Sempre (mas sem sub-perguntas de linhagem ainda — ver Fase 1) |
| 8. Características e Talentos | Só se existir ao menos uma feature com `.choice` pendente |
| 10. Conjuração | Só se `getSpellcastingAbility(character)` não for `null` |

### 17. Como features geram decisões

O Builder não tem uma lista fixa de "o que perguntar". A cada mudança relevante (classe/subclasse/espécie/antecedente/nível), ele recalcula `getCharacterFeatures(character)`, filtra as que têm `.choice`, e para cada uma sem resposta em `featureChoices` renderiza um controle genérico baseado em `choice.type` — `select`/`selectMultiple` viram um formulário simples; `skillPicker`/`toolPicker`/`weaponPicker` reaproveitam os mesmos catálogos já usados em outras etapas (perícias, ferramentas, armas).

### 18. Onde entram os insights

Mantém a arquitetura de `analytics/` como está — só adiciona pontos de entrada novos:
- Etapa 2 (Classe): `InsightCard`/`Popover` com uma métrica **nova** que ainda não existe no repositório — `classPopularity` ("18% dos personagens registrados são Magos"). É uma extensão pequena e direta do mesmo padrão de `getSpeciesDistribution`/`getBackgroundDistribution` (sem filtro nenhum, já que é o próprio contexto raiz).
- Etapa 3 (Subclasse): reaproveita `subclassPopularity`, já existente.
- Etapa 5 (Antecedente): reaproveita `backgroundPopularity`.
- Etapa 6 (Atributos): reaproveita `abilityHighest`.
- Etapa 9 (Equipamento): reaproveita `armorPopularity` (+ a dimensão `highestAbility` já implementada).
- Sempre com `sampleSize` visível e nunca como recomendação — texto e regras de frequência (um popover automático por vez, nunca repete na sessão) continuam exatamente como já implementado.

### 19. Revisão e edição

A etapa 11 mostra um resumo compacto de tudo. A Ficha Web (pós-criação) ganha um botão **Editar personagem** que devolve ao Builder na etapa relevante (não do zero) — tecnicamente simples, já que Builder e Ficha Web leem/escrevem o mesmo `useCharacterStore`; só precisa de um `builderStore` com "passo atual" e uma forma de abrir o Builder já posicionado numa etapa.

---

## 20–24. Arquitetura

### 20. Pastas/tipos novos (proposta)

```
src/
  domain/
    character.ts        # + featureChoices; ativa hp/deathSaves/heroicInspiration/attacks/inventory (já existem, sem uso)
    features.ts          # NOVO — FeatureDefinition, FeatureChoice etc.
  data/
    weapons.ts            # NOVO — catálogo de armas (nome/categoria/dano/propriedades/maestria)
    features/
      classes/<classId>.ts
      subclasses/<classId>/<subclassId>.ts
      species/<speciesId>.ts
      backgrounds/<backgroundId>.ts
      feats/<featId>.ts   # NOVO sistema de talentos gerais
  content/
    features/
      classes/ subclasses/ species/ backgrounds/ feats/   # resumos, mesmo id das definitions
  rules/
    features.ts            # getClassFeatures...getCharacterFeatures, getFeatureView
    weapons.ts              # getAvailableWeapons, integra com attack.ts já existente
  state/
    characterStore.ts       # + setFeatureChoice + wiring dos campos "mortos" (hp, deathSaves...)
    builderStore.ts          # NOVO — passo atual, navegação, "pode avançar?"
  analytics/                 # + classPopularity
  ui/
    builder/                 # NOVO — layout de etapas, um componente por etapa, controle genérico de FeatureChoice
    sheet/                    # Ficha Web pós-criação (reorganiza o que hoje está em ui/sections/*)
  pdf/
    template/                 # NOVO — o PDF-molde como asset estático
    fieldMap.ts                # NOVO — PdfFieldMapping[]
    formatter.ts                 # NOVO
    exporter.ts                   # NOVO
```

### 21. Impacto nos testes atuais

Nenhuma das 192 existentes deveria quebrar só por essas adições — são todas aditivas (campos novos opcionais, módulos novos). Duas exceções mecânicas, não de lógica:
- Se movermos `ui/sections/*` para `ui/sheet/*`, os imports de `App.test.tsx` e afins precisam de ajuste — risco baixo, é um `rename`.
- Testes futuros do Builder (navegação, "pode avançar") são só novos, não tocam nos existentes.

### 22. Novos testes necessários

- `rules/features.test.ts`: progressão por nível, filtragem por classe/subclasse conhecida, `getCharacterFeatures` sem duplicar/perder itens.
- Um teste de integridade **data ↔ content**: todo `FeatureDefinition` tem uma entrada correspondente em `content/` (evita "feature muda, texto esquece de acompanhar").
- `state/characterStore.test.ts`: `setFeatureChoice` aplica o efeito certo (ex.: perícia escolhida vira proficiência via a mesma união de fontes do antecedente).
- `analytics/`: `classPopularity` (filtro, fallback, percentual).
- `pdf/formatter.test.ts`: sinal (+3/-1), mapeamento de rótulos internos → rótulos de exibição, campos vazios, truncamento controlado.
- `pdf/exporter.test.ts`: gera um PDF válido (reabre com pdf-lib, confere nº de páginas, confere que nenhum campo interativo/JS sobrou) para pelo menos os 3 fixtures que você propôs (Guerreiro, Mago, Bárbaro).

### 23. Riscos técnicos

1. **Volume de dados de regra 2024** (features exatas por classe/subclasse/nível, dado de vida por classe, nível de acesso a subclasse, método de geração de atributo, catálogo de armas + Maestria) é grande demais para eu "confiar de memória" com a precisão que este projeto já exige — prefiro confirmar cada bloco com você antes de codificar do que arriscar outro bug sutil como o do PDF original.
2. `SUBCLASSE`/`ARMADURA.ATUAL` não têm lista de opções gravada no PDF (só a Acrobat injeta em tempo real) — tratamento especial já identificado (§5–6), risco baixo agora que está mapeado.
3. Se optarmos por achatar o PDF interativo, preciso confirmar que a página 2 fica visualmente correta sem o botão "RESET" funcional (ele fica só decorativo, ou eu removo a marcação vermelha).
4. `pdf-lib` + o PDF-molde como asset aumentam o peso do bundle se o export rodar no navegador — mitigo com import dinâmico (só carrega quando o usuário clica em "Exportar").

### 24. Decisões que preciso que você aprove

1. **Molde do exportador**: uso o PDF interativo da Fase 1 (preenchimento por nome de campo + flatten + remoção de JS, minha recomendação) ou o PDF de impressão que você acabou de enviar (overlay 100% por coordenada)? O resultado visual final é o mesmo.
2. **Etapa 8 nova** ("Características e Talentos") no Builder — aprovo a inclusão, ou prefere embutir escolhas de feature dentro da etapa 7?
3. **PV máximo**: quero confirmar a fórmula exata (nível 1 = máximo do dado + CON; níveis seguintes = média fixa arredondada para cima + CON, ou o jogador escolhe rolar?) antes de automatizar — no PDF original isso sempre foi campo 100% manual.
4. **Dado de Vida por classe** (d6/d8/d10/d12) — tenho valores que uso com confiança alta (Bárbaro d12; Guerreiro/Paladino/Patrulheiro d10; Bardo/Clérigo/Druida/Ladino/Bruxo/Monge d8; Mago/Feiticeiro/Artífice d6, a confirmar especificamente), mas prefiro que você confirme antes de eu gravar em `data/classes.ts`.
5. **Nível de acesso à subclasse por classe** — no PHB 2024 varia (algumas classes recebem no nível 1, a maioria no nível 3); preciso da tabela exata por classe antes de tornar a etapa 3 do Builder condicional com segurança.
6. **Catálogo de armas + Weapon Mastery** — modelamos já nesta fase (necessário para os "Ataques" do PDF e para o item 8 do seu pedido) ou adiamos junto com o catálogo de magias? Se for agora, preciso do material de referência (lista de armas, dano, propriedades, maestria) — não quero reconstruir isso de memória.
7. **Sistema de talentos gerais** (ASI/Feat em níveis 4/8/12…) é um sistema que ainded não existe no domínio — confirma que entra nesta expansão, ou fica para depois?
8. **Método de geração de atributos** no Builder (array padrão / point buy / rolagem) — qual(is) oferecer na etapa 6?

---

Não avancei para implementação — aguardo suas respostas aos 8 pontos acima (e qualquer ajuste que queira nos demais itens) antes de tocar em código.
