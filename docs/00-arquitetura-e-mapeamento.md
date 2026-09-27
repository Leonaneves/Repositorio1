# Ficha de Personagem D&D 2024 — Análise e Proposta de Arquitetura

> Documento de arquitetura e mapeamento funcional. **Nenhum código de produto foi escrito nesta etapa.**
> Fonte analisada: `Ficha_PTBR_A4_Interativa_2.pdf` (2 páginas, A4, AcroForm com 450 campos de formulário e JavaScript do Acrobat, fontes Roboto / Roboto Condensed / Roboto Black embutidas).

---

## 1. Como a análise foi feita

O PDF foi aberto programaticamente (não apenas visualmente): extraí a árvore completa de campos do AcroForm (`/AcroForm/Fields`, seguindo `/Kids` recursivamente) e todo o JavaScript associado — tanto os scripts de documento (`AtualizarArmaduras`, `SubclassesPorClasse`) quanto as ações por campo (`/AA` → `K` keystroke, `F` format, `V` validate, `C` calculate). Isso me deu acesso ao **código-fonte real das automações do Acrobat**, não apenas aos rótulos visíveis — o que é essencial, porque a maior parte do texto da ficha é arte/diagramação (rótulos fixos), e os nomes internos dos campos (`O.SAB.perc`, `AUTO.CA`, `MOD.CONJ` etc.) só fazem sentido lendo a lógica que os manipula.

Total: **450 campos terminais** (247 texto, 39 seleção/combo, 164 botão/checkbox), distribuídos em 2 páginas.

---

## 2. Inventário de campos

Classificação usada:
- **Manual** — o usuário digita livremente.
- **Seleção** — combo/lista fixa de opções.
- **Checkbox** — booleano.
- **Texto livre** — manual, sem estrutura/validação (parágrafos, notas).
- **Calculado** — o motor de regras produz o valor; sem edição direta.
- **Calculado + ajuste manual** — o motor produz um valor automático, mas o campo aceita um ajuste que é somado a ele (o princípio "auto + manual = final" pedido por você). No PDF original isso é implementado com um **campo-sombra de memória** (`AUTO.*`) que guarda o último valor automático, para que o script consiga inferir `ajuste = valor_atual − valor_automático_anterior` por subtração de texto. É uma técnica frágil (ver seção 7) que a arquitetura nova substitui por dados explícitos.

### 2.1 Identidade e progressão

| Campo (PDF) | Classificação | Observações |
|---|---|---|
| `Nome` | Manual (texto) | Nome do personagem |
| `ANTECEDENTE` | Seleção | 16 antecedentes do PHB 2024. Dispara: talento de origem (texto em `Talentos`), 2 perícias marcadas em `O.*` |
| `CLASSE` | Seleção | 13 classes. Dispara: atributo de conjuração, salvaguardas, proficiência com armaduras, proficiência com armas (texto), proficiência com ferramentas (texto), repopula `SUBCLASSE` |
| `SUBCLASSE` | Seleção (dependente) | Lista reconstruída dinamicamente conforme `CLASSE` (ver 2.6) |
| `ESPECIE` | Seleção | 10 espécies. Dispara: traços em texto (`HABILIDADES.ESPECIE`), `Tamanho` |
| `Nível` | Manual (validado 1–20, inteiro) | |
| `Tamanho` | Calculado (⚠ sem separação auto/manual, ver §7.3) | Definido pela espécie |
| `Deslocamento` | Manual (texto) | ⚠ Não é derivado da espécie no PDF original (ver §7.4) |
| `Assinatura` | Texto livre fixo | Crédito do autor da ficha original |

### 2.2 Atributos (repetido para FOR/DEX/CON/INT/SAB/CAR)

| Campo | Classificação | Fórmula |
|---|---|---|
| `<ATR>.val` | Manual (validado 1–30, inteiro) | Valor bruto do atributo |
| `<ATR>.MOD` | Calculado | `floor((val − 10) / 2)` |

### 2.3 Perícias e salvaguardas (18 perícias + 6 salvaguardas)

