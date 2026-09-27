var nomeValor = event.target.name.replace(".MOD", ".val");
var campo = this.getField(nomeValor);
var valor = campo.valueAsString;

if (valor == "") {
    event.value = "";
} else {
    valor = Number(valor);
    var modificador = Math.floor((valor - 10) / 2);

    if (modificador >= 0) {
        event.value = "+" + modificador;
    } else {
        event.value = modificador;
    }
}
