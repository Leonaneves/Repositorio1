var classe = String(event.value).replace(/^\s+|\s+$/g, "");

var campoAtributo = this.getField("ATRIBUTO.conju");

var atributoConjuracao = {

    "Bardo": "CARISMA",

    "Bruxo": "CARISMA",

    "Cl�rigo": "SABEDORIA",

    "Druida": "SABEDORIA",

    "Feiticeiro": "CARISMA",

    "Mago": "INTELIG�NCIA",

    "Paladino": "CARISMA",

    "Patrulheiro": "SABEDORIA",

    "Art�fice": "INTELIG�CIA"

};

campoAtributo.value = atributoConjuracao[classe] || "";


// ======================================================
// SALVAGUARDAS E ARMADURAS DA CLASSE
// ======================================================

var classeAtual = String(event.value).replace(/^\s+|\s+$/g, "");


// ======================================================
// PRIMEIRO DESMARCA TODAS AS SALVAGUARDAS
// ======================================================

var todasSalvaguardas = [
    "O.FOR.res",
    "O.DEX.res",
    "O.CON.res",
    "O.INT.res",
    "O.SAB.res",
    "O.CAR.res"
];

for (var i = 0; i < todasSalvaguardas.length; i++) {

    var campo = this.getField(todasSalvaguardas[i]);

    if (campo) {
        campo.checkThisBox(0, false);
    }
}


// ======================================================
// PRIMEIRO DESMARCA TODAS AS ARMADURAS
// ======================================================

var todasArmaduras = [
    "PROF.leve",
    "PROF.med",
    "PROF.pesa",
    "PROF.Escudo"
];

for (var j = 0; j < todasArmaduras.length; j++) {

    var campoArm = this.getField(todasArmaduras[j]);

    if (campoArm) {
        campoArm.checkThisBox(0, false);
    }
}


// ======================================================
// SALVAGUARDAS POR CLASSE
// ======================================================

var salvaguardasClasse = {

    "B�rbaro": [
        "O.FOR.res",
        "O.CON.res"
    ],

    "Bardo": [
        "O.DEX.res",
        "O.CAR.res"
    ],

    "Bruxo": [
        "O.SAB.res",
        "O.CAR.res"
    ],

    "Cl�rigo": [
        "O.SAB.res",
        "O.CAR.res"
    ],

    "Druida": [
        "O.INT.res",
        "O.SAB.res"
    ],

    "Feiticeiro": [
        "O.CON.res",
        "O.CAR.res"
    ],

    "Guerreiro": [
        "O.FOR.res",
        "O.CON.res"
    ],

    "Ladino": [
        "O.DEX.res",
        "O.INT.res"
    ],

    "Mago": [
        "O.INT.res",
        "O.SAB.res"
    ],

    "Monge": [
        "O.FOR.res",
        "O.DEX.res"
    ],

    "Paladino": [
        "O.SAB.res",
        "O.CAR.res"
    ],

    "Patrulheiro": [
        "O.FOR.res",
        "O.DEX.res"
    ],

    "Art�fice": [
        "O.CON.res",
        "O.INT.res"
    ]
};


// ======================================================
// ARMADURAS POR CLASSE
// ======================================================

var armadurasClasse = {

    "B�rbaro": [
        "PROF.leve",
        "PROF.med",
        "PROF.Escudo"
    ],

    "Bardo": [
        "PROF.leve"
    ],

    "Bruxo": [
        "PROF.leve"
    ],

    "Cl�rigo": [
        "PROF.leve",
        "PROF.med",
        "PROF.Escudo"
    ],

    "Druida": [
        "PROF.leve",
        "PROF.Escudo"
    ],

    "Feiticeiro": [],

    "Guerreiro": [
        "PROF.leve",
        "PROF.med",
        "PROF.pesa",
        "PROF.Escudo"
    ],

    "Ladino": [
        "PROF.leve"
    ],

    "Mago": [],

    "Monge": [],

    "Paladino": [
        "PROF.leve",
        "PROF.med",
        "PROF.pesa",
        "PROF.Escudo"
    ],

    "Patrulheiro": [
        "PROF.leve",
        "PROF.med",
        "PROF.Escudo"
    ],

    "Art�fice": [
        "PROF.leve",
        "PROF.med",
        "PROF.Escudo"
    ]
};


// ======================================================
// MARCA AS SALVAGUARDAS DA CLASSE ESCOLHIDA
// ======================================================

var salvaguardasNovas =
    salvaguardasClasse[classeAtual] || [];

for (var k = 0; k < salvaguardasNovas.length; k++) {

    var campoSalv =
        this.getField(salvaguardasNovas[k]);

    if (campoSalv) {
        campoSalv.checkThisBox(0, true);
    }
}


// ======================================================
// MARCA AS ARMADURAS DA CLASSE ESCOLHIDA
// ======================================================

var armadurasNovas =
    armadurasClasse[classeAtual] || [];

for (var l = 0; l < armadurasNovas.length; l++) {

    var campoArmadura =
        this.getField(armadurasNovas[l]);

    if (campoArmadura) {
        campoArmadura.checkThisBox(0, true);
    }
}




