var nivelCampo = this.getField("N�vel");
var nivel = Number(nivelCampo.valueAsString);

if (nivelCampo.valueAsString == "" || isNaN(nivel)) {

    event.value = "";

} else if (nivel >= 1 && nivel <= 4) {

    event.value = "+2";

} else if (nivel >= 5 && nivel <= 8) {

    event.value = "+3";

} else if (nivel >= 9 && nivel <= 12) {

    event.value = "+4";

} else if (nivel >= 13 && nivel <= 16) {

    event.value = "+5";

} else if (nivel >= 17 && nivel <= 20) {

    event.value = "+6";

} else {

    event.value = "";
}