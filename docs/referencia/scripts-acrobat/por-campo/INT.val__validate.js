javascript
if (event.value != "") {
    var valor = Number(event.value);

    if (isNaN(valor) || valor < 1 || valor > 30 || valor != Math.floor(valor)) {
        app.alert("Digite um número inteiro de 1 a 30.");
        event.rc = false;
    }
}