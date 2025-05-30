import * as hardcoded from './hardcodedvorteile.js';

export class IlarisActor extends Actor {
    async _preCreate(data, options, user) {
        //this.data.update(data);  // should this be called here?
        await super._preCreate(data, options, user);
        // console.log(data);
    }

    prepareData() {
        console.log('prepareData');
        super.prepareData();
    }

    prepareEmbeddedEntities() {
        console.log('prepareEmbeddedEntities');
        super.prepareEmbeddedEntities();
    }

    prepareDerivedData() {
        console.log('prepareDerivedData');
        super.prepareDerivedData();
    }

    prepareBaseData() {
        console.log('prepareBaseData');
        super.prepareBaseData();
    }

    __getStatuseffectById(data, statusId) {
        let iterator = data.effects.values();
        for (const effect of iterator) {
            if (effect.flags.core.statusId == statusId) {
                return true;
            }
        }
        return false;
    }


    _calculatePWAttribute(systemData) {
        for (let attribut of Object.values(systemData.attribute)) {
            attribut.pw = 2 * attribut.wert;
        }
    }

    _calculateProfanFertigkeiten(actor) {
        console.log('Berechne Profane Fertigkeiten');
        for (let fertigkeit of actor.profan.fertigkeiten) {
            let basiswert = 0;
            // console.log(data.data.attribute);
            // console.log(fertigkeit.data);
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_0].wert;
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_1].wert;
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.system.basis = basiswert;
            fertigkeit.system.pw = basiswert + Math.round(Number(fertigkeit.system.fw) * 0.5);
            fertigkeit.system.pwt = basiswert + Number(fertigkeit.system.fw);
        }
    }

    // Werte werden nicht gespeichert, sonder jedes mal neu berechnet?
    _calculateUebernaturlichFertigkeiten(actor) {
        console.log('Berechne Übernatürliche Fertigkeiten');
        for (let fertigkeit of actor.uebernatuerlich.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0;
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_0].wert;
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_1].wert;
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_2].wert;
            basiswert = Math.round(basiswert / 3);
            fertigkeit.system.basis = basiswert;
            fertigkeit.system.pw = basiswert + Number(fertigkeit.system.fw);
        }
    }

    __getAlleUebernatuerlichenFertigkeiten(actor) {
        let fertigkeit_list = [];
        for (let fertigkeit of actor.uebernatuerlich.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name);
        }
        return fertigkeit_list;
    }

    _calculateUebernaturlichTalente(actor) {
        console.log('Berechne übernatürliche Talente');
        let fertigkeit_uebereinstimmung = [];
        // const alleMagieFertigkeiten = this.__getAlleMagieFertigkeiten(data);
        // const alleKarmaFertigkeiten = this.__getAlleKarmaFertigkeiten(data);
        // const alleFertigkeiten = this.__getAlleUebernatuerlichenFertigkeiten(data);
        // for (let talent of data.magie.talente) {
        for (let talent of actor.uebernatuerlich.zauber) {
            let max_pw = -1;
            const fertigkeit_string = talent.system.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(',');
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.magie.fertigkeiten) {
                for (let actor_fertigkeit of actor.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.system.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.system.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    } else if (talent.system.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.system.pw;
                    }
                }
            }
            talent.system.pw = max_pw;
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
        for (let talent of actor.uebernatuerlich.liturgien) {
            let max_pw = -1;
            const fertigkeit_string = talent.system.fertigkeiten;
            let fertigkeit_array = fertigkeit_string.split(',');
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim();
                // for (let actor_fertigkeit of data.karma.fertigkeiten) {
                for (let actor_fertigkeit of actor.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.system.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.system.pw;
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp;
                        }
                    } else if (talent.system.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.system.pw;
                    }
                }
            }
            talent.system.pw = max_pw;
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

    _calculateWounds(systemData) {
        console.log('Berechne Wunden');
        let einschraenkungen = Math.floor(systemData.gesundheit.wunden + systemData.gesundheit.erschoepfung);
        let gesundheitzusatz = ``;
        // let old_hp = data.data.gesundheit.hp.value;
        let new_hp = systemData.gesundheit.hp.max - einschraenkungen;
        if (einschraenkungen == 0) {
            systemData.gesundheit.wundabzuege = 0;
            gesundheitzusatz = `(Volle Gesundheit)`;
        } else if (einschraenkungen > 0 && einschraenkungen <= 2) {
            systemData.gesundheit.wundabzuege = 0;
            gesundheitzusatz = `(Kaum ein Kratzer)`;
        } else if (einschraenkungen >= 3 && einschraenkungen <= 4) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Verwundet)`;
        } else if (einschraenkungen >= 5 && einschraenkungen <= 8) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Kampfunfähig)`;
        } else if (einschraenkungen >= 9) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2;
            gesundheitzusatz = `(Tot)`;
        } else {
            systemData.gesundheit.display = 'Fehler bei Berechnung der Wundabzüge';
            return;
        }
        if (systemData.gesundheit.wundenignorieren > 0) {
            systemData.gesundheit.wundabzuege = 0;
        }
        systemData.gesundheit.display = ``;
        if (systemData.gesundheit.wundabzuege == 0) {
            systemData.gesundheit.display += `-`;
        }
        systemData.gesundheit.display +=
            `${systemData.gesundheit.wundabzuege} auf alle Proben ` + gesundheitzusatz;
        // if (old_hp != new_hp) {
        systemData.gesundheit.hp.value = new_hp;
        //     // console.log(data);
        //     let actor = game.actors.get(data._id);
        //     // console.log(actor);
        //     // eigentlich async:
        //     if (actor) {
        //         actor.update({ "data.gesundheit.hp.value": new_hp });
        //     }
        // }
    }

    _calculateFear(systemData) {
        console.log('Berechne Furchteffekt');
        let furchtzusatz = ``;
        if (systemData.furcht.furchtstufe == 0) {
            systemData.furcht.furchtabzuege = 0;
            furchtzusatz = `(keine Furcht)`;
        } else if (systemData.furcht.furchtstufe == 1) {
            systemData.furcht.furchtabzuege = -2;
            furchtzusatz = `(Furcht I)`;
        } else if (systemData.furcht.furchtstufe == 2) {
            systemData.furcht.furchtabzuege = -4;
            furchtzusatz = `(Furcht II)`;
        } else if (systemData.furcht.furchtstufe == 3) {
            systemData.furcht.furchtabzuege = -8;
            furchtzusatz = `(Furcht III)`;
        } else if (systemData.furcht.furchtstufe >= 4) {
            systemData.furcht.furchtabzuege = -8;
            furchtzusatz = `(Furcht IV)`;
        } else {
            systemData.furcht.furchtstufe = 0;
            systemData.furcht.display = 'Fehler bei Berechnung der Furchtabzüge';
            return;
        }
        systemData.furcht.display = ``;
        if (systemData.furcht.furchtabzuege == 0) {
            systemData.furcht.display += `-`;
        }
        systemData.furcht.display +=
            `${systemData.furcht.furchtabzuege} auf alle Proben ` + furchtzusatz;
    }

    _calculateWundschwellenRuestung(actor) {
        console.log('Berechne Rüstung');
        let ws = 4 + Math.floor(actor.system.attribute.KO.wert / 4);
        ws = hardcoded.wundschwelle(ws, actor);
        // let ws_stern = ws;
        let ws_stern = hardcoded.wundschwelleStern(ws, actor);
        let be = 0;
        let ws_beine = ws_stern;
        let ws_larm = ws_stern;
        let ws_rarm = ws_stern;
        let ws_bauch = ws_stern;
        let ws_brust = ws_stern;
        let ws_kopf = ws_stern;
        for (let ruestung of actor.ruestungen) {
            if (ruestung.system.aktiv == true) {
                ws_stern += ruestung.system.rs;
                be += ruestung.system.be;
                ws_beine += ruestung.system.rs_beine;
                ws_larm += ruestung.system.rs_larm;
                ws_rarm += ruestung.system.rs_rarm;
                ws_bauch += ruestung.system.rs_bauch;
                ws_brust += ruestung.system.rs_brust;
                ws_kopf += ruestung.system.rs_kopf;
            }
        }
        be = hardcoded.behinderung(be, actor);
        actor.system.abgeleitete.ws = ws;
        actor.system.abgeleitete.ws_stern = ws_stern;
        actor.system.abgeleitete.be = be;
        actor.system.abgeleitete.ws_beine = ws_beine;
        actor.system.abgeleitete.ws_larm = ws_larm;
        actor.system.abgeleitete.ws_rarm = ws_rarm;
        actor.system.abgeleitete.ws_bauch = ws_bauch;
        actor.system.abgeleitete.ws_brust = ws_brust;
        actor.system.abgeleitete.ws_kopf = ws_kopf;
    }

    _calculateModifikatoren(systemData) {
        let globalermod = hardcoded.globalermod(systemData);
        systemData.abgeleitete.globalermod = globalermod;
        // displayed text for nahkampfmod
        systemData.abgeleitete.nahkampfmoddisplay = ``;
        if (systemData.modifikatoren.nahkampfmod == 0){
            systemData.abgeleitete.nahkampfmoddisplay += `-`;
        }
        else if (systemData.modifikatoren.nahkampfmod > 0) {
            systemData.abgeleitete.nahkampfmoddisplay += `+`;
        }
        // let nahkampfmodgesamt = data.data.modifikatoren.nahkampfmod + data.data.modifikatoren.globalermod;
        systemData.abgeleitete.nahkampfmoddisplay += `${systemData.modifikatoren.nahkampfmod} auf AT/VT durch Status am Token`;
        // displayed text for globalermod (auf alle Proben insgesamt)
        systemData.abgeleitete.globalermoddisplay = ``;
        if (systemData.abgeleitete.globalermod == 0){
            systemData.abgeleitete.globalermoddisplay += `-`;
        }
        else if (systemData.abgeleitete.globalermod > 0) {
            systemData.abgeleitete.globalermoddisplay += `+`;
        }
        systemData.abgeleitete.globalermoddisplay += `${systemData.abgeleitete.globalermod} auf alle Proben (insgesamt)`;
    }

    _calculateAbgeleitete(actor) {
        console.log('Berechne abgeleitete Werte');
        let ini = actor.system.attribute.IN.wert;
        ini = hardcoded.initiative(ini, actor);
        actor.system.abgeleitete.ini = ini;
        actor.system.initiative = ini + 0.5;
        let mr = 4 + Math.floor(actor.system.attribute.MU.wert / 4);
        mr = hardcoded.magieresistenz(mr, actor);
        actor.system.abgeleitete.mr = mr;
        let traglast_intervall = actor.system.attribute.KK.wert;
        traglast_intervall = traglast_intervall >= 1 ? traglast_intervall : 1;
        actor.system.abgeleitete.traglast_intervall = traglast_intervall;
        let traglast = 2 * actor.system.attribute.KK.wert;
        traglast = traglast >= 1 ? traglast : 1;
        actor.system.abgeleitete.traglast = traglast;
        let summeGewicht = 0;
        for (let i of actor.inventar.mitfuehrend) {
            summeGewicht += i.system.gewicht;
        }
        actor.system.getragen = summeGewicht;
        let be_mod = hardcoded.beTraglast(actor.system);
        actor.system.abgeleitete.be += be_mod;
        actor.system.abgeleitete.be_traglast = be_mod;
        let dh = hardcoded.durchhalte(actor);
        // let dh = systemData.attribute.KO.wert - (2 * systemData.abgeleitete.be);
        // dh = hardcoded.durchhalte(dh, systemData);
        // dh = (dh > 1) ? dh : 1;
        actor.system.abgeleitete.dh = dh;
        let gs = 4 + Math.floor(actor.system.attribute.GE.wert / 4);
        gs = hardcoded.geschwindigkeit(gs, actor);
        gs -= actor.system.abgeleitete.be;
        gs = gs >= 1 ? gs : 1;
        actor.system.abgeleitete.gs = gs;
        // let schips = 4;
        // schips = hardcoded.schips(schips, data);
        let schips = hardcoded.schips(actor);
        actor.system.schips.schips = schips;
        // let asp = 0;
        // asp = hardcoded.zauberer(asp, data);
        let asp = hardcoded.zauberer(actor);
        actor.system.abgeleitete.zauberer = asp > 0 ? true : false;
        asp += Number(actor.system.abgeleitete.asp_zugekauft) || 0;
        asp -= Number(actor.system.abgeleitete.gasp) || 0;
        actor.system.abgeleitete.asp = asp;
        // let kap = 0;
        // kap = hardcoded.geweihter(kap, data);
        let kap = hardcoded.geweihter(actor);
        actor.system.abgeleitete.geweihter = kap > 0 ? true : false;
        kap += Number(actor.system.abgeleitete.kap_zugekauft) || 0;
        kap -= Number(actor.system.abgeleitete.gkap) || 0;
        actor.system.abgeleitete.kap = kap;
    }

    _calculateKampf(actor) {
        console.log('Berechne Kampf');
        const KK = actor.system.attribute.KK.wert;
        const sb = Math.floor(KK / 4);
        // data.data.abgeleitete.sb = sb;
        let be = actor.system.abgeleitete.be;
        let nahkampfmod = actor.system.modifikatoren.nahkampfmod;
        // let wundabzuege = data.data.gesundheit.wundabzuege;
        let kampfstile = hardcoded.getKampfstile(actor);
        // data.misc.selected_kampfstil = "ohne";
        actor.misc.kampfstile_list = kampfstile;
        let selected_kampfstil = actor.system.misc?.selected_kampfstil ?? 'ohne';
        console.log(kampfstile);
        let HAUPTWAFFE =
            actor.nahkampfwaffen.find((x) => x.system.hauptwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.hauptwaffe == true);
        let NEBENWAFFE =
            actor.nahkampfwaffen.find((x) => x.system.nebenwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.nebenwaffe == true);
        for (let nwaffe of actor.nahkampfwaffen) {
            if (nwaffe.system.manoever == undefined) {
                console.log('Ich überschreibe Manöver');
            }
            nwaffe.system.manoever =
                nwaffe.system.manoever ||
                foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf);
            // TODO: ich finde die waffeneigenschaften nicht besonders elegant umgesetzt,
            // könnte man dafür ggf. items anlegen und die iwie mit den waffen items verknüpfen?
            let kopflastig = nwaffe.system.eigenschaften.kopflastig;
            let niederwerfen = nwaffe.system.eigenschaften.niederwerfen;
            let parierwaffe = nwaffe.system.eigenschaften.parierwaffe;
            let reittier = nwaffe.system.eigenschaften.reittier;
            let ruestungsbrechend = nwaffe.system.eigenschaften.ruestungsbrechend;
            let schild = nwaffe.system.eigenschaften.schild;
            let schwer_4 = nwaffe.system.eigenschaften.schwer_4;
            let schwer_8 = nwaffe.system.eigenschaften.schwer_8;
            let stumpf = nwaffe.system.eigenschaften.stumpf;
            let unberechenbar = nwaffe.system.eigenschaften.unberechenbar;
            let unzerstoerbar = nwaffe.system.eigenschaften.unzerstoerbar;
            let wendig = nwaffe.system.eigenschaften.wendig;
            let zerbrechlich = nwaffe.system.eigenschaften.zerbrechlich;
            let zweihaendig = nwaffe.system.eigenschaften.zweihaendig;
            let kein_malus_nebenwaffe = nwaffe.system.eigenschaften.kein_malus_nebenwaffe;
            let hauptwaffe = nwaffe.system.hauptwaffe;
            let nebenwaffe = nwaffe.system.nebenwaffe;
            let schaden = 0;
            schaden += Number(nwaffe.system.dice_plus);
            // let kopflastig = eigenschaften.includes("Kopflastig");
            schaden += sb;
            if (kopflastig) {
                schaden += sb;
            }
            let at = 0;
            let vt = 0;
            let fertigkeit = nwaffe.system.fertigkeit;
            // console.log(fertigkeit);
            let talent = nwaffe.system.talent;
            // console.log(talent);
            at += Number(nwaffe.system.wm_at);
            vt += Number(nwaffe.system.wm_vt);
            let pw = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pw;
            // console.log(pw);
            let pwt = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pwt;
            // console.log(pwt);
            let taltrue = actor.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.system.talente.find((x) => x.name == talent); // console.log(taltrue);
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
            const mod_at = nwaffe.system.mod_at;
            const mod_vt = nwaffe.system.mod_vt;
            const mod_schaden = nwaffe.system.mod_schaden;
            if (!isNaN(mod_at)) {
                at += mod_at;
            }
            if (!isNaN(mod_vt)) {
                vt += mod_vt;
            }
            // if (!isNaN(mod_schaden)) { schaden += mod_schaden;}
            nwaffe.system.at = at;
            nwaffe.system.vt = vt;
            nwaffe.system.schaden = `${nwaffe.system.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                nwaffe.system.schaden = `${nwaffe.system.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }
            // if (nwaffe.data.data.eigenschaften.ruestungsbrechend) {
            //     // manoever_at.push("km_rust");
            //     // manoever_at.km_rust.possible = true;
            //     nwaffe.data.data.manoever.km_rust.possible = true;
            // }
            // nwaffe.data.data.manoever.km_rust.possible = nwaffe.data.data.eigenschaften.ruestungsbrechend == "true";
            nwaffe.system.manoever.km_rust.possible =
                nwaffe.system.eigenschaften.ruestungsbrechend;
            // if (nwaffe.data.data.eigenschaften.stumpf) {
            //     manoever_at.push("km_stsl");
            //     // manoever_at.km_stsl.possible = true;
            // }
            // console.log(nwaffe.data.data.eigenschaften.stumpf);
            // console.log(nwaffe.data.data.eigenschaften.stumpf == "true");
            // nwaffe.data.data.manoever.km_stsl.possible = nwaffe.data.data.eigenschaften.stumpf == "true";
            nwaffe.system.manoever.km_stsl.possible = nwaffe.system.eigenschaften.stumpf;
            if (nebenwaffe && hauptwaffe) {
                if (
                    HAUPTWAFFE.system.talent == 'Unbewaffnet' &&
                    NEBENWAFFE.system.talent == 'Unbewaffnet'
                ) {
                    // manoever_at.push("km_umkl");
                    // manoever_at.km_umkl.possible = true;
                    nwaffe.system.manoever.km_umkl.possible = true;
                }
            } else {
                nwaffe.system.manoever.km_umkl.possible = false;
            }
            // if (data.data.vorteil.kampf.find(x => x.name == "Ausfall")) {
            //     manoever_at.push("km_ausf");
            //     // manoever_at.km_ausf.possible = true;
            // }
            nwaffe.system.manoever.km_ausf.possible = actor.vorteil.kampf.some(
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
            nwaffe.system.manoever.km_hmsl.possible = actor.vorteil.kampf.some(
                (x) => x.name == 'Hammerschlag',
            );
            // nwaffe.data.data.manoever.km_hmsl.possible = data.data.vorteil.kampf.includes(x => x.name == "Hammerschlag");
            // if (data.data.vorteil.kampf.find(x => x.name == "Klingentanz")) {
            //     manoever_at.push("km_kltz");
            //     // manoever_at.km_kltz.possible = true;
            // }
            nwaffe.system.manoever.km_kltz.possible = actor.vorteil.kampf.some(
                (x) => x.name == 'Klingentanz',
            );
            // nwaffe.data.data.manoever.km_kltz.possible = data.data.vorteil.kampf.includes(x => x.name == "Klingentanz");
            // if (data.data.vorteil.kampf.find(x => x.name == "Niederwerfen")) {
            //     manoever_at.push("km_ndwf");
            //     // manoever_at.km_ndwf.possible = true;
            // }
            nwaffe.system.manoever.km_ndwf.possible = actor.vorteil.kampf.some(
                (x) => x.name == 'Niederwerfen',
            );
            // nwaffe.data.data.manoever.km_ndwf.possible = data.data.vorteil.kampf.includes(x => x.name == "Niederwerfen");
            // if (data.data.vorteil.kampf.find(x => x.name == "Sturmangriff")) {
            //     manoever_at.push("km_stag");
            //     // manoever_at.km_stag.possible = true;
            // }
            nwaffe.system.manoever.km_stag.possible = actor.vorteil.kampf.some(
                (x) => x.name == 'Sturmangriff',
            );
            // nwaffe.data.data.manoever.km_stag.possible = data.data.vorteil.kampf.includes(x => x.name == "Sturmangriff");
            // if (data.data.vorteil.kampf.find(x => x.name == "Todesstoß")) {
            //     manoever_at.push("km_tdst");
            //     // manoever_at.km_tdst.possible = true;
            // }
            nwaffe.system.manoever.km_tdst.possible = actor.vorteil.kampf.some(
                (x) => x.name == 'Todesstoß',
            );
            // nwaffe.data.data.manoever.km_tdst.possible = data.data.vorteil.kampf.includes(x => x.name == "Todesstoß");
            // console.log(`AT: ${at} | VT: ${vt}`);
            // console.log(pw);
            // nwaffe.data.data.manoever_at = manoever_at;
            // nwaffe.data.data.manoever_vt = manoever_vt;
            // console.log(nwaffe.data.data.manoever);
            nwaffe.system.manoever.vlof.offensiver_kampfstil = actor.vorteil.kampf.some(
                (x) => x.name == 'Offensiver Kampfstil',
            );
            nwaffe.system.manoever.kwut = actor.vorteil.kampf.some(
                (x) => x.name == 'Kalte Wut',
            );
        }

        for (let fwaffe of actor.fernkampfwaffen) {
            fwaffe.system.manoever =
                fwaffe.system.manoever ||
                foundry.utils.deepClone(CONFIG.ILARIS.manoever_fernkampf);
            let kein_reiter = fwaffe.system.eigenschaften.kein_reiter;
            let reittier =
                HAUPTWAFFE?.system.eigenschaften?.reittier ||
                NEBENWAFFE?.system.eigenschaften?.reittier;
            let niederwerfen = fwaffe.system.eigenschaften.niederwerfen;
            let niederwerfen_4 = fwaffe.system.eigenschaften.niederwerfen_4;
            let niederwerfen_8 = fwaffe.system.eigenschaften.niederwerfen_8;
            let schwer_4 = fwaffe.system.eigenschaften.schwer_4;
            let schwer_8 = fwaffe.system.eigenschaften.schwer_8;
            let stationaer = fwaffe.system.eigenschaften.stationaer;
            let stumpf = fwaffe.system.eigenschaften.stumpf;
            let umklammern_212 = fwaffe.system.eigenschaften.umklammern_212;
            let umklammern_416 = fwaffe.system.eigenschaften.umklammern_416;
            let umklammern_816 = fwaffe.system.eigenschaften.umklammern_816;
            let zweihaendig = fwaffe.system.eigenschaften.zweihaendig;
            let hauptwaffe = fwaffe.system.hauptwaffe;
            let nebenwaffe = fwaffe.system.nebenwaffe;
            let schaden = 0;
            schaden += Number(fwaffe.system.dice_plus);
            let fk = 0;
            let fertigkeit = fwaffe.system.fertigkeit;
            let talent = fwaffe.system.talent;
            fk += Number(fwaffe.system.wm_fk);
            let pw = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pw;
            let pwt = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system
                .pwt;
            let taltrue = actor.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.system.talente.find((x) => x.name == talent);
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
            const mod_fk = fwaffe.system.mod_fk;
            const mod_schaden = fwaffe.system.mod_schaden;
            if (!isNaN(mod_fk)) {
                fk += mod_fk;
            }
            fwaffe.system.fk = fk;
            if (zweihaendig && ((hauptwaffe && !nebenwaffe) || (!hauptwaffe && nebenwaffe))) {
                fwaffe.system.fk = '-';
            } else if (kein_reiter && (hauptwaffe || nebenwaffe)) {
                // let reittier = false;
                // let reittier = HAUPTWAFFE?.data.data.eigenschaften?.reittier || NEBENWAFFE?.data.data.eigenschaften?.reittier;
                if (reittier && kein_reiter) {
                    fwaffe.system.fk = '-';
                }
            }
            fwaffe.system.schaden = `${fwaffe.system.dice_anzahl}d6+${schaden}`;
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                fwaffe.system.schaden = `${fwaffe.system.dice_anzahl}d6+${schaden}+${mod_schaden}`;
            }

            // if (data.data.vorteil.kampf.find(x => x.name.includes("Defensiver Kampfstil"))) item.data.data.manoever.vldf.possible = true;
            if (actor.vorteil.kampf.find((x) => x.name.includes('Schnellziehen')))
                fwaffe.system.manoever.fm_snls.possible = true;
            if (actor.vorteil.kampf.find((x) => x.name.includes('Ruhige Hand')))
                fwaffe.system.manoever.fm_zlen.ruhige_hand = true;
            if (actor.vorteil.kampf.find((x) => x.name.includes('Meisterschuss')))
                fwaffe.system.manoever.fm_msts.possible = true;
            if (true) fwaffe.system.manoever.fm_rust.possible = true;
            let rw = fwaffe.system.rw;
            fwaffe.system.manoever.rw['0'] = `${rw} Schritt`;
            fwaffe.system.manoever.rw['1'] = `${2 * rw} Schritt`;
            fwaffe.system.manoever.rw['2'] = `${4 * rw} Schritt`;
            if (actor.vorteil.kampf.find((x) => x.name.includes('Reflexschuss')))
                fwaffe.system.manoever.rflx = true;
            if (hardcoded.getKampfstilStufe('rtk', actor) >= 2)
                fwaffe.system.manoever.brtn.rtk = true;
            if (reittier) fwaffe.system.manoever.brtn.selected = true;
            // get status effects
            // licht lcht
            // console.log("bevor get_status_effects");
            // console.log(data);
            let ss1 = this.__getStatuseffectById(actor, 'schlechtesicht1');
            let ss2 = this.__getStatuseffectById(actor, 'schlechtesicht2');
            let ss3 = this.__getStatuseffectById(actor, 'schlechtesicht3');
            let ss4 = this.__getStatuseffectById(actor, 'schlechtesicht4');
            if (ss4) {
                fwaffe.system.manoever.lcht.selected = 4;
            } else if (ss3) {
                fwaffe.system.manoever.lcht.selected = 3;
            } else if (ss2) {
                fwaffe.system.manoever.lcht.selected = 2;
            } else if (ss1) {
                fwaffe.system.manoever.lcht.selected = 1;
            } else {
                fwaffe.system.manoever.lcht.selected = 0;
            }
            let lcht_angepasst = hardcoded.getAngepasst('Dunkelheit', actor);
            // console.log(`licht angepasst: ${lcht_angepasst}`);
            fwaffe.system.manoever.lcht.angepasst = lcht_angepasst;
            fwaffe.system.manoever.kwut = actor.vorteil.kampf.some(
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
        let stufe = hardcoded.getKampfstilStufe(selected_kampfstil, actor);
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
                    HAUPTWAFFE.system.eigenschaften.zweihaendig ||
                    NEBENWAFFE.system.eigenschaften.zweihaendig
                )
            ) {
                einhaendig = true;
            }
            if (nahkampfwaffe) {
                if (
                    !(
                        HAUPTWAFFE.system.eigenschaften.schild ||
                        NEBENWAFFE.system.eigenschaften.schild
                    )
                ) {
                    kein_schild = true;
                }
                if (
                    !(
                        HAUPTWAFFE.system.eigenschaften.reittier ||
                        NEBENWAFFE.system.eigenschaften.reittier
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
                    if (!NEBENWAFFE.system.eigenschaften.kein_malus_nebenwaffe) {
                        at_nw += 4;
                        NEBENWAFFE.system.vt += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3');
                    at_hw += 1;
                    at_nw += 1;
                    HAUPTWAFFE.system.manoever.km_dppl.possible = true;
                    NEBENWAFFE.system.manoever.km_dppl.possible = true;
                    // HAUPTWAFFE.data.data.manoever_at.push("km_dppl");
                    // NEBENWAFFE.data.data.manoever_at.push("km_dppl");
                    // HAUPTWAFFE.data.manoever_at.km_dppl.possible = true;
                    // NEBENWAFFE.data.manoever_at.km_dppl.possible = true;
                }
                HAUPTWAFFE.system.at += at_hw;
                NEBENWAFFE.system.at += at_nw;
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
                    if (WAFFE.system.eigenschaften.reittier == false) {
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
                            WAFFE.system.manoever.km_befr.possible = true;
                            // WAFFE.data.data.manoever_at.push("km_befr");
                            // WAFFE.data.manoever_at.km_befr.possible=true;
                        }
                        schaden = '+'.concat(schaden);
                        WAFFE.system.schaden = WAFFE.system.schaden.concat(schaden);
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
                if (HAUPTWAFFE.system.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (HAUPTWAFFE.system.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.system.eigenschaften.parierwaffe) {
                    parierwaffe = true;
                }
                if (NEBENWAFFE.system.eigenschaften.reittier) {
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
                        if (!NEBENWAFFE.system.eigenschaften.kein_malus_nebenwaffe) {
                            NEBENWAFFE.system.at += 4;
                            NEBENWAFFE.system.vt += 4;
                        }
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3');
                    if (hauptwaffe) HAUPTWAFFE.system.manoever.km_rpst.possible = true;
                    if (nebenwaffe) NEBENWAFFE.system.manoever.km_rpst.possible = true;
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
                if (HAUPTWAFFE.system.eigenschaften.reittier) {
                    reittier = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.system.eigenschaften.reittier) {
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
                    if (HAUPTWAFFE.system.eigenschaften.reittier)
                        HAUPTWAFFE.system.manoever.km_uebr.possible = true;
                    // if (HAUPTWAFFE.data.data.eigenschaften.reittier) HAUPTWAFFE.data.data.manoever_at.push("km_uebr");
                    // if (HAUPTWAFFE.data.eigenschaften.reittier) HAUPTWAFFE.data.manoever_at.km_uebr.possible=true;
                }
                schaden = '+'.concat(schaden);
                HAUPTWAFFE.system.at += at;
                HAUPTWAFFE.system.vt += vt;
                HAUPTWAFFE.system.schaden = HAUPTWAFFE.system.schaden.concat(schaden);
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
                        !NEBENWAFFE.system.eigenschaften.kein_malus_nebenwaffe &&
                        NEBENWAFFE.system.eigenschaften.reittier
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
                    if (NEBENWAFFE.system.eigenschaften.reittier)
                        NEBENWAFFE.system.manoever.km_uebr.possible = true;
                    // if (NEBENWAFFE.data.data.eigenschaften.reittier) NEBENWAFFE.data.data.manoever_at.push("km_uebr");
                    // if (NEBENWAFFE.data.eigenschaften.reittier) NEBENWAFFE.data.manoever_at.km_uebr.possible=true;
                }
                schaden = '+'.concat(schaden);
                NEBENWAFFE.system.at += at;
                NEBENWAFFE.system.vt += vt;
                NEBENWAFFE.system.schaden = NEBENWAFFE.system.schaden.concat(schaden);
            }
        } else if (selected_kampfstil == 'shk') {
            console.log(CONFIG.ILARIS.label[selected_kampfstil]);
            let hauptwaffe = false;
            let nebenwaffe = false;
            let schild = false;
            if (typeof HAUPTWAFFE != 'undefined') hauptwaffe = true;
            if (typeof NEBENWAFFE != 'undefined') nebenwaffe = true;
            if (hauptwaffe && HAUPTWAFFE.type == 'nahkampfwaffe') {
                if (HAUPTWAFFE.system.eigenschaften.schild) {
                    schild = true;
                }
            }
            if (nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                if (NEBENWAFFE.system.eigenschaften.schild) {
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
                    HAUPTWAFFE.system.manoever.km_shwl.possible = true;
                    // HAUPTWAFFE.data.data.manoever_vt.push("km_shwl");
                }
                HAUPTWAFFE.system.vt += vt;
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
                        !NEBENWAFFE.system.eigenschaften.kein_malus_nebenwaffe &&
                        NEBENWAFFE.system.eigenschaften.schild
                    ) {
                        vt += 4;
                        NEBENWAFFE.system.at += 4;
                    }
                }
                if (stufe >= 3) {
                    console.log('Stufe 3 (Nebenwaffe)');
                    vt += 1;
                    NEBENWAFFE.system.manoever.km_shwl.possible = true;
                    // NEBENWAFFE.data.data.manoever_vt.push("km_shwl");
                }
                NEBENWAFFE.system.vt += vt;
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
                if (!HAUPTWAFFE.system.eigenschaften.reittier) {
                    WAFFE = HAUPTWAFFE;
                    console.log('step 1');
                }
            } else if (!hauptwaffe && nebenwaffe && NEBENWAFFE.type == 'nahkampfwaffe') {
                console.log('Nebenwaffe nahkampf');
                if (!NEBENWAFFE.system.eigenschaften.reittier) {
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
                if (!HAUPTWAFFE.system.eigenschaften.reittier) {
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
                    WAFFE.system.manoever.km_utlf.possible = true;
                    // WAFFE.data.data.manoever_vt.push("km_utlf");
                }
                WAFFE.system.at += at;
            }
        }
    }

    _calculateUebernatuerlichProbendiag(actor) {
        // data.data.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten;
        // data.data.uebernatuerlich.zauber = magie_talente;
        // data.data.uebernatuerlich.liturgien = karma_talente;
        // data.data.vorteil.magie = vorteil_magie;
        // data.data.vorteil.zaubertraditionen = vorteil_zaubertraditionen;
        // data.data.vorteil.karma = vorteil_karma;
        // data.data.vorteil.geweihtentradition = vorteil_geweihtetraditionen;
        // let be = data.data.abgeleitete.be;
        for (let item of actor.uebernatuerlich.zauber) {
            if (item.system.manoever == undefined) {
                console.log('Ich überschreibe Magie Manöver');
            }
            item.system.manoever =
                item.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_magie);
            console.log(item.system);
            // mm_erzw: 'Erzwingen',
            if (hardcoded.magieErzwingenPossible(actor)) {
                console.log('Erzwingen aktiviert');
                item.system.manoever.mm_erzw.possible = true;
            }
            // mm_kosp: 'Kosten sparen',
            if (hardcoded.magieKostenSparenPossible(actor)) {
                item.system.manoever.mm_kosp.possible = true;
            }
            // mm_ztls: 'Zeit lassen',
            if (hardcoded.magieZeitLassenPossible(actor)) {
                item.system.manoever.mm_ztls.possible = true;
            }
            // mm_zere: 'Zeremonie',
            if (hardcoded.magieZeremoniePossible(actor)) {
                item.system.manoever.mm_zere.possible = true;
            }
            // mm_opfe: 'Opferung',
            if (hardcoded.magieOpferungPossible(actor)) {
                item.system.manoever.mm_opfe.possible = true;
            }
        }
        for (let item of actor.uebernatuerlich.liturgien) {
            if (item.system.manoever == undefined) {
                console.log('Ich überschreibe Karma Manöver');
            }
            item.system.manoever =
                item.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_karma);
            console.log(item.system);
            // mm_kosp: 'Kosten sparen',
            if (hardcoded.karmaKostenSparenPossible(actor)) {
                item.system.manoever.lm_kosp.possible = true;
            }
            // mm_zere: 'Zeremonie',
            if (hardcoded.karmaZeremoniePossible(actor)) {
                item.system.manoever.lm_zere.possible = true;
            }
            // mm_opfe: 'Opferung',
            if (hardcoded.karmaOpferungPossible(actor)) {
                item.system.manoever.lm_opfe.possible = true;
            }
        }
    }
    _sortItems(actor) {
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
        let anrufung_talente = [];
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
        let freie_uebernatuerliche_fertigkeiten = [];
        let unsorted = [];
        let speicherplatz_list = ['tragend', 'mitführend'];
        let item_tragend = [];
        let item_mitfuehrend = [];
        let item_list = [];
        let item_list_tmp = [];
        for (let item of actor.items) {
            // let item = i.data;
            if (item.type == 'ruestung') {
                // console.log("Rüstung gefunden");
                // console.log(i);
                item.system.bewahrt_auf = [];
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0;
                    speicherplatz_list.push(item.name);
                    item_list.push(item);
                } else item_list_tmp.push(item);
                ruestungen.push(item);
            } else if (item.type == 'nahkampfwaffe') {
                // console.log("Nahkampfwaffe gefunden");
                // console.log(i);
                item.system.bewahrt_auf = [];
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0;
                    speicherplatz_list.push(item.name);
                    item_list.push(item);
                } else item_list_tmp.push(item);
                nahkampfwaffen.push(item);
            } else if (item.type == 'fernkampfwaffe') {
                // console.log("Fernkampfwaffe gefunden");
                // console.log(i);
                item.system.bewahrt_auf = [];
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0;
                    speicherplatz_list.push(item.name);
                    item_list.push(item);
                } else item_list_tmp.push(item);
                fernkampfwaffen.push(item);
            } else if (item.type == 'gegenstand') {
                item.system.bewahrt_auf = [];
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0;
                    speicherplatz_list.push(item.name);
                    item_list.push(item);
                } else item_list_tmp.push(item);
            } else if (item.type == 'fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                item.system.talente = [];
                profan_fertigkeiten.push(item);
                profan_fertigkeit_list.push(item.name);
                // profan_talente[i.name] = [];
            } else if (item.type == 'talent') {
                profan_talente.push(item);
            } else if (item.type == 'freie_fertigkeit') {
                freie_fertigkeiten.push(item);
            } else if (item.type == 'uebernatuerliche_fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                uebernatuerliche_fertigkeiten.push(item);
            } else if (item.type == 'zauber') {
                magie_talente.push(item);
            }
            else if (item.type == 'liturgie') {
                karma_talente.push(item);
            }
            else if (item.type == 'anrufung') {
                anrufung_talente.push(item);
            } else if (item.type == 'vorteil') {
                if (actor.type == "kreatur") vorteile.push(item);
                if (item.system.gruppe == 0) vorteil_allgemein.push(item);
                else if (item.system.gruppe == 1) vorteil_profan.push(item);
                else if (item.system.gruppe == 2) vorteil_kampf.push(item);
                else if (item.system.gruppe == 3) vorteil_kampfstil.push(item);
                else if (item.system.gruppe == 4) vorteil_magie.push(item);
                else if (item.system.gruppe == 5) vorteil_zaubertraditionen.push(item);
                else if (item.system.gruppe == 6) vorteil_karma.push(item);
                else if (item.system.gruppe == 7) vorteil_geweihtetraditionen.push(item);
                // else vorteil_allgemein.push(i);
            } else if (item.type == 'eigenheit') {
                eigenheiten.push(item);
            } else if (item.type == 'eigenschaft') { // kreatur only
                console.log(item);
                eigenschaften.push(item);
            } else if (item.type == 'angriff') { // kreatur only
                angriffe.push(item);
            } else if (item.type == 'info') { // kreatur only
                infos.push(item);
            } else if (item.type == 'freiestalent') {
                if (item.system.profan == true) {
                    freietalente.push(item);
                    console.log('Freies Talent eingetragen');
                } else {
                    freie_uebernatuerliche_fertigkeiten.push(item);
                    console.log('Freies Uebernatuerliches Talent eingetragen');
                }
            } else unsorted.push(item);
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
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
                ? -1
                : 0,
        );
        // magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        magie_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        magie_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
                ? -1
                : 0,
        );
        karma_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        karma_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
                ? -1
                : 0,
        );
        anrufung_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        anrufung_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
                ? -1
                : 0,
        );
        profan_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        profan_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
                ? -1
                : 0,
        );
        freie_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        freie_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe
                ? 1
                : b.system.gruppe > a.system.gruppe
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
        freie_uebernatuerliche_fertigkeiten.sort((a, b) =>
        a.system.gruppe > b.system.gruppe
            ? 1
            : b.system.gruppe > a.system.gruppe
            ? -1
            : 0,
        );

        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'name' );
        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'data.gruppe' );

        for (let talent of profan_talente) {
            if (profan_fertigkeit_list.includes(talent.system.fertigkeit)) {
                profan_fertigkeiten
                    .find((x) => x.name == talent.system.fertigkeit)
                    .system.talente.push(talent);
            } else {
                profan_talente_unsorted.push(talent);
            }
        }

        actor.system.getragen = 0;
        for (let i of item_list_tmp) {
            let aufbewahrung = i.system.aufbewahrungs_ort;
            if (aufbewahrung == 'tragend') {
                item_tragend.push(i);
            } else if (aufbewahrung == 'mitführend') {
                item_mitfuehrend.push(i);
                actor.system.getragen += i.system.gewicht;
            } else if (speicherplatz_list.includes(aufbewahrung)) {
                // item_list.find(x => x.name == aufbewahrung).system.bewahrt_auf.push(i);
                let idx = item_list.indexOf(item_list.find((x) => x.name == aufbewahrung));
                item_list[idx].system.bewahrt_auf.push(i);
                item_list[idx].system.gewicht_summe += i.system.gewicht;
            } else {
                i.system.aufbewahrungs_ort == 'mitführend';
                item_mitfuehrend.push(i);
                actor.system.getragen += i.system.gewicht;
            }
        }

        // data.magie = {};
        // data.karma = {};
        actor.profan = {};
        actor.uebernatuerlich = {};
        actor.vorteil = {};
        actor.inventar = {};
        actor.inventar.tragend = item_tragend;
        actor.inventar.mitfuehrend = item_mitfuehrend;
        actor.inventar.item_list = item_list;
        actor.ruestungen = ruestungen;
        actor.nahkampfwaffen = nahkampfwaffen;
        actor.fernkampfwaffen = fernkampfwaffen;
        actor.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten;
        actor.uebernatuerlich.zauber = magie_talente;
        actor.uebernatuerlich.liturgien = karma_talente;
        actor.uebernatuerlich.anrufungen = anrufung_talente;
        actor.profan.fertigkeiten = profan_fertigkeiten;
        actor.profan.talente_unsorted = profan_talente_unsorted;
        actor.profan.freie = freie_fertigkeiten;
        // vorteil singular? inkonsistent zu den anderen listen
        // fuer kreaturen waere es wesentlich einfacher alles in einer liste zu sammeln
        // und die kategorie als property zu behalten (kann ja auch nach gefiltert werden)
        // in data.vorteile leg ich erstmal alle ab als zwischenloesung ;) 
        actor.vorteil.allgemein = vorteil_allgemein;
        actor.vorteil.profan = vorteil_profan;
        actor.vorteil.kampf = vorteil_kampf;
        actor.vorteil.kampfstil = vorteil_kampfstil;
        actor.vorteil.magie = vorteil_magie;
        actor.vorteil.zaubertraditionen = vorteil_zaubertraditionen;
        actor.vorteil.karma = vorteil_karma;
        actor.vorteil.geweihtentradition = vorteil_geweihtetraditionen;
        actor.eigenheiten = eigenheiten;
        actor.unsorted = unsorted;
        actor.misc = actor.misc || {};
        actor.misc.kampfstile_list = vorteil_kampfstil.map(kampfstil => kampfstil.name);
        actor.misc.profan_fertigkeit_list = profan_fertigkeit_list;
        actor.misc.uebernatuerlich_fertigkeit_list =
            this.__getAlleUebernatuerlichenFertigkeiten(actor);
        actor.misc.speicherplatz_list = speicherplatz_list;
        if (actor.type == "kreatur") {
            actor.eigenschaften = eigenschaften;
            actor.angriffe = angriffe;
            actor.vorteile = vorteile;
            actor.infos = infos;
            actor.freietalente = freietalente;
            actor.uebernatuerlich.fertigkeiten = freie_uebernatuerliche_fertigkeiten;
            actor.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options);
        }
    }
}
