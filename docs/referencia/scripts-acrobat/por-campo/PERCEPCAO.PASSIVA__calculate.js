var campoPercepcao = this.getField("SAB.perc");
var campoMemoria = this.getField("AUTO.PASSIVA");

var textoPercepcao = campoPercepcao.valueAsString;


// Se Percep��o ainda estiver vazia,
// a Percep��o Passiva tamb�m fica vazia.
if (textoPercepcao == "") {

    event.value = "";

} else {

    // ==========================================
    // CALCULA O VALOR AUTOM�TICO
    // ==========================================

    var bonusPercepcao = Number(textoPercepcao);

    var valorAutomatico = 10 + bonusPercepcao;


    // ==========================================
    // DESCOBRE SE EXISTIA AJUSTE MANUAL
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
    // RESULTADO
    // ==========================================

    var resultado =
        valorAutomatico + ajusteManual;

    event.value = resultado;


    // Guarda o novo valor autom�tico.
    campoMemoria.value =
        valorAutomatico;
}