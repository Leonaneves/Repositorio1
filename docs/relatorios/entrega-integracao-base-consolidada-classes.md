# Relatório de entrega — integração da base estruturada consolidada de classes

Cobre o pedido "Agora integre a base estruturada consolidada de
classes que acabei de fornecer ao projeto existente" (15 seções):
validação/correção contra a base fornecida, dados estruturados (não
string-parsed), gating real do Builder, preenchimento de checkboxes do
PDF e a correção estrutural do exportador. Segue a estrutura de 11
pontos pedida no item 15.

## 1. Arquivos alterados

38 arquivos (2804 inserções / 121 remoções) nesta rodada, agrupados
por área:

**Dados de classe** — `src/data/classes.ts` (primaryAbilityText,
skillChoice, toolChoice, startingEquipment por classe),
`src/data/classResources.ts` (tabelas nível→valor de 13+ recursos, +
Truques/Magias Preparadas por classe), `src/data/subclasses.ts`
(`SUBCLASS_FEATURE_LEVELS` por classe), `src/data/features/classes.ts`
(features nomeadas por nível, feature de escolha de perícias, feature
de escolha de ferramentas).

**Motor de regras** — `src/rules/classProgression.ts` (novo:
`getClassProgression`, ponto único de consulta), `src/rules/classResources.ts`
(um getter por recurso, incluindo Truques/Magias Preparadas),
`src/rules/features.ts` (`isFeatureChoiceComplete`/`isFeatureComplete`/
`getIncompleteRequiredChoices`), `src/rules/startingEquipment.ts` (novo).

**Estado/Builder** — `src/state/builderStore.ts` (`canAdvance()`,
`goNext()` passa a respeitar), `src/state/characterStore.ts`
(`setStartingEquipmentOption`, reset ao trocar de classe),
`src/ui/builder/BuilderWizard.tsx` (botão "Avançar" desabilitado +
dica visível), `src/ui/builder/steps/Step9Equipment.tsx` (novo: UI de
escolha de pacote), `src/ui/builder/FeatureChoiceControl.tsx`
(contador `(selecionadas/count)`).

**PDF** — `src/pdf/fieldMap.ts` (mapeamento dos 163 checkboxes reais),
`src/pdf/exporter.ts` (preenchimento de checkboxes, remoção dos 8
campos ocultos "AUTO.\*", troca de biblioteca), `package.json` (troca
`pdf-lib` → `@cantoo/pdf-lib`).

**Documentação** — `docs/referencia/pdf-exportacao/checkboxes-diagnostico.md`,
`docs/referencia/pdf-exportacao/xref-investigacao.md` (novos).

**Testes** — 10 arquivos novos/estendidos (ver ponto 10).

## 2 e 3. Diferenças encontradas vs. implementação anterior, e o que foi corrigido