| Campo | Classificação | Fórmula |
|---|---|---|
| `O.<ATR>.<pericia>` (checkbox) | Checkbox | Proficiência na perícia. Marcado automaticamente pelo antecedente; editável manualmente |
| `<ATR>.<pericia>` (texto) | Calculado + ajuste manual | `MOD do atributo + (bônus de proficiência, se O.* marcado) + ajuste` |
| `O.<ATR>.res` (checkbox) | Checkbox | Proficiência em salvaguarda. Marcado automaticamente pela classe; editável |
| `<ATR>.res` (texto) | Calculado + ajuste manual | Mesma fórmula das perícias |

Mapa perícia→atributo confirmado no PDF: FOR: Atletismo · DEX: Acrobacia, Furtividade, Prestidigitação · CON: (nenhuma) · INT: Arcanismo, História, Investigação, Natureza, Religião · SAB: Intuição, Lidar com Animais, Medicina, Percepção, Sobrevivência · CAR: Atuação, Enganação, Intimidação, Persuasão (18 perícias, igual ao 5e/2024).

### 2.4 Proficiência, iniciativa, percepção passiva

| Campo | Classificação | Fórmula |
|---|---|---|
| `PROFICIENCIA` | Calculado (⚠ **sem** ajuste manual, inconsistente com o resto — ver §7.2) | Tabela por nível: 1–4→+2, 5–8→+3, 9–12→+4, 13–16→+5, 17–20→+6 |
| `Iniciativa` | Calculado + ajuste manual | `= DEX.MOD` |
| `PERCEPCAO.PASSIVA` | Calculado + ajuste manual | `= 10 + SAB.perc` (usa o valor já com proficiência) |

### 2.5 Classe de Armadura

| Campo | Classificação | Fórmula |
|---|---|---|
| `PROF.leve` / `PROF.med` / `PROF.pesa` / `PROF.Escudo` (checkbox) | Checkbox | Proficiência com armaduras. Marcado automaticamente pela classe; editável. Controla quais opções aparecem em `ARMADURA.ATUAL` |
| `ARMADURA.ATUAL` | Seleção (lista dinâmica) | Reconstruída a partir das proficiências marcadas (ver AtualizarArmaduras, §2.6) |
| `Escudo` (checkbox) | Checkbox | Uso de escudo (+2 CA) |
| `CA` | Calculado + ajuste manual | Ver regras completas abaixo |

**Regras de CA extraídas literalmente do script:**
- Sem armadura, classes gerais: `10 + DEX` (+2 se escudo)
- Sem armadura, **Bárbaro**: `10 + DEX + CON` (+2 se escudo)
- Sem armadura, **Monge sem escudo**: `10 + DEX + SAB`
- Sem armadura, **Monge com escudo**: `10 + DEX + 2` (perde a defesa sem armadura do Monge; usa CA normal + escudo)
- Armaduras leves: Acolchoada `11+DEX`, Couro `11+DEX`, Couro Batido `12+DEX`
- Armaduras médias (DEX limitado a +2): Gibão de Peles `12`, Camisa de Malha `13`, Brunea `14`, Peitoral `14`, Meia-Armadura `15`
- Armaduras pesadas (sem DEX): Cota de Anéis `14`, Cota de Malha `16`, Cota de Talas `17`, Placas `18`
- Escudo com armadura: `+2` sempre que equipado (independente da classe)
- Não há verificação de Força mínima nem penalidade de Furtividade para armadura pesada (ver §7.8)

### 2.6 Conjuração

| Campo | Classificação | Fórmula |
|---|---|---|
| `ATRIBUTO.conju` | Calculado (derivado da classe) | Bardo/Bruxo/Feiticeiro/Paladino→CAR · Clérigo/Druida/Patrulheiro→SAB · Mago/Artífice→INT · demais classes→vazio |
| `MOD.CONJ` | Calculado | `= MOD do atributo de conjuração` |
| `MOD.magia` (bônus de ataque mágico) | Calculado | `= MOD.CONJ + PROFICIENCIA` |
| `CD.magia` | Calculado | `= 8 + MOD.CONJ + PROFICIENCIA` |
| `Esp.mag.1` … `Esp.mag.9` (espaços por círculo) | Calculado (⚠ sem ajuste manual) | Tabela de progressão por nível, ramificada por tipo de conjurador (ver §5.5) |
| `1o.circ.1..4`, `2o.circ.1..3`, … `9o.circ.1` (checkboxes) | Checkbox | Rastreio de espaços **gastos** (não é regra, é controle de uso) |