// ======================================================
// PROFICI�NCIAS EM ARMAS POR CLASSE
// ======================================================

var classeArmas = String(event.value).replace(/^\s+|\s+$/g, "");

var campoArmas = this.getField("PROF.armas");
var campoAutoArmas = this.getField("AUTO.ARMAS");


// ======================================================
// PROFICI�NCIAS DE CADA CLASSE
// ======================================================

var armasClasse = {

    "B�rbaro":
        "Armas Simples e Marciais",

    "Bardo":
        "Armas Simples",

    "Bruxo":
        "Armas Simples",

    "Cl�rigo":
        "Armas Simples",

    "Druida":
        "Armas Simples",

    "Feiticeiro":
        "Armas Simples",

    "Guerreiro":
        "Armas Simples e Marciais",

    "Ladino":
        "Armas Simples e Armas Marciais com propriedade Acuidade ou Leve",

    "Mago":
        "Armas Simples",

    "Monge":
        "Armas Simples e Armas Marciais com propriedade Leve",

    "Paladino":
        "Armas Simples e Marciais",

    "Patrulheiro":
        "Armas Simples e Marciais",

    "Art�fice":
        "Armas Simples"

};


// ======================================================
// TEXTO AUTOM�TICO NOVO
// ======================================================

var novoAutomaticoArmas =
    armasClasse[classeArmas] || "";

var automaticoAnteriorArmas =
    campoAutoArmas.valueAsString;

var textoAtualArmas =
    campoArmas.valueAsString;


// ======================================================
// REMOVE SOMENTE O TEXTO DA CLASSE ANTERIOR
// ======================================================

if (automaticoAnteriorArmas != "") {

    var posArmas =
        textoAtualArmas.indexOf(automaticoAnteriorArmas);

    if (posArmas != -1) {

        textoAtualArmas =
            textoAtualArmas.substring(0, posArmas)
            + textoAtualArmas.substring(
                posArmas + automaticoAnteriorArmas.length
            );

        textoAtualArmas =
            textoAtualArmas.replace(/^\s+|\s+$/g, "");
    }
}


// ======================================================
// COLOCA A PROFICI�NCIA DA NOVA CLASSE
// ======================================================

if (novoAutomaticoArmas != "") {

    if (textoAtualArmas != "") {

        campoArmas.value =
            novoAutomaticoArmas
            + "\n"
            + textoAtualArmas;

    } else {

        campoArmas.value =
            novoAutomaticoArmas;
    }

} else {

    campoArmas.value =
        textoAtualArmas;
}


// Guarda o texto autom�tico atual.
campoAutoArmas.value =
    novoAutomaticoArmas;



// ======================================================
// PROFICI�NCIAS EM FERRAMENTAS POR CLASSE
// ======================================================

var classeFerramentas = String(event.value).replace(/^\s+|\s+$/g, "");

var campoFerramentas = this.getField("PROF.ferramentas");
var campoAutoFerramentas = this.getField("AUTO.FERRAMENTAS");


// ======================================================
// PROFICI�NCIAS DE CADA CLASSE
// ======================================================

var ferramentasClasse = {

    "Bardo":
        "3 Instrumentos Musicais � escolha",

    "Druida":
        "Kit de Herbalismo",

    "Monge":
        "1 Ferramenta de Artes�o ou Instrumento Musical � escolha",

    "Ladino":
        "Ferramentas de Ladr�o",

    "Art�fice":
        "Ferramentas de Ladr�o\n"
        + "Ferramentas de Funileiro\n"
        + "1 Ferramenta de Artes�o � escolha"

};


// ======================================================
// TEXTO AUTOM�TICO NOVO
// ======================================================

var novoAutomaticoFerramentas =
    ferramentasClasse[classeFerramentas] || "";

var automaticoAnteriorFerramentas =
    campoAutoFerramentas.valueAsString;

var textoAtualFerramentas =
    campoFerramentas.valueAsString;


// ======================================================
// REMOVE SOMENTE O TEXTO DA CLASSE ANTERIOR
// ======================================================

if (automaticoAnteriorFerramentas != "") {

    var posFerramentas =
        textoAtualFerramentas.indexOf(automaticoAnteriorFerramentas);

    if (posFerramentas != -1) {

        textoAtualFerramentas =
            textoAtualFerramentas.substring(0, posFerramentas)
            + textoAtualFerramentas.substring(
                posFerramentas + automaticoAnteriorFerramentas.length
            );

        textoAtualFerramentas =
            textoAtualFerramentas.replace(/^\s+|\s+$/g, "");
    }
}


// ======================================================
// COLOCA AS PROFICI�NCIAS DA NOVA CLASSE
// ======================================================

if (novoAutomaticoFerramentas != "") {

    if (textoAtualFerramentas != "") {

        campoFerramentas.value =
            novoAutomaticoFerramentas
            + "\n"
            + textoAtualFerramentas;

    } else {

        campoFerramentas.value =
            novoAutomaticoFerramentas;
    }

} else {

    campoFerramentas.value =
        textoAtualFerramentas;
}


