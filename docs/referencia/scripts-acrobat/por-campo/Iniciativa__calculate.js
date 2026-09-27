var campoDestreza = this.getField("DEX.MOD");
var campoMemoria = this.getField("AUTO.INICIATIVA");

var textoDestreza = campoDestreza.valueAsString;


// Se o modificador de Destreza estiver vazio,
// a iniciativa tamb�m fica vazia.
if (textoDestreza == "") {

    event.value = "";

} else {

    // ==========================================
    // VALOR AUTOM�TICO
    // ==========================================

    var valorAutomatico = Number(textoDestreza);


    // ==========================================
    // VERIFICA SE EXISTE AJUSTE MANUAL
    // ==========================================

    var automaticoAnterior =
        campoMemoria.valueAsString;

    var valorAtualTexto =
        event.target.valueAsString;

    var ajusteManual = 0;


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


    // ==========================================
    // RESULTADO FINAL
    // ==========================================

    var resultado =
        valorAutomatico + ajusteManual;


    // Mostra o sinal + nos valores positivos.
    if (resultado >= 0) {

        event.value =
            "+" + resultado;

    } else {

        event.value =
            resultado;
    }


    // ==========================================
    // GUARDA O NOVO VALOR AUTOM�TICO
    // ==========================================

    campoMemoria.value =
        valorAutomatico;
}