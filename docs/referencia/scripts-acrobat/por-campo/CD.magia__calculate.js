var atributo = this.getField("ATRIBUTO.conju").valueAsString;
var prof = this.getField("PROFICIENCIA").valueAsString;

if (atributo == "" || prof == "") {

    event.value = "";

} else {

    var modificador = 0;

    if (atributo == "INTELIG�NCIA") {
        modificador = Number(this.getField("INT.MOD").valueAsString);

    } else if (atributo == "SABEDORIA") {
        modificador = Number(this.getField("SAB.MOD").valueAsString);

    } else if (atributo == "CARISMA") {
        modificador = Number(this.getField("CAR.MOD").valueAsString);

    } else {
        event.value = "";
    }

    if (
        atributo == "INTELIG�NCIA" ||
        atributo == "SABEDORIA" ||
        atributo == "CARISMA"
    ) {
        event.value = 8 + modificador + Number(prof);
    }
}