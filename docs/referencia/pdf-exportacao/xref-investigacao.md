# Investigação: xref inválido no `form.flatten()` + texto de depuração vazando

## Problema 1 — xref estruturalmente inválido

`pdf-lib` (biblioteca original, `Hopding/pdf-lib`, sem commits desde
2023) grava uma tabela de xref **estruturalmente inválida**
especificamente quando `form.flatten()` é chamado sobre este molde.
Leitores tolerantes (Chrome, o próprio `pdf-lib` ao reabrir,
`pikepdf`/`qpdf` ao abrir) escondem o problema recuperando os objetos
em memória sem avisar — o que não é aceitável como solução final:
"abre no Chrome" não prova que o arquivo é válido.

### Confirmação com um leitor independente

`poppler` (`pdfinfo`/`pdftoppm`, projeto e codebase totalmente
diferentes de `pdf-lib`/`qpdf`) reporta o problema de forma explícita
e não-tolerante:

```
$ pdfinfo flattened-por-pdf-lib.pdf
Syntax Error: Invalid XRef entry 105
Syntax Error: Invalid XRef entry 107
Syntax Error: Invalid XRef entry 108
... (11 entradas no total)
```

### Tentativas descartadas

- `useObjectStreams: false` no `.save()` — piorou (mais entradas
  inválidas).
- Salvar duas vezes (`load` → `save` → `load` → `save`) — o próprio
  `pdf-lib` não consegue reabrir corretamente o que ele mesmo escreveu.
- `updateFieldAppearances: false` — erro fatal.
- Pós-processar com `pikepdf` (Python, usa `libqpdf`) reabrindo e
  regravando o PDF: **funciona** (0 "Invalid XRef" no resultado), mas
  exigiria um passo em Python fora do pipeline — inviável, porque este
  projeto é 100% client-side (Vite/React, sem backend) e o export
  acontece no navegador do usuário.

### Solução adotada

Trocar `pdf-lib` por **`@cantoo/pdf-lib`** (`cantoo-scribe/pdf-lib`),
um fork mantido com a mesma API pública (mesmos imports, mesmas
classes `PDFDocument`/`PDFForm`/`PDFCheckBox`/etc. — troca é só o
nome do pacote). Ele corrige o bug na origem: a tabela de xref gerada
por `form.flatten()` neste mesmo molde é válida.

Verificado com `pdfinfo`/`pdftoppm` (poppler, independente de ambas as
bibliotecas):

| | `pdf-lib` (original) | `@cantoo/pdf-lib` |
|---|---|---|
| `pdfinfo` | 11× "Invalid XRef entry" | 0 erros |
| `pdftoppm` (rasterizar pág. 1) | erros de sintaxe no stderr | saída limpa, `exit 0` |

Também testado no fluxo real (Builder → Revisão → Exportar PDF →
download, via Playwright/Chromium) — mesmo resultado limpo no PDF
baixado pelo navegador.

Testes automatizados (`src/pdf/exporter.test.ts`, bloco "validade
estrutural do xref"): rodam `pdfinfo`/`pdftoppm` sobre o PDF gerado
por `buildExportedPdf` e falham se aparecer "Invalid XRef". Pulam
(não falham) se o poppler não estiver instalado no ambiente de CI —
é uma dependência de sistema opcional só para este reforço; a
correção em si (troca de biblioteca) não depende do poppler existir
em produção, só o teste de verificação depende dele em CI.

## Problema 2 — texto de depuração vazando no flatten (achado durante a investigação)

Ao inspecionar visualmente o PDF exportado (renderizado com
`pdftoppm`), apareceu um texto estranho no rodapé da página 1:

```
FOR.res=2;FOR.atl=-1;DEX.res=4;DEX.acr=4;...
```

Isso **não é gerado pelo nosso código** (nenhum lugar em
`src/pdf/*.ts` escreve esse formato) — é o valor (`/V`) de um campo
chamado `AUTO.PERICIAS.ANTECEDENTE`, um campo auxiliar que o autor
original do molde ("Sr Stuart III") usava para armazenar dados
internos consumidos pelo JavaScript do documento (JavaScript esse que
já removemos via `/Names`/`OpenAction`).

Diagnosticado com `pikepdf`: existem **8 campos** assim
(`AUTO.PERICIAS.ANTECEDENTE`, `AUTO.ARMAS`, `AUTO.FERRAMENTAS`,
`AUTO.ESPECIE`, `AUTO.ANTECEDENTE`, `AUTO.INICIATIVA`, `AUTO.PASSIVA`,
`AUTO.CA`), todos com a flag de anotação `Hidden` (`/F` com o bit 2
ligado) — por isso são sempre invisíveis no Acrobat/Chrome. O
problema: `form.flatten()` **ignora essa flag** (tanto no `pdf-lib`
original quanto no fork `@cantoo/pdf-lib`) e desenha o valor do campo
como texto visível na página achatada.

### Correção

`removeHiddenHelperFields()` (em `src/pdf/exporter.ts`) roda antes do
`flatten()` (junto com a remoção do campo "Reset") e remove todo
campo cuja(s) anotação(ões) widget tenha(m) a flag `AnnotationFlags.Hidden`
ligada — detectado programaticamente via
`field.acroField.getWidgets().some(w => w.hasFlag(AnnotationFlags.Hidden))`,
não por uma lista de nomes fixa (então continua correto se o molde
ganhar mais campos ocultos no futuro). Confirmado que nenhum dos 163
checkboxes reais (perícias, salvaguardas, etc.) tem essa flag — a
remoção não afeta nada que o exportador precisa preencher.

Testes: `exporter.test.ts` confirma que os 8 campos somem do formulário
depois de `fillPdfForm`, e (com poppler disponível) que `pdftotext`
não extrai mais o texto "FOR.res=" nem qualquer "AUTO." do PDF final.
