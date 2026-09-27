function atualizarListaArmaduras(doc) {

    var campoArmadura = doc.getField("ARMADURA.ATUAL");

    var profLeve = doc.getField("PROF.leve");
    var profMedia = doc.getField("PROF.med");
    var profPesada = doc.getField("PROF.pesa");

    if (!campoArmadura) {
        return;
    }


    // Guarda a armadura que estava selecionada
    // antes de reconstruir a lista.

    var armaduraAnterior =
        campoArmadura.valueAsString;


    // ==========================================
    // VERIFICA AS PROFICI�NCIAS
    // ==========================================

    var temLeve =
        profLeve && profLeve.isBoxChecked(0);

    var temMedia =
        profMedia && profMedia.isBoxChecked(0);

    var temPesada =
        profPesada && profPesada.isBoxChecked(0);


    // ==========================================
    // MONTA A NOVA LISTA
    // ==========================================

    var opcoes = [];


    // Sem Armadura fica sempre dispon�vel.

    opcoes.push([
        "Sem Armadura = 10 + DEX",
        "Sem Armadura"
    ]);


    // ==========================================
    // ARMADURAS LEVES
    // ==========================================

    if (temLeve) {

        opcoes.push([
            "Acolchoada = 11 + DEX",
            "Acolchoada"
        ]);

        opcoes.push([
            "Couro = 11 + DEX",
            "Couro"
        ]);

        opcoes.push([
            "Couro Batido = 12 + DEX",
            "Couro Batido"
        ]);
    }


    // ==========================================
    // ARMADURAS M�DIAS
    // ==========================================

    if (temMedia) {

        opcoes.push([
            "Gib�o de Peles = 12 + DEX (2)",
            "Gib�o de Peles"
        ]);

        opcoes.push([
            "Camisa de Malha = 13 + DEX (2)",
            "Camisa de Malha"
        ]);

        opcoes.push([
            "Brunea = 14 + DEX (2)",
            "Brunea"
        ]);

        opcoes.push([
            "Peitoral = 14 + DEX (2)",
            "Peitoral"
        ]);

        opcoes.push([
            "Meia-Armadura = 15 + DEX (2)",
            "Meia-Armadura"
        ]);
    }


    // ==========================================
    // ARMADURAS PESADAS
    // ==========================================

    if (temPesada) {

        opcoes.push([
            "Cota de an�is = 14",
            "Cota de an�is"
        ]);

        opcoes.push([
            "Cota de malha = 16",
            "Cota de malha"
        ]);

        opcoes.push([
            "Cota de talas = 17",
            "Cota de talas"
        ]);

        opcoes.push([
            "Placas = 18",
            "Placas"
        ]);
    }


    // ==========================================
    // APAGA A LISTA ANTIGA
    // ==========================================

    campoArmadura.clearItems();


    // ==========================================
    // COLOCA A NOVA LISTA
    // ==========================================

    for (var i = 0; i < opcoes.length; i++) {

        campoArmadura.insertItemAt(
            opcoes[i][0],
            opcoes[i][1],
            i
        );
    }


    // ==========================================
    // TENTA MANTER A ARMADURA ATUAL
    // ==========================================

    var armaduraAindaPermitida = false;

    for (var j = 0; j < opcoes.length; j++) {

        if (opcoes[j][1] == armaduraAnterior) {

            armaduraAindaPermitida = true;
            break;
        }
    }


    if (armaduraAindaPermitida) {

        campoArmadura.value =
            armaduraAnterior;

    } else {

        campoArmadura.value =
            "Sem Armadura";
    }


    // Recalcula a ficha, inclusive a CA.

    doc.calculateNow();
}


// Executa uma vez quando o PDF � aberto.

atualizarListaArmaduras(this);