### 2.7 Combate (armas) e recursos

| Campo | Classificação |
|---|---|
| `Arma.Truque`, `Arma.Truque2`…`6` (nome da arma/truque) | Manual (texto) |
| `Bonus de atk`, `Bonus de atk 1`…`5` | Manual (texto) — **não há cálculo automático de bônus de ataque no PDF original** (ver §7.5) |
| `Dano e Tipo`, `Dano e Tipo 1`…`5` | Manual (texto) |
| `Notas da Arma`, `Notas da Arma 1`…`5` | Manual (texto) |
| `HP.atual`, `HP.max`, `HP.temp`, `HP.Dados.max`, `HP.Dados.Gasto` | Manual — sem automação |
| `Morte.suc.1-3`, `Morte.fal.1-3` (checkbox) | Checkbox — sucessos/falhas de resistência à morte |
| `C5` (checkbox) | Checkbox — **Inspiração Heroica** (identificado por posição no layout; nome de campo genérico/técnico no PDF original) |

### 2.8 Proficiências e blocos de texto auto-preenchidos

| Campo | Classificação |
|---|---|
| `PROF.armas` | Calculado + manual, concatenado em texto único (auto-preenchido pela classe) |
| `PROF.ferramentas` | Idem, por classe |
| `Talentos` | Idem, auto-preenchido pelo talento de origem do antecedente |
| `HABILIDADES.ESPECIE` | Idem, auto-preenchido pelos traços da espécie |
| `Carac.Classe.1`, `Carac.Classe.2` | Texto livre manual (características de classe/subclasse — sem automação; presumivelmente o jogador copia do livro) |

⚠ Estes 4 primeiros campos usam a técnica de "colar texto automático + texto do usuário numa única string e remover por `indexOf/substring` na próxima mudança" — funcional mas frágil (ver §7.1).

### 2.9 Magias preparadas (tabela de até 34 linhas, página 2)

| Campo | Classificação |
|---|---|
| `circulo1.0`…`circulo1.33` | Manual (texto) — apesar do nome, é digitado livremente, não calculado |
| `nome.magia.1.0`…`.33` | Manual (texto) |
| `tempo.mag.0`…`.33` | Seleção (`-`, Ação, AB, Reação, 1min, 10min, 1h, 8h, 12h, 24h) |
| `alcance.magia.0`…`.33` | Manual (texto) |
| `Concentracao.1`…`.34`, `Ritual.1`…`.34`, `Material.1`…`.34` | Checkbox |
| `notas.magia.1.0`…`.33` | Manual (texto) |

(Numeração 0-based num grupo de campos e 1-based noutro é inconsistência de nomenclatura do PDF original, não uma regra — a arquitetura nova normaliza para um array 0-based de 34 linhas por personagem.)

### 2.10 Página 2 — diversos

| Campo | Classificação |
|---|---|
| `aparência`, `idiomas`, `Equipamentos` | Texto livre manual |
| `cobre`, `prata`, `ouro`, `platina` | Manual (numérico) |
| `Item.magico.1-3` / `O.item.magico.1-3` | Manual (texto) + checkbox de sintonização (máx. 3, não validado no PDF) |
| `Reset` (botão) | Ação de botão do Acrobat (provável `resetForm()`; script de clique não incluído nas ações de campo padrão, ver §7.10) |

### 2.11 Campos-sombra (não visíveis, uso interno do Acrobat)

`AUTO.CA`, `AUTO.INICIATIVA`, `AUTO.PASSIVA`, `AUTO.PERICIAS`, `AUTO.PERICIAS.ANTECEDENTE`, `AUTO.ANTECEDENTE`, `AUTO.ESPECIE`, `AUTO.ARMAS`, `AUTO.FERRAMENTAS` — armazenam o "último valor automático" para permitir a técnica de diff. **Não existem na arquitetura nova**: são substituídos pelos campos `auto`/`manual` explícitos do modelo de dados (§4).

---

## 3. Mapeamento de dependências

