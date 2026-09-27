var nomePericia = event.target.name;

// Exemplo:
// SAB.lidar -> SAB
var partes = nomePericia.split(".");
var atributo = partes[0];

// Campos relacionados automaticamente.
var campoMod = this.getField(atributo + ".MOD");
var campoProf = this.getField("PROFICIENCIA");
var campoCheckbox = this.getField("O." + nomePericia);
var campoMemoria = this.getField("AUTO.PERICIAS");


// ======================================================
// L� OS VALORES B�SICOS
// ======================================================

var textoMod = campoMod ? campoMod.valueAsString : "";
var textoProf = campoProf ? campoProf.valueAsString : "";


// Se ainda n�o existe modificador de atributo,
// n�o h� valor de per�cia para calcular.
if (textoMod == "") {

    event.value = "";

} else {

    var modificador = Number(textoMod);

    var proficiencia = 0;

    if (textoProf != "") {
        proficiencia = Number(textoProf);
    }


    // ==================================================
    // DESCOBRE SE A PER�CIA TEM PROFICI�NCIA
    // ==================================================

    var possuiProficiencia = false;

    if (campoCheckbox) {
        possuiProficiencia =
            campoCheckbox.isBoxChecked(0);
    }


    // ==================================================
    // VALOR AUTOM�TICO ATUAL
    // ==================================================

    var valorAutomatico = modificador;

    if (possuiProficiencia) {
        valorAutomatico += proficiencia;
    }


    // ==================================================
    // RECUPERA OS VALORES AUTOM�TICOS ANTERIORES
    // ==================================================

    var memoria = {};

    var textoMemoria =
        campoMemoria ? campoMemoria.valueAsString : "";

    if (textoMemoria != "") {

        var registros = textoMemoria.split(";");

        for (var i = 0; i < registros.length; i++) {

            var pos = registros[i].indexOf("=");

            if (pos != -1) {

                var nome =
                    registros[i].substring(0, pos);

                var valor =
                    Number(registros[i].substring(pos + 1));

                if (!isNaN(valor)) {
                    memoria[nome] = valor;
                }
            }
        }
    }


    // ==================================================
    // DESCOBRE SE O JOGADOR FEZ UM AJUSTE MANUAL
    // ==================================================

    var ajusteManual = 0;

    var valorAtualTexto =
        event.target.valueAsString;

    if (
        typeof memoria[nomePericia] != "undefined" &&
        valorAtualTexto != ""
    ) {

        var valorAtual =
            Number(valorAtualTexto);

        if (!isNaN(valorAtual)) {

            ajusteManual =
                valorAtual - memoria[nomePericia];
        }
    }


    // ==================================================
    // RESULTADO FINAL
    // ==================================================

    var resultado =
        valorAutomatico + ajusteManual;

    if (resultado >= 0) {
        event.value = "+" + resultado;
    } else {
        event.value = resultado;
    }


    // ==================================================
    // ATUALIZA A MEM�RIA
    // ==================================================

    memoria[nomePericia] =
        valorAutomatico;

    var novaMemoria = [];

    for (var chave in memoria) {

        novaMemoria.push(
            chave + "=" + memoria[chave]
        );
    }

    if (campoMemoria) {
        campoMemoria.value =
            novaMemoria.join(";");
    }
}