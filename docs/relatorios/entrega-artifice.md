# Relatório de entrega — Artífice (13ª e última classe)

Integração da fonte "DADOS DE CLASSE — ARTÍFICE", encerrando a
pendência "aguardando revisão contra fonte fornecida". Todas as 13
classes do projeto agora têm dados estruturais confirmados.

## 1. Diferenças entre o Artífice provisório e esta fonte

| Campo | Provisório (Fase 2) | Fonte fornecida | Resultado |
|---|---|---|---|
| hitDie, spellcastingAbility, savingThrowProficiencies, armorProficiencies, weaponProficiencyText, toolProficiencyText | d8, INT, [CON, INT], leve+média+escudo (sem pesada), "Armas Simples", "Ferramentas de Ladrão/Funileiro + 1 Ferramenta de Artesão" | idêntico | Conferido — nenhuma mudança, só confirmação |
| primaryAbilityText | `null` | "Inteligência" | Preenchido |
| skillChoice | `undefined` | escolha 2 de 7 (Arcanismo, História, Investigação, Medicina, Natureza, Percepção, Prestidigitação) | Preenchido |
| toolChoice | `undefined` (só texto) | escolha 1 "Ferramenta de Artesão" (as 2 automáticas continuam em `toolProficiencyText`) | Preenchido, sem duplicar |
| startingEquipment | `undefined` | 1 pacote padrão (itens) + 1 alternativa em ouro (fórmula, não fixa) | Preenchido — formato novo (ver §3) |
| casterKind | `"half"` (fórmula genérica) | tabela explícita própria | Trocado por `"artificer"` — **nunca divergiu numericamente** da fórmula genérica em nenhum dos 20 níveis (conferido nível a nível), mas passa a ser uma tabela registrada e auditável, não derivada, por ser essa a fonte de autoridade |
| Infusões Conhecidas / Itens Infundidos / Truques Conhecidos | inexistentes | 3 tabelas por nível | Adicionadas |
| Features nomeadas | inexistentes | 11 features (nível 1–20) | Adicionadas |
| Níveis de Aumento no Valor de Atributo | inexistentes | 4, 8, 12, 16, **19** | Adicionado — único caso com ASI também no 19 (no lugar da Dádiva Épica) |
| Dádiva Épica | não se aplicava (sem features) | a própria fonte dá ASI no 19 e "Alma do Artífice" no 20 — nunca Dádiva Épica | Artífice explicitamente excluído da lista de Dádiva Épica |
| SUBCLASS_FEATURE_LEVELS | inexistente | 3, 5, 9, 15 | Adicionado |

Nenhum dado fora desta fonte foi alterado silenciosamente (subclasses
já cadastradas continuam disponíveis, sem conteúdo de feature
inventado; catálogo de talentos/magias permanece fora de escopo).

## 2. Arquivos alterados

27 arquivos (551 inserções / 68 remoções):

**Dados** — `data/classes.ts` (Artífice completo + `StartingEquipmentOption.goldFormula`), `data/classResources.ts` (3 tabelas novas), `data/spellProgression.ts` (`ARTIFICER_SLOT_TABLE`), `data/subclasses.ts` (`SUBCLASS_FEATURE_LEVELS.artifice`), `data/features/classes.ts` (features nomeadas, ASI, exclusão da Dádiva Épica, 3 features de decisão de equipamento inicial).

**Domínio/regras** — `domain/features.ts` (novo efeito `optionPick`), `domain/ids.ts` (`CasterProgressionType` + "artificer"), `rules/features.ts` (gating de `optionPick`), `rules/spellcasting.ts` (branch "artificer" em `getSpellSlots`), `rules/classResources.ts` (`getInfusionsKnown`/`getInfusedItemsMax`), `rules/classProgression.ts` (campos novos no snapshot).

**Estado/UI** — `state/characterStore.ts` (`goldFormula` nunca vira número sozinho), `ui/builder/FeatureChoiceControl.tsx` (renderização de `optionPick`), `ui/builder/steps/Step9Equipment.tsx` (exibe a fórmula de ouro em vez de um número).