```
ESPECIE ──────────────► Tamanho
        ──────────────► HABILIDADES.ESPECIE (traços em texto)

ANTECEDENTE ──────────► Talentos (texto do talento de origem)
            ──────────► O.<pericias do antecedente> (2 checkboxes)

CLASSE ───────────────► ATRIBUTO.conju
       ───────────────► O.<ATR>.res (2 salvaguardas)
       ───────────────► PROF.leve / PROF.med / PROF.pesa / PROF.Escudo
       ───────────────► PROF.armas (texto)
       ───────────────► PROF.ferramentas (texto)
       ───────────────► SUBCLASSE (repopula lista de opções)
       ───────────────► ARMADURA.ATUAL (via proficiências → reconstrói lista)

Nível ────────────────► PROFICIENCIA
      ────────────────► Esp.mag.1..9 (junto com CLASSE e SUBCLASSE)

CLASSE + SUBCLASSE + Nível ─► Esp.mag.1..9 (tabela de conjurador completo/
                               meio-conjurador/terços — Cavaleiro Místico,
                               Trapaceiro Arcano — e Magia de Pacto do Bruxo)

<ATR>.val ────────────► <ATR>.MOD
<ATR>.MOD + PROFICIENCIA + O.<ATR>.<pericia> ─► <ATR>.<pericia>  (perícia)
<ATR>.MOD + PROFICIENCIA + O.<ATR>.res ───────► <ATR>.res        (salvaguarda)

DEX.MOD ──────────────► Iniciativa
SAB.perc (já calculada) ► PERCEPCAO.PASSIVA

ARMADURA.ATUAL + Escudo + CLASSE + DEX.MOD + CON.MOD + SAB.MOD ─► CA

ATRIBUTO.conju ───────► MOD.CONJ (junto com <ATR>.MOD correspondente)
MOD.CONJ + PROFICIENCIA ► MOD.magia, CD.magia
```

Pontos de atenção estruturais:
- `CLASSE` é o campo com mais efeitos colaterais (7 sistemas dependem dele diretamente).
- A ordem de cálculo importa: atributo → modificador → proficiência (nível) → perícia/salvaguarda/CA/conjuração. No PDF isso é resolvido pela `CalculationOrder` do Acrobat (46 campos, ordem implícita); na arquitetura nova isso vira um grafo de dependências explícito e determinístico (função pura, sem "ordem de formulário").
- `SUBCLASSE` depende de `CLASSE`, mas `Esp.mag.*` depende de `SUBCLASSE` **apenas** para 2 casos especiais (Guerreiro/Cavaleiro Místico e Ladino/Trapaceiro Arcano) — é uma dependência condicional, não universal.

---

## 4. Modelo central de dados do personagem

Princípio adotado em todo o modelo: qualquer valor que hoje é "calculado ou calculado+manual" vira um objeto explícito, nunca uma string com técnica de diff.

```ts
interface ComputedValue<T = number> {
  auto: T;       // resultado puro do motor de regras
  manual: T;     // ajuste/override informado pelo jogador (default 0 para números)
  final: T;      // auto (+) manual — nunca armazenado calculado "à mão"; é sempre derivado
}

interface AbilityScore {
  score: number;               // entrada manual, 1–30
  modifier: number;             // derivado, não persistido (ou persistido só como cache)
}

type AbilityKey = "FOR" | "DEX" | "CON" | "INT" | "SAB" | "CAR";

interface SkillState {
  proficient: boolean;          // checkbox, com origem rastreável (ver ProficiencySource)
  expertise?: boolean;          // fora do escopo v1 (§7.9), campo reservado
  bonus: ComputedValue;
}

interface ProficiencyEntry {
  label: string;                 // ex.: "Ferramentas de Ladrão"
  source: "species" | "class" | "background" | "feat" | "manual";
}

interface Character {
  id: string;
  meta: {
    name: string;
    background: BackgroundId | null;
    species: SpeciesId | null;
    class: ClassId | null;
    subclass: SubclassId | null;
    level: number;               // 1–20
  };

  abilities: Record<AbilityKey, AbilityScore>;

  skills: Record<SkillKey, SkillState>;
  savingThrows: Record<AbilityKey, SkillState>;

  proficiencyBonus: ComputedValue;  // hoje sem manual no PDF; ver decisão em §7.2
  initiative: ComputedValue;
  passivePerception: ComputedValue;

  armor: {
    equipped: ArmorId | "unarmed";
    shield: boolean;
    armorProficiencies: { light: boolean; medium: boolean; heavy: boolean; shield: boolean };
    ac: ComputedValue;
  };

  spellcasting: {
    ability: AbilityKey | null;   // derivado da classe, mas armazenado (permite futura fonte alternativa, §7.7)
    modifier: number;             // derivado
    attackBonus: ComputedValue;
    saveDC: ComputedValue;
    slotsByCircle: Record<1|2|3|4|5|6|7|8|9, { total: number; expended: number }>;
  };

  size: ComputedValue<SizeId>;
  speed: ComputedValue<number>;   // gap: PDF original não calcula (§7.4); arquitetura já prevê

  weaponProficiencies: ProficiencyEntry[];
  toolProficiencies: ProficiencyEntry[];
  speciesTraits: ProficiencyEntry[]; // reaproveita a mesma forma (label + source) em vez de texto concatenado
  backgroundFeat: string | null;

  classFeatures: { column1: string; column2: string }; // texto livre, sem automação (igual ao original)

  attacks: Array<{ name: string; attackBonus: string; damage: string; notes: string }>; // manual, ver §7.5

  hp: { current: number; max: number; temp: number; hitDiceMax: number; hitDiceSpent: number };
  deathSaves: { successes: number; failures: number };
  heroicInspiration: boolean;

  spellsPrepared: Array<{
    circle: string; name: string; castingTime: string; range: string;
    concentration: boolean; ritual: boolean; material: boolean; notes: string;
  }>; // até 34 linhas, ver §2.9

  inventory: {
    equipment: string;
    coins: { cp: number; sp: number; gp: number; pp: number };
    attunedItems: Array<{ description: string; attuned: boolean }>; // máx. 3
  };

  appearance: string;
  languages: string;
  notes: { talents: string /* mescla auto+manual, ver ProficiencyEntry[] */ };
}
```

