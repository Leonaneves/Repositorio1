# Diagnóstico estrutural: checkboxes/radios do PDF-molde

Inspeção feita com `pikepdf` sobre o PDF-molde interativo
(`Ficha_PTBR_A4_Interativa_2.pdf`), enumerando programaticamente **todos**
os campos `/FT /Btn` do AcroForm — nome, tipo (checkbox/radio/pushbutton
via bits `Radio`/`Pushbutton` de `/Ff`), valor atual (`/V`), estado da
aparência (`/AS`) e a lista real de estados de aparência (`/AP/N`, cujas
chaves SÃO os valores "ligado"/"desligado" verdadeiros do campo — nunca
assumidos).

## Resultado

- **164 campos `/Btn`** no total (dos 450 campos do AcroForm).
- **163 são checkboxes simples**, todos com exatamente os mesmos dois
  estados de aparência: **`/Sim`** (ligado) e **`/Off`** (desligado).
  Não é `"Yes"`/`"On"` nem qualquer valor genérico — é literalmente
  `/Sim`, em português, igual em TODOS os 163 campos, sem exceção.
- **0 campos são radio buttons** (`Ff` bit *Radio* nunca aparece
  ligado) — cada checkbox é independente, não há grupos.
- **1 campo é botão de clique** (`Reset`, `Ff` bit *Pushbutton* ligado)
  — já tratado à parte (remoção estrutural antes do flatten, ver
  `reset-diagnostico.md`).
- **`C5` — Inspiração Heroica — mapeado, implementação adiada para
  futura Ficha Web.** O campo (retângulo pequeno, página 1, sem `/DA`,
  `/MK/CA = "H"`, só com o estado de aparência `/Sim` — sem `/Off`)
  foi identificado pelo autor do projeto como o checkbox de Inspiração
  Heroica. Decisão explícita: não é implementado como interação do
  Builder nem rastreado na ficha de impressão nesta fase — Inspiração
  Heroica só fica realmente útil numa Ficha Web futura, usada durante
  a sessão, com o jogador marcando/desmarcando em tempo real (não faz
  sentido "imprimir" um estado que muda a cada cena de jogo). O
  `Character` já tem `heroicInspiration: boolean` (preservado,
  reservado para essa fase futura) e `pdf/fieldMap.ts` registra o
  mapeamento (`heroicInspirationCheckboxField`), mas fora de
  `pdfCheckboxFields` de propósito — o exportador nunca escreve nele.
  A anomalia de aparência (só `/Sim`, sem `/Off`) também não precisa
  de correção agora, já que o campo não é escrito.

## Grupos funcionais (pelos nomes, todos com o padrão `/Off`↔`/Sim`)

| Grupo | Quantidade | Exemplo | Uso |
|---|---:|---|---|
| Perícias/Salvaguardas | 24 | `O.DEX.acr`, `O.FOR.res` | Bolinha de proficiência de cada perícia/salvaguarda (18 perícias + 6 salvaguardas) |
| Salvaguardas contra morte | 6 | `Morte.suc.1..3`, `Morte.fal.1..3` | 3 sucessos + 3 falhas |
| Treinamento de armadura | 4 | `PROF.leve`, `PROF.med`, `PROF.pesa`, `PROF.Escudo` | Proficiência de categoria de armadura |
| Escudo equipado | 1 | `Escudo` | Se o escudo está equipado agora |
| Itens mágicos sintonizados | 3 | `O.item.magico.1..3` | Sintonização de cada um dos 3 slots |
| Espaços de magia gastos | 22 | `1o.circ.1..4`, ..., `9o.circ.1` | Marca de espaço de magia já gasto, por círculo (1º–9º) |
| Magia preparada: Concentração/Ritual/Material | 102 (34×3) | `Concentracao.1..34`, `Ritual.1..34`, `Material.1..34` | Flags de cada uma das 34 linhas de magia preparada |
| Inspiração Heroica (mapeado, não escrito nesta fase) | 1 | `C5` | Reservado para a futura Ficha Web (ver acima) |
| **Total** | **163** (+ `Reset`, tratado à parte) | | |

Observação: `o.INT.arc` (perícia Arcanismo) usa "o" minúsculo — mesma
inconsistência de nomenclatura já documentada em `data/skills.ts`
(extraída literalmente do PDF original); mapeado com o nome exato.

## Decisão de implementação

`pdf-lib` já resolve o valor "ligado" sozinho, lendo o próprio
dicionário de aparência do campo (`form.getCheckBox(nome).check()` —
confirmado por teste direto: gera `/V = /Sim` sem eu precisar
declarar `"/Sim"` em lugar nenhum do código). Por isso o exportador
**nunca hardcoda** o valor "ligado" — usa a API de checkbox do
`pdf-lib`, que é auto-descritiva a partir do próprio PDF. Isso também
significa que, se um campo específico tiver um valor "ligado"
diferente (nenhum caso encontrado aqui, mas por precaução), o código
continua correto sem alteração.

Implementados (ver `pdf/fieldMap.ts`/`pdf/exporter.ts`):
Perícias/Salvaguardas, Salvaguardas contra morte, Treinamento de
armadura, Escudo equipado, Itens mágicos sintonizados (3 caixas,
`inventory.attunedItems[].attuned`), Espaços de magia gastos por
círculo (22 caixas, leitura cumulativa de
`spellcasting.slots[circulo].expended`, mesmo padrão das
salvaguardas contra morte).

**Deliberadamente não implementado ainda** (decisão explícita — não é
falta de mapeamento): Concentração/Ritual/Material das 34 linhas de
magia preparada. Embora `SpellPreparedEntry` já tenha os booleanos
`concentration`/`ritual`/`material`, `spellsPrepared` continua sendo
uma entrada manual sem metadados estruturados de magia (não há
catálogo de magias ainda) — a escrita desses 3 grupos de checkbox
fica reservada para quando a base de magias for fornecida, para
evitar qualquer inferência sobre dado que ainda não tem uma fonte
estruturada por trás.

## Verificação

`pdf/exporter.ts` foi separado em `fillPdfForm` (preenche sem achatar)
e `buildExportedPdf` (chama `fillPdfForm` e só então achata)
especificamente para permitir testar o estado de cada checkbox com
`form.getCheckBox(nome).isChecked()` **antes** do `flatten()` remover
os campos do AcroForm — o achatamento em si não pode ser inspecionado
depois (os campos deixam de existir). Ver `pdf/exporter.test.ts`,
bloco "fillPdfForm — checkboxes": cobre perícia com `manualOverride`
(incluindo a exceção `o.INT.arc`), salvaguarda proficiente,
salvaguardas contra morte cumulativas (2 sucessos marca `suc.1`/`suc.2`
mas não `suc.3`), treinamento de armadura + escudo equipado, o caso
"nunca escreve em `C5`/Inspiração Heroica nesta fase" (mesmo com
`heroicInspiration = true` no `Character`) e o caso "personagem em
branco não marca nada".
