if (event.value != "") {

    var nivel = Number(event.value);

    if (
        isNaN(nivel) ||
        nivel < 1 ||
        nivel > 20 ||
        nivel != Math.floor(nivel)
    ) {

        app.alert("Digite um n�vel inteiro de 1 a 20.");
        event.rc = false;
    }
}