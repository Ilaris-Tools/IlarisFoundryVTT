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
        this._calculateWerteFertigkeiten(data);
        this._calculateWounds(data);
        this._calculateWundschwellenRuestung(data);
        this._calculateProfanFertigkeiten(data);
        this._calculateUebernaturlichFertigkeiten(data);
        this._calculateUebernaturlichTalente(data); //Nach Uebernatürliche Fertigkeiten
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
        for (let fertigkeit of data.magie.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.basis = basiswert;
            fertigkeit.data.pw = basiswert + Number(fertigkeit.data.fw);
        }
        for (let fertigkeit of data.karma.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_0].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_1].wert;
            basiswert = basiswert + data.data.attribute[fertigkeit.data.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.data.basis = basiswert;
            fertigkeit.data.pw = basiswert + Number(fertigkeit.data.fw);
        }
    }


    __getAlleMagieFertigkeiten(data) {
        let fertigkeit_list = [];
        for (let fertigkeit of data.magie.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name);
        }
        return fertigkeit_list;
    }

    __getAlleKarmaFertigkeiten(data) {
        let fertigkeit_list = [];
        for (let fertigkeit of data.karma.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name);
        }
        return fertigkeit_list;
    }

    _calculateUebernaturlichTalente(data) {
        console.log("Berechne übernatürliche Talente");
        let fertigkeit_uebereinstimmung = [];
        const alleMagieFertigkeiten = this.__getAlleMagieFertigkeiten(data);
        const alleKarmaFertigkeiten = this.__getAlleKarmaFertigkeiten(data);
        for (let talent of data.magie.talente) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(",");
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                for (let actor_fertigkeit of data.magie.fertigkeiten) {
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
                    fertigkeit_actor: alleMagieFertigkeiten,
                    pw: max_pw
                }
            });
        }
        for (let talent of data.karma.talente) {
            let max_pw = -1;
            const fertigkeit_string = talent.data.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(",");
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                for (let actor_fertigkeit of data.karma.fertigkeiten) {
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
                    fertigkeit_actor: alleKarmaFertigkeiten,
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
        let einschraenkungen = data.data.gesundheit.wunden.wert + data.data.gesundheit.erschoepfung.wert;
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
        data.data.abgeleitete.ws = ws;
        data.data.abgeleitete.ws_stern = ws;
        data.data.abgeleitete.be = 0;
        data.data.abgeleitete.ws_beine = ws;
        data.data.abgeleitete.ws_larm = ws;
        data.data.abgeleitete.ws_rarm = ws;
        data.data.abgeleitete.ws_bauch = ws;
        data.data.abgeleitete.ws_brust = ws;
        data.data.abgeleitete.ws_kopf = ws;
        for (let ruestung of data.ruestungen) {
            // console.log(ruestung.data.aktiv);
            if (ruestung.data.aktiv == true) {
                data.data.abgeleitete.ws_stern += ruestung.data.rs;
                data.data.abgeleitete.be += ruestung.data.be;
                data.data.abgeleitete.ws_beine += ruestung.data.rs_beine;
                data.data.abgeleitete.ws_larm += ruestung.data.rs_larm;
                data.data.abgeleitete.ws_rarm += ruestung.data.rs_rarm;
                data.data.abgeleitete.ws_bauch += ruestung.data.rs_bauch;
                data.data.abgeleitete.ws_brust += ruestung.data.rs_brust;
                data.data.abgeleitete.ws_kopf += ruestung.data.rs_kopf;
            }
        }
    }

    _sortItems(data) {
        console.log("In sort_Items");
        // console.log(data);
        let ruestungen = [];
        let profan_fertigkeiten = [];
        let profan_talente = [];
        let profan_fertigkeit_list = [];
        let profan_talente_unsorted = [];
        let magie_fertigkeiten = [];
        let magie_talente = [];
        let karma_fertigkeiten = [];
        let karma_talente = [];
        for (let i of data.items) {
            // let item = i.data;
            if (i.type == "ruestung") {
                // console.log("Rüstung gefunden");
                // console.log(i);
                ruestungen.push(i);
            }
            else if (i.type == "profan_fertigkeit") {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                i.data.talente = [];
                profan_fertigkeiten.push(i);
                profan_fertigkeit_list.push(i.name);
                // profan_talente[i.name] = [];
            }
            else if (i.type == "profan_talent") {
                profan_talente.push(i);
            }
            else if (i.type == "magie_fertigkeit") {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                magie_fertigkeiten.push(i);
            }
            else if (i.type == "magie_talent") {
                // console.log("Magietalent gefunden");
                // console.log(i);
                magie_talente.push(i);
            }
            else if (i.type == "karma_fertigkeit") {
                // console.log("Karmafertigkeit gefunden");
                // console.log(i);
                karma_fertigkeiten.push(i);
            }
            else if (i.type == "karma_talent") {
                // console.log("Karmatalent gefunden");
                // console.log(i);
                karma_talente.push(i);
            }
        }
        magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        magie_talente.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        karma_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        karma_talente.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        profan_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        profan_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));

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

        data.magie = {};
        data.karma = {};
        data.profan = {};
        data.ruestungen = ruestungen;
        data.magie.fertigkeiten = magie_fertigkeiten;
        data.magie.talente = magie_talente;
        data.karma.fertigkeiten = karma_fertigkeiten;
        data.karma.talente = karma_talente;
        data.profan.fertigkeiten = profan_fertigkeiten;
        data.profan.talente_unsorted = profan_talente_unsorted;
        // console.log(data);
        // let item = i.data;
        // i.img = i.img || DEFAULT_TOKEN;
        // // Append to gear.
        // if (i.type === 'item') {
        //     gear.push(i);
        // }
        // // Append to features.
        // else if (i.type === 'feature') {
        //     features.push(i);
        // }
        // // Append to spells.
        // else if (i.type === 'spell') {
        //     if (i.data.spellLevel != undefined) {
        //         spells[i.data.spellLevel].push(i);
        //     }
        // }
        // Assign and return
        // actorData.gear = gear;
        // actorData.features = features;
        // actorData.spells = spells;
    }

}
