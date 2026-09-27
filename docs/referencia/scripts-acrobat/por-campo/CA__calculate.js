var campoArmadura = this.getField("ARMADURA.ATUAL");
var campoClasse = this.getField("CLASSE");

var campoDex = this.getField("DEX.MOD");
var campoCon = this.getField("CON.MOD");
var campoSab = this.getField("SAB.MOD");

var campoEscudo = this.getField("Escudo");
var campoMemoria = this.getField("AUTO.CA");


// ======================================================
// L� OS VALORES
// ======================================================

var armadura = campoArmadura.valueAsString;
var classe = campoClasse.valueAsString;

var dex = Number(campoDex.valueAsString);
var con = Number(campoCon.valueAsString);
var sab = Number(campoSab.valueAsString);


// Se algum modificador estiver vazio,
// Number pode ser tratado como 0.
if (isNaN(dex)) {
    dex = 0;
}

if (isNaN(con)) {
    con = 0;
}

if (isNaN(sab)) {
    sab = 0;
}


// ======================================================
// VERIFICA ESCUDO
// ======================================================

var usandoEscudo = false;

if (campoEscudo) {
    usandoEscudo = campoEscudo.isBoxChecked(0);
}


// ======================================================
// CALCULA A CA AUTOM�TICA
// ======================================================

var caAutomatica = 0;


// ======================================================
// SEM ARMADURA
// ======================================================

if (armadura == "Sem Armadura") {

    // --------------------------------------------------
    // B�RBARO
    // 10 + DEX + CON
    // Pode usar Escudo.
    // --------------------------------------------------

    if (classe == "B�rbaro") {

        caAutomatica =
            10 + dex + con;

        if (usandoEscudo) {
            caAutomatica += 2;
        }


    // --------------------------------------------------
    // MONGE
    // 10 + DEX + SAB
    // Apenas se N�O estiver usando Escudo.
    // --------------------------------------------------

    } else if (
        classe == "Monge" &&
        !usandoEscudo
    ) {

        caAutomatica =
            10 + dex + sab;


    // --------------------------------------------------
    // MONGE COM ESCUDO
    //
    // Perde a Defesa sem Armadura do Monge.
    // Usa a CA normal sem armadura:
    // 10 + DEX + 2 do Escudo
    // --------------------------------------------------

    } else if (
        classe == "Monge" &&
        usandoEscudo
    ) {

        caAutomatica =
            10 + dex + 2;


    // --------------------------------------------------
    // OUTRAS CLASSES SEM ARMADURA
    // 10 + DEX
    // --------------------------------------------------

    } else {

        caAutomatica =
            10 + dex;

        if (usandoEscudo) {
            caAutomatica += 2;
        }
    }


// ======================================================
// ARMADURAS LEVES
// ======================================================

} else if (armadura == "Acolchoada") {

    caAutomatica = 11 + dex;

} else if (armadura == "Couro") {

    caAutomatica = 11 + dex;

} else if (armadura == "Couro Batido") {

    caAutomatica = 12 + dex;


// ======================================================
// ARMADURAS M�DIAS
// M�ximo de +2 de DEX
// ======================================================

} else if (armadura == "Gib�o de Peles") {

    caAutomatica =
        12 + Math.min(dex, 2);

} else if (armadura == "Camisa de Malha") {

    caAutomatica =
        13 + Math.min(dex, 2);

} else if (armadura == "Brunea") {

    caAutomatica =
        14 + Math.min(dex, 2);

} else if (armadura == "Peitoral") {

    caAutomatica =
        14 + Math.min(dex, 2);

} else if (armadura == "Meia-Armadura") {

    caAutomatica =
        15 + Math.min(dex, 2);


// ======================================================
// ARMADURAS PESADAS
// ======================================================

} else if (armadura == "Cota de an�is") {

    caAutomatica = 14;

} else if (armadura == "Cota de malha") {

    caAutomatica = 16;

} else if (armadura == "Cota de talas") {

    caAutomatica = 17;

} else if (armadura == "Placas") {

    caAutomatica = 18;
}


// ======================================================
// ESCUDO COM ARMADURA
// ======================================================

if (
    armadura != "Sem Armadura" &&
    armadura != "" &&
    usandoEscudo
) {

    caAutomatica += 2;
}


// ======================================================
// PRESERVA ALTERA��ES MANUAIS
// ======================================================

if (armadura == "") {

    event.value = "";
    campoMemoria.value = "";

} else {

    var automaticoAnterior =
        campoMemoria.valueAsString;

    var valorAtualTexto =
        event.target.valueAsString;

    var ajusteManual = 0;


    // Se j� havia um valor autom�tico anterior,
    // compara com o valor que est� atualmente no campo.

    if (
        automaticoAnterior != "" &&
        valorAtualTexto != ""
    ) {

        var valorAnterior =
            Number(automaticoAnterior);

        var valorAtual =
            Number(valorAtualTexto);

        if (
            !isNaN(valorAnterior) &&
            !isNaN(valorAtual)
        ) {

            ajusteManual =
                valorAtual - valorAnterior;
        }
    }


    // ==================================================
    // RESULTADO FINAL
    // ==================================================

    event.value =
        caAutomatica + ajusteManual;


    // Guarda somente o valor autom�tico,
    // sem o ajuste manual.
    campoMemoria.value =
        caAutomatica;
}