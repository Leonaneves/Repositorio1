var especie = event.value;

var campoHabilidades = this.getField("HABILIDADES.ESPECIE");
var campoAutomatico = this.getField("AUTO.ESPECIE");


// =====================================
// HABILIDADES AUTOM�TICAS DAS ESP�CIES
// =====================================

var habilidades = {

    "Humano":
        "Ganha 1 Inspira��o Her�ica quando terminar um Descanso Longo",

    "Elfo":
        "# VIS�O NO ESCURO 18m\n"
        + "# Ancestralidade Fey:\n"
        + "Vantagem contra condi��o Encantado\n"
        + "# TRANSE:\n"
        + "Descanso Longo = 4h\n"
        + "Voc� n�o dorme, nem por meios m�gicos\n"
        + "# LINHAGEM �LFICA:\n",

    "An�o":
        "# VIS�O NO ESCURO 36m\n"
        + "# RESILI�NCIA AN�NICA\n"
        + "Resist�ncia a dano de veneno\n"
        + "Vantagem contra a condi��o Envenenado\n"
        + "# ROBUSTEZ AN�NICA\n"
        + "+1 HP por n�vel\n"
        + "# CORTADOR DE PEDRAS\n"
        + "A��O B�NUS: ganha 9m de Tremorsense por 10 minutos\n"
        + "S� � us�vel em superf�cies de pedra\n"
        + "Usos = Profici�ncia. Recupera em Descanso Longo",

    "Halfling":
        "# CORAJOSO\n"
        + "Vantagem contra condi��o Amedrontado\n"
        + "# SORTE\n"
        + "Rerrola os 1 do d20\n"
        + "# FURTIVIDADE NATURAL\n"
        + "Pode usar a a��o Esconder-se quando obstru�do por uma criatura m�dia ou maior",

    "Draconato":
        "# VIS�O NO ESCURO 18m\n"
        + "# RESIST�NCIA A DANO _________\n"
        + "# ARMA DE SOPRO\n"
        + "Pode trocar um de seus ataques por um sopro. Linha de 9m ou Cone de 4,5m.\n"
        + "Salvaguarda de CON CD___ para 1/2 do dano\n"
        + "Dano = ___d10. Usos=Prof. Recupera em DL\n"
        + "# V�O DRAC�NICO (n�vel 5)\n"
        + "A��O B�NUS: v�o = deslocamento por 10 minutos\n"
        + "1 uso por Descanso Longo",

    "Tiefling":
        "# VIS�O NO ESCURO 18m\n"
        + "# TAUMATURGIA TRUQUE",

    "Gnomo":
        "# VIS�O NO ESCURO 18m\n"
        + "# AST�CIA GN�MICA\n"
        + "- Vantagem em Salvaguardas de INT, CAR e SAB\n"
        + "# LINHAGEM GN�MICA:",

    "Golias":
        "# FORMA GRANDE (nvl 5)\n"
        + "- Dura 10min | A��o B�nus | 1 p/ DL\n"
        + "- Tamanho = Grande: Vantagem em Testes de For�a e +3m de desl.\n"
        + "# ANCESTRALIDADE DE GIGANTE:",

    "Aasimar":
        "# VIS�O NO ESCURO 18m\n"
        + "# RESIST�NCIA CELESTIAL: � dano Necr�tico e Radiante\n"
        + "# M�OS CURATIVAS: 3d4 (1 p/ DL)\n"
        + "# TRUQUE LUZ\n"
        + "# REVELA��O CELESTIAL:\n"
        + "- Dura 1min | A��o B�nus | 1 p/ DL\n"
        + "> Asas Celestiais:+3 dano Radiante\n"
        + "Pode voar\n"
        + "> Manto Necr�tico: +3 dano Nec\n"
        + "a 3m de vc faz Salvaguarda de CAR CD___ ou fica Amedrontado\n"
        + "> Radiancia Interna: +3 rad\n"
        + "todos a 3m sofrem 3 dano radiante",

    "Orc":
        "# VIS�O NO ESCURO 36m\n"
        + "# SURTO DE ADRENALINA:\n"
        + "- A��o B�nus | Usos = prof. | Recupera ao Descansar\n"
        + "Disparada como a��o B�nus e ganha temp. HP = profici�ncia\n"
        + "# RESIST�NCIA INCANS�VEL:\n"
        + "Quando cair para 0HP, fique com 1HP no lugar\n"
        + "1 uso por Descanso Longo"
};


// =====================================
// N�O PRECISA ALTERAR DAQUI PARA BAIXO
// =====================================

var novoAutomatico = habilidades[especie] || "";

var automaticoAnterior = campoAutomatico.valueAsString;
var textoAtual = campoHabilidades.valueAsString;

var separador = "\n";

var textoUsuario = textoAtual;


// Se j� existia um texto autom�tico,
// remove somente essa parte.
if (
    automaticoAnterior != "" &&
    textoAtual.indexOf(automaticoAnterior) == 0
) {

    textoUsuario =
        textoAtual.substring(automaticoAnterior.length);

    // Remove o separador antigo.
    if (textoUsuario.indexOf(separador) == 0) {
        textoUsuario =
            textoUsuario.substring(separador.length);
    }
}


// Monta novamente o campo.
if (textoUsuario != "") {

    campoHabilidades.value =
        novoAutomatico
        + separador
        + textoUsuario;

} else {

    campoHabilidades.value =
        novoAutomatico;
}


// Guarda o novo texto autom�tico
// para a pr�xima troca de esp�cie.
campoAutomatico.value =
    novoAutomatico;


// ======================================================
// TAMANHO POR ESP�CIE
// ======================================================

var especieTamanho = String(event.value).replace(/^\s+|\s+$/g, "");

var campoTamanho = this.getField("Tamanho");

var tamanhoEspecie = {

    "Humano": "M�dio",

    "Elfo": "M�dio",

    "An�o": "M�dio",

    "Halfling": "Pequeno",

    "Draconato": "M�dio",

    "Tiefling": "M�dio",

    "Gnomo": "Pequeno",

    "Golias": "M�dio",

    "Aasimar": "M�dio",

    "Orc": "M�dio"

};

campoTamanho.value = tamanhoEspecie[especieTamanho] || "";

