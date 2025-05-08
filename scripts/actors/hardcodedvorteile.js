//TODO delete, is a function for test setup
export function sum(a, b) {
    return a + b;
  }


export function behinderung(be, systemData) {
    // let pw = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pw;
    let rg = systemData.vorteil.kampf.find((x) => x.name == 'Rüstungsgewöhnung');
    let vrg = systemData.vorteil.kampf.find((x) => x.name == 'Verbesserte Rüstungsgewöhnung');
    if (be > 0 && rg) {
        be -= 1;
    }
    if (be > 0 && vrg) {
        be -= 2;
        be = be >= 0 ? be : 0;
    }
    return be;
}

export function beTraglast(systemData) {
    let summeGewicht = systemData.getragen;
    let traglast = systemData.abgeleitete.traglast;
    let intervall = systemData.abgeleitete.traglast_intervall;
    let be_mod = 0;
    let gewicht_diff = summeGewicht - traglast;
    if (gewicht_diff > 0) {
        let div_floor = Math.floor(gewicht_diff / intervall);
        let div_ceil = Math.ceil(gewicht_diff / intervall);
        if (div_ceil == div_floor) {
            be_mod = div_floor;
        } else {
            be_mod = div_floor + 1;
        }
    }
    return be_mod;
}

export function wundschwelle(ws, actor) {
    if (actor.vorteil.profan.find((x) => x.name == 'Unverwüstlich')) ws += 1;
    // let uv = data.vorteil.profan.find(x => x.name == "Unverwüstlich");
    // let nr = data.vorteil.allgemein.find(x => x.name == "Natürliche Rüstung");
    // if (uv) ws += 1;
    // if (nr) ws += 1;
    return ws;
}

export function wundschwelleStern(ws, actor) {
    if (actor.vorteil.allgemein.find((x) => x.name == 'Natürliche Rüstung')) ws += 1;
    return ws;
}

export function globalermod(systemData) {
    return (
        systemData.gesundheit.wundabzuege +
        systemData.furcht.furchtabzuege +
        systemData.modifikatoren.manuellermod
    );
}

export function initiative(ini, actor) {
    let kr = actor.vorteil.kampf.find((x) => x.name == 'Kampfreflexe');
    if (kr) ini += 4;
    return ini;
}

export function magieresistenz(mr, actor) {
    let wsI = actor.vorteil.profan.find((x) => x.name == 'Willensstark I');
    let wsII = actor.vorteil.profan.find((x) => x.name == 'Willensstark II');
    let ub = actor.vorteil.profan.find((x) => x.name == 'Unbeugsamkeit');
    if (wsI) mr += 4;
    if (wsII) mr += 4;
    if (ub) mr += Math.round(actor.system.attribute.MU.wert / 2);
    return mr;
}

export function geschwindigkeit(gs, actor) {
    let fI = actor.vorteil.profan.find((x) => x.name == 'Flink I');
    let fII = actor.vorteil.profan.find((x) => x.name == 'Flink II');
    if (fI) gs += 1;
    if (fII) gs += 1;
    return gs;
}

export function durchhalte(actor) {
    //Reihenfolge der Berechnung?
    let be_traglast = actor.system.abgeleitete.be_traglast;
    let be = actor.system.abgeleitete.be - be_traglast;
    let dh = actor.system.attribute.KO.wert;
    let agh = actor.vorteil.profan.find((x) => x.name == 'Abgehärtet II');
    if (agh) dh += 2;
    dh -= 2 * be;
    dh = dh > 1 ? dh : 1;
    dh -= 2 * be_traglast;
    return dh;
}

// export function schips(sch, data) {
export function schips(actor) {
    let schips = 4;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Glück I')) schips = 5;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Glück II')) schips = 6;
    // let gI = data.vorteil.allgemein.find(x => x.name == "Glück I");
    // let gII = data.vorteil.allgemein.find(x => x.name == "Glück II");
    // if (gI) sch += 1;
    // if (gII) sch += 1;
    return schips;
}

// export function zauberer(asp, data) {
export function zauberer(actor) {
    let asp = 0;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer I')) asp = 8;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer II')) asp = 16;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer III')) asp = 24;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Zauberer IV')) asp = 32;
    if (actor.vorteil.magie.find((x) => x.name == 'Gefäß der Sterne'))
        asp += 4 + actor.system.attribute.CH.wert;
    // let zI = data.vorteil.allgemein.find(x => x.name == "Zauberer I");
    // let zII = data.vorteil.allgemein.find(x => x.name == "Zauberer II");
    // let zIII = data.vorteil.allgemein.find(x => x.name == "Zauberer III");
    // let zIV = data.vorteil.allgemein.find(x => x.name == "Zauberer IV");
    // let gds = data.vorteil.magie.find(x => x.name == "Gefäß der Sterne");
    // if (zI) asp += 8;
    // if (zII) asp += 8;
    // if (zIII) asp += 8;
    // if (zIV) asp += 8;
    // if (gds) asp += 4 + data.data.attribute.CH.wert;
    return asp;
}

