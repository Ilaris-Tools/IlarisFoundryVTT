export function behinderung(be, data) {
    // let pw = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pw;
    let rg = data.data.vorteil.kampf.find(x => x.name == "Rüstungsgewöhnung");
    let vrg = data.data.vorteil.kampf.find(x => x.name == "Verbesserte Rüstungsgewöhnung");
    if (be > 0 && rg) {
        be -= 1;
    }
    if (be > 0 && vrg) {
        be -= 2;
        be = (be >= 0) ? be : 0;
    }
    return be;
}

export function beTraglast(data) {
    let summeGewicht = data.data.getragen;
    let traglast = data.data.abgeleitete.traglast;
    let intervall = data.data.abgeleitete.traglast_intervall;
    let be_mod = 0;
    let gewicht_diff = summeGewicht - traglast;
    if (gewicht_diff > 0) {
        let div_floor = Math.floor(gewicht_diff/intervall);
        let div_ceil = Math.ceil(gewicht_diff/intervall);
        if (div_ceil == div_floor) {
            be_mod = div_floor;
        }
        else {
            be_mod = div_floor + 1;
        }
    }
    return be_mod;
}

export function wundschwelle(ws, data) {
    if (data.data.vorteil.profan.find(x => x.name == "Unverwüstlich")) ws += 1;
    // let uv = data.vorteil.profan.find(x => x.name == "Unverwüstlich");
    // let nr = data.vorteil.allgemein.find(x => x.name == "Natürliche Rüstung");
    // if (uv) ws += 1;
    // if (nr) ws += 1;
    return ws;
}

export function wundschwelleStern(ws, data) {
    if (data.data.vorteil.allgemein.find(x => x.name == "Natürliche Rüstung")) ws += 1;
    return ws;
}

export function globalermod(data) {
    return data.data.gesundheit.wundabzuege + data.data.furcht.furchtabzuege + data.data.modifikatoren.manuellermod;
}

export function initiative(ini, data) {
    let kr = data.data.vorteil.kampf.find(x => x.name == "Kampfreflexe");
    if (kr) ini += 4;
    return ini;
}

export function magieresistenz(mr, data) {
    let wsI = data.data.vorteil.profan.find(x => x.name == "Willensstark I");
    let wsII = data.data.vorteil.profan.find(x => x.name == "Willensstark II");
    let ub = data.data.vorteil.profan.find(x => x.name == "Unbeugsamkeit");
    if (wsI) mr += 4;
    if (wsII) mr += 4;
    if (ub) mr += Math.round(data.data.attribute.MU.wert/2);
    return mr;
}

export function geschwindigkeit(gs, data) {
    let fI = data.data.vorteil.profan.find(x => x.name == "Flink I");
    let fII = data.data.vorteil.profan.find(x => x.name == "Flink II");
    if (fI) gs += 1;
    if (fII) gs += 1;
    return gs;
}

export function durchhalte(data) {
    //Reihenfolge der Berechnung?
    let be_traglast = data.data.abgeleitete.be_traglast;
    let be = data.data.abgeleitete.be - be_traglast;
    let dh = data.data.attribute.KO.wert;
    let agh = data.data.vorteil.profan.find(x => x.name == "Abgehärtet II");
    if (agh) dh += 2;
    dh -= 2*be;
    dh = (dh > 1) ? dh : 1;
    dh -= 2*be_traglast;
    return dh;
}

// export function schips(sch, data) {
export function schips(data) {
    let schips = 4;
    if (data.data.vorteil.allgemein.find(x => x.name == "Glück I")) schips = 5;
    if (data.data.vorteil.allgemein.find(x => x.name == "Glück II")) schips = 6;
    // let gI = data.vorteil.allgemein.find(x => x.name == "Glück I");
    // let gII = data.vorteil.allgemein.find(x => x.name == "Glück II");
    // if (gI) sch += 1;
    // if (gII) sch += 1;
    return schips;
}

// export function zauberer(asp, data) {
export function zauberer(data) {
    let asp = 0;
    if (data.data.vorteil.allgemein.find(x => x.name == "Zauberer I")) asp = 8;
    if (data.data.vorteil.allgemein.find(x => x.name == "Zauberer II")) asp = 16;
    if (data.data.vorteil.allgemein.find(x => x.name == "Zauberer III")) asp = 24;
    if (data.data.vorteil.allgemein.find(x => x.name == "Zauberer IV")) asp = 32;
    if (data.data.vorteil.magie.find(x => x.name == "Gefäß der Sterne")) asp += 4 + data.data.attribute.CH.wert;
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
export function geweihter(data) {
    let kap = 0;
    if (data.data.vorteil.allgemein.find(x => x.name == "Geweiht I")) kap = 8;
    if (data.data.vorteil.allgemein.find(x => x.name == "Geweiht II")) kap = 16;
    if (data.data.vorteil.allgemein.find(x => x.name == "Geweiht III")) kap = 24;
    if (data.data.vorteil.allgemein.find(x => x.name == "Geweiht IV")) kap = 32;
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

export function getKampfstile(data) {
    let kampfstile = ["ohne"];
    let bhk = false;
    let kvk = false;
    let pwk = false;
    let rtk = false;
    let shk = false;
    let snk = false;
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Beidhändiger Kampf"))) kampfstile.push("bhk");
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Kraftvoller Kampf"))) kampfstile.push("kvk");
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Parierwaffenkampf"))) kampfstile.push("pwk");
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Reiterkampf"))) kampfstile.push("rtk");
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Schildkampf"))) kampfstile.push("shk");
    if (data.data.vorteil.kampfstil.find(x => x.name.includes("Schneller Kampf"))) kampfstile.push("snk");
    return kampfstile;
}

export function getKampfstilStufe(stil, data) {
    // "bhk": "Beidhändiger Kampf",
    // "kvk": "Kraftvoller Kampf",
    // "pwk": "Parierwaffenkampf",
    // "rtk": "Reiterkampf",
    // "shk": "Schildkampf",
    // "snk": "Schneller Kampf"
    let stufe = 0;
    if (data.data.vorteil.kampfstil.find(x => x.name == `${CONFIG.ILARIS.label[stil]} I`)) stufe = 1;
    if (data.data.vorteil.kampfstil.find(x => x.name == `${CONFIG.ILARIS.label[stil]} II`)) stufe = 2;
    if (data.data.vorteil.kampfstil.find(x => x.name == `${CONFIG.ILARIS.label[stil]} III`)) stufe = 3;
    if (data.data.vorteil.kampfstil.find(x => x.name == `${CONFIG.ILARIS.label[stil]} IV`)) stufe = 4;
    return stufe;
}

export function getAngepasst(angepasst_string, data) {
    let angepasst = 0;
    let string_1 = `Angepasst (${angepasst_string}) I`;
    let string_2 = `Angepasst (${angepasst_string}) II`;
    if (data.data.vorteil.allgemein.find(x => x.name == string_1)) angepasst = 1;
    if (data.data.vorteil.allgemein.find(x => x.name == string_2)) angepasst = 2;
    return angepasst;
}
