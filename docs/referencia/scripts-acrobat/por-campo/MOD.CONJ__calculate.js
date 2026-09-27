var atributo = this.getField("ATRIBUTO.conju").valueAsString;

if (atributo == "INTELIG�NCIA") {
    event.value = this.getField("INT.MOD").valueAsString;

} else if (atributo == "SABEDORIA") {
    event.value = this.getField("SAB.MOD").valueAsString;

} else if (atributo == "CARISMA") {
    event.value = this.getField("CAR.MOD").valueAsString;

} else {
    event.value = "";
}