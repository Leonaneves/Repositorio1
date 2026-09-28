# Diagnóstico estrutural: botão RESET e marcação vermelha

Inspeção feita com `pikepdf` sobre o PDF-molde interativo
(`Ficha_PTBR_A4_Interativa_2.pdf`, aprovado como base do exportador —
ver `docs/04-builder-features-pdf-arquitetura.md`, decisão 1). Objetivo:
decidir COMO remover o botão "RESET" e a marcação vermelha de forma
estrutural (não apenas escondê-los visualmente).

## O que o botão é

- Um único campo de formulário `/T = "Reset"`, `/FT = /Btn` (botão de
  clique), **sem** `/Kids` — o dicionário do campo e o da anotação
  widget estão fundidos no mesmo objeto (caso comum para botões simples
  sem múltiplas instâncias visuais).
- Fica na **página 2** (índice 1), posição 348 de 350 no array
  `/Annots` dessa página.
- `/Rect = [267.224, 797.521, 326.873, 832.268]` — perto do topo da
  página.
- Ação: `/A = {"/S": "/ResetForm", "/Fields": [], "/Flags": 1}` — uma
  ação **nativa** do PDF (`ResetForm`), não JavaScript. Com `/Fields`
  vazio e `/Flags = 1` (Exclude), o efeito é resetar **todos** os
  campos do formulário.
- **Não** está no array `/CO` (ordem de cálculo) do AcroForm, e nenhum
  outro campo referencia "Reset" em suas próprias ações — é
  completamente isolado, sem efeitos colaterais em outros campos além
  do próprio reset.
- O documento só tem 2 scripts JavaScript de nível de documento
  (`AtualizarArmaduras`, `SubclassesPorClasse`, já mapeados na Fase 1)
  — nenhum deles é acionado pelo Reset nem depende dele.

## De onde vem a cor vermelha

A cor vermelha (RGB `0.898, 0.133, 0.216`) aparece em **exatamente dois
lugares, ambos só deste campo**:

1. `/MK/BC` (cor da borda no dicionário de aparência do campo) — usada
   por leitores que regeneram a aparência.
2. O stream de aparência pré-renderizado `/AP/N` (Form XObject próprio
   deste widget, referenciado só por ele) — desenha o botão "3D"
   (branco/cinza), a borda vermelha (`0.898041 0.133331 0.215683 RG` +
   `re s`) e o texto "RESET" também em vermelho
   (`0.899994 0.130005 0.210007 rg` + `Tj`).

Comparado com **todos os outros ~350 campos de botão/checkbox** da
ficha (proficiências, marcação de morte, escudo, preparação de magia
etc.), que usam `/MK/BC = [0, 0, 0]` (preto) — o Reset é o único campo
de todo o documento com essa cor. Não há nenhum retângulo ou texto
vermelho desenhado separadamente no *content stream* estático da
página — a cor inteira vem deste um objeto.

## Conclusão: estratégia de remoção

Remover o botão **e** toda a marcação vermelha é uma única operação
estrutural, sem risco de sobrar resíduo visual:

1. Remover o dicionário do campo do array `/AcroForm/Fields` (é
   top-level, sem `/Parent`, então é uma remoção de nó único).
2. Remover a mesma referência do array `/Annots` da página 2.
3. O Form XObject de `/AP/N` fica órfão (sem nenhuma referência) e é
   descartado automaticamente na gravação — nenhum passo extra
   necessário.

Isso é o que `pdf/exporter.ts` (Etapa seguinte) precisa fazer antes de
achatar (`flatten`) o formulário: **remover o campo/anotação "Reset"
antes do flatten**, não apenas ocultá-lo — do contrário o flatten
"queimaria" o botão vermelho como um desenho estático permanente na
página 2 exportada.