// Guarda o texto autom�tico atual.
campoAutoFerramentas.value =
    novoAutomaticoFerramentas;



// ======================================================
// SUBCLASSES DISPON�VEIS DE ACORDO COM A CLASSE
// PHB 2024 + RAVENLOFT + ARCANA UNLEASHED + ART�FICE
// ======================================================

var classeSub =
    String(event.value).replace(/^\s+|\s+$/g, "");

var campoSubclasse =
    this.getField("SUBCLASSE");

var subclasses = {

    // ==================================================
    // ART�FICE
    // Eberron: Forge of the Artificer
    // + Ravenloft: The Horrors Within
    // ==================================================

    "Art�fice": [
        "Alquimista",
        "Armeiro",
        "Artilheiro",
        "Ferreiro de Batalha",
        "Cart�grafo",
        "Reanimador"
    ],


    // ==================================================
    // B�RBARO
    // Player's Handbook 2024
    // ==================================================

    "B�rbaro": [
        "Berserker",
        "do Cora��o Selvagem",
        "da �rvore do Mundo",
        "Zelote"
    ],


    // ==================================================
    // BARDO
    // PHB 2024 + Ravenloft
    // ==================================================

    "Bardo": [
        "da Dan�a",
        "do Glamour",
        "do Conhecimento",
        "da Bravura",
        "dos Esp�ritos"
    ],


    // ==================================================
    // BRUXO
    // PHB 2024 + Ravenloft + Arcana Unleashed
    // ==================================================

    "Bruxo": [
        "Arquifada",
        "Celestial",
        "Corruptor",
        "Grande Antigo",
        "Morto-Vivo",
        "Vest�gio"
    ],


    // ==================================================
    // CL�RIGO
    // PHB 2024 + Ravenloft + Arcana Unleashed
    // ==================================================

    "Cl�rigo": [
        "da Guerra",
        "da Luz",
        "da Trapa�a",
        "da Vida",
        "da Sepultura",
        "Arcano"
    ],


    // ==================================================
    // DRUIDA
    // Player's Handbook 2024
    // ==================================================

    "Druida": [
        "da Lua",
        "do Mar",
        "das Estrelas",
        "da Terra"
    ],


    // ==================================================
    // FEITICEIRO
    // PHB 2024 + Ravenloft
    // ==================================================

    "Feiticeiro": [
        "Aberrante",
        "Mec�nica",
        "Drac�nico",
        "Magia Selvagem",
        "das Sombras"
    ],


    // ==================================================
    // GUERREIRO
    // PHB 2024 + Arcana Unleashed
    // ==================================================

    "Guerreiro": [
        "Campe�o",
        "Cavaleiro M�stico",
        "Mestre de Batalha",
        "Guerreiro Psi�nico",
        "Arqueiro Arcano"
    ],


    // ==================================================
    // LADINO
    // PHB 2024 + Ravenloft
    // ==================================================

    "Ladino": [
        "Assassino",
        "Ladr�o",
        "Trapaceiro Arcano",
        "L�mina Ps�quica",
        "Fantasma"
    ],


    // ==================================================
    // MAGO
    // PHB 2024 + Arcana Unleashed
    // ==================================================

    "Mago": [
        "Abjurador",
        "Adivinho",
        "Evocador",
        "Ilusionista",
        "Conjurador",
        "Encantador",
        "Necromante",
        "Transmutador"
    ],


    // ==================================================
    // MONGE
    // PHB 2024 + Arcana Unleashed
    // ==================================================

    "Monge": [
        "da Miseric�rdia",
        "das Sombras",
        "dos Elementos",
        "da M�o Aberta",
        "das Artes M�sticas"
    ],


    // ==================================================
    // PALADINO
    // Player's Handbook 2024
    // ==================================================

    "Paladino": [
        "dos Anci�es",
        "da Devo��o",
        "da Gl�ria",
        "da Vingan�a"
    ],


    // ==================================================
    // PATRULHEIRO
    // PHB 2024 + Ravenloft
    // ==================================================

    "Patrulheiro": [
        "Senhor das Feras",
        "Andarilho Fe�rico",
        "Perseguidor das Sombras",
        "Ca�ador",
        "Guardi�o Oco"
    ]
};


// ======================================================
// LIMPA AS SUBCLASSES DA CLASSE ANTERIOR
// ======================================================

if (campoSubclasse) {

    campoSubclasse.clearItems();


    // ==================================================
    // COLOCA A OP��O INICIAL
    // ==================================================

    campoSubclasse.insertItemAt(
        "Selecione...",
        "Selecione...",
        0
    );


    // ==================================================
    // CARREGA AS SUBCLASSES DA CLASSE ESCOLHIDA
    // ==================================================

    var listaSubclasses =
        subclasses[classeSub] || [];

    for (var i = 0; i < listaSubclasses.length; i++) {

        campoSubclasse.insertItemAt(
            listaSubclasses[i],
            listaSubclasses[i],
            i + 1
        );
    }


    // Sempre volta para "Selecione..."
    // quando a classe for alterada.

    campoSubclasse.currentValueIndices = 0;
}




atualizarListaArmaduras(this);