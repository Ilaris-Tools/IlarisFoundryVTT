import * as hardcoded from "./hardcodedvorteile.js";

export class IlarisActor extends Actor {

    prepareData() {
        super.prepareData();
        if (this.data.type === "held") {
            this._initializeHeld(this.data);
        }
    }

    _initializeHeld(data) {
        console.log("***Bevor Berechnungen***");
        console.log(data);
        this._sortItems(data); //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(data);
        // this._calculateWerteFertigkeiten(data);
        this._calculateWounds(data);
        this._calculateWundschwellenRuestung(data);
        this._calculateAbgeleitete(data);
        this._calculateProfanFertigkeiten(data);
        this._calculateUebernaturlichFertigkeiten(data);
        this._calculateUebernaturlichTalente(data); //Nach Uebernatürliche Fertigkeiten
        this._calculateKampf(data);
        console.log("***Nach Berechnungen***");
        console.log(data);
    }

    _calculatePWAttribute(data) {
        for (let attribut of Object.values(data.data.attribute)) {
            attribut.pw = 2 * attribut.wert;
        }
    }

    _calculateWerteFertigkeiten(data) {
        console.log("Berechne profane Fertigkeiten (hardcoded)");
        for (let fertigkeit of Object.values(data.data.fertigkeiten)) {
            let basiswert = 0;
            for (const attribut of fertigkeit.attribute) {
                basiswert = basiswert + Number(data.data.attribute[attribut].wert);
            }
            basiswert = Math.round(basiswert / 3);
            fertigkeit.basis = basiswert;
            fertigkeit.pw = basiswert + Math.round(Number(fertigkeit.fw) * 0.5);
            fertigkeit.pwt = basiswert + Number(fertigkeit.fw);
        }
    }

    _calculateProfanFertigkeiten(data) {
        console.log("Berechne Profane Fertigkeiten");
        for (let fertigkeit of data.profan.fertigkeiten) {
            let basiswert = 0;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.basis = basiswert;
            fertigkeit.data.pw = basiswert + Math.round(Number(fertigkeit.data.fw) * 0.5);
            fertigkeit.data.pwt = basiswert + Number(fertigkeit.data.fw);
        }
    }

    // Werte werden nicht gespeichert, sonder jedes mal neu berechnet?
    _calculateUebernaturlichFertigkeiten(data) {
        console.log("Berechne Übernatürliche Fertigkeiten");
        for (let fertigkeit of data.uebernatuerlich.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.basis = basiswert;
            fertigkeit.data.pw = basiswert + Number(fertigkeit.data.fw);
        }
        // for (let fertigkeit of data.magie.fertigkeiten) {
        //     // console.log(fertigkeit);
        //     let basiswert = 0;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
        //     basiswert = Math.round(basiswert / 3);
        //     fertigkeit.data.basis = basiswert;
        //     fertigkeit.data.pw = basiswert + Number(fertigkeit.data.fw);
        // }
        // for (let fertigkeit of data.karma.fertigkeiten) {
        //     // console.log(fertigkeit);
        //     let basiswert = 0;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
        //     basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
        //     basiswert = Math.round(basiswert / 3);
        //     fertigkeit.data.basis = basiswert;
        //     fertigkeit.data.pw = basiswert + Number(fertigkeit.data.fw);
        // }
    }


    // __getAlleMagieFertigkeiten(data) {
    //     let fertigkeit_list = [];
    //     for (let fertigkeit of data.magie.fertigkeiten) {
    //         fertigkeit_list.push(fertigkeit.name);
    //     }
    //     return fertigkeit_list;
    // }

    // __getAlleKarmaFertigkeiten(data) {
    //     let fertigkeit_list = [];
    //     for (let fertigkeit of data.karma.fertigkeiten) {
    //         fertigkeit_list.push(fertigkeit.name);
    //     }
    //     return fertigkeit_list;
    // }