// export function geweihter(kap, data) {
export function geweihter(actor) {
    let kap = 0;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht I')) kap = 8;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht II')) kap = 16;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht III')) kap = 24;
    if (actor.vorteil.allgemein.find((x) => x.name == 'Geweiht IV')) kap = 32;
    // let gI = data.vorteil.allgemein.find(x => x.name == "Geweiht I");
    // let gII = data.vorteil.allgemein.find(x => x.name == "Geweiht II");
    // let gIII = data.vorteil.allgemein.find(x => x.name == "Geweiht III");
    // let gIV = data.vorteil.allgemein.find(x => x.name == "Geweiht IV");
    // if (gI) kap += 8;
    // if (gII) kap += 8;
    // if (gIII) kap += 8;
    // if (gIV) kap += 8;
    return kap;
}

export function getKampfstile(actor) {
    let kampfstile = ['ohne'];
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Beidhändiger Kampf')))
        kampfstile.push('bhk');
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Kraftvoller Kampf')))
        kampfstile.push('kvk');
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Parierwaffenkampf')))
        kampfstile.push('pwk');
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Reiterkampf')))
        kampfstile.push('rtk');
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Schildkampf')))
        kampfstile.push('shk');
    if (actor.vorteil.kampfstil.find((x) => x.name.includes('Schneller Kampf')))
        kampfstile.push('snk');
    return kampfstile;
}

export function getKampfstilStufe(stil, actor) {
    // "bhk": "Beidhändiger Kampf",
    // "kvk": "Kraftvoller Kampf",
    // "pwk": "Parierwaffenkampf",
    // "rtk": "Reiterkampf",
    // "shk": "Schildkampf",
    // "snk": "Schneller Kampf"
    let stufe = 0;
    if (actor.vorteil.kampfstil.find((x) => x.name == `${CONFIG.ILARIS.label[stil]} I`))
        stufe = 1;
    if (actor.vorteil.kampfstil.find((x) => x.name == `${CONFIG.ILARIS.label[stil]} II`))
        stufe = 2;
    if (actor.vorteil.kampfstil.find((x) => x.name == `${CONFIG.ILARIS.label[stil]} III`))
        stufe = 3;
    if (actor.vorteil.kampfstil.find((x) => x.name == `${CONFIG.ILARIS.label[stil]} IV`))
        stufe = 4;
    return stufe;
}

export function getAngepasst(angepasst_string, actor) {
    let angepasst = 0;
    let string_1 = `Angepasst (${angepasst_string}) I`;
    let string_2 = `Angepasst (${angepasst_string}) II`;
    if (actor.vorteil.allgemein.find((x) => x.name == string_1)) angepasst = 1;
    if (actor.vorteil.allgemein.find((x) => x.name == string_2)) angepasst = 2;
    return angepasst;
}

export function magieErzwingenPossible(actor) {
    let possible = false;
    if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Anach-Nurim III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Anach-Nurim IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Borbaradianer III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Borbaradianer IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Druiden III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Druiden IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Hexen III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Hexen IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Schelme III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Schelme IV')
    ) {
        possible = true;
    }
    return possible;
}

export function magieKostenSparenPossible(actor) {
    let possible = false;
    if (actor.vorteil.magie.find((x) => x.name == 'Effizientes Zaubern')) {
        possible = true;
    }
    return possible;
}

export function magieZeitLassenPossible(actor) {
    let possible = false;
    if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Alchemisten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Alchemisten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Elfen III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Elfen IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Geoden III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Geoden IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Gildenmagier III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Gildenmagier IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find(
            (x) => x.name == 'Tradition der Kristallomanten III',
        )
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find(
            (x) => x.name == 'Tradition der Kristallomanten IV',
        )
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Scharlatane III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Scharlatane IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Zauberbarden III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Zauberbarden IV')
    ) {
        possible = true;
    }
    return possible;
}

export function magieZeremoniePossible(actor) {
    let possible = false;

    if (actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Schamanen III')) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Schamanen IV')
    ) {
        possible = true;
    }
    return possible;
}

export function magieOpferungPossible(actor) {
    let possible = false;
    if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Durro-dun III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Durro-dun IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Zaubertänzer III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.zaubertraditionen.find((x) => x.name == 'Tradition der Zaubertänzer IV')
    ) {
        possible = true;
    }
    return possible;
}

export function karmaKostenSparenPossible(actor) {
    let possible = false;
    if (actor.vorteil.karma.find((x) => x.name == 'Liturgische Disziplin')) {
        possible = true;
    }
    return possible;
}

export function karmaZeremoniePossible(actor) {
    let possible = false;

    if (actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Borongeweihten III')) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Borongeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Hesindegeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Hesindegeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Ifirngeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Ifirngeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Perainegeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Perainegeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Praiosgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Praiosgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Traviageweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Traviageweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Tsageweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Tsageweihten IV')
    ) {
        possible = true;
    }
    return possible;
}

export function karmaOpferungPossible(actor) {
    let possible = false;
    if (actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Avesgeweihten III')) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Avesgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Efferdgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Efferdgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Firungeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Firungeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Ingerimmgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Ingerimmgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Nandusgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Nandusgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Phexgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Phexgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Rahjageweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Rahjageweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Rondrageweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Rondrageweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Korgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Korgeweihten IV')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Swafnirgeweihten III')
    ) {
        possible = true;
    } else if (
        actor.vorteil.geweihtentradition.find((x) => x.name == 'Tradition der Swafnirgeweihten IV')
    ) {
        possible = true;
    }
    return possible;
}
