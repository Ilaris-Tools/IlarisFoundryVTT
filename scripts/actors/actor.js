import * as hardcoded from './hardcodedvorteile.js';
// import { get_statuseffect_by_id } from "../common/wuerfel/wuerfel_misc.js";

export class IlarisActor extends Actor {
    async _preCreate(data, options, user) {
        console.log('Hallo aus _preCreate in Actor');
        console.log(data);
        mergeObject(data, {
            'token.bar1': { attribute: 'gesundheit.hp' },
            'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            'token.displayBars': CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            'token.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            'token.name': data.name
        });
        if (data.type === 'held' || data.type === 'nsc') {
            // TODO CR: Wegen Bild fragen
            data.img = 'systems/Ilaris/assets/images/token/kreaturentypen/humanoid.png';
            data.token.vision = true;
            data.token.actorLink = true;
            data.token.brightSight = 15;
            data.token.dimSight = 5;
        }
        if (data.type === 'nsc') {
            data.token.vision = false;
            data.token.disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
        } else if (data.type == 'kreatur') {
            data.token.disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
            if (!data.img) {
                data.img = 'systems/Ilaris/assets/images/token/kreaturentypen/tier.png';
            }
        }
        this.data.update(data);  // should this be called here?
        await super._preCreate(data, options, user);
        // console.log(data);
    }

    prepareData() {
        console.log('prepareData');
        // let data = this.data;
        // for (let nwaffe of data.items) {
        //     if (nwaffe.type == "nahkampfwaffe") {
        //         console.log(nwaffe.data.data.manoever);
        //         nwaffe.data.data.manoever = nwaffe.data.data.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf);
        //     }
        // }
        // this.data.update(data);
        super.prepareData();
        // console.log(this.data);
        if (this.data.type === 'held' || this.data.type === 'nsc') {
            this._initializeHeld(this.data);
        }
        else if (this.data.type == 'kreatur') {
            this._initializeKreatur(this.data);
        }
    }

    prepareEmbeddedEntities() {
        console.log('prepareEmbeddedEntities');
        // let data = this.data;
        // console.log("ursprüngliche this.data");
        // console.log(this.data);
        // for (let nwaffe of data.items) {
        //     if (nwaffe.type == "nahkampfwaffe") {
        //         console.log(nwaffe.data.data.manoever);
        //         nwaffe.data.data.manoever = nwaffe.data.data.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf);
        //     }
        // }
        // console.log("veränderte data");
        // console.log(data);
        // this.data.update(data);
        // console.log("veränderte this.data");
        // console.log(this.data);
        super.prepareEmbeddedEntities();
    }

    prepareDerivedData() {
        console.log('prepareDerivedData');
        // if (this.data.data.misc?.selected_kampfstil == undefined) {
        //     console.log("Wurststulle");
        //     this.data.update({ "data.misc.selected_kampfstil": "ohne" });
        // }
        super.prepareDerivedData();
    }

    prepareBaseData() {
        console.log('prepareBaseData');
        // console.log(this.data);
        // console.log(this.data.data.misc?.selected_kampfstil);
        // if (this.data.data.misc?.selected_kampfstil == undefined) {
        //     console.log("Wurstbrot");
        //     this.data.update({"data.misc.selected_kampfstil": "ohne"});
        // }
        super.prepareBaseData();
    }

    __getStatuseffectById(data, statusId) {
        // console.log("get_statuseffect");
        // console.log(actor);
        let iterator = data.effects.values();
        for (const effect of iterator) {
            if (effect.data.flags.core.statusId == statusId) {
                return true;
            }
        }
        return false;
    }

    _initializeHeld(data) {
        console.log('**Ilaris** Bevor Berechnungen');
        console.log(data);
        this._sortItems(data); //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(data);
        // this._calculateWerteFertigkeiten(data);
        this._calculateWounds(data); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateFear(data); // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateWundschwellenRuestung(data);
        this._calculateModifikatoren(data);
        this._calculateAbgeleitete(data);
        this._calculateProfanFertigkeiten(data);
        this._calculateUebernaturlichFertigkeiten(data);
        this._calculateUebernaturlichTalente(data); //Nach Uebernatürliche Fertigkeiten
        this._calculateKampf(data);
        this._calculateUebernatuerlichProbendiag(data);
        console.log('**Ilaris** Nach Berechnungen');
        console.log(data);
    }

    _initializeKreatur(data) {
        console.log('**Ilaris** Bevor Berechnungen');
        console.log(data);

        // TODO: wo genau sollten default werte definiert werden, die nicht nur beim erstellen sondern auch beim
        // import aus json oder kompendium gesetzt werden?
        if (!data.data.modifikatoren) {
            data.data.modifikatoren = {}
        }
        if (!data.data.modifikatoren.manuellermod) {
            data.data.modifikatoren.manuellermod = 0;
        }
        this._sortItems(data);
        this._calculateWounds(data);
        this._calculateFear(data);
        this._calculateModifikatoren(data);
    }


    _calculatePWAttribute(data) {
        for (let attribut of Object.values(data.data.attribute)) {
            attribut.pw = 2 * attribut.wert;
        }
    }

    // _calculateWerteFertigkeiten(data) {
    //     console.log("Berechne profane Fertigkeiten (hardcoded)");
    //     for (let fertigkeit of Object.values(data.data.fertigkeiten)) {
    //         let basiswert = 0;
    //         for (const attribut of fertigkeit.attribute) {
    //             basiswert = basiswert + Number(data.data.attribute[attribut].wert);
    //         }
    //         basiswert = Math.round(basiswert / 3);
    //         fertigkeit.basis = basiswert;
    //         fertigkeit.pw = basiswert + Math.round(Number(fertigkeit.fw) * 0.5);
    //         fertigkeit.pwt = basiswert + Number(fertigkeit.fw);
    //     }
    // }

    _calculateProfanFertigkeiten(data) {
        console.log('Berechne Profane Fertigkeiten');
        for (let fertigkeit of data.data.profan.fertigkeiten) {
            let basiswert = 0;
            // console.log(data.data.attribute);
            // console.log(fertigkeit.data);
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.data.basis = basiswert;
            fertigkeit.data.data.pw = basiswert + Math.round(Number(fertigkeit.data.data.fw) * 0.5);
            fertigkeit.data.data.pwt = basiswert + Number(fertigkeit.data.data.fw);
        }
    }

    // Werte werden nicht gespeichert, sonder jedes mal neu berechnet?
    _calculateUebernaturlichFertigkeiten(data) {
        console.log('Berechne Übernatürliche Fertigkeiten');
        for (let fertigkeit of data.data.uebernatuerlich.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.data.basis = basiswert;
            fertigkeit.data.data.pw = basiswert + Number(fertigkeit.data.data.fw);
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
        for (let fertigkeit of data.data.uebernatuerlich.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name);
        }
        return fertigkeit_list;
    }