Observação de design: campos hoje "texto concatenado auto+manual" (`Talentos`, `PROF.armas`, `PROF.ferramentas`, `HABILIDADES.ESPECIE`) deixam de ser uma única string. Passam a ser uma lista de `ProficiencyEntry` (rotulada por origem) **mais** um campo de notas manuais livre, e a interface os renderiza juntos visualmente — preservando a aparência da ficha impressa sem herdar a fragilidade do diff de string.

---

## 5. Organização dos dados estáticos

Cada domínio do jogo vira um módulo de dados imutável, tipado, sem lógica — só fatos.

### 5.1 Classes (`data/classes.ts`)
```ts
interface ClassDefinition {
  id: ClassId; // 13 classes fornecidas por você
  name: string;
  spellcastingAbility: AbilityKey | null;
  savingThrowProficiencies: [AbilityKey, AbilityKey];
  armorProficiencies: ("light"|"medium"|"heavy"|"shield")[];
  weaponProficienciesText: string;   // hoje é texto pronto no PDF; mantém assim por ora
  toolProficienciesText?: string;
  spellcasterType: "full" | "half" | "pact" | "third-subclass" | "none";
  // "third-subclass": só conjura se a subclasse específica conceder (Cavaleiro Místico, Trapaceiro Arcano)
}
```

### 5.2 Subclasses (`data/subclasses.ts`)
Estrutura `Record<ClassId, SubclassDefinition[]>`. Fonte: PHB 2024 + Artífice (Eberron) + Ravenloft: The Horrors Within + Arcana Unleashed, **sem Forgotten Realms**, exatamente como veio nos dois scripts do PDF (que são consistentes entre si). Cada subclasse guarda `shortName` (rótulo no dropdown) e `fullName` (valor "canônico"/exportação), replicando a distinção que o PDF já faz.

Lista consolidada (13 classes, 4–8 subclasses cada):
- **Artífice**: Alquimista, Armeiro, Artilheiro, Ferreiro de Batalha, Cartógrafo, Reanimador
- **Bárbaro**: Berserker, Coração Selvagem, Árvore do Mundo, Zelote
- **Bardo**: Dança, Glamour, Conhecimento, Bravura, Espíritos
- **Bruxo**: Arquifada, Celestial, Corruptor, Grande Antigo, Morto-Vivo, Vestígio
- **Clérigo**: Vida, Luz, Trapaça, Guerra, Sepultura, Arcano
- **Druida**: Terra, Lua, Mar, Estrelas
- **Feiticeiro**: Aberrante, Mecânica, Dracônica, Magia Selvagem, Sombras
- **Guerreiro**: Mestre de Batalha, Campeão, Cavaleiro Místico, Guerreiro Psiônico, Arqueiro Arcano
- **Ladino**: Trapaceiro Arcano, Assassino, Lâmina Psíquica, Ladrão, Fantasma
- **Mago**: Abjurador, Adivinho, Evocador, Ilusionista, Conjurador, Encantador, Necromante, Transmutador
- **Monge**: Misericórdia, Sombras, Elementos, Mão Aberta, Artes Místicas
- **Paladino**: Devoção, Glória, Anciões, Vingança
- **Patrulheiro**: Senhor das Feras, Andarilho Feérico, Perseguidor das Sombras, Caçador, Guardião Oco