**Testes** — 13 arquivos estendidos com casos do Artífice (ver §5).

**Documentação** — este relatório.

## 3. Progressões estruturadas adicionadas

- `ARTIFICER_CANTRIPS_KNOWN`, `ARTIFICER_INFUSIONS_KNOWN`, `ARTIFICER_INFUSED_ITEMS_MAX` (`data/classResources.ts`) — expostas via `getCantripsKnown`/`getInfusionsKnown`/`getInfusedItemsMax` e agregadas em `getClassProgression().resources`.
- `ARTIFICER_SLOT_TABLE` (`data/spellProgression.ts`) — indexada pelo nível do personagem (não nível efetivo), 5 posições fixas (círculos 1–5), usada por um branch dedicado em `getSpellSlots` (mesmo padrão da Magia de Pacto do Bruxo).
- Equipamento inicial com fórmula de ouro: `StartingEquipmentOption.gold` virou opcional e ganhou `goldFormula?: string` — a fórmula "5d4 × 10" nunca é convertida num número; a UI mostra o texto e o jogador usa o campo de Ouro (já existente) para digitar o resultado rolado.

## 4. Novas escolhas reconhecidas pelo Builder

Todas resolvidas na mesma etapa "Características e Talentos" já existente (nenhum pipeline novo):

- **Perícias de Classe** (2 de 7) — mesmo mecanismo de todas as outras classes.
- **Ferramentas de Classe** (1 Ferramenta de Artesão) — mesmo mecanismo de Bardo/Monge.
- **2 decisões de arma simples** (`weaponPicker`, 1 cada) — equipamento inicial do Artífice é o único, entre as 13 classes, a expor escolhas internas do próprio pacote como decisões reais do Builder (as demais mantêm isso como texto livre dentro do pacote).
- **1 decisão de armadura** (Couro Batido OU Cota de Escamas) — introduziu o efeito genérico `optionPick` (`FeatureChoiceEffect`), para escolha fechada entre opções nomeadas que não pertencem a nenhum catálogo existente (perícia/ferramenta/arma). Reutilizável para qualquer futura classe com o mesmo tipo de decisão.

Todas bloqueiam "Avançar" enquanto pendentes — confirmado em teste e verificado visualmente no navegador (Builder real, capturas em anexo nesta sessão).

## 5. Resultado dos testes

**496 testes, 39 arquivos, todos passando** (eram 473 antes desta rodada — 12 testes antigos que assumiam "Artífice sem dados" foram atualizados para refletir a fonte agora fornecida, nunca preservados incorretamente). `npm run typecheck` e `npm run build` limpos.

Cobertura adicionada: d8 + salvaguardas CON/INT; escolha de 2 perícias da lista certa; Ferramentas de Ladrão/Funileiro automáticas + 1 Ferramenta de Artesão obrigatória; subclasse no nível 3 + características em 3/5/9/15; Infusões Conhecidas/Itens Infundidos/Truques Conhecidos por nível; espaços de magia da tabela própria em toda a progressão (1, 3, 5, 9, 13, 17, 20); conjuração desde o nível 1; equipamento inicial (2 armas + escolha de armadura) via Builder; fórmula de ouro preservada; PV automático (8+CON no 1º nível, 5+CON depois); PDF recebendo classe/PV/Dado de Vida/atributo e CD de conjuração/espaços de magia gastos; teste de integração completo (Builder → escolhas → exportar → reabrir o PDF).

## 6. Pendências que continuam fora desta fonte

- Conteúdo mecânico completo das 11 features nomeadas (`FeatureContent` = `pending`, como pedido).
- Conteúdo das características de subclasse (níveis 3/5/9/15 registrados; o que cada uma FAZ continua pendente).
- Catálogo de talentos e catálogo de magias (fora de escopo desta fonte).
- Campo `C5` do PDF (anomalia sem par ON/OFF, função ainda não identificada) — segue sem receber escrita, sem bloquear a exportação.
