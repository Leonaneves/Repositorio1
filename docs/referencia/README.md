# Material de referência extraído do PDF original

Gerado por análise programática de `Ficha_PTBR_A4_Interativa_2.pdf` (AcroForm + JavaScript do Acrobat). Serve de base factual para `docs/00-arquitetura-e-mapeamento.md` e para a futura implementação do motor de regras — antes de reescrever qualquer fórmula, confira aqui o comportamento exato do arquivo original.

- `ficha-pagina-1.png`, `ficha-pagina-2.png` — render das duas páginas (200dpi), para conferência visual de rótulos e diagramação.
- `campos-resumo.tsv` — lista tabular dos 450 campos (nome, tipo, valor default, opções, quais ações têm script).
- `campos-completos.json` — dump completo de cada campo (nome, tipo, flags, rect, opções, valor default e, quando existe, o texto de cada ação `/AA` — keystroke/format/validate/calculate).
- `scripts-acrobat/por-campo/` — script de cada ação de campo, um arquivo por `<campo>__<ação>.js`.
- `scripts-acrobat/documento/` — os dois scripts de nível de documento: `AtualizarArmaduras.js` (reconstrói a lista de armaduras disponíveis a partir das proficiências) e `SubclassesPorClasse.js` (tabela definitiva de subclasses por classe, com nome curto de exibição e nome completo de exportação).