    _calculateUebernaturlichTalente(data) {
        console.log('Berechne übernatürliche Talente');
        let fertigkeit_uebereinstimmung = [];
        // const alleMagieFertigkeiten = this.__getAlleMagieFertigkeiten(data);
        // const alleKarmaFertigkeiten = this.__getAlleKarmaFertigkeiten(data);
        // const alleFertigkeiten = this.__getAlleUebernatuerlichenFertigkeiten(data);
        // for (let talent of data.magie.talente) {
        for (let talent of data.data.uebernatuerlich.zauber) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(',');
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.magie.fertigkeiten) {
                for (let actor_fertigkeit of data.data.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.data.data.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.data.data.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    } else if (talent.data.data.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.data.data.pw;
                    }
                }
            }
            talent.data.data.pw = max_pw;
            // this.updateEmbeddedEntity('OwnedItem', {
            //     _id: talent._id,
            //     data: {
            //         // fertigkeit_actor: alleMagieFertigkeiten,
            //         fertigkeit_actor: alleFertigkeiten,
            //         pw: max_pw
            //     }
            // });
        }
        // for (let talent of data.karma.talente) {
        for (let talent of data.data.uebernatuerlich.liturgien) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(',');
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.karma.fertigkeiten) {
                for (let actor_fertigkeit of data.data.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.data.data.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.data.data.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    } else if (talent.data.data.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.data.data.pw;
                    }
                }
            }
            talent.data.data.pw = max_pw;
            // this.updateEmbeddedEntity('OwnedItem', {
            //     _id: talent._id,
            //     data: {
            //         // fertigkeit_actor: alleKarmaFertigkeiten,
            //         fertigkeit_actor: alleFertigkeiten,
            //         pw: max_pw
            //     }
            // });
        }
    }

    _calculateWounds(data) {
        console.log('Berechne Wunden');
        let einschraenkungen = data.data.gesundheit.wunden + data.data.gesundheit.erschoepfung;
        let gesundheitzusatz = ``;
        // let old_hp = data.data.gesundheit.hp.value;
        let new_hp = data.data.gesundheit.hp.max - einschraenkungen;
        if (einschraenkungen == 0) {
            data.data.gesundheit.wundabzuege = 0;
            gesundheitzusatz = `(Volle Gesundheit)`;
        } else if (einschraenkungen > 0 && einschraenkungen <= 2) {
            data.data.gesundheit.wundabzuege = 0;
            gesundheitzusatz = `(Kaum ein Kratzer)`;
        } else if (einschraenkungen >= 3 && einschraenkungen <= 4) {
            data.data.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Verwundet)`;
        } else if (einschraenkungen >= 5 && einschraenkungen <= 8) {
            data.data.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Kampfunfähig)`;
        } else if (einschraenkungen >= 9) {
            data.data.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Tot)`;
        } else {
            data.data.gesundheit.display = 'Fehler bei Berechnung der Wundabzüge';
            return;
        }
        if (data.data.gesundheit.wundenignorieren > 0) {
            data.data.gesundheit.wundabzuege = 0;
        }
        data.data.gesundheit.display = ``;
        if (data.data.gesundheit.wundabzuege == 0) {
            data.data.gesundheit.display += `-`;
        }
        data.data.gesundheit.display +=
            `${data.data.gesundheit.wundabzuege} auf alle Proben ` + gesundheitzusatz;
        // if (old_hp != new_hp) {
        data.data.gesundheit.hp.value = new_hp;
        //     // console.log(data);
        //     let actor = game.actors.get(data._id);
        //     // console.log(actor);
        //     // eigentlich async:
        //     if (actor) {
        //         actor.update({ "data.gesundheit.hp.value": new_hp });
        //     }
        // }
    }

    _calculateFear(data) {
        console.log('Berechne Furchteffekt');
        let furchtzusatz = ``;
        if (data.data.furcht.furchtstufe == 0) {
            data.data.furcht.furchtabzuege = 0;
            furchtzusatz = `(keine Furcht)`;
        } else if (data.data.furcht.furchtstufe == 1) {
            data.data.furcht.furchtabzuege = -2;
            furchtzusatz = `(Furcht I)`;
        } else if (data.data.furcht.furchtstufe == 2) {
            data.data.furcht.furchtabzuege = -4;
            furchtzusatz = `(Furcht II)`;
        } else if (data.data.furcht.furchtstufe == 3) {
            data.data.furcht.furchtabzuege = -8;
            furchtzusatz = `(Furcht III)`;
        } else if (data.data.furcht.furchtstufe >= 4) {
            data.data.furcht.furchtabzuege = -8;
            furchtzusatz = `(Furcht IV)`;
        } else {
            data.data.furcht.furchtstufe = 0;
            data.data.furcht.display = 'Fehler bei Berechnung der Furchtabzüge';
            return;
        }
        data.data.furcht.display = ``;
        if (data.data.furcht.furchtabzuege == 0) {
            data.data.furcht.display += `-`;
        }
        data.data.furcht.display +=
            `${data.data.furcht.furchtabzuege} auf alle Proben ` + furchtzusatz;
    }

    _calculateWundschwellenRuestung(data) {
        console.log('Berechne Rüstung');
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
        for (let ruestung of data.data.ruestungen) {
            if (ruestung.data.data.aktiv == true) {
                ws_stern += ruestung.data.data.rs;
                be += ruestung.data.data.be;
                ws_beine += ruestung.data.data.rs_beine;
                ws_larm += ruestung.data.data.rs_larm;
                ws_rarm += ruestung.data.data.rs_rarm;
                ws_bauch += ruestung.data.data.rs_bauch;
                ws_brust += ruestung.data.data.rs_brust;
                ws_kopf += ruestung.data.data.rs_kopf;
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

    _calculateModifikatoren(data) {
        let globalermod = hardcoded.globalermod(data);
        data.data.abgeleitete.globalermod = globalermod;
        // displayed text for nahkampfmod
        data.data.abgeleitete.nahkampfmoddisplay = ``;
        if (data.data.modifikatoren.nahkampfmod == 0){
            data.data.abgeleitete.nahkampfmoddisplay += `-`;
        }
        else if (data.data.modifikatoren.nahkampfmod > 0) {
            data.data.abgeleitete.nahkampfmoddisplay += `+`;
        }
        // let nahkampfmodgesamt = data.data.modifikatoren.nahkampfmod + data.data.modifikatoren.globalermod;
        data.data.abgeleitete.nahkampfmoddisplay += `${data.data.modifikatoren.nahkampfmod} auf AT/VT durch Status am Token`;
        // displayed text for globalermod (auf alle Proben insgesamt)
        data.data.abgeleitete.globalermoddisplay = ``;
        if (data.data.abgeleitete.globalermod == 0){
            data.data.abgeleitete.globalermoddisplay += `-`;
        }
        else if (data.data.abgeleitete.globalermod > 0) {
            data.data.abgeleitete.globalermoddisplay += `+`;
        }
        data.data.abgeleitete.globalermoddisplay += `${data.data.abgeleitete.globalermod} auf alle Proben (insgesamt)`;
    }

    _calculateAbgeleitete(data) {
        console.log('Berechne abgeleitete Werte');
        let ini = data.data.attribute.IN.wert;
        ini = hardcoded.initiative(ini, data);
        data.data.abgeleitete.ini = ini;
        data.data.initiative = ini + 0.5;
        let mr = 4 + Math.floor(data.data.attribute.MU.wert / 4);
        mr = hardcoded.magieresistenz(mr, data);
        data.data.abgeleitete.mr = mr;
        let traglast_intervall = data.data.attribute.KK.wert;
        traglast_intervall = traglast_intervall >= 1 ? traglast_intervall : 1;
        data.data.abgeleitete.traglast_intervall = traglast_intervall;
        let traglast = 2 * data.data.attribute.KK.wert;
        traglast = traglast >= 1 ? traglast : 1;
        data.data.abgeleitete.traglast = traglast;
        let summeGewicht = 0;
        for (let i of data.data.inventar.mitfuehrend) {
            summeGewicht += i.data.data.gewicht;
        }
        data.data.getragen = summeGewicht;
        let be_mod = hardcoded.beTraglast(data);
        data.data.abgeleitete.be += be_mod;
        data.data.abgeleitete.be_traglast = be_mod;
        let dh = hardcoded.durchhalte(data);
        // let dh = data.data.attribute.KO.wert - (2 * data.data.abgeleitete.be);
        // dh = hardcoded.durchhalte(dh, data);
        // dh = (dh > 1) ? dh : 1;
        data.data.abgeleitete.dh = dh;
        let gs = 4 + Math.floor(data.data.attribute.GE.wert / 4);
        gs = hardcoded.geschwindigkeit(gs, data);
        gs -= data.data.abgeleitete.be;
        gs = gs >= 1 ? gs : 1;
        data.data.abgeleitete.gs = gs;
        // let schips = 4;
        // schips = hardcoded.schips(schips, data);
        let schips = hardcoded.schips(data);
        data.data.schips.schips = schips;
        // let asp = 0;
        // asp = hardcoded.zauberer(asp, data);
        let asp = hardcoded.zauberer(data);
        data.data.abgeleitete.zauberer = asp > 0 ? true : false;
        asp += Number(data.data.abgeleitete.asp_zugekauft) || 0;
        asp -= Number(data.data.abgeleitete.gasp) || 0;
        data.data.abgeleitete.asp = asp;
        // let kap = 0;
        // kap = hardcoded.geweihter(kap, data);
        let kap = hardcoded.geweihter(data);
        data.data.abgeleitete.geweihter = kap > 0 ? true : false;
        kap += Number(data.data.abgeleitete.kap_zugekauft) || 0;
        kap -= Number(data.data.abgeleitete.gkap) || 0;
        data.data.abgeleitete.kap = kap;
    }

    _calculateKampf(data) {
        console.log('Berechne Kampf');
        const KK = data.data.attribute.KK.wert;
        const sb = Math.floor(KK / 4);
        // data.data.abgeleitete.sb = sb;
        let be = data.data.abgeleitete.be;
        let nahkampfmod = data.data.modifikatoren.nahkampfmod;
        // let wundabzuege = data.data.gesundheit.wundabzuege;
        let kampfstile = hardcoded.getKampfstile(data);
        // data.misc.selected_kampfstil = "ohne";
        data.data.misc.kampfstile_list = kampfstile;
        let selected_kampfstil = data.data.misc.selected_kampfstil;
        // console.log(kampfstile);
        let HAUPTWAFFE =
            data.data.nahkampfwaffen.find((x) => x.data.data.hauptwaffe == true) ||
            data.data.fernkampfwaffen.find((x) => x.data.data.hauptwaffe == true);
        let NEBENWAFFE =
            data.data.nahkampfwaffen.find((x) => x.data.data.nebenwaffe == true) ||
            data.data.fernkampfwaffen.find((x) => x.data.data.nebenwaffe == true);
        // console.log(HAUPTWAFFE.name);
        // console.log(NEBENWAFFE.name);
        for (let nwaffe of data.data.nahkampfwaffen) {
            // // console.log(nwaffe.data.data.manoever);
            if (nwaffe.data.data.manoever == undefined) {
                // if (nwaffe.data.data.manoever == "undefined") {
                // // if (!nwaffe.data.data.hasOwnProperty("manoever")) {
                // // if (!("manoever" in nwaffe.data.data)) {
                // // if (!nwaffe.data.data.manoever) {
                //     console.log(nwaffe.data.data);
                console.log('Ich überschreibe Manöver');
                //     //shallow Copy. Nur bei primitives!
                //     // nwaffe.data.data.manoever = Object.assign({}, CONFIG.ILARIS.manoever_at);
                //     //deep copy
                //     nwaffe.data.data.manoever = JSON.parse(JSON.stringify(CONFIG.ILARIS.manoever_nahkampf));
                //     // nwaffe.update(JSON.parse(JSON.stringify(CONFIG.ILARIS.manoever_nahkampf)));
            }
            nwaffe.data.data.manoever =
                nwaffe.data.data.manoever ||
                foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf);
            // nwaffe.data.data.manoever.km_utlf.possible = false;
            // nwaffe.data.data.manoever.km_befr.possible = false;
            // nwaffe.data.data.manoever.km_dppl.possible = false;
            // nwaffe.data.data.manoever.km_rpst.possible = false;
            // nwaffe.data.data.manoever.km_shwl.possible = false;
            // nwaffe.data.data.manoever.km_stag.possible = false;
            // nwaffe.data.data.manoever.km_uebr.possible = false;
            // nwaffe.data.data.manoever.km_utlf.possible = false;
            // let manoever_at = ["km_ever",
            //                    "km_entw",
            //                    "km_gzsl",
            //                    "km_umre",
            //                    "km_wusl",
            //                    "km_shsp"];
            // let manoever_vt = ["km_ausw",
            //                    "km_bind",
            //                    "km_entw",
            //                    "km_aufl"];
            // let manoever_at = {};
            // Object.assign(manoever_at, CONFIG.ILARIS.manoever_at);
            // manoever_at = JSON.parse(JSON.stringify(CONFIG.ILARIS.manoever_at));
            // jQuery.extend(true, manoever_at, CONFIG.ILARIS.manoever_at);
            // TODO: ich finde die waffeneigenschaften nicht besonders elegant umgesetzt,
            // könnte man dafür ggf. items anlegen und die iwie mit den waffen items verknüpfen?
            let kopflastig = nwaffe.data.data.eigenschaften.kopflastig;
            let niederwerfen = nwaffe.data.data.eigenschaften.niederwerfen;
            let parierwaffe = nwaffe.data.data.eigenschaften.parierwaffe;
            let reittier = nwaffe.data.data.eigenschaften.reittier;
            let ruestungsbrechend = nwaffe.data.data.eigenschaften.ruestungsbrechend;
            let schild = nwaffe.data.data.eigenschaften.schild;
            let schwer_4 = nwaffe.data.data.eigenschaften.schwer_4;
            let schwer_8 = nwaffe.data.data.eigenschaften.schwer_8;
            let stumpf = nwaffe.data.data.eigenschaften.stumpf;
            let unberechenbar = nwaffe.data.data.eigenschaften.unberechenbar;
            let unzerstoerbar = nwaffe.data.data.eigenschaften.unzerstoerbar;
            let wendig = nwaffe.data.data.eigenschaften.wendig;
            let zerbrechlich = nwaffe.data.data.eigenschaften.zerbrechlich;
            let zweihaendig = nwaffe.data.data.eigenschaften.zweihaendig;
            let kein_malus_nebenwaffe = nwaffe.data.data.eigenschaften.kein_malus_nebenwaffe;
            let hauptwaffe = nwaffe.data.data.hauptwaffe;
            let nebenwaffe = nwaffe.data.data.nebenwaffe;
            let schaden = 0;
            schaden += Number(nwaffe.data.data.dice_plus);
            // let kopflastig = eigenschaften.includes("Kopflastig");
            schaden += sb;
            if (kopflastig) {
                schaden += sb;
            }
            let at = 0;
            let vt = 0;
            let fertigkeit = nwaffe.data.data.fertigkeit;
            // console.log(fertigkeit);
            let talent = nwaffe.data.data.talent;
            // console.log(talent);
            at += Number(nwaffe.data.data.wm_at);
            vt += Number(nwaffe.data.data.wm_vt);
            let pw = data.data.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.data.data.pw;
            // console.log(pw);
            let pwt = data.data.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.data.data
                .pwt;
            // console.log(pwt);
            let taltrue = data.data.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.data.data.talente.find((x) => x.name == talent); // console.log(taltrue);
            if (typeof pw !== 'undefined') {
                // console.log(`${fertigkeit} ist defined`);
                if (typeof taltrue !== 'undefined') {
                    // console.log(`${talent} ist defined`);
                    at += pwt;
                    vt += pwt;
                } else {
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
            if (schwer_4 && KK < 4) {
                at -= 2;
                vt -= 2;
            } else if (schwer_8 && KK < 8) {
                at -= 2;
                vt -= 2;
            }
            if (zweihaendig) {
                if (hauptwaffe && !nebenwaffe) {
                    at -= 2;
                    vt -= 2;
                    schaden -= 4;
                } else if (!hauptwaffe && nebenwaffe) {
                    at -= 6;
                    vt -= 6;
                    schaden -= 4;
                }
            }
            if (nebenwaffe && !zweihaendig && !kein_malus_nebenwaffe && !hauptwaffe) {
                vt -= 4;
                at -= 4;
            }
            at -= be;
            vt -= be;
            // at += wundabzuege;
            // vt += wundabzuege;
            const mod_at = nwaffe.data.data.mod_at;
            const mod_vt = nwaffe.data.data.mod_vt;
            const mod_schaden = nwaffe.data.data.mod_schaden;
            if (!isNaN(mod_at)) {
                at += mod_at;
            }
            if (!isNaN(mod_vt)) {
                vt += mod_vt;
            }
            // if (!isNaN(mod_schaden)) { schaden += mod_schaden;}
            nwaffe.data.data.at = at;
            nwaffe.data.data.vt = vt;
            nwaffe.data.data.schaden = `${nwaffe.data.data.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                nwaffe.data.data.schaden = `${nwaffe.data.data.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }
            // if (nwaffe.data.data.eigenschaften.ruestungsbrechend) {
            //     // manoever_at.push("km_rust");
            //     // manoever_at.km_rust.possible = true;
            //     nwaffe.data.data.manoever.km_rust.possible = true;
            // }
            // nwaffe.data.data.manoever.km_rust.possible = nwaffe.data.data.eigenschaften.ruestungsbrechend == "true";
            nwaffe.data.data.manoever.km_rust.possible =
                nwaffe.data.data.eigenschaften.ruestungsbrechend;
            // if (nwaffe.data.data.eigenschaften.stumpf) {
            //     manoever_at.push("km_stsl");
            //     // manoever_at.km_stsl.possible = true;
            // }
            // console.log(nwaffe.data.data.eigenschaften.stumpf);
            // console.log(nwaffe.data.data.eigenschaften.stumpf == "true");
            // nwaffe.data.data.manoever.km_stsl.possible = nwaffe.data.data.eigenschaften.stumpf == "true";
            nwaffe.data.data.manoever.km_stsl.possible = nwaffe.data.data.eigenschaften.stumpf;
            if (nebenwaffe && hauptwaffe) {
                if (
                    HAUPTWAFFE.data.data.talent == 'Unbewaffnet' &&
                    NEBENWAFFE.data.data.talent == 'Unbewaffnet'
                ) {
                    // manoever_at.push("km_umkl");
                    // manoever_at.km_umkl.possible = true;
                    nwaffe.data.data.manoever.km_umkl.possible = true;
                }
            } else {
                nwaffe.data.data.manoever.km_umkl.possible = false;
            }
            // if (data.data.vorteil.kampf.find(x => x.name == "Ausfall")) {
            //     manoever_at.push("km_ausf");
            //     // manoever_at.km_ausf.possible = true;
            // }
            nwaffe.data.data.manoever.km_ausf.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Ausfall',
            );
            // nwaffe.data.data.manoever.km_ausf.possible = data.data.vorteil.kampf.includes(x => x.name == "Ausfall");
            // console.log("data.data.vorteil.kampf:");
            // console.log(data.data.vorteil.kampf);
            // console.log(data.data.vorteil.kampf.includes(x => x.name == "Ausfall"));
            // console.log(data.data.vorteil.kampf.find(x => x.name == "Ausfall"));
            // console.log(data.data.vorteil.kampf.indexOf(x => x.name == "Ausfall"));
            // console.log(data.data.vorteil.kampf.indexOf(x => x.name == "Ausfall") > -1);
            // console.log(data.data.vorteil.kampf.some(x => x.name == "Ausfall"));
            // if (data.data.vorteil.kampf.find(x => x.name == "Hammerschlag")) {
            //     manoever_at.push("km_hmsl");
            //     // manoever_at.km_hmsl.possible = true;
            // }
            nwaffe.data.data.manoever.km_hmsl.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Hammerschlag',
            );
            // nwaffe.data.data.manoever.km_hmsl.possible = data.data.vorteil.kampf.includes(x => x.name == "Hammerschlag");
            // if (data.data.vorteil.kampf.find(x => x.name == "Klingentanz")) {
            //     manoever_at.push("km_kltz");
            //     // manoever_at.km_kltz.possible = true;
            // }
            nwaffe.data.data.manoever.km_kltz.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Klingentanz',
            );
            // nwaffe.data.data.manoever.km_kltz.possible = data.data.vorteil.kampf.includes(x => x.name == "Klingentanz");
            // if (data.data.vorteil.kampf.find(x => x.name == "Niederwerfen")) {
            //     manoever_at.push("km_ndwf");
            //     // manoever_at.km_ndwf.possible = true;
            // }
            nwaffe.data.data.manoever.km_ndwf.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Niederwerfen',
            );
            // nwaffe.data.data.manoever.km_ndwf.possible = data.data.vorteil.kampf.includes(x => x.name == "Niederwerfen");
            // if (data.data.vorteil.kampf.find(x => x.name == "Sturmangriff")) {
            //     manoever_at.push("km_stag");
            //     // manoever_at.km_stag.possible = true;
            // }
            nwaffe.data.data.manoever.km_stag.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Sturmangriff',
            );
            // nwaffe.data.data.manoever.km_stag.possible = data.data.vorteil.kampf.includes(x => x.name == "Sturmangriff");
            // if (data.data.vorteil.kampf.find(x => x.name == "Todesstoß")) {
            //     manoever_at.push("km_tdst");
            //     // manoever_at.km_tdst.possible = true;
            // }
            nwaffe.data.data.manoever.km_tdst.possible = data.data.vorteil.kampf.some(
                (x) => x.name == 'Todesstoß',
            );
            // nwaffe.data.data.manoever.km_tdst.possible = data.data.vorteil.kampf.includes(x => x.name == "Todesstoß");
            // console.log(`AT: ${at} | VT: ${vt}`);
            // console.log(pw);
            // nwaffe.data.data.manoever_at = manoever_at;
            // nwaffe.data.data.manoever_vt = manoever_vt;
            // console.log(nwaffe.data.data.manoever);
            nwaffe.data.data.manoever.vlof.offensiver_kampfstil = data.data.vorteil.kampf.some(
                (x) => x.name == 'Offensiver Kampfstil',
            );
            nwaffe.data.data.manoever.kwut = data.data.vorteil.kampf.some(
                (x) => x.name == 'Kalte Wut',
            );
        }

        for (let item of data.data.fernkampfwaffen) {
            item.data.data.manoever =
                item.data.data.manoever ||
                foundry.utils.deepClone(CONFIG.ILARIS.manoever_fernkampf);
            let kein_reiter = item.data.data.eigenschaften.kein_reiter;
            let reittier =
                HAUPTWAFFE?.data.data.eigenschaften?.reittier ||
                NEBENWAFFE?.data.data.eigenschaften?.reittier;
            let niederwerfen = item.data.data.eigenschaften.niederwerfen;
            let niederwerfen_4 = item.data.data.eigenschaften.niederwerfen_4;
            let niederwerfen_8 = item.data.data.eigenschaften.niederwerfen_8;
            let schwer_4 = item.data.data.eigenschaften.schwer_4;
            let schwer_8 = item.data.data.eigenschaften.schwer_8;
            let stationaer = item.data.data.eigenschaften.stationaer;
            let stumpf = item.data.data.eigenschaften.stumpf;
            let umklammern_212 = item.data.data.eigenschaften.umklammern_212;
            let umklammern_416 = item.data.data.eigenschaften.umklammern_416;
            let umklammern_816 = item.data.data.eigenschaften.umklammern_816;
            let zweihaendig = item.data.data.eigenschaften.zweihaendig;
            let hauptwaffe = item.data.data.hauptwaffe;
            let nebenwaffe = item.data.data.nebenwaffe;
            let schaden = 0;
            schaden += Number(item.data.data.dice_plus);
            let fk = 0;
            let fertigkeit = item.data.data.fertigkeit;
            let talent = item.data.data.talent;
            fk += Number(item.data.data.wm_fk);
            let pw = data.data.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.data.data.pw;
            let pwt = data.data.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.data.data
                .pwt;
            let taltrue = data.data.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.data.data.talente.find((x) => x.name == talent);
            if (typeof pw !== 'undefined') {
                if (typeof taltrue !== 'undefined') {
                    fk += pwt;
                } else {
                    fk += pw;
                }
            }
            if (schwer_4 && KK < 4) {
                fk -= 2;
            } else if (schwer_8 && KK < 8) {
                fk -= 2;
            }
            if (nebenwaffe && !zweihaendig && !hauptwaffe) {
                fk -= 4;
            }
            fk -= be;
            // fk += wundabzuege;
            const mod_fk = item.data.data.mod_fk;
            const mod_schaden = item.data.data.mod_schaden;
            if (!isNaN(mod_fk)) {
                fk += mod_fk;
            }
            item.data.data.fk = fk;
            if (zweihaendig && ((hauptwaffe && !nebenwaffe) || (!hauptwaffe && nebenwaffe))) {
                item.data.data.fk = '-';
            } else if (kein_reiter && (hauptwaffe || nebenwaffe)) {
                // let reittier = false;
                // let reittier = HAUPTWAFFE?.data.data.eigenschaften?.reittier || NEBENWAFFE?.data.data.eigenschaften?.reittier;
                if (reittier && kein_reiter) {
                    item.data.data.fk = '-';
                }
            }
            item.data.data.schaden = `${item.data.data.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                item.data.data.schaden = `${item.data.data.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }

            // if (data.data.vorteil.kampf.find(x => x.name.includes("Defensiver Kampfstil"))) item.data.data.manoever.vldf.possible = true;
            if (data.data.vorteil.kampf.find((x) => x.name.includes('Schnellziehen')))
                item.data.data.manoever.fm_snls.possible = true;
            if (data.data.vorteil.kampf.find((x) => x.name.includes('Ruhige Hand')))
                item.data.data.manoever.fm_zlen.ruhige_hand = true;
            if (data.data.vorteil.kampf.find((x) => x.name.includes('Meisterschuss')))
                item.data.data.manoever.fm_msts.possible = true;
            if (true) item.data.data.manoever.fm_rust.possible = true;
            let rw = item.data.data.rw;
            item.data.data.manoever.rw['0'] = `${rw} Schritt`;
            item.data.data.manoever.rw['1'] = `${2 * rw} Schritt`;
            item.data.data.manoever.rw['2'] = `${4 * rw} Schritt`;
            if (data.data.vorteil.kampf.find((x) => x.name.includes('Reflexschuss')))
                item.data.data.manoever.rflx = true;
            if (hardcoded.getKampfstilStufe('rtk', data) >= 2)
                item.data.data.manoever.brtn.rtk = true;
            if (reittier) item.data.data.manoever.brtn.selected = true;
            // get status effects
            // licht lcht
            // console.log("bevor get_status_effects");
            // console.log(data);
            let ss1 = this.__getStatuseffectById(data, 'schlechtesicht1');
            let ss2 = this.__getStatuseffectById(data, 'schlechtesicht2');
            let ss3 = this.__getStatuseffectById(data, 'schlechtesicht3');
            let ss4 = this.__getStatuseffectById(data, 'schlechtesicht4');
            if (ss4) {
                item.data.data.manoever.lcht.selected = 4;
            } else if (ss3) {
                item.data.data.manoever.lcht.selected = 3;
            } else if (ss2) {
                item.data.data.manoever.lcht.selected = 2;
            } else if (ss1) {
                item.data.data.manoever.lcht.selected = 1;
            } else {
                item.data.data.manoever.lcht.selected = 0;
            }
            let lcht_angepasst = hardcoded.getAngepasst('Dunkelheit', data);
            // console.log(`licht angepasst: ${lcht_angepasst}`);
            item.data.data.manoever.lcht.angepasst = lcht_angepasst;
            item.data.data.manoever.kwut = data.data.vorteil.kampf.some(
                (x) => x.name == 'Kalte Wut',
            );
        }

        // "ohne": "Kein Kampfstil",
        // "bhk": "Beidhändiger Kampf",
        // "kvk": "Kraftvoller Kampf",
        // "pwk": "Parierwaffenkampf",
        // "rtk": "Reiterkampf",
        // "shk": "Schildkampf",
        // "snk": "Schneller Kampf"
        let stufe = hardcoded.getKampfstilStufe(selected_kampfstil, data);
        if (
            selected_kampfstil == 'bhk' &&
            typeof HAUPTWAFFE != 'undefined' &&
            typeof NEBENWAFFE != 'undefined'
        ) {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let nahkampfwaffe = true;
            let einhaendig = false;
            let kein_schild = false;
            let unterschiedlich = false;
            let kein_reiter = false;
            if (HAUPTWAFFE.type == 'nahkampfwaffe' && NEBENWAFFE.type == 'nahkampfwaffe') {
                nahkampfwaffe = true;
            }
            if (HAUPTWAFFE.id != NEBENWAFFE.id) {
                unterschiedlich = true;
            }
            if (
                !(
                    HAUPTWAFFE.data.data.eigenschaften.zweihaendig ||
                    NEBENWAFFE.data.data.eigenschaften.zweihaendig
                )
            ) {
                einhaendig = true;
            }
            if (nahkampfwaffe) {
                if (
                    !(
                        HAUPTWAFFE.data.data.eigenschaften.schild ||
                        NEBENWAFFE.data.data.eigenschaften.schild
                    )
                ) {
                    kein_schild = true;
                }
                if (
                    !(
                        HAUPTWAFFE.data.data.eigenschaften.reittier ||
                        NEBENWAFFE.data.data.eigenschaften.reittier
                    )
                ) {
                    kein_reiter = true;
                }
            }
            if (nahkampfwaffe && einhaendig && kein_schild && kein_reiter && unterschiedlich) {
                let at_hw = 0;
                let at_nw = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1');
                    at_hw += 1;
                    at_nw += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2');
                    at_hw += 1;
                    at_nw += 1;
                    if (!NEBENWAFFE.data.data.eigenschaften.kein_malus_nebenwaffe) {
                        at_nw += 4;
                        NEBENWAFFE.data.data.vt += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3');
                    at_hw += 1;
                    at_nw += 1;
                    HAUPTWAFFE.data.data.manoever.km_dppl.possible = true;
                    NEBENWAFFE.data.data.manoever.km_dppl.possible = true;
                    // HAUPTWAFFE.data.data.manoever_at.push("km_dppl");
                    // NEBENWAFFE.data.data.manoever_at.push("km_dppl");
                    // HAUPTWAFFE.data.manoever_at.km_dppl.possible = true;
                    // NEBENWAFFE.data.manoever_at.km_dppl.possible = true;
                }
                HAUPTWAFFE.data.data.at += at_hw;
                NEBENWAFFE.data.data.at += at_nw;
            }
        } else if (selected_kampfstil == 'kvk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let WAFFE = null;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && nebenwaffe) {
                if (HAUPTWAFFE.id == NEBENWAFFE.id) {
                    WAFFE = HAUPTWAFFE;
                }
            }
            if (hauptwaffe && !nebenwaffe) {
                WAFFE = HAUPTWAFFE;
            }
            if (!hauptwaffe && nebenwaffe) {
                WAFFE = NEBENWAFFE;
            }
            if (WAFFE) {
                if (WAFFE.type == 'nahkampfwaffe') {
                    if (WAFFE.data.data.eigenschaften.reittier == false) {
                        let schaden = 0;
                        if (stufe >= 1) {
                            console.log('Stufe 1');
                            schaden += 1;
                        }
                        if (stufe >= 2) {
                            console.log('Stufe 2');
                            schaden += 1;
                        }
                        if (stufe >= 3) {
                            console.log('Stufe 3');
                            schaden += 1;
                            WAFFE.data.data.manoever.km_befr.possible = true;
                            // WAFFE.data.data.manoever_at.push("km_befr");
                            // WAFFE.data.manoever_at.km_befr.possible=true;
                        }
                        schaden = '+'.concat(schaden);
                        WAFFE.data.data.schaden = WAFFE.data.data.schaden.concat(schaden);
                    }
                }
            }
        } else if (selected_kampfstil == 'pwk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let parierwaffe = false;
            let fernkampf = false;
            let reittier = false;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                if (HAUPTWAFFE.data.data.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (HAUPTWAFFE.data.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.data.data.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (NEBENWAFFE.data.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (hauptwaffe && HAUPTWAFFE.type == 'fernkampfwaffe') {
                fernkampf = true;
            }
            if (nebenwaffe && NEBENWAFFE.type == 'fernkampfwaffe') {
                fernkampf = true;
            }
            if (parierwaffe && !fernkampf && !reittier) {
                if (stufe >= 1) {
                    console.log('Stufe 1');
                }
                if (stufe >= 2) {
                    console.log('Stufe 2');
                    if (nebenwaffe) {
                        if (!NEBENWAFFE.data.data.eigenschaften.kein_malus_nebenwaffe) {
                            NEBENWAFFE.data.data.at += 4;
                            NEBENWAFFE.data.data.vt += 4;
                        }
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3');
                    if (hauptwaffe) HAUPTWAFFE.data.data.manoever.km_rpst.possible = true;
                    // if (hauptwaffe) HAUPTWAFFE.data.data.manoever_vt.push("km_rpst");
                    // if (hauptwaffe) HAUPTWAFFE.data.manoever_vt.km_rpst.possible=true;
                    if (nebenwaffe) NEBENWAFFE.data.data.manoever.km_rpst.possible = true;
                    // if (nebenwaffe) NEBENWAFFE.data.data.manoever_vt.push("km_rpst");
                    // if (nebenwaffe) NEBENWAFFE.data.manoever_vt.km_rpst.possible=true;
                }
            }
        } else if (selected_kampfstil == 'rtk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let reittier = false;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                if (HAUPTWAFFE.data.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.data.data.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (reittier && hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                let schaden = 0;
                let at = 0;
                let vt = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1 (Hauptwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2 (Hauptwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 3) {
                    console.log('Stufe 3 (Hauptwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                    if (HAUPTWAFFE.data.data.eigenschaften.reittier)
                        HAUPTWAFFE.data.data.manoever.km_uebr.possible = true;
                    // if (HAUPTWAFFE.data.data.eigenschaften.reittier) HAUPTWAFFE.data.data.manoever_at.push("km_uebr");
                    // if (HAUPTWAFFE.data.eigenschaften.reittier) HAUPTWAFFE.data.manoever_at.km_uebr.possible=true;
                }
                schaden = '+'.concat(schaden);
                HAUPTWAFFE.data.data.at += at;
                HAUPTWAFFE.data.data.vt += vt;
                HAUPTWAFFE.data.data.schaden = HAUPTWAFFE.data.data.schaden.concat(schaden);
            }
            if (
                reittier &&
                nebenwaffe &&
                NEBENWAFFE.type == 'nahkampfwaffe' &&
                (!hauptwaffe || HAUPTWAFFE.id != NEBENWAFFE.id)
            ) {
                let schaden = 0;
                let at = 0;
                let vt = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1 (Nebenwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2 (Nebenwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                    if (
                        !NEBENWAFFE.data.data.eigenschaften.kein_malus_nebenwaffe &&
                        NEBENWAFFE.data.data.eigenschaften.reittier
                    ) {
                        at += 4;
                        vt += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3 (Nebenwaffe)');
                    schaden += 1;
                    at += 1;
                    vt += 1;
                    if (NEBENWAFFE.data.data.eigenschaften.reittier)
                        NEBENWAFFE.data.data.manoever.km_uebr.possible = true;
                    // if (NEBENWAFFE.data.data.eigenschaften.reittier) NEBENWAFFE.data.data.manoever_at.push("km_uebr");
                    // if (NEBENWAFFE.data.eigenschaften.reittier) NEBENWAFFE.data.manoever_at.km_uebr.possible=true;
                }
                schaden = '+'.concat(schaden);
                NEBENWAFFE.data.data.at += at;
                NEBENWAFFE.data.data.vt += vt;
                NEBENWAFFE.data.data.schaden = NEBENWAFFE.data.data.schaden.concat(schaden);
            }
        } else if (selected_kampfstil == 'shk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let schild = false;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                if (HAUPTWAFFE.data.data.eigenschaften.schild) {
                    schild = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.data.data.eigenschaften.schild) {
                    schild = true;
                }
            }
            if (hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe' && schild) {
                let vt = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1 (Hauptwaffe)');
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2 (Hauptwaffe)');
                    vt += 1;
                }
                if (stufe >= 3) {
                    console.log('Stufe 3 (Hauptwaffe)');
                    vt += 1;
                    HAUPTWAFFE.data.data.manoever.km_shwl.possible = true;
                    // HAUPTWAFFE.data.data.manoever_vt.push("km_shwl");
                }
                HAUPTWAFFE.data.data.vt += vt;
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe' && schild) {
                let vt = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1 (Nebenwaffe)');
                    vt += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2 (Nebenwaffe)');
                    vt += 1;
                    if (
                        !NEBENWAFFE.data.data.eigenschaften.kein_malus_nebenwaffe &&
                        NEBENWAFFE.data.data.eigenschaften.schild
                    ) {
                        vt += 4;
                        NEBENWAFFE.data.data.at += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3 (Nebenwaffe)');
                    vt += 1;
                    NEBENWAFFE.data.data.manoever.km_shwl.possible = true;
                    // NEBENWAFFE.data.data.manoever_vt.push("km_shwl");
                }
                NEBENWAFFE.data.data.vt += vt;
            }
        } else if (selected_kampfstil == 'snk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let WAFFE = null;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && !nebenwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                console.log('Hauptwaffe nahkampf');
                if (!HAUPTWAFFE.data.data.eigenschaften.reittier) {
                    WAFFE = HAUPTWAFFE;
                    console.log('step 1');
                }
            } else if (!hauptwaffe && nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                console.log('Nebenwaffe nahkampf');
                if (!NEBENWAFFE.data.data.eigenschaften.reittier) {
                    WAFFE = NEBENWAFFE;
                    console.log('step 2');
                }
            } else if (
                hauptwaffe &&
                nebenwaffe &&
                HAUPTWAFFE.type == 'nahkampfwaffe' &&
                HAUPTWAFFE.id == NEBENWAFFE.id
            ) {
                console.log('Nahkampfwaffen identisch');
                if (!HAUPTWAFFE.data.data.eigenschaften.reittier) {
                    WAFFE = HAUPTWAFFE;
                    console.log('step 3');
                }
            }
            if (WAFFE) {
                console.log('step 4');
                let at = 0;
                if (stufe >= 1) {
                    console.log('Stufe 1');
                    at += 1;
                }
                if (stufe >= 2) {
                    console.log('Stufe 2');
                    at += 1;
                }
                if (stufe >= 3) {
                    console.log('Stufe 3');
                    at += 1;
                    WAFFE.data.data.manoever.km_utlf.possible = true;
                    // WAFFE.data.data.manoever_vt.push("km_utlf");
                }
                WAFFE.data.data.at += at;
            }
        }
    }

    _calculateUebernatuerlichProbendiag(data) {
        // data.data.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten;
        // data.data.uebernatuerlich.zauber = magie_talente;
        // data.data.uebernatuerlich.liturgien = karma_talente;
        // data.data.vorteil.magie = vorteil_magie;
        // data.data.vorteil.zaubertraditionen = vorteil_zaubertraditionen;
        // data.data.vorteil.karma = vorteil_karma;
        // data.data.vorteil.geweihtentradition = vorteil_geweihtetraditionen;
        // let be = data.data.abgeleitete.be;
        for (let item of data.data.uebernatuerlich.zauber) {
            if (item.data.data.manoever == undefined) {
                console.log('Ich überschreibe Magie Manöver');
            }
            item.data.data.manoever =
                item.data.data.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_magie);
            console.log(item.data.data);
            // mm_erzw: 'Erzwingen',
            if (hardcoded.magieErzwingenPossible(data)) {
                console.log('Erzwingen aktiviert');
                item.data.data.manoever.mm_erzw.possible = true;
            }
            // mm_kosp: 'Kosten sparen',
            if (hardcoded.magieKostenSparenPossible(data)) {
                item.data.data.manoever.mm_kosp.possible = true;
            }
            // mm_ztls: 'Zeit lassen',
            if (hardcoded.magieZeitLassenPossible(data)) {
                item.data.data.manoever.mm_ztls.possible = true;
            }
            // mm_zere: 'Zeremonie',
            if (hardcoded.magieZeremoniePossible(data)) {
                item.data.data.manoever.mm_zere.possible = true;
            }
            // mm_opfe: 'Opferung',
            if (hardcoded.magieOpferungPossible(data)) {
                item.data.data.manoever.mm_opfe.possible = true;
            }
        }
        for (let item of data.data.uebernatuerlich.liturgien) {
            if (item.data.data.manoever == undefined) {
                console.log('Ich überschreibe Karma Manöver');
            }
            item.data.data.manoever =
                item.data.data.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_karma);
            console.log(item.data.data);
            // mm_kosp: 'Kosten sparen',
            if (hardcoded.karmaKostenSparenPossible(data)) {
                item.data.data.manoever.lm_kosp.possible = true;
            }
            // mm_zere: 'Zeremonie',
            if (hardcoded.karmaZeremoniePossible(data)) {
                item.data.data.manoever.lm_zere.possible = true;
            }
            // mm_opfe: 'Opferung',
            if (hardcoded.karmaOpferungPossible(data)) {
                item.data.data.manoever.lm_opfe.possible = true;
            }
        }
    }
    _sortItems(data) {
        console.log('_sortItems');
        // koennen  alle noetigen variablen nicht direkt ins objekt geschrieben werden
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
        let eigenschaften = [];  // kreatur only
        let angriffe = [];  // kreatur only
        let infos = [];  // kreatur only
        let vorteile = [];  // TODO: gleich machen fuer helden und kreaturen
        let freietalente = [];
        let unsorted = [];
        let speicherplatz_list = ['tragend', 'mitführend'];
        let item_tragend = [];
        let item_mitfuehrend = [];
        let item_list = [];
        let item_list_tmp = [];
        for (let i of data.items) {
            // let item = i.data;
            if (i.type == 'ruestung') {
                // console.log("Rüstung gefunden");
                // console.log(i);
                i.data.data.bewahrt_auf = [];
                if (i.data.data.gewicht < 0) {
                    i.data.data.gewicht_summe = 0;
                    speicherplatz_list.push(i.name);
                    item_list.push(i);
                } else item_list_tmp.push(i);
                ruestungen.push(i);
            } else if (i.type == 'nahkampfwaffe') {
                // console.log("Nahkampfwaffe gefunden");
                // console.log(i);
                i.data.data.bewahrt_auf = [];
                if (i.data.data.gewicht < 0) {
                    i.data.data.gewicht_summe = 0;
                    speicherplatz_list.push(i.name);
                    item_list.push(i);
                } else item_list_tmp.push(i);
                nahkampfwaffen.push(i);
            } else if (i.type == 'fernkampfwaffe') {
                // console.log("Fernkampfwaffe gefunden");
                // console.log(i);
                i.data.data.bewahrt_auf = [];
                if (i.data.data.gewicht < 0) {
                    i.data.data.gewicht_summe = 0;
                    speicherplatz_list.push(i.name);
                    item_list.push(i);
                } else item_list_tmp.push(i);
                fernkampfwaffen.push(i);
            } else if (i.type == 'gegenstand') {
                i.data.data.bewahrt_auf = [];
                if (i.data.data.gewicht < 0) {
                    i.data.data.gewicht_summe = 0;
                    speicherplatz_list.push(i.name);
                    item_list.push(i);
                } else item_list_tmp.push(i);
            } else if (i.type == 'fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                i.data.data.talente = [];
                profan_fertigkeiten.push(i);
                profan_fertigkeit_list.push(i.name);
                // profan_talente[i.name] = [];
            } else if (i.type == 'talent') {
                profan_talente.push(i);
            } else if (i.type == 'freie_fertigkeit') {
                freie_fertigkeiten.push(i);
            } else if (i.type == 'uebernatuerliche_fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                uebernatuerliche_fertigkeiten.push(i);
            } else if (i.type == 'zauber') {
                // console.log("Magietalent gefunden");
                // console.log(i);
                magie_talente.push(i);
            }
            // else if (i.type == "karma_fertigkeit") {
            //     // console.log("Karmafertigkeit gefunden");
            //     // console.log(i);
            //     karma_fertigkeiten.push(i);
            // }
            else if (i.type == 'liturgie') {
                // console.log("Karmatalent gefunden");
                // console.log(i);
                karma_talente.push(i);
            } else if (i.type == 'vorteil') {
                if (data.type == "kreatur") vorteile.push(i);
                else if (i.data.data.gruppe == 0) vorteil_allgemein.push(i);
                else if (i.data.data.gruppe == 1) vorteil_profan.push(i);
                else if (i.data.data.gruppe == 2) vorteil_kampf.push(i);
                else if (i.data.data.gruppe == 3) vorteil_kampfstil.push(i);
                else if (i.data.data.gruppe == 4) vorteil_magie.push(i);
                else if (i.data.data.gruppe == 5) vorteil_zaubertraditionen.push(i);
                else if (i.data.data.gruppe == 6) vorteil_karma.push(i);
                else if (i.data.data.gruppe == 7) vorteil_geweihtetraditionen.push(i);
                // else vorteil_allgemein.push(i);
            } else if (i.type == 'eigenheit') {
                eigenheiten.push(i);
            } else if (i.type == 'eigenschaft') { // kreatur only
                console.log(i);
                eigenschaften.push(i);
            } else if (i.type == 'angriff') { // kreatur only
                angriffe.push(i);
            } else if (i.type == 'info') { // kreatur only
                infos.push(i);
            } else if (i.type == 'freiestalent') {
                freietalente.push(i);
            } else unsorted.push(i);
        }
        ruestungen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        nahkampfwaffen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        fernkampfwaffen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        item_list.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        item_list_tmp.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        uebernatuerliche_fertigkeiten.sort((a, b) =>
            a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
        );
        uebernatuerliche_fertigkeiten.sort((a, b) =>
            a.data.data.gruppe > b.data.data.gruppe
                ? 1
                : b.data.data.gruppe > a.data.data.gruppe
                ? -1
                : 0,
        );
        // magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        magie_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        magie_talente.sort((a, b) =>
            a.data.data.gruppe > b.data.data.gruppe
                ? 1
                : b.data.data.gruppe > a.data.data.gruppe
                ? -1
                : 0,
        );
        // karma_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // karma_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        karma_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        karma_talente.sort((a, b) =>
            a.data.data.gruppe > b.data.data.gruppe
                ? 1
                : b.data.data.gruppe > a.data.data.gruppe
                ? -1
                : 0,
        );
        profan_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        profan_fertigkeiten.sort((a, b) =>
            a.data.data.gruppe > b.data.data.gruppe
                ? 1
                : b.data.data.gruppe > a.data.data.gruppe
                ? -1
                : 0,
        );
        freie_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        freie_fertigkeiten.sort((a, b) =>
            a.data.data.gruppe > b.data.data.gruppe
                ? 1
                : b.data.data.gruppe > a.data.data.gruppe
                ? -1
                : 0,
        );
        vorteil_allgemein.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_profan.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_kampf.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_kampfstil.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_magie.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_zaubertraditionen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_karma.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        vorteil_geweihtetraditionen.sort((a, b) =>
            a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
        );
        vorteile.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        eigenheiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));

        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'name' );
        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'data.gruppe' );

        for (let i of profan_talente) {
            // this.updateEmbeddedEntity('OwnedItem', {
            //     _id: i._id,
            //     data: {
            //         fertigkeit_list: profan_fertigkeit_list,
            //     }
            // });
            // this.updateOwnedItem({
            //     _id: i._id,
            //     data: {
            //         fertigkeit_list: profan_fertigkeit_list,
            //     }
            // });
            // i.data.fertigkeit_list = profan_fertigkeit_list;
            if (profan_fertigkeit_list.includes(i.data.data.fertigkeit)) {
                profan_fertigkeiten
                    .find((x) => x.name == i.data.data.fertigkeit)
                    .data.data.talente.push(i);
            } else {
                profan_talente_unsorted.push(i);
            }
        }

        data.data.getragen = 0;
        for (let i of item_list_tmp) {
            let aufbewahrung = i.data.data.aufbewahrungs_ort;
            if (aufbewahrung == 'tragend') {
                item_tragend.push(i);
            } else if (aufbewahrung == 'mitführend') {
                item_mitfuehrend.push(i);
                data.data.getragen += i.data.data.gewicht;
            } else if (speicherplatz_list.includes(aufbewahrung)) {
                // item_list.find(x => x.name == aufbewahrung).data.data.bewahrt_auf.push(i);
                let idx = item_list.indexOf(item_list.find((x) => x.name == aufbewahrung));
                item_list[idx].data.data.bewahrt_auf.push(i);
                item_list[idx].data.data.gewicht_summe += i.data.data.gewicht;
            } else {
                i.data.data.aufbewahrungs_ort == 'mitführend';
                item_mitfuehrend.push(i);
                data.data.getragen += i.data.data.gewicht;
            }
        }

        // data.magie = {};
        // data.karma = {};
        data.data.profan = {};
        data.data.uebernatuerlich = {};
        data.data.vorteil = {};
        data.data.inventar = {};
        data.data.inventar.tragend = item_tragend;
        data.data.inventar.mitfuehrend = item_mitfuehrend;
        data.data.inventar.item_list = item_list;
        data.data.ruestungen = ruestungen;
        data.data.nahkampfwaffen = nahkampfwaffen;
        data.data.fernkampfwaffen = fernkampfwaffen;
        data.data.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten;
        data.data.uebernatuerlich.zauber = magie_talente;
        data.data.uebernatuerlich.liturgien = karma_talente;
        // data.data.magie.talente = magie_talente;
        // data.data.karma.fertigkeiten = karma_fertigkeiten;
        // data.data.karma.talente = karma_talente;
        data.data.profan.fertigkeiten = profan_fertigkeiten;
        data.data.profan.talente_unsorted = profan_talente_unsorted;
        data.data.profan.freie = freie_fertigkeiten;
        // vorteil singular? inkonsistent zu den anderen listen
        // fuer kreaturen waere es wesentlich einfacher alles in einer liste zu sammeln
        // und die kategorie als property zu behalten (kann ja auch nach gefiltert werden)
        // in data.vorteile leg ich erstmal alle ab als zwischenloesung ;) 
        data.data.vorteil.allgemein = vorteil_allgemein;
        data.data.vorteil.profan = vorteil_profan;
        data.data.vorteil.kampf = vorteil_kampf;
        data.data.vorteil.kampfstil = vorteil_kampfstil;
        data.data.vorteil.magie = vorteil_magie;
        data.data.vorteil.zaubertraditionen = vorteil_zaubertraditionen;
        data.data.vorteil.karma = vorteil_karma;
        data.data.vorteil.geweihtentradition = vorteil_geweihtetraditionen;
        data.data.eigenheiten = eigenheiten;
        data.data.unsorted = unsorted;
        data.data.misc = data.data.misc || {};
        data.data.misc.profan_fertigkeit_list = profan_fertigkeit_list;
        data.data.misc.uebernatuerlich_fertigkeit_list =
            this.__getAlleUebernatuerlichenFertigkeiten(data);
        data.data.misc.speicherplatz_list = speicherplatz_list;
        if (data.type == "kreatur") {
            data.data.eigenschaften = eigenschaften;
            data.data.angriffe = angriffe;
            data.data.vorteile = vorteile;
            data.data.infos = infos;
            data.data.freietalente = freietalente;
        }
        // let actor = game.actors.get(data._id);
        // // console.log(actor);
        // // eigentlich async:
        // if (actor) {
        //     actor.update({ "data.data.gesundheit.hp.value": new_hp });
        // }
    }
}
