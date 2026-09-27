var antecedente = String(event.value).replace(/^\s+|\s+$/g, "");

var campoTalentos = this.getField("Talentos");
var campoAutoTalento = this.getField("AUTO.ANTECEDENTE");
var campoAutoPericias = this.getField("AUTO.PERICIAS.ANTECEDENTE");


// ======================================================
// TALENTO DE ORIGEM DE CADA ANTECEDENTE
// ======================================================

var talentos = {

    "Ac�lito":
        "Iniciado em Magia (Cl�rigo)2 truques e 1 magia de 1� n�vel",

    "Andarilho":
        "Sortudo: vantagem ou desvantagem = profici�ncia",

    "Artes�o":
        "Artifista",

    "Artista":
        "M�sico",

    "Charlat�o":
        "Habilidoso: 2 Per�cias",

    "Criminoso":
        "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",

    "Eremita":
        "Curandeiro: Rerrola os 1 em dados de cura | Pode usar o Kit de Cura para curar algu�m em 1 dado de vida da pessoa + sua profici�ncia",

    "Escriba":
        "Habilidoso: 2 Per�cias",

    "Fazendeiro":
        "Vigoroso: +2HP por n�vel",

    "Guarda":
        "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",

    "Guia":
        "Iniciado em Magia (Druida)2 truques e 1 magia de 1� n�vel",

    "Marinheiro":
        "Valent�o de Taverna",

    "Mercador":
        "Sortudo: vantagem ou desvantagem = profici�ncia",

    "Nobre":
        "Habilidoso: 2 Per�cias",

    "S�bio":
        "Iniciado em Magia (Mago): 2 truques e 1 magia de 1� n�vel",

    "Soldado":
        "Atacante Selvagem: Rerola 1 dado de dano p/ turno"

};


// ======================================================
// CHECKBOXES DAS PER�CIAS
// IMPORTANTE: CONFIRA OS NOMES COM OS SEUS CAMPOS
// ======================================================

var pericias = {

    "Ac�lito": [
        "O.SAB.int",
        "O.INT.rel"
    ],

    "Andarilho": [
        "O.DEX.fur",
        "O.SAB.int"
    ],

    "Artes�o": [
        "O.INT.inv",
        "O.CAR.pers"
    ],

    "Artista": [
        "O.DEX.acr",
        "O.CAR.atu"
    ],

    "Charlat�o": [
        "O.CAR.eng",
        "O.DEX.pre"
    ],

    "Criminoso": [
        "O.DEX.pre",
        "O.DEX.fur"
    ],

    "Eremita": [
        "O.SAB.med",
        "O.INT.rel"
    ],

    "Escriba": [
        "O.INT.inv",
        "O.SAB.perc"
    ],

    "Fazendeiro": [
        "O.SAB.lidar",
        "O.INT.nat"
    ],

    "Guarda": [
        "O.FOR.atl",
        "O.SAB.perc"
    ],

    "Guia": [
        "O.DEX.fur",
        "O.SAB.sob"
    ],

    "Marinheiro": [
        "O.DEX.acr",
        "O.SAB.perc"
    ],

    "Mercador": [
        "O.SAB.lidar",
        "O.CAR.pers"
    ],

    "Nobre": [
        "O.INT.hist",
        "O.CAR.pers"
    ],

    "S�bio": [
        "O.INT.arc",
        "O.INT.hist"
    ],

    "Soldado": [
        "O.FOR.atl",
        "O.CAR.inti"
    ]

};


// ======================================================
// ATUALIZA O TALENTO
// ======================================================

var talentoNovo = talentos[antecedente] || "";

var blocoNovo = "";

if (talentoNovo != "") {
    blocoNovo = "ANTECEDENTE: " + talentoNovo;
}

var blocoAntigo = campoAutoTalento.valueAsString;
var textoAtual = campoTalentos.valueAsString;


// Remove somente o talento que o antecedente anterior colocou.
if (blocoAntigo != "") {

    var posicao = textoAtual.indexOf(blocoAntigo);

    if (posicao != -1) {

        textoAtual =
            textoAtual.substring(0, posicao)
            + textoAtual.substring(posicao + blocoAntigo.length);

        // Limpa quebras extras.
        textoAtual =
            textoAtual.replace(/^\s+|\s+$/g, "");
    }
}


// Coloca o novo talento sem apagar o restante.
if (blocoNovo != "") {

    if (textoAtual != "") {
        campoTalentos.value =
            blocoNovo + "\n\n" + textoAtual;
    } else {
        campoTalentos.value =
            blocoNovo;
    }

} else {

    campoTalentos.value =
        textoAtual;
}


// Guarda o bloco autom�tico atual.
campoAutoTalento.value =
    blocoNovo;


// ======================================================
// ATUALIZA OS CHECKBOXES DAS PER�CIAS
// ======================================================

// Primeiro recupera as per�cias do antecedente anterior.
var anterioresTexto =
    campoAutoPericias.valueAsString;

var anteriores = [];

if (anterioresTexto != "") {
    anteriores =
        anterioresTexto.split("|");
}


// Desmarca somente as per�cias que o antecedente
// anterior havia marcado.
for (var i = 0; i < anteriores.length; i++) {

    var campoAnterior =
        this.getField(anteriores[i]);

    if (campoAnterior) {
        campoAnterior.checkThisBox(0, false);
    }
}


// Pega as per�cias do novo antecedente.
var novas =
    pericias[antecedente] || [];


// Marca as novas per�cias.
for (var j = 0; j < novas.length; j++) {

    var campoNovo =
        this.getField(novas[j]);

    if (campoNovo) {
        campoNovo.checkThisBox(0, true);
    }
}


// Guarda quais per�cias foram marcadas
// pelo antecedente atual.
campoAutoPericias.value =
    novas.join("|");