| Área | Estado anterior | Base consolidada | Correção aplicada |
|---|---|---|---|
| Truques/Magias Preparadas | Não estruturado | Tabela por classe/nível | `classResources.ts` + `getCantripsKnown`/`getSpellsPreparedMax` (retornam `null`, não `0`, para Paladino/Patrulheiro, que não têm truques) |
| Escolha de perícias de classe | Existia como dado, sem gating real | "Escolha N de [pool]" deve bloquear o Builder | `FeatureChoice` (`skillProficiency`) + `canAdvance()` na etapa `featuresAndTalents` |
| Escolha de ferramentas | Não modelada (Bardo/Monge) | Distinção automático vs. escolha | `toolChoice` em `data/classes.ts` + feature "Ferramentas de Classe" (`toolProficiency`) só para as 2 classes que têm escolha real |
| Equipamento inicial | Dado cru, sem UI | Deve aparecer como decisão do Builder ("Pacote A: itens..." ou "Ouro") | `Step9Equipment.tsx` + `isStartingEquipmentResolved` gating a etapa `equipment` |
| Níveis de Característica de Subclasse | Não existiam | Específicos por classe (ex.: Guerreiro 3,7,10,15,18; Mago 3,6,10,14) | `SUBCLASS_FEATURE_LEVELS` em `data/subclasses.ts`, um array por classe — nenhuma progressão universal |
| hitDie/PV | Já era fonte única | Confirmar que não há tabela paralela | Auditado (`rules/hp.ts`) — já correto, nenhuma mudança necessária |
| Checkboxes do PDF | Nenhum preenchido | Estados ON/OFF reais devem ser diagnosticados, nunca assumidos | Diagnóstico `pikepdf` (164 campos `/Btn`, 163 usam `/Sim`↔`/Off`) → implementados via API de checkbox do `pdf-lib`/`@cantoo/pdf-lib`, que lê o valor real sozinha |
| xref do PDF exportado | "Limitação conhecida" (documentada, não corrigida) | Inaceitável como estado final | Trocada a biblioteca (`@cantoo/pdf-lib`) — 0 erros de xref confirmados com poppler, validador independente |
| Texto oculto vazando no PDF | Não detectado antes | (achado durante esta investigação) | 8 campos `AUTO.*` (flag `Hidden`) removidos antes do flatten — senão apareciam como texto visível no rodapé da página |
| Artífice | Risco de preencher com dados de outra classe | Explicitamente fora desta base — não alterar | Comentário "AGUARDANDO REVISÃO CONTRA FONTE FORNECIDA" em `classes.ts`; nenhum campo novo (`skillChoice`/`toolChoice`/`startingEquipment`) foi preenchido para Artífice; Builder confirmado (teste) a nunca travar por isso |

## 4. Modelo final de progressão de classe

`getClassProgression(character): ClassProgressionSnapshot`
(`src/rules/classProgression.ts`) é o ponto único de consulta — a UI
nunca mais faz parsing de string de tabela. Devolve: `hitDie`/
`hitDiceMax`, `cantripsKnown`/`spellsPreparedMax` (`null` quando a
classe não tem a coluna), `spellSlots` por círculo, `pactMagic`
(Bruxo), `extraAttacks`, e um objeto `resources` com todos os
recursos numéricos por nível (Fúrias, Dano da Fúria, Maestrias,
Invocações, Canalizar Divindade, Forma Selvagem, Pontos de
Feitiçaria, Recuperar Fôlego, Ataque Furtivo, Artes Marciais, Pontos
de Foco, Inimigo Favorito, Dado de Inspiração). Cada recurso tem um
getter próprio em `rules/classResources.ts` que devolve `null` para
classe errada e `0` (nunca `null`) para a classe certa em nível ainda
não alcançado.

## 5. Features registradas

~150 features nomeadas por nível (`namedClassFeatures`, transcritas
literalmente da base, nome+nível apenas — sem inventar descrição),
mais: `mechanicalClassFeatures` (Movimento Rápido/Movimento sem
Armadura), `classSkillChoiceFeatures` (uma por classe, `FeatureChoice`
tipo `skillProficiency`), `classToolChoiceFeatures` (Bardo/Monge,
`toolProficiency`), `abilityScoreImprovementFeatures` e
`epicBoonFeatures` (nível 19, `manualText` como fallback estrutural).
Toda feature cujo efeito mecânico não foi fornecido fica como
`FeatureDefinition` registrada com `FeatureContent` pendente — nunca
inventado.

## 6. Decisões obrigatórias agora reconhecidas pelo Builder

`builderStore.canAdvance()` (chamado por `goNext()`, não só pela UI):
- Etapa **Características e Talentos**: bloqueia enquanto qualquer
  `FeatureChoice` obrigatória da classe atual (perícias, ferramentas)
  não estiver totalmente resolvida (`getIncompleteRequiredChoices`).
