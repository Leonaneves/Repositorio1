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
- **1 anomalia**: o campo `C5` (retângulo pequeno, página 1, sem `/DA`,
  `/MK/CA = "H"`) só tem UM estado de aparência (`/Sim`) — não tem
  aparência definida para `/Off`. Não foi possível identificar a que
  ele corresponde visualmente (nome curto, sem rótulo próximo óbvio no
  texto extraído da página). Por segurança, o exportador **não escreve
  nada nele** — fica como está no molde (nunca marcado), evitando
  qualquer efeito colateral não previsto.

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
| Anomalia (não preenchida) | 1 | `C5` | Só 1 estado de aparência — deixada intocada |
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

Implementados nesta etapa (ver `pdf/fieldMap.ts`/`pdf/exporter.ts`):
Perícias/Salvaguardas, Salvaguardas contra morte, Treinamento de
armadura, Escudo equipado. **Não implementados ainda** (fora do pedido
desta etapa, mas já mapeados/documentados aqui para quando for a
vez): Itens mágicos sintonizados, Espaços de magia gastos,
Concentração/Ritual/Material das magias preparadas — o Character já
tem os dados correspondentes (`inventory.attunedItems`,
`spellcasting.slots[].expended`, `spellsPrepared[].concentration/
ritual/material`), só falta o mapeamento campo-a-campo linha a linha.