    __getAlleUebernatuerlichenFertigkeiten(data) {
        let fertigkeit_list = [];
        for (let fertigkeit of data.uebernatuerlich.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name);
        }
        return fertigkeit_list;
    }

    _calculateUebernaturlichTalente(data) {
        console.log("Berechne übernatürliche Talente");
        let fertigkeit_uebereinstimmung = [];
        // const alleMagieFertigkeiten = this.__getAlleMagieFertigkeiten(data);
        // const alleKarmaFertigkeiten = this.__getAlleKarmaFertigkeiten(data);
        const alleFertigkeiten = this.__getAlleUebernatuerlichenFertigkeiten(data);
        // for (let talent of data.magie.talente) {
        for (let talent of data.uebernatuerlich.zauber) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(",");
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.magie.fertigkeiten) {
                for (let actor_fertigkeit of data.uebernatuerlich.fertigkeiten) {
                    if (fertigkeit == actor_fertigkeit.name && talent.data.fertigkeit_ausgewaehlt == "auto") {
                        let max_tmp = actor_fertigkeit.data.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    }
                    else if (talent.data.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.data.pw;
                    }
                }
            }
            this.updateEmbeddedEntity('OwnedItem', {
                _id: talent._id,
                data: {
                    // fertigkeit_actor: alleMagieFertigkeiten,
                    fertigkeit_actor: alleFertigkeiten,
                    pw: max_pw
                }
            });
        }
        // for (let talent of data.karma.talente) {
        for (let talent of data.uebernatuerlich.liturgien) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(",");
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.karma.fertigkeiten) {
                for (let actor_fertigkeit of data.uebernatuerlich.fertigkeiten) {
                    if (fertigkeit == actor_fertigkeit.name && talent.data.fertigkeit_ausgewaehlt == "auto") {
                        let max_tmp = actor_fertigkeit.data.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    }
                    else if (talent.data.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.data.pw;
                    }
                }
            }
            this.updateEmbeddedEntity('OwnedItem', {
                _id: talent._id,
                data: {
                    // fertigkeit_actor: alleKarmaFertigkeiten,
                    fertigkeit_actor: alleFertigkeiten,
                    pw: max_pw
                }
            });
        }
    }

    _calculateWounds(data) {
        console.log("Berechne Wunden");
        // console.log(data.data);
        // console.log(data.data.gesundheit.wunden.wert);
        // console.log(data.data.gesundheit.erschoepfung.wert);
        let einschraenkungen = data.data.gesundheit.wunden + data.data.gesundheit.erschoepfung;
        let abzuege = 0;
        if (einschraenkungen == 0) {
            data.data.gesundheit.wundabzuege = 0;
            data.data.gesundheit.display = "Volle Gesundheit";
        }
        else if (einschraenkungen > 0 && einschraenkungen <= 2) {
            data.data.gesundheit.wundabzuege = 0;
            data.data.gesundheit.display = "Keine Abzüge";
        }
        else if (einschraenkungen >= 3 && einschraenkungen <= 4) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = `${abzuege} auf alle Proben`;
        }
        else if (einschraenkungen >= 5 && einschraenkungen <= 8) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = `${abzuege} auf alle Proben (Kampfunfähig)`;
        }
        else if (einschraenkungen >= 9) {
            abzuege = -(einschraenkungen - 2) * 2;
            data.data.gesundheit.wundabzuege = abzuege;
            data.data.gesundheit.display = 'Tod';
        }
        else {
            data.data.gesundheit.display = 'Irgendetwas ist schief gelaufen';
        }
    }

    _calculateWundschwellenRuestung(data) {
        console.log("Berechne Rüstung");
        let ws = 4 + Math.floor(data.data.attribute.KO.wert / 4);
        ws = hardcoded.wundschwelle(ws, data);
        // let ws_stern = ws;
        let ws_stern = hardcoded.wundschwelleStern(ws, data);
        let be = 0;
        let ws_beine = ws_stern;
        let ws_larm = ws_stern;
        let ws_rarm = ws_stern;
        let ws_bauch = ws_stern;
        let ws_brust = ws_stern;
        let ws_kopf = ws_stern;
        for (let ruestung of data.ruestungen) {
            if (ruestung.data.aktiv == true) {
                ws_stern += ruestung.data.rs;
                be += ruestung.data.be;
                ws_beine += ruestung.data.rs_beine;
                ws_larm += ruestung.data.rs_larm;
                ws_rarm += ruestung.data.rs_rarm;
                ws_bauch += ruestung.data.rs_bauch;
                ws_brust += ruestung.data.rs_brust;
                ws_kopf += ruestung.data.rs_kopf;
            }
        }
        be = hardcoded.behinderung(be, data);
        data.data.abgeleitete.ws = ws;
        data.data.abgeleitete.ws_stern = ws_stern;
        data.data.abgeleitete.be = be;
        data.data.abgeleitete.ws_beine = ws_beine;
        data.data.abgeleitete.ws_larm = ws_larm;
        data.data.abgeleitete.ws_rarm = ws_rarm;
        data.data.abgeleitete.ws_bauch = ws_bauch;
        data.data.abgeleitete.ws_brust = ws_brust;
        data.data.abgeleitete.ws_kopf = ws_kopf;
        // data.data.abgeleitete.ws = ws;
        // data.data.abgeleitete.ws_stern = ws;
        // data.data.abgeleitete.be = 0;
        // data.data.abgeleitete.ws_beine = ws;
        // data.data.abgeleitete.ws_larm = ws;
        // data.data.abgeleitete.ws_rarm = ws;
        // data.data.abgeleitete.ws_bauch = ws;
        // data.data.abgeleitete.ws_brust = ws;
        // data.data.abgeleitete.ws_kopf = ws;
        // for (let ruestung of data.ruestungen) {
        //     // console.log(ruestung.data.aktiv);
        //     if (ruestung.data.aktiv == true) {
        //         data.data.abgeleitete.ws_stern += ruestung.data.rs;
        //         data.data.abgeleitete.be += ruestung.data.be;
        //         data.data.abgeleitete.ws_beine += ruestung.data.rs_beine;
        //         data.data.abgeleitete.ws_larm += ruestung.data.rs_larm;
        //         data.data.abgeleitete.ws_rarm += ruestung.data.rs_rarm;
        //         data.data.abgeleitete.ws_bauch += ruestung.data.rs_bauch;
        //         data.data.abgeleitete.ws_brust += ruestung.data.rs_brust;
        //         data.data.abgeleitete.ws_kopf += ruestung.data.rs_kopf;
        //     }
        // }
    }


    _calculateAbgeleitete(data) {
        console.log("Berechne abgeleitete Werte");
        let ini = data.data.attribute.IN.wert;
        ini = hardcoded.initiative(ini, data);
        data.data.abgeleitete.ini = ini;
        let mr = 4 + Math.floor(data.data.attribute.MU.wert / 4);
        mr = hardcoded.magieresistenz(mr, data);
        data.data.abgeleitete.mr = mr;
        let dh = data.data.attribute.KO.wert - (2 * data.data.abgeleitete.be);
        dh = hardcoded.durchhalte(dh, data);
        dh = (dh > 1) ? dh : 1;
        data.data.abgeleitete.dh = dh;
        let gs = 4 + Math.floor(data.data.attribute.GE.wert / 4);
        gs = hardcoded.geschwindigkeit(gs, data);
        gs -= data.data.abgeleitete.be;
        gs = (gs >= 1) ? gs : 1;
        data.data.abgeleitete.gs = gs;
        // let schips = 4;
        // schips = hardcoded.schips(schips, data);
        let schips = hardcoded.schips(data);
        data.data.schips.schips = schips;
        // let asp = 0;
        // asp = hardcoded.zauberer(asp, data);
        let asp = hardcoded.zauberer(data);
        data.data.abgeleitete.zauberer = (asp > 0) ? true : false;
        asp += Number(data.data.abgeleitete.asp_zugekauft) || 0;
        asp -= Number(data.data.abgeleitete.gasp) || 0;
        data.data.abgeleitete.asp = asp;
        // let kap = 0;
        // kap = hardcoded.geweihter(kap, data);
        let kap = hardcoded.geweihter(data);
        data.data.abgeleitete.geweihter = (kap > 0) ? true : false;
        kap += Number(data.data.abgeleitete.kap_zugekauft) || 0;
        kap -= Number(data.data.abgeleitete.gkap) || 0;
        data.data.abgeleitete.kap = kap;
    }


    _calculateKampf(data) {
        console.log("Berechne Kampf");
        const KK = data.data.attribute.KK.wert;
        const sb = Math.floor(KK/4);
        // data.data.abgeleitete.sb = sb;
        let be = data.data.abgeleitete.be;
        // let wundabzuege = data.data.gesundheit.wundabzuege;
        let kampfstile = hardcoded.getKampfstile(data);
        // data.misc.selected_kampfstil = "ohne";
        data.misc.kampfstile_list = kampfstile;
        let selected_kampfstil = data.misc.selected_kampfstil;
        // console.log(kampfstile);
        let HAUPTWAFFE = data.nahkampfwaffen.find(x => x.data.hauptwaffe == true) || data.fernkampfwaffen.find(x => x.data.hauptwaffe == true);
        let NEBENWAFFE = data.nahkampfwaffen.find(x => x.data.nebenwaffe == true) || data.fernkampfwaffen.find(x => x.data.nebenwaffe == true);
        // console.log(HAUPTWAFFE.name);
        // console.log(NEBENWAFFE.name);
        for (let nwaffe of data.nahkampfwaffen) {
            let kopflastig = nwaffe.data.eigenschaften.kopflastig;
            let niederwerfen = nwaffe.data.eigenschaften.niederwerfen;
            let parierwaffe = nwaffe.data.eigenschaften.parierwaffe;
            let reittier = nwaffe.data.eigenschaften.reittier;
            let ruestungsbrechend = nwaffe.data.eigenschaften.ruestungsbrechend;
            let schild = nwaffe.data.eigenschaften.schild;
            let schwer_4 = nwaffe.data.eigenschaften.schwer_4;
            let schwer_8 = nwaffe.data.eigenschaften.schwer_8;
            let stumpf = nwaffe.data.eigenschaften.stumpf;
            let unberechenbar = nwaffe.data.eigenschaften.unberechenbar;
            let unzerstoerbar = nwaffe.data.eigenschaften.unzerstoerbar;
            let wendig = nwaffe.data.eigenschaften.wendig;
            let zerbrechlich = nwaffe.data.eigenschaften.zerbrechlich;
            let zweihaendig = nwaffe.data.eigenschaften.zweihaendig;
            let kein_malus_nebenwaffe = nwaffe.data.eigenschaften.kein_malus_nebenwaffe;
            let hauptwaffe = nwaffe.data.hauptwaffe;
            let nebenwaffe = nwaffe.data.nebenwaffe;
            let schaden = 0;
            schaden += Number(nwaffe.data.dice_plus);
            // let kopflastig = eigenschaften.includes("Kopflastig");
            schaden += sb;
            if (kopflastig) { schaden += sb; }
            let at = 0;
            let vt = 0;
            let fertigkeit = nwaffe.data.fertigkeit;
            // console.log(fertigkeit);
            let talent = nwaffe.data.talent;
            // console.log(talent);
            at += Number(nwaffe.data.wm_at);
            vt += Number(nwaffe.data.wm_vt);
            let pw = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pw;
            // console.log(pw);
            let pwt = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pwt;
            // console.log(pwt);
            let taltrue = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.talente.find(x => x.name == talent); // console.log(taltrue);
            if (typeof pw !== "undefined") {
                // console.log(`${fertigkeit} ist defined`);
                if (typeof taltrue !== "undefined") {
                    // console.log(`${talent} ist defined`);
                    at += pwt;
                    vt += pwt;
                }
                else {
                    at += pw;
                    vt += pw;
                }
            }
            // let eigenschaften_array = eigenschaften.split(", ");
            // let schwer = eigenschaften_array.find(x => x.includes("Schwer"));
            // if (typeof schwer !== "undefined") {
            //     if (schwer.length > 0) {
            //         schwer = schwer.replace("(","");
            //         schwer = schwer.replace(")","");
            //         schwer = schwer.split(" ");
            //         schwer = Number(schwer[1]);
            //     }
            // }
            // if (!isNaN(schwer)) {
            //     if (KK < schwer) {
            //         at -= 2;
            //         vt -= 2;
            //     }
            // }
            // let zweihaendig = eigenschaften.includes("Zweihändig");
            if (schwer_4 && KK < 4){
                at -= 2;
                vt -= 2;
            }
            else if (schwer_8 && KK < 8){
                at -= 2;
                vt -= 2;
            }
            if (zweihaendig) {
                if (hauptwaffe && !nebenwaffe) {
                    at -= 2;
                    vt -= 2;
                    schaden -= 4;
                }
                else if (!hauptwaffe && nebenwaffe){
                    at -= 6;
                    vt -= 6;
                    schaden -= 4;
                }
            }
            if (nebenwaffe && !zweihaendig && !kein_malus_nebenwaffe && !hauptwaffe) { vt -= 4; at -= 4;}
            at -= be;
            vt -= be;
            // at += wundabzuege;
            // vt += wundabzuege;
            const mod_at = nwaffe.data.mod_at;
            const mod_vt = nwaffe.data.mod_vt;
            const mod_schaden = nwaffe.data.mod_schaden;
            if (!isNaN(mod_at)) { at += mod_at;}
            if (!isNaN(mod_vt)) { vt += mod_vt;}
            // if (!isNaN(mod_schaden)) { schaden += mod_schaden;}
            nwaffe.data.at = at;
            nwaffe.data.vt = vt;
            nwaffe.data.schaden = `${nwaffe.data.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== "undefined" && mod_schaden !==null && mod_schaden !== "") {
                nwaffe.data.schaden = `${nwaffe.data.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }
            // console.log(`AT: ${at} | VT: ${vt}`);
            // console.log(pw);
        }
        for (let item of data.fernkampfwaffen) {
            let kein_reiter = item.data.eigenschaften.kein_reiter;
            let niederwerfen = item.data.eigenschaften.niederwerfen;
            let niederwerfen_4 = item.data.eigenschaften.niederwerfen_4;
            let niederwerfen_8 = item.data.eigenschaften.niederwerfen_8;
            let schwer_4 = item.data.eigenschaften.schwer_4;
            let schwer_8 = item.data.eigenschaften.schwer_8;
            let stationaer = item.data.eigenschaften.stationaer;
            let stumpf = item.data.eigenschaften.stumpf;
            let umklammern_212 = item.data.eigenschaften.umklammern_212;
            let umklammern_416 = item.data.eigenschaften.umklammern_416;
            let umklammern_816 = item.data.eigenschaften.umklammern_816;
            let zweihaendig = item.data.eigenschaften.zweihaendig;
            let hauptwaffe = item.data.hauptwaffe;
            let nebenwaffe = item.data.nebenwaffe;
            let schaden = 0;
            schaden += Number(item.data.dice_plus);
            let fk = 0;
            let fertigkeit = item.data.fertigkeit;
            let talent = item.data.talent;
            fk += Number(item.data.wm_fk);
            let pw = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pw;
            let pwt = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.pwt;
            let taltrue = data.profan.fertigkeiten.find(x => x.name == fertigkeit)?.data.talente.find(x => x.name == talent);
            if (typeof pw !== "undefined") {
                if (typeof taltrue !== "undefined") {
                    fk += pwt;
                }
                else {
                    fk += pw;
                }
            }
            if (schwer_4 && KK < 4) {
                fk -= 2;
            }
            else if (schwer_8 && KK < 8) {
                fk -= 2;
            }
            if (nebenwaffe && !zweihaendig && !hauptwaffe) { fk -= 4; }
            fk -= be;
            // fk += wundabzuege;
            const mod_fk = item.data.mod_fk;
            const mod_schaden = item.data.mod_schaden;
            if (!isNaN(mod_fk)) { fk += mod_fk; }
            item.data.fk = fk;
            if (zweihaendig && ((hauptwaffe && !nebenwaffe) || (!hauptwaffe && nebenwaffe))) {
                item.data.fk = "-";
            }
            else if (kein_reiter && (hauptwaffe || nebenwaffe)) {
                // let reittier = false;
                let reittier = HAUPTWAFFE?.data.eigenschaften?.reittier || NEBENWAFFE?.data.eigenschaften?.reittier;
                if (reittier && kein_reiter) {
                    item.data.fk = "-";
                }
            }
            item.data.schaden = `${item.data.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== "undefined" && mod_schaden !== null && mod_schaden !== "") {
                item.data.schaden = `${item.data.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }
        }
        // "ohne": "Kein Kampfstil",
        // "bhk": "Beidhändiger Kampf",
        // "kvk": "Kraftvoller Kampf",
        // "pwk": "Parierwaffenkampf",
        // "rtk": "Reiterkampf",
        // "shk": "Schildkampf",
        // "snk": "Schneller Kampf"
        let stufe = hardcoded.getKampfstilStufe(selected_kampfstil, data);
        if (selected_kampfstil == "bhk" && typeof(HAUPTWAFFE) != "undefined" && typeof(NEBENWAFFE) != "undefined") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let nahkampfwaffe = true;
            let einhaendig = false;
            let kein_schild = false;
            let unterschiedlich = false;
            let kein_reiter = false;
            if (HAUPTWAFFE.type == "nahkampfwaffe" && NEBENWAFFE.type == "nahkampfwaffe") {
                nahkampfwaffe = true;
            }
            if (HAUPTWAFFE._id != NEBENWAFFE._id) {
                unterschiedlich = true;
            }
            if (!(HAUPTWAFFE.data.eigenschaften.zweihaendig || NEBENWAFFE.data.eigenschaften.zweihaendig)) {
                einhaendig = true;
            }
            if (nahkampfwaffe){
                if (!(HAUPTWAFFE.data.eigenschaften.schild || NEBENWAFFE.data.eigenschaften.schild)) {
                    kein_schild = true;
                }
                if (!(HAUPTWAFFE.data.eigenschaften.reittier || NEBENWAFFE.data.eigenschaften.reittier)) {
                    kein_reiter = true;
                }
            }
            if (nahkampfwaffe && einhaendig && kein_schild && kein_reiter && unterschiedlich){
                let at_hw = 0;
                let at_nw = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1");
                    at_hw += 1;
                    at_nw += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2");
                    at_hw += 1;
                    at_nw += 1;
                    if (!(NEBENWAFFE.data.eigenschaften.kein_malus_nebenwaffe)){
                        at_nw += 4;
                        NEBENWAFFE.data.vt += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log("Stufe 3");
                    at_hw += 1;
                    at_nw += 1;
                }
                HAUPTWAFFE.data.at += at_hw;
                NEBENWAFFE.data.at += at_nw;
            }
        }
        else if (selected_kampfstil == "kvk") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let WAFFE = null;
            if (typeof(HAUPTWAFFE) != "undefined") hauptwaffe = true;
            if (typeof(NEBENWAFFE) != "undefined") nebenwaffe = true;
            if (hauptwaffe && nebenwaffe) {
                if (HAUPTWAFFE._id == NEBENWAFFE._id) {
                    WAFFE = HAUPTWAFFE;
                }
            }
            if (hauptwaffe && !nebenwaffe) { WAFFE = HAUPTWAFFE; }
            if (!hauptwaffe && nebenwaffe) { WAFFE = NEBENWAFFE; }
            if (WAFFE) {
                if (WAFFE.type == "nahkampfwaffe") {
                    if (WAFFE.data.eigenschaften.reittier == false) {
                        let schaden = 0;
                        if (stufe >= 1) {
                            console.log("Stufe 1");
                            schaden +=1;
                        }
                        if (stufe >= 2) {
                            console.log("Stufe 2");
                            schaden += 1;
                        }
                        if (stufe >= 3) {
                            console.log("Stufe 3");
                            schaden += 1;
                        }
                        schaden = "+".concat(schaden);
                        WAFFE.data.schaden = WAFFE.data.schaden.concat(schaden);
                    }
                }
            }
        }
        else if (selected_kampfstil == "pwk") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let parierwaffe = false;
            let fernkampf = false;
            let reittier = false;
            if (typeof (HAUPTWAFFE) != "undefined") hauptwaffe = true;
            if (typeof (NEBENWAFFE) != "undefined") nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == "nahkampfwaffe") {
                if (HAUPTWAFFE.data.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (HAUPTWAFFE.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe") {
                if (NEBENWAFFE.data.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (NEBENWAFFE.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (hauptwaffe && HAUPTWAFFE.type == "fernkampfwaffe") {
                fernkampf = true;
            }
            if (nebenwaffe && NEBENWAFFE.type == "fernkampfwaffe") {
                fernkampf = true;
            }
            if (parierwaffe && !fernkampf && !reittier) {
                if (stufe >= 1) {
                    console.log("Stufe 1");
                }
                if (stufe >= 2) {
                    console.log("Stufe 2");
                    if (nebenwaffe) {
                        if (!(NEBENWAFFE.data.eigenschaften.kein_malus_nebenwaffe)) {
                            NEBENWAFFE.data.at += 4;
                            NEBENWAFFE.data.vt += 4;

                        }
                    }
                }
                if (stufe >= 3) {
                    console.log("Stufe 3");
                }
            }
        }
        else if (selected_kampfstil == "rtk") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let reittier = false;
            if (typeof (HAUPTWAFFE) != "undefined") hauptwaffe = true;
            if (typeof (NEBENWAFFE) != "undefined") nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == "nahkampfwaffe") {
                if (HAUPTWAFFE.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe") {
                if (NEBENWAFFE.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (reittier && hauptwaffe && HAUPTWAFFE.type == "nahkampfwaffe") {
                let schaden = 0;
                let at = 0;
                let vt = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1 (Hauptwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2 (Hauptwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 3) {
                    console.log("Stufe 3 (Hauptwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                schaden = "+".concat(schaden);
                HAUPTWAFFE.data.at += at;
                HAUPTWAFFE.data.vt += vt;
                HAUPTWAFFE.data.schaden = HAUPTWAFFE.data.schaden.concat(schaden);
            }
            if (reittier && nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe" && (!hauptwaffe || HAUPTWAFFE._id != NEBENWAFFE._id)) {
                let schaden = 0;
                let at = 0;
                let vt = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1 (Nebenwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2 (Nebenwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                    if (!(NEBENWAFFE.data.eigenschaften.kein_malus_nebenwaffe) && NEBENWAFFE.data.eigenschaften.reittier) {
                        at += 4;
                        vt += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log("Stufe 3 (Nebenwaffe)");
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                schaden = "+".concat(schaden);
                NEBENWAFFE.data.at += at;
                NEBENWAFFE.data.vt += vt;
                NEBENWAFFE.data.schaden = NEBENWAFFE.data.schaden.concat(schaden);
            }
        }
        else if (selected_kampfstil == "shk") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let schild = false;
            if (typeof (HAUPTWAFFE) != "undefined") hauptwaffe = true;
            if (typeof (NEBENWAFFE) != "undefined") nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == "nahkampfwaffe") {
                if (HAUPTWAFFE.data.eigenschaften.schild) {
                    schild = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe") {
                if (NEBENWAFFE.data.eigenschaften.schild) {
                    schild = true;
                }
            }
            if (hauptwaffe && HAUPTWAFFE.type == "nahkampfwaffe" && schild) {
                let vt = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1 (Hauptwaffe)");
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2 (Hauptwaffe)");
                    vt += 1;
                }
                if (stufe >= 3) {
                    console.log("Stufe 3 (Hauptwaffe)");
                    vt += 1;
                }
                HAUPTWAFFE.data.vt += vt;
            }
            if (nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe" && schild) {
                let vt = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1 (Nebenwaffe)");
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2 (Nebenwaffe)");
                    vt += 1;
                    if (!(NEBENWAFFE.data.eigenschaften.kein_malus_nebenwaffe) && NEBENWAFFE.data.eigenschaften.schild) {
                        vt += 4;
                        NEBENWAFFE.data.at += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log("Stufe 3 (Nebenwaffe)");
                    vt += 1;
                }
                NEBENWAFFE.data.vt += vt;
            }
        }
        else if (selected_kampfstil == "snk") {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let WAFFE = null;
            if (typeof (HAUPTWAFFE) != "undefined") hauptwaffe = true;
            if (typeof (NEBENWAFFE) != "undefined") nebenwaffe = true;
            if (hauptwaffe && !nebenwaffe && HAUPTWAFFE.type == "nahkampfwaffe") {
                console.log("Hauptwaffe nahkampf");
                if (!HAUPTWAFFE.data.eigenschaften.reittier) {
                    WAFFE = HAUPTWAFFE;
                    console.log("step 1");
                }
            }
            else if (!hauptwaffe && nebenwaffe && NEBENWAFFE.type == "nahkampfwaffe") {
                console.log("Nebenwaffe nahkampf");
                if (!NEBENWAFFE.data.eigenschaften.reittier) {
                    WAFFE = NEBENWAFFE;
                    console.log("step 2");
                }
            }
            else if (hauptwaffe && nebenwaffe && HAUPTWAFFE.type == "nahkampfwaffe" && HAUPTWAFFE._id == NEBENWAFFE._id) {
                console.log("Nahkampfwaffen identisch");
                if (!HAUPTWAFFE.data.eigenschaften.reittier) {
                    WAFFE = HAUPTWAFFE;
                    console.log("step 3");
                }
            }
            if (WAFFE) {
                console.log("step 4");
                let at = 0;
                if (stufe >= 1) {
                    console.log("Stufe 1");
                    at += 1;
                }
                if (stufe >= 2) {
                    console.log("Stufe 2");
                    at += 1;
                }
                if (stufe >= 3) {
                    console.log("Stufe 3");
                    at += 1;
                }
                WAFFE.data.at += at;
            }
        }
    }

    _sortItems(data) {
        console.log("In sort_Items");
        // console.log(data);
        let ruestungen = [];
        let nahkampfwaffen = [];
        let fernkampfwaffen = [];
        let profan_fertigkeiten = [];
        let profan_talente = [];
        let profan_fertigkeit_list = [];
        let profan_talente_unsorted = [];
        let uebernatuerliche_fertigkeiten = [];
        let magie_talente = [];
        let karma_talente = [];
        let freie_fertigkeiten = [];
        let vorteil_allgemein = [];
        let vorteil_profan = [];
        let vorteil_kampf = [];
        let vorteil_kampfstil = [];
        let vorteil_magie = [];
        let vorteil_zaubertraditionen = [];
        let vorteil_karma = [];
        let vorteil_geweihtetraditionen = [];
        let eigenheiten = [];
        let unsorted = [];
        for (let i of data.items) {
            // let item = i.data;
            if (i.type == "ruestung") {
                // console.log("Rüstung gefunden");
                // console.log(i);
                ruestungen.push(i);
            }
            else if (i.type == "nahkampfwaffe") {
                // console.log("Nahkampfwaffe gefunden");
                // console.log(i);
                nahkampfwaffen.push(i);
            }
            else if (i.type == "fernkampfwaffe") {
                // console.log("Fernkampfwaffe gefunden");
                // console.log(i);
                fernkampfwaffen.push(i);
            }
            else if (i.type == "fertigkeit") {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                i.data.talente = [];
                profan_fertigkeiten.push(i);
                profan_fertigkeit_list.push(i.name);
                // profan_talente[i.name] = [];
            }
            else if (i.type == "talent") {
                profan_talente.push(i);
            }
            else if (i.type == "freie_fertigkeit") {
                freie_fertigkeiten.push(i);
            }
            else if (i.type == "uebernatuerliche_fertigkeit") {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                uebernatuerliche_fertigkeiten.push(i);
            }
            else if (i.type == "zauber") {
                // console.log("Magietalent gefunden");
                // console.log(i);
                magie_talente.push(i);
            }
            // else if (i.type == "karma_fertigkeit") {
            //     // console.log("Karmafertigkeit gefunden");
            //     // console.log(i);
            //     karma_fertigkeiten.push(i);
            // }
            else if (i.type == "liturgie") {
                // console.log("Karmatalent gefunden");
                // console.log(i);
                karma_talente.push(i);
            }
            else if (i.type == "vorteil") {
                if (i.data.gruppe == 0) vorteil_allgemein.push(i);
                else if (i.data.gruppe == 1) vorteil_profan.push(i);
                else if (i.data.gruppe == 2) vorteil_kampf.push(i);
                else if (i.data.gruppe == 3) vorteil_kampfstil.push(i);
                else if (i.data.gruppe == 4) vorteil_magie.push(i);
                else if (i.data.gruppe == 5) vorteil_zaubertraditionen.push(i);
                else if (i.data.gruppe == 6) vorteil_karma.push(i);
                else if (i.data.gruppe == 7) vorteil_geweihtetraditionen.push(i);
            }
            else if (i.type == "eigenheit") {
                eigenheiten.push(i);
            }
            else unsorted.push(i);
        }
        uebernatuerliche_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        uebernatuerliche_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        magie_talente.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        magie_talente.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        // karma_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // karma_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        karma_talente.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        karma_talente.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        profan_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        profan_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        freie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        freie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        vorteil_allgemein.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_profan.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_kampf.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_kampfstil.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_magie.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_zaubertraditionen.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_karma.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        vorteil_geweihtetraditionen.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        eigenheiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'name' );
        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'data.gruppe' );

        for (let i of profan_talente) {
            this.updateEmbeddedEntity('OwnedItem', {
                _id: i._id,
                data: {
                    fertigkeit_list: profan_fertigkeit_list,
                }
            });
            // i.data.fertigkeit_list = profan_fertigkeit_list;
            if (profan_fertigkeit_list.includes(i.data.fertigkeit)) {
                profan_fertigkeiten.find(x => x.name == i.data.fertigkeit).data.talente.push(i);
            }
            else {
                profan_talente_unsorted.push(i);
            }
        }

        // data.magie = {};
        // data.karma = {};
        data.profan = {};
        data.uebernatuerlich = {};
        data.vorteil = {};
        data.ruestungen = ruestungen;
        data.nahkampfwaffen = nahkampfwaffen;
        data.fernkampfwaffen = fernkampfwaffen;
        data.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten;
        data.uebernatuerlich.zauber = magie_talente;
        data.uebernatuerlich.liturgien = karma_talente;
        // data.magie.talente = magie_talente;
        // data.karma.fertigkeiten = karma_fertigkeiten;
        // data.karma.talente = karma_talente;
        data.profan.fertigkeiten = profan_fertigkeiten;
        data.profan.talente_unsorted = profan_talente_unsorted;
        data.profan.freie = freie_fertigkeiten;
        data.vorteil.allgemein = vorteil_allgemein;
        data.vorteil.profan = vorteil_profan;
        data.vorteil.kampf = vorteil_kampf;
        data.vorteil.kampfstil = vorteil_kampfstil;
        data.vorteil.magie = vorteil_magie;
        data.vorteil.zaubertraditionen = vorteil_zaubertraditionen;
        data.vorteil.karma = vorteil_karma;
        data.vorteil.geweihtentradition = vorteil_geweihtetraditionen;
        data.eigenheiten = eigenheiten;
        data.unsorted = unsorted;
        data.misc = data.misc || {};
    }

}