### 5.3 Espécies (`data/species.ts`)
```ts
interface SpeciesDefinition {
  id: SpeciesId; // 10 espécies fornecidas
  name: string;
  size: SizeId;
  speed?: number; // gap: PDF não define — precisa confirmação (§7.4)
  traits: { title: string; description: string }[]; // vira ProficiencyEntry[source:"species"]
}
```

### 5.4 Antecedentes (`data/backgrounds.ts`)
```ts
interface BackgroundDefinition {
  id: BackgroundId; // 16 antecedentes
  name: string;
  grantedSkills: SkillKey[]; // exatamente 2, conforme extraído do PDF
  originFeat: string;         // texto do talento de origem
}
```

### 5.5 Armaduras (`data/armors.ts`)
```ts
interface ArmorDefinition {
  id: ArmorId;
  name: string;
  category: "light" | "medium" | "heavy";
  baseAC: number;
  dexBonus: "full" | "max2" | "none";
  // strengthRequirement / stealthDisadvantage: fora do PDF original, ver §7.8
}
```
Lista extraída literalmente do script `AtualizarArmaduras`: Acolchoada(11,leve,full), Couro(11,leve,full), Couro Batido(12,leve,full), Gibão de Peles(12,média,max2), Camisa de Malha(13,média,max2), Brunea(14,média,max2), Peitoral(14,média,max2), Meia-Armadura(15,média,max2), Cota de Anéis(14,pesada,none), Cota de Malha(16,pesada,none), Cota de Talas(17,pesada,none), Placas(18,pesada,none).

### 5.6 Progressão de espaços de magia (`data/spellProgression.ts`)
A tabela `tabelaCompleta[nível][círculo]` (21 linhas × 9 colunas, níveis 0–20) extraída literalmente do script é a fonte única. Aplicada com 3 regras de derivação de "nível de conjurador efetivo":
- **Conjurador completo** (Bardo, Clérigo, Druida, Feiticeiro, Mago): usa `nível` diretamente.
- **Meio-conjurador** (Paladino, Patrulheiro, Artífice): usa `ceil(nível / 2)`.
- **Terço-conjurador por subclasse** (Guerreiro/Cavaleiro Místico a partir do nível 3, Ladino/Trapaceiro Arcano a partir do nível 3): usa `ceil(nível / 3)`.
- **Bruxo (Magia de Pacto)**: tabela própria, independente — todos os espaços concentrados num único círculo (ver script, §2.6). Não usa `tabelaCompleta`.

---

## 6. Funções do motor de regras

Módulo puro (`rules/engine.ts`), sem dependência de UI, 100% testável.

```ts
getAbilityModifier(score: number): number
getProficiencyBonus(level: number): number
getSkillBonus(character: Character, skill: SkillKey): ComputedValue
getSavingThrow(character: Character, ability: AbilityKey): ComputedValue
getPassivePerception(character: Character): ComputedValue
getInitiative(character: Character): ComputedValue
getArmorClass(character: Character): ComputedValue
getSpellcastingModifier(character: Character): number | null
getSpellSaveDC(character: Character): ComputedValue | null
getSpellAttackBonus(character: Character): ComputedValue | null
getSpellSlots(character: Character): Record<number, number> // total por círculo
getAvailableSubclasses(classId: ClassId): SubclassDefinition[]
getAvailableArmor(character: Character): ArmorDefinition[] // filtra por proficiências marcadas

// Funções adicionais identificadas como necessárias pela análise:
getClassSideEffects(classId: ClassId): {
  spellcastingAbility, savingThrows, armorProficiencies, weaponProficienciesText, toolProficienciesText
}
getBackgroundSideEffects(backgroundId: BackgroundId): { grantedSkills: SkillKey[]; feat: string }
getSpeciesSideEffects(speciesId: SpeciesId): { size: SizeId; speed?: number; traits: ... }
getCasterProgressionType(classId, subclassId, level): "full" | "half" | "third" | "pact" | "none"
applyManualAdjustment(auto: number, manual: number): number // = auto + manual, isolado por testabilidade/clareza
```

