/* =========================================================
   DROPDOWN SUBCLASSE DEPENDENTE DE CLASSE

   D&D 2024
   + Art�fice
   + Ravenloft: The Horrors Within
   + Arcana Unleashed

   SEM Forgotten Realms

   NOME CURTO = aparece no dropdown
   NOME COMPLETO = valor interno/exporta��o
   ========================================================= */


function atualizarSubclasses(doc, classeSelecionada) {

    var campo = doc.getField("SUBCLASSE");

    if (!campo) {
        return;
    }


    /* =====================================================
       CONFIGURA��O DO CAMPO
       ===================================================== */

    campo.editable = false;
    campo.commitOnSelChange = true;


    var classe = String(classeSelecionada || "");
    classe = classe.replace(/^\s+|\s+$/g, "");


    /* =====================================================
       ACEITA NOMES EM INGL�S TAMB�M
       ===================================================== */

    var aliases = {

        "Artificer": "Art�fice",
        "Barbarian": "B�rbaro",
        "Bard": "Bardo",
        "Warlock": "Bruxo",
        "Cleric": "Cl�rigo",
        "Druid": "Druida",
        "Sorcerer": "Feiticeiro",
        "Fighter": "Guerreiro",
        "Rogue": "Ladino",
        "Wizard": "Mago",
        "Monk": "Monge",
        "Paladin": "Paladino",
        "Ranger": "Patrulheiro"

    };


    if (aliases[classe]) {
        classe = aliases[classe];
    }


    /* =====================================================
       SUBCLASSES

       FORMATO:

       ["NOME CURTO", "NOME COMPLETO"]

       O primeiro aparece visualmente.
       O segundo � o valor usado pelos scripts.
       ===================================================== */

    var subclasses = {


        /* =================================================
           ART�FICE
           ================================================= */

        "Art�fice": [

            ["Alquimista", "Alquimista"],

            ["Armeiro", "Armeiro"],

            ["Artilheiro", "Artilheiro"],

            ["Ferreiro", "Ferreiro de Batalha"],

            ["Cart�grafo", "Cart�grafo"],

            ["Reanimador", "Reanimador"]

        ],


        /* =================================================
           B�RBARO
           Remove "Trilha do..."
           ================================================= */

        "B�rbaro": [

            ["Berserker", "Trilha do Berserker"],

            ["Cora��o Selvagem",
             "Trilha do Cora��o Selvagem"],

            ["�rvore do Mundo",
             "Trilha da �rvore do Mundo"],

            ["Zelote", "Trilha do Zelote"]

        ],


        /* =================================================
           BARDO
           Remove "Col�gio..."
           ================================================= */

        "Bardo": [

            ["Dan�a", "Col�gio da Dan�a"],

            ["Glamour", "Col�gio do Glamour"],

            ["Conhecimento",
             "Col�gio do Conhecimento"],

            ["Bravura", "Col�gio da Bravura"],

            ["Esp�ritos",
             "Col�gio dos Esp�ritos"]

        ],


        /* =================================================
           BRUXO
           Remove "Patrono..."
           ================================================= */

        "Bruxo": [

            ["Arquifada",
             "Patrono Arquifada"],

            ["Celestial",
             "Patrono Celestial"],

            ["Corruptor",
             "Patrono Corruptor"],

            ["Grande Antigo",
             "Patrono do Grande Antigo"],

            ["Morto-Vivo",
             "Patrono Morto-Vivo"],

            ["Vest�gio",
             "Patrono do Vest�gio"]

        ],


        /* =================================================
           CL�RIGO
           Remove "Dom�nio..."
           ================================================= */

        "Cl�rigo": [

            ["da Vida",
             "Dom�nio da Vida"],

            ["da Luz",
             "Dom�nio da Luz"],

            ["da Trapa�a",
             "Dom�nio da Trapa�a"],

            ["da Guerra",
             "Dom�nio da Guerra"],

            ["da Sepultura",
             "Dom�nio da Sepultura"],

            ["Arcano",
             "Dom�nio Arcano"]

        ],


        /* =================================================
           DRUIDA
           Remove "C�rculo..."
           ================================================= */

        "Druida": [

            ["da Terra",
             "C�rculo da Terra"],

            ["da Lua",
             "C�rculo da Lua"],

            ["do Mar",
             "C�rculo do Mar"],

            ["das Estrelas",
             "C�rculo das Estrelas"]

        ],


        /* =================================================
           FEITICEIRO
           Remove "Feiti�aria..."
           ================================================= */

        "Feiticeiro": [

            ["Aberrante",
             "Feiti�aria Aberrante"],

            ["Mec�nica",
             "Feiti�aria Mec�nica"],

            ["Drac�nica",
             "Feiti�aria Drac�nica"],

            ["Magia Selvagem",
             "Feiti�aria Selvagem"],

            ["Sombras",
             "Feiti�aria das Sombras"]

        ],


        /* =================================================
           GUERREIRO
           ================================================= */

        "Guerreiro": [

            ["Mestre da Batalha",
             "Mestre da Batalha"],

            ["Campe�o",
             "Campe�o"],

            /*
               N�O encurtei o valor interno.
               Seu script de espa�os de magia
               reconhece "Cavaleiro M�stico".
            */

            ["Cavaleiro M�stico",
             "Cavaleiro M�stico"],

            ["Psi�nico",
             "Guerreiro Psi�nico"],

            ["Arqueiro Arcano",
             "Arqueiro Arcano"]

        ],


        /* =================================================
           LADINO
           ================================================= */

        "Ladino": [

            /*
               Visualmente fica "Arcano",
               mas internamente continua
               "Trapaceiro Arcano".

               Isso mant�m seu c�lculo
               de espa�os de magia funcionando.
            */

            ["Arcano",
             "Trapaceiro Arcano"],

            ["Assassino",
             "Assassino"],

            ["L�mina Ps�quica",
             "L�mina Ps�quica"],

            ["Ladr�o",
             "Ladr�o"],

            ["Fantasma",
             "Fantasma"]

        ],


        /* =================================================
           MAGO

           Os pr�prios nomes j� s�o curtos.
           ================================================= */

        "Mago": [

            ["Abjurador",
             "Abjurador"],

            ["Adivinho",
             "Adivinho"],

            ["Evocador",
             "Evocador"],

            ["Ilusionista",
             "Ilusionista"],

            ["Conjurador",
             "Conjurador"],

            ["Encantador",
             "Encantador"],

            ["Necromante",
             "Necromante"],

            ["Transmutador",
             "Transmutador"]

        ],


        /* =================================================
           MONGE
           Remove "Guerreiro..."
           ================================================= */

        "Monge": [

            ["da Miseric�rdia",
             "Guerreiro da Miseric�rdia"],

            ["das Sombras",
             "Guerreiro das Sombras"],

            ["dos Elementos",
             "Guerreiro dos Elementos"],

            ["da M�o Aberta",
             "Guerreiro da M�o Aberta"],

            ["das Artes M�sticas",
             "Guerreiro das Artes M�sticas"]

        ],


        /* =================================================
           PALADINO
           Remove "Juramento..."
           ================================================= */

        "Paladino": [

            ["da Devo��o",
             "Juramento da Devo��o"],

            ["da Gl�ria",
             "Juramento da Gl�ria"],

            ["dos Anci�es",
             "Juramento dos Anci�es"],

            ["da Vingan�a",
             "Juramento da Vingan�a"]

        ],


        /* =================================================
           PATRULHEIRO

           Aqui mantive quase todos os nomes,
           porque n�o possuem um prefixo comum
           desnecess�rio.
           ================================================= */

        "Patrulheiro": [

            ["Senhor das Feras",
             "Senhor das Feras"],

            ["Andarilho Fe�rico",
             "Andarilho Fe�rico"],

            ["das Sombras",
             "Perseguidor das Sombras"],

            ["Ca�ador",
             "Ca�ador"],

            ["Guardi�o Oco",
             "Guardi�o Oco"]

        ]

    };


    /* =====================================================
       GUARDA O VALOR INTERNO ATUAL

       Como usamos valores de exporta��o,
       aqui recebemos o nome COMPLETO.
       ===================================================== */

    var subclasseAnterior = campo.valueAsString;


    /* =====================================================
       PEGA A LISTA DA CLASSE
       ===================================================== */

    var lista = subclasses[classe];

    if (!lista) {
        lista = [];
    }


    /* =====================================================
       MONTA OS ITENS

       "Selecione..." ter� valor interno vazio.
       ===================================================== */

    var itens = [

        ["Selecione...", ""]

    ];


    for (var i = 0; i < lista.length; i++) {

        itens.push(lista[i]);

    }


    /* =====================================================
       ATUALIZA O DROPDOWN
       ===================================================== */

    campo.setItems(itens);


    /* =====================================================
       TENTA MANTER A SUBCLASSE ANTERIOR

       Comparamos pelo VALOR DE EXPORTA��O,
       n�o pelo nome curto.
       ===================================================== */

    var encontrou = false;


    if (subclasseAnterior != "") {

        for (var j = 1; j < campo.numItems; j++) {

            var valorInterno =
                campo.getItemAt(j, true);

            if (valorInterno == subclasseAnterior) {

                campo.currentValueIndices = j;

                encontrou = true;

                break;
            }

        }

    }


    /* =====================================================
       SE TROCOU DE CLASSE E A SUBCLASSE N�O EXISTE MAIS
       ===================================================== */

    if (!encontrou) {

        campo.currentValueIndices = 0;

    }

}


/* =========================================================
   AO ABRIR O PDF
   ========================================================= */

try {

    var campoClasseInicial =
        this.getField("CLASSE");


    if (campoClasseInicial) {

        atualizarSubclasses(

            this,

            campoClasseInicial.valueAsString

        );

    }

} catch (erro) {

}