- Etapa **Equipamento / Combate**: bloqueia enquanto a classe tiver
  pacotes de equipamento inicial definidos e nenhum estiver escolhido
  (`isStartingEquipmentResolved`) — nunca trava para uma classe sem
  dado confirmado (Artífice), testado explicitamente.

## 7. Integração do equipamento inicial

`StartingEquipmentOption`/`startingEquipment` em `data/classes.ts`
(pacotes A/B/C, cada um com `items: string[]` e/ou `gold: number`).
`Step9Equipment.tsx` renderiza um grupo de rádio por pacote; ao
escolher, `setStartingEquipmentOption` grava o id e aplica
itens/ouro ao inventário do personagem atomicamente. Sem regras de
peso/compra — só a apresentação e a escolha, como pedido.

## 8. Relatório dos checkboxes do PDF (ON/OFF)

Diagnóstico completo em
`docs/referencia/pdf-exportacao/checkboxes-diagnostico.md`: 164
campos `/Btn`, 163 checkboxes simples (todos `/Sim`↔`/Off`, nunca
`"Yes"`/`"On"`), 0 radios, 1 pushbutton (Reset, tratado à parte), 1
anomalia (`C5`, um único estado de aparência — nunca escrita).
Implementado nesta rodada: perícias/salvaguardas (24), salvaguardas
contra morte (6, semântica cumulativa), treinamento de armadura +
escudo equipado (5). O exportador nunca hardcoda o valor "ligado" —
usa a API de checkbox da biblioteca, que lê o valor real do próprio
PDF.

## 9. Solução do problema de xref

Adotada (não só proposta): troca de `pdf-lib` por `@cantoo/pdf-lib`
(fork mantido, mesma API). Investigação completa, com comparação
antes/depois usando um validador independente (`poppler`
`pdfinfo`/`pdftoppm`), em
`docs/referencia/pdf-exportacao/xref-investigacao.md`. Antes: 11×
"Invalid XRef entry". Depois: 0 erros, tanto em teste isolado quanto
no PDF baixado pelo navegador no fluxo real (Builder → Exportar).
Também corrigido, achado durante a mesma investigação: 8 campos
ocultos que vazavam texto de depuração no flatten.

## 10. Total de testes e resultado

**473 testes, 39 arquivos, todos passando** (`npm test -- --run`).
`npm run typecheck` e `npm run build` limpos. Destaque desta rodada:
`exporter.test.ts` (17 testes, incluindo 4 que rodam `pdfinfo`/
`pdftoppm`/`pdftotext` reais — pulam, não falham, se o poppler não
estiver instalado no ambiente) e `builderToPdf.integration.test.ts`
(2 testes fim-a-fim: Builder resolve escolhas → exporta → reabre o
PDF → confere campos).

## 11. Pendências que dependem de fonte nova do usuário

- **Artífice**: nenhum dado novo adicionado (skillChoice/toolChoice/
  startingEquipment/features nomeadas) — aguardando a base específica
  dessa classe.
- **Conteúdo mecânico das features**: as ~150 features registradas
  têm nome+nível, não descrição/efeito — fora do escopo desta rodada
  por definição do próprio pedido.
- **Conteúdo de subclasse**: níveis de aquisição registrados, não o
  conteúdo das características em si.
- **Catálogo de talentos (feats) e catálogo de magias**: `data/spells/`
  continua como placeholder preparado, como pedido.
- **Campo `C5` do PDF**: única anomalia sem par de aparência ON/OFF —
  não foi possível identificar visualmente a que corresponde na ficha
  impressa; segue sem receber escrita.
- **Checkboxes mapeados mas não implementados** (não é falta de dado —
  o `Character` já tem os campos, só falta o mapeamento campo-a-campo):
  itens mágicos sintonizados (3), espaços de magia gastos por círculo
  (22), Concentração/Ritual/Material de magias preparadas (102) — já
  documentados em `checkboxes-diagnostico.md` para quando entrarem em
  escopo.