Cada função recebe o personagem (ou os dados mínimos necessários) e devolve valores — nunca lê nem escreve em campos de UI. Isso corrige o maior problema estrutural do PDF original: lá, o "motor de regras" está entranhado em scripts de evento de campos específicos (ex.: a lógica de subclasses por classe está dentro da própria ação do campo `CLASSE`), o que tornaria qualquer mudança de interface arriscada.

---

## 7. Achados, lacunas e decisões que preciso que você confirme

Estes pontos vieram da leitura literal do JavaScript do PDF — não são regras que inventei, são comportamentos reais (ou ausências) que encontrei e que afetam decisões de arquitetura.

1. **Bug real no PDF original**: a checkbox de proficiência em Arcanismo está nomeada `o.INT.arc` (o minúsculo), mas o script de cálculo de `INT.arc` procura pelo campo `O.INT.arc` (O maiúsculo). Nomes de campo em PDF são *case-sensitive*, então **marcar a proficiência em Arcanismo nunca soma o bônus automaticamente** no arquivo atual. Pretendo corrigir isso na versão web (tratar como bug), a menos que você prefira que eu confirme esse comportamento com você antes.
2. `PROFICIENCIA` (bônus de proficiência) é o único valor "calculado" do PDF que **não** aceita ajuste manual, diferente de todos os outros. Foi proposital no original ou devo padronizar com `ComputedValue` (auto+manual) como o resto?
3. `Tamanho` é recalculado pela espécie mas, ao contrário de `Iniciativa`/`CA`/perícias, não tem o padrão de memória auto/manual — uma edição manual pode ser perdida/sobrescrita ao trocar de espécie de novo. Quero aplicar o mesmo padrão robusto aqui — confirma?
4. `Deslocamento` **não é calculado automaticamente** pela espécie no PDF (é campo 100% manual), embora no D&D 2024 cada espécie tenha um deslocamento base definido. Você quer que a versão web já calcule isso automaticamente (com ajuste manual), ou mantenho manual como está hoje, deixando para uma fase futura?
5. Bônus de ataque com arma (`Bonus de atk`) e dano são **100% manuais** no PDF — não há fórmula (mod de atributo + proficiência) automatizada. Quer que eu implemente esse cálculo agora, ou mantenho fiel ao original (manual) nesta primeira versão?
6. A ficha suporta apenas **uma classe e uma subclasse** por personagem — confirmo que multiclasse está fora de escopo?
7. Antecedentes que concedem conjuração parcial via talento (ex.: Acólito/Guia/Sábio → "Iniciado em Magia") **não** alimentam `ATRIBUTO.conju` nem espaços de magia no PDF — só a `CLASSE` define isso. Mantenho esse mesmo escopo restrito, ou a arquitetura deve prever fontes adicionais de conjuração desde já (mesmo que não implementadas ainda)?
8. Não há verificação de **Força mínima** nem penalidade de Furtividade para armadura pesada/média (regra existente no livro). Fica fora do escopo v1, igual ao original?
9. **Expertise** (proficiência dobrada em perícia, ex.: Ladino/Bardo) não existe no PDF (só proficiente/não-proficiente). Confirma que fica fora do escopo v1?
10. O botão `Reset` da página 2 quase certamente aciona `this.resetForm()` do Acrobat (ação de clique no nível do widget, que não fica nas mesmas chaves de ação que os demais campos, então não consegui extrair o script exato). Na versão web isso vira uma ação de aplicação ("Novo Personagem" / "Limpar Ficha"), decidida pela camada de persistência, não pelo motor de regras. Ok?
11. **Identidade visual**: o PDF fornecido é a exportação achatada do InDesign (não o pacote de design original). Consegui confirmar as fontes exatas (Roboto, Roboto Condensed/Light, Roboto Black — todas Google Fonts, ótimo para a web) e o estilo geral (traço fino, cantos ornamentados, medidores circulares para "modificador/valor" de cada atributo, paleta em tons de cinza/preto sobre fundo claro). Se você tiver o pacote InDesign, guia de estilo, paleta de cores exata (hex) ou os ícones/ornamentos como vetores separados, isso ajuda bastante a fase de interface — mas não bloqueia o restante do projeto.
12. Nomeação de campos de magia inconsistente entre 0-based (`circulo1.0`…`.33`) e 1-based (`Concentracao.1`…`.34`) é só nomenclatura do PDF, será normalizada; sinalizando para constar como decisão já tomada, não pergunta.

