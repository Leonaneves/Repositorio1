var campoClasse = this.getField("CLASSE");
var campoNivel = this.getField("N�vel");
var campoSubclasse = this.getField("SUBCLASSE");

var classe = "";
var subclasse = "";
var nivelTexto = "";

if (campoClasse) {
    classe = String(campoClasse.valueAsString)
        .replace(/^\s+|\s+$/g, "");
}

if (campoSubclasse) {
    subclasse = String(campoSubclasse.valueAsString)
        .replace(/^\s+|\s+$/g, "");
}

if (campoNivel) {
    nivelTexto = campoNivel.valueAsString;
}

var nivel = Number(nivelTexto);


// ======================================================
// DESCOBRE QUAL C�RCULO ESTE CAMPO REPRESENTA
//
// Esp.mag.1 -> 1
// Esp.mag.5 -> 5
// Esp.mag.9 -> 9
// ======================================================

var partesNome = event.target.name.split(".");
var circulo = Number(partesNome[partesNome.length - 1]);


// ======================================================
// TABELA DE CONJURADOR COMPLETO
//
// Cada linha corresponde ao n�vel do personagem.
// As nove posi��es representam os c�rculos 1 a 9.
// ======================================================

var tabelaCompleta = [

    // n�vel 0
    [0, 0, 0, 0, 0, 0, 0, 0, 0],

    // n�vel 1
    [2, 0, 0, 0, 0, 0, 0, 0, 0],

    // n�vel 2
    [3, 0, 0, 0, 0, 0, 0, 0, 0],

    // n�vel 3
    [4, 2, 0, 0, 0, 0, 0, 0, 0],

    // n�vel 4
    [4, 3, 0, 0, 0, 0, 0, 0, 0],

    // n�vel 5
    [4, 3, 2, 0, 0, 0, 0, 0, 0],

    // n�vel 6
    [4, 3, 3, 0, 0, 0, 0, 0, 0],

    // n�vel 7
    [4, 3, 3, 1, 0, 0, 0, 0, 0],

    // n�vel 8
    [4, 3, 3, 2, 0, 0, 0, 0, 0],

    // n�vel 9
    [4, 3, 3, 3, 1, 0, 0, 0, 0],

    // n�vel 10
    [4, 3, 3, 3, 2, 0, 0, 0, 0],

    // n�vel 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0],

    // n�vel 12
    [4, 3, 3, 3, 2, 1, 0, 0, 0],

    // n�vel 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0],

    // n�vel 14
    [4, 3, 3, 3, 2, 1, 1, 0, 0],

    // n�vel 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0],

    // n�vel 16
    [4, 3, 3, 3, 2, 1, 1, 1, 0],

    // n�vel 17
    [4, 3, 3, 3, 2, 1, 1, 1, 1],

    // n�vel 18
    [4, 3, 3, 3, 3, 1, 1, 1, 1],

    // n�vel 19
    [4, 3, 3, 3, 3, 2, 1, 1, 1],

    // n�vel 20
    [4, 3, 3, 3, 3, 2, 2, 1, 1]
];


// ======================================================
// COME�A SEM ESPA�OS
// ======================================================

var slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];


// ======================================================
// S� CALCULA SE O N�VEL FOR V�LIDO
// ======================================================

if (
    nivelTexto == "" ||
    isNaN(nivel) ||
    nivel < 1 ||
    nivel > 20
) {

    event.value = "";

} else {


    // ==================================================
    // CONJURADORES COMPLETOS
    // ==================================================

    if (
        classe == "Bardo" ||
        classe == "Cl�rigo" ||
        classe == "Druida" ||
        classe == "Feiticeiro" ||
        classe == "Mago"
    ) {

        slots = tabelaCompleta[nivel].slice(0);


    // ==================================================
    // MEIO CONJURADORES
    //
    // Paladino
    // Patrulheiro
    // Art�fice
    // ==================================================

    } else if (
        classe == "Paladino" ||
        classe == "Patrulheiro" ||
        classe == "Art�fice"
    ) {

        var nivelConjurador =
            Math.ceil(nivel / 2);

        slots =
            tabelaCompleta[nivelConjurador].slice(0);


    // ==================================================
    // GUERREIRO: CAVALEIRO M�STICO
    // ==================================================

    } else if (
        classe == "Guerreiro" &&
        (
            subclasse == "Cavaleiro M�stico" ||
            subclasse == "Cavaleiro Arcano" ||
            subclasse == "Eldritch Knight"
        ) &&
        nivel >= 3
    ) {

        var nivelCavaleiro =
            Math.ceil(nivel / 3);

        slots =
            tabelaCompleta[nivelCavaleiro].slice(0);


    // ==================================================
    // LADINO: TRAPACEIRO ARCANO
    // ==================================================

    } else if (
        classe == "Ladino" &&
        (
            subclasse == "Trapaceiro Arcano" ||
            subclasse == "Arcane Trickster"
        ) &&
        nivel >= 3
    ) {

        var nivelTrapaceiro =
            Math.ceil(nivel / 3);

        slots =
            tabelaCompleta[nivelTrapaceiro].slice(0);


    // ==================================================
    // BRUXO: MAGIA DE PACTO
    //
    // Todos os espa�os ficam concentrados
    // no c�rculo atual da Magia de Pacto.
    // ==================================================

    } else if (classe == "Bruxo") {

        var nivelEspacoPacto = 0;
        var quantidadePacto = 0;


        if (nivel == 1) {

            nivelEspacoPacto = 1;
            quantidadePacto = 1;

        } else if (nivel == 2) {

            nivelEspacoPacto = 1;
            quantidadePacto = 2;

        } else if (nivel >= 3 && nivel <= 4) {

            nivelEspacoPacto = 2;
            quantidadePacto = 2;

        } else if (nivel >= 5 && nivel <= 6) {

            nivelEspacoPacto = 3;
            quantidadePacto = 2;

        } else if (nivel >= 7 && nivel <= 8) {

            nivelEspacoPacto = 4;
            quantidadePacto = 2;

        } else if (nivel >= 9 && nivel <= 10) {

            nivelEspacoPacto = 5;
            quantidadePacto = 2;

        } else if (nivel >= 11 && nivel <= 16) {

            nivelEspacoPacto = 5;
            quantidadePacto = 3;

        } else if (nivel >= 17 && nivel <= 20) {

            nivelEspacoPacto = 5;
            quantidadePacto = 4;
        }


        if (nivelEspacoPacto > 0) {

            slots[nivelEspacoPacto - 1] =
                quantidadePacto;
        }
    }


    // ==================================================
    // COLOCA O VALOR DESTE C�RCULO
    // ==================================================

    var valor = slots[circulo - 1];

    if (valor && valor > 0) {

        event.value = valor;

    } else {

        event.value = "";
    }
}