---

## 8. Estrutura técnica proposta

**Stack recomendada:** React + TypeScript, com Vite.

Por quê:
- **TypeScript** é praticamente obrigatório aqui: o modelo de dados tem muitas interdependências (classe→subclasse→espaços de magia, atributo→modificador→perícia→CA...) e tipagem estática pega em tempo de compilação boa parte dos erros que, no PDF original, só apareceriam em runtime dentro do Acrobat.
- **React** dá um mapeamento natural entre "seções visuais da ficha" (bloco de Força, bloco de Perícias, bloco de CA...) e componentes, o que ajuda a preservar a organização visual pedida por você.
- **Vite** por build rápido e simplicidade; o projeto não precisa de SSR.

**Separação de camadas (pasta única, sem monorepo — o escopo não justifica):**
```
src/
  domain/        # tipos: Character, ComputedValue<T>, AbilityKey, SkillKey, ids...
  data/          # dados estáticos: classes, subclasses, species, backgrounds, armors, spellProgression
  rules/         # motor de regras — funções puras, testáveis isoladamente, SEM import de React
  state/         # store do personagem atual (proponho Zustand: menos boilerplate que Redux
                 # para este tamanho de app; troco por Redux Toolkit se você preferir
                 # devtools/time-travel mais robustos)
  persistence/   # interface CharacterRepository + implementação inicial (localStorage/IndexedDB)
  ui/            # componentes visuais, um por bloco da ficha (Atributos, Pericias, CA, Conjuracao...)
  App.tsx
```

- **Persistência**: abstraio atrás de uma interface (`CharacterRepository.save/load/list/delete`) para que a primeira implementação (local, no navegador — via `IndexedDB`, mais robusto que `localStorage` para dados estruturados) possa depois ser trocada/complementada por um backend (ex.: Supabase/Firebase) sem tocar em UI nem motor de regras, caso no futuro vocês queiram sync entre dispositivos ou multiusuário.
- **Testes**: Vitest para o motor de regras (prioridade alta — é a parte com mais lógica: tabela de espaços de magia, casos especiais de CA de Bárbaro/Monge, meio-conjuradores) + React Testing Library para componentes críticos.
- **Validação de dados**: Zod para validar o personagem na entrada/saída da persistência (evita ficha corrompida "quebrar" a UI).
- **Exportação/impressão** (fases futuras, mas já influencia a escolha): como a UI será HTML/CSS, dá para ter uma folha de estilo `@media print` dedicada, e depois somar geração de PDF (ex.: `react-to-print` ou renderização server-side) sem reescrever a lógica de regras.
- **PWA** (sugestão, não obrigatória): registrar service worker para uso offline à mesa — combina bem com IndexedDB local.

Alternativas consideradas e descartadas por ora: Vue (ecossistema também serviria, mas React tem mais tooling de teste maduro no seu contexto); Redux Toolkit como state manager padrão (mais boilerplate do que o tamanho do projeto pede, mas fica como troca fácil se a equipe já tiver preferência); Next.js (SSR/roteamento multi-página não são necessários para uma SPA de ficha única).

---

## 9. Próximos passos (após sua aprovação)

1. Modelo de dados (`domain/`) + dados estáticos (`data/`) tipados.
2. Motor de regras (`rules/`) com testes unitários cobrindo os casos especiais (Bárbaro/Monge, meio-conjuradores, Bruxo).
3. Camada de persistência local.
4. Interface, replicando a organização visual da ficha por blocos.
5. Exportação/impressão.

Aguardo sua validação desta arquitetura — em especial as 12 respostas da seção 7 — antes de avançar para o modelo de dados e o motor de regras.
