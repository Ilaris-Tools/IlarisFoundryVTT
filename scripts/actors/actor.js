import * as hardcoded from './hardcodedvorteile.js'
import * as weaponUtils from './weapon-utils.js'

export class IlarisActor extends Actor {
    async _preCreate(data, options, user) {
        //this.data.update(data);  // should this be called here?
        await super._preCreate(data, options, user)
        // console.log(data);
    }

    prepareData() {
        console.log('prepareData')
        super.prepareData()
    }

    prepareEmbeddedEntities() {
        console.log('prepareEmbeddedEntities')
        super.prepareEmbeddedEntities()
    }

    prepareDerivedData() {
        console.log('prepareDerivedData')
        super.prepareDerivedData()
    }

    prepareBaseData() {
        console.log('prepareBaseData')
        super.prepareBaseData()
    }

    _checkVorteilSource(requirement, vorteil) {
        // For Stile (gruppe 3, 5, or 7) on held-type actors, check with getSelectedStil
        if (this.type === 'held' && [3, 5, 7].includes(Number(vorteil.system.gruppe))) {
            return (
                hardcoded
                    .getSelectedStil(this, 'kampf')
                    ?.sources.some((source) => source === requirement) ||
                hardcoded
                    .getSelectedStil(this, 'uebernatuerlich')
                    ?.sources.some((source) => source === requirement)
            )
        }

        // For all other cases, just check if the requirement matches the vorteil name
        return vorteil.name === requirement
    }

    _hasVorteil(vorteilRequirement) {
        // use _stats.compendiumSource or flags.core.sourceId to check for requirement
        return (
            this.vorteil.allgemein.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.kampf.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.karma.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.magie.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.profan.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.kampfstil.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.zaubertraditionen.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            }) ||
            this.vorteil.geweihtentradition.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil)
            })
        )
    }

    __getStatuseffectById(data, statusId) {
        let iterator = data.effects.values()
        for (const effect of iterator) {
            console.log(effect.statuses)
            // Get the first entry from the Set
            const firstStatus = effect.statuses.values().next().value
            if (firstStatus == statusId) {
                return true
            }
        }
        return false
    }

    _calculatePWAttribute(systemData) {
        for (let attribut of Object.values(systemData.attribute)) {
            attribut.pw = 2 * attribut.wert
        }
    }

    _calculateProfanFertigkeiten(actor) {
        console.log('Berechne Profane Fertigkeiten')
        for (let fertigkeit of actor.profan.fertigkeiten) {
            let basiswert = 0
            // console.log(data.data.attribute);
            // console.log(fertigkeit.data);
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_0].wert
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_1].wert
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_2].wert
            basiswert = Math.round(basiswert / 3)
            fertigkeit.system.basis = basiswert
            fertigkeit.system.pw = basiswert + Math.round(Number(fertigkeit.system.fw) * 0.5)
            fertigkeit.system.pwt = basiswert + Number(fertigkeit.system.fw)
        }
    }

    // Werte werden nicht gespeichert, sonder jedes mal neu berechnet?
    _calculateUebernaturlichFertigkeiten(actor) {
        console.log('Berechne Übernatürliche Fertigkeiten')
        for (let fertigkeit of actor.uebernatuerlich.fertigkeiten) {
            // console.log(fertigkeit);
            let basiswert = 0
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_0].wert
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_1].wert
            basiswert = basiswert + actor.system.attribute[fertigkeit.system.attribut_2].wert
            basiswert = Math.round(basiswert / 3)
            fertigkeit.system.basis = basiswert
            fertigkeit.system.pw = basiswert + Number(fertigkeit.system.fw)
        }
    }

    __getAlleUebernatuerlichenFertigkeiten(actor) {
        let fertigkeit_list = []
        for (let fertigkeit of actor.uebernatuerlich.fertigkeiten) {
            fertigkeit_list.push(fertigkeit.name)
        }
        return fertigkeit_list
    }

    _calculateUebernaturlichTalente(actor) {
        console.log('Berechne übernatürliche Talente')
        let fertigkeit_uebereinstimmung = []
        // const alleMagieFertigkeiten = this.__getAlleMagieFertigkeiten(data);
        // const alleKarmaFertigkeiten = this.__getAlleKarmaFertigkeiten(data);
        // const alleFertigkeiten = this.__getAlleUebernatuerlichenFertigkeiten(data);
        // for (let talent of data.magie.talente) {
        for (let talent of actor.uebernatuerlich.zauber) {
            let max_pw = -1
            const fertigkeit_string = talent.system.fertigkeiten
            let fertigkeit_array = fertigkeit_string.split(',')
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim()
                // for (let actor_fertigkeit of data.magie.fertigkeiten) {
                for (let actor_fertigkeit of actor.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.system.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.system.pw
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp
                        }
                    } else if (talent.system.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.system.pw
                    }
                }
            }
            talent.system.pw = max_pw
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
            let max_pw = -1
            const fertigkeit_string = talent.system.fertigkeiten
            let fertigkeit_array = fertigkeit_string.split(',')
            for (let [i, fert_string] of fertigkeit_array.entries()) {
                let fertigkeit = fert_string.trim()
                // for (let actor_fertigkeit of data.karma.fertigkeiten) {
                for (let actor_fertigkeit of actor.uebernatuerlich.fertigkeiten) {
                    if (
                        fertigkeit == actor_fertigkeit.name &&
                        talent.system.fertigkeit_ausgewaehlt == 'auto'
                    ) {
                        let max_tmp = actor_fertigkeit.system.pw
                        if (max_tmp > max_pw) {
                            max_pw = max_tmp
                        }
                    } else if (talent.system.fertigkeit_ausgewaehlt == actor_fertigkeit.name) {
                        max_pw = actor_fertigkeit.system.pw
                    }
                }
            }
            talent.system.pw = max_pw
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
        console.log('Berechne Wunden')
        let einschraenkungen = Math.floor(
            systemData.gesundheit.wunden + systemData.gesundheit.erschoepfung,
        )
        let gesundheitzusatz = ``
        // let old_hp = data.data.gesundheit.hp.value;
        let new_hp = systemData.gesundheit.hp.max - einschraenkungen
        if (einschraenkungen == 0) {
            systemData.gesundheit.wundabzuege = 0
            gesundheitzusatz = `(Volle Gesundheit)`
        } else if (einschraenkungen > 0 && einschraenkungen <= 2) {
            systemData.gesundheit.wundabzuege = 0
            gesundheitzusatz = `(Kaum ein Kratzer)`
        } else if (einschraenkungen >= 3 && einschraenkungen <= 4) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2
            gesundheitzusatz = `(Verwundet)`
        } else if (einschraenkungen >= 5 && einschraenkungen <= 8) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2
            gesundheitzusatz = `(Kampfunfähig)`
        } else if (einschraenkungen >= 9) {
            systemData.gesundheit.wundabzuege = -(einschraenkungen - 2) * 2
            gesundheitzusatz = `(Tot)`
        } else {
            systemData.gesundheit.display = 'Fehler bei Berechnung der Wundabzüge'
            return
        }
        if (systemData.gesundheit.wundenignorieren > 0) {
            systemData.gesundheit.wundabzuege = 0
        }
        systemData.gesundheit.display = ``
        if (systemData.gesundheit.wundabzuege == 0) {
            systemData.gesundheit.display += `-`
        }
        systemData.gesundheit.display +=
            `${systemData.gesundheit.wundabzuege} auf alle Proben ` + gesundheitzusatz
        // if (old_hp != new_hp) {
        systemData.gesundheit.hp.value = new_hp
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
        console.log('Berechne Furchteffekt')
        let furchtzusatz = ``
        if (systemData.furcht.furchtstufe == 0) {
            systemData.furcht.furchtabzuege = 0
            furchtzusatz = `(keine Furcht)`
        } else if (systemData.furcht.furchtstufe == 1) {
            systemData.furcht.furchtabzuege = -2
            furchtzusatz = `(Furcht I)`
        } else if (systemData.furcht.furchtstufe == 2) {
            systemData.furcht.furchtabzuege = -4
            furchtzusatz = `(Furcht II)`
        } else if (systemData.furcht.furchtstufe == 3) {
            systemData.furcht.furchtabzuege = -8
            furchtzusatz = `(Furcht III)`
        } else if (systemData.furcht.furchtstufe >= 4) {
            systemData.furcht.furchtabzuege = -8
            furchtzusatz = `(Furcht IV)`
        } else {
            systemData.furcht.furchtstufe = 0
            systemData.furcht.display = 'Fehler bei Berechnung der Furchtabzüge'
            return
        }
        systemData.furcht.display = ``
        if (systemData.furcht.furchtabzuege == 0) {
            systemData.furcht.display += `-`
        }
        systemData.furcht.display +=
            `${systemData.furcht.furchtabzuege} auf alle Proben ` + furchtzusatz
    }

    _calculateWundschwellenRuestung(actor) {
        console.log('Berechne Rüstung')
        let ws = 4 + Math.floor(actor.system.attribute.KO.wert / 4)
        ws = hardcoded.wundschwelle(ws, actor)
        // let ws_stern = ws;
        let ws_stern = hardcoded.wundschwelleStern(ws, actor)
        let be = 0
        let ws_beine = ws_stern
        let ws_larm = ws_stern
        let ws_rarm = ws_stern
        let ws_bauch = ws_stern
        let ws_brust = ws_stern
        let ws_kopf = ws_stern
        for (let ruestung of actor.ruestungen) {
            if (ruestung.system.aktiv == true) {
                ws_stern += ruestung.system.rs
                be += ruestung.system.be
                ws_beine += ruestung.system.rs_beine
                ws_larm += ruestung.system.rs_larm
                ws_rarm += ruestung.system.rs_rarm
                ws_bauch += ruestung.system.rs_bauch
                ws_brust += ruestung.system.rs_brust
                ws_kopf += ruestung.system.rs_kopf
            }
        }
        be = hardcoded.behinderung(be, actor)
        actor.system.abgeleitete.ws = ws
        actor.system.abgeleitete.ws_stern = ws_stern
        actor.system.abgeleitete.be = be
        actor.system.abgeleitete.ws_beine = ws_beine
        actor.system.abgeleitete.ws_larm = ws_larm
        actor.system.abgeleitete.ws_rarm = ws_rarm
        actor.system.abgeleitete.ws_bauch = ws_bauch
        actor.system.abgeleitete.ws_brust = ws_brust
        actor.system.abgeleitete.ws_kopf = ws_kopf
    }

    _calculateModifikatoren(systemData) {
        let globalermod = hardcoded.globalermod(systemData)
        systemData.abgeleitete.globalermod = globalermod
        // displayed text for nahkampfmod
        systemData.abgeleitete.nahkampfmoddisplay = ``
        if (systemData.modifikatoren.nahkampfmod == 0) {
            systemData.abgeleitete.nahkampfmoddisplay += `-`
        } else if (systemData.modifikatoren.nahkampfmod > 0) {
            systemData.abgeleitete.nahkampfmoddisplay += `+`
        }
        // let nahkampfmodgesamt = data.data.modifikatoren.nahkampfmod + data.data.modifikatoren.globalermod;
        systemData.abgeleitete.nahkampfmoddisplay += `${systemData.modifikatoren.nahkampfmod} auf AT/VT durch Status am Token`
        // displayed text for globalermod (auf alle Proben insgesamt)
        systemData.abgeleitete.globalermoddisplay = ``
        if (systemData.abgeleitete.globalermod == 0) {
            systemData.abgeleitete.globalermoddisplay += `-`
        } else if (systemData.abgeleitete.globalermod > 0) {
            systemData.abgeleitete.globalermoddisplay += `+`
        }
        systemData.abgeleitete.globalermoddisplay += `${systemData.abgeleitete.globalermod} auf alle Proben`
    }

    _calculateAbgeleitete(actor) {
        console.log('Berechne abgeleitete Werte')
        let ini = actor.system.attribute.IN.wert
        ini = hardcoded.initiative(ini, actor)
        actor.system.abgeleitete.ini = ini
        actor.system.initiative = ini + 0.5
        let mr = 4 + Math.floor(actor.system.attribute.MU.wert / 4)
        mr = hardcoded.magieresistenz(mr, actor)
        actor.system.abgeleitete.mr = mr
        let traglast_intervall = actor.system.attribute.KK.wert
        traglast_intervall = traglast_intervall >= 1 ? traglast_intervall : 1
        actor.system.abgeleitete.traglast_intervall = traglast_intervall
        let traglast = 2 * actor.system.attribute.KK.wert
        traglast = traglast >= 1 ? traglast : 1
        actor.system.abgeleitete.traglast = traglast
        let summeGewicht = 0
        for (let i of actor.inventar.mitfuehrend) {
            summeGewicht += i.system.gewicht
        }
        actor.system.getragen = summeGewicht
        let be_mod = hardcoded.beTraglast(actor.system)
        actor.system.abgeleitete.be += be_mod
        actor.system.abgeleitete.be_traglast = be_mod
        let dh = hardcoded.durchhalte(actor)
        // let dh = systemData.attribute.KO.wert - (2 * systemData.abgeleitete.be);
        // dh = hardcoded.durchhalte(dh, systemData);
        // dh = (dh > 1) ? dh : 1;
        actor.system.abgeleitete.dh = dh
        let gs = 4 + Math.floor(actor.system.attribute.GE.wert / 4)
        gs = hardcoded.geschwindigkeit(gs, actor)
        gs -= actor.system.abgeleitete.be
        gs = gs >= 1 ? gs : 1
        actor.system.abgeleitete.gs = gs
        // let schips = 4;
        // schips = hardcoded.schips(schips, data);
        let schips = hardcoded.schips(actor)
        actor.system.schips.schips = schips
        // let asp = 0;
        // asp = hardcoded.zauberer(asp, data);
        let asp = hardcoded.zauberer(actor)
        actor.system.abgeleitete.zauberer = asp > 0 ? true : false
        asp += Number(actor.system.abgeleitete.asp_zugekauft) || 0
        asp -= Number(actor.system.abgeleitete.gasp) || 0
        actor.system.abgeleitete.asp = asp
        actor.system.abgeleitete.asp_stern =
            actor.system.abgeleitete.asp_stern !== null &&
            actor.system.abgeleitete.asp_stern !== undefined
                ? Number(actor.system.abgeleitete.asp_stern)
                : asp
        // let kap = 0;
        // kap = hardcoded.geweihter(kap, data);
        let kap = hardcoded.geweihter(actor)
        actor.system.abgeleitete.geweihter = kap > 0 ? true : false
        kap += Number(actor.system.abgeleitete.kap_zugekauft) || 0
        kap -= Number(actor.system.abgeleitete.gkap) || 0
        actor.system.abgeleitete.kap = kap
        actor.system.abgeleitete.kap_stern =
            actor.system.abgeleitete.kap_stern !== null &&
            actor.system.abgeleitete.kap_stern !== undefined
                ? Number(actor.system.abgeleitete.kap_stern)
                : kap
    }

    async _calculateKampf(actor) {
        console.log('Berechne Kampf')
        const KK = actor.system.attribute.KK.wert
        const sb = Math.floor(KK / 4)
        // data.data.abgeleitete.sb = sb;
        let be = actor.system.abgeleitete.be
        let nahkampfmod = actor.system.modifikatoren.nahkampfmod
        // let wundabzuege = data.data.gesundheit.wundabzuege;
        let kampfstile = hardcoded.getKampfstile(actor)
        // data.misc.selected_kampfstil = "ohne";
        actor.misc.kampfstile_list = kampfstile
        let selected_kampfstil = hardcoded.getSelectedStil(actor, 'kampf')

        // Handle supernatural styles
        let uebernatuerliche_stile = hardcoded.getUebernatuerlicheStile(actor)
        actor.misc.uebernatuerliche_stile_list = uebernatuerliche_stile
        let selected_uebernatuerlicher_stil = hardcoded.getSelectedStil(actor, 'uebernatuerlich')

        let HAUPTWAFFE =
            actor.nahkampfwaffen.find((x) => x.system.hauptwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.hauptwaffe == true)
        let NEBENWAFFE =
            actor.nahkampfwaffen.find((x) => x.system.nebenwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.nebenwaffe == true)
        for (let nwaffe of actor.nahkampfwaffen) {
            if (nwaffe.system.manoever == undefined) {
                console.log('Ich überschreibe Manöver')
            }
            nwaffe.system.manoever =
                nwaffe.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf)
            // TODO: ich finde die waffeneigenschaften nicht besonders elegant umgesetzt,
            // könnte man dafür ggf. items anlegen und die iwie mit den waffen items verknüpfen?
            let kopflastig = nwaffe.system.eigenschaften.kopflastig
            let niederwerfen = nwaffe.system.eigenschaften.niederwerfen
            let parierwaffe = nwaffe.system.eigenschaften.parierwaffe
            let reittier = nwaffe.system.eigenschaften.reittier
            let ruestungsbrechend = nwaffe.system.eigenschaften.ruestungsbrechend
            let schild = nwaffe.system.eigenschaften.schild
            let schwer_4 = nwaffe.system.eigenschaften.schwer_4
            let schwer_8 = nwaffe.system.eigenschaften.schwer_8
            let stumpf = nwaffe.system.eigenschaften.stumpf
            let unberechenbar = nwaffe.system.eigenschaften.unberechenbar
            let unzerstoerbar = nwaffe.system.eigenschaften.unzerstoerbar
            let wendig = nwaffe.system.eigenschaften.wendig
            let zerbrechlich = nwaffe.system.eigenschaften.zerbrechlich
            let zweihaendig = nwaffe.system.eigenschaften.zweihaendig
            let kein_malus_nebenwaffe = nwaffe.system.eigenschaften.kein_malus_nebenwaffe
            let hauptwaffe = nwaffe.system.hauptwaffe
            let nebenwaffe = nwaffe.system.nebenwaffe
            let schaden = 0
            // let kopflastig = eigenschaften.includes("Kopflastig");
            schaden += sb
            if (kopflastig) {
                schaden += sb
            }
            let at = 0
            let vt = 0
            let fertigkeit = nwaffe.system.fertigkeit
            // console.log(fertigkeit);
            let talent = nwaffe.system.talent
            // console.log(talent);
            at += Number(nwaffe.system.wm_at)
            vt += Number(nwaffe.system.wm_vt)
            let pw = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pw
            // console.log(pw);
            let pwt = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pwt
            // console.log(pwt);
            let taltrue = actor.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.system.talente.find((x) => x.name == talent) // console.log(taltrue);
            if (typeof pw !== 'undefined') {
                // console.log(`${fertigkeit} ist defined`);
                if (typeof taltrue !== 'undefined') {
                    // console.log(`${talent} ist defined`);
                    at += pwt
                    vt += pwt
                } else {
                    at += pw
                    vt += pw
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
                at -= 2
                vt -= 2
            } else if (schwer_8 && KK < 8) {
                at -= 2
                vt -= 2
            }
            if (zweihaendig) {
                if (hauptwaffe && !nebenwaffe) {
                    at -= 2
                    vt -= 2
                    schaden -= 4
                } else if (!hauptwaffe && nebenwaffe) {
                    at -= 6
                    vt -= 6
                    schaden -= 4
                }
            }
            if (nebenwaffe && !zweihaendig && !kein_malus_nebenwaffe && !hauptwaffe) {
                vt -= 4
                at -= 4
            }
            at -= be
            vt -= be
            // at += wundabzuege;
            // vt += wundabzuege;
            const mod_at = nwaffe.system.mod_at
            const mod_vt = nwaffe.system.mod_vt
            const mod_schaden = nwaffe.system.mod_schaden
            if (!isNaN(mod_at)) {
                at += mod_at
            }
            if (!isNaN(mod_vt)) {
                vt += mod_vt
            }
            // if (!isNaN(mod_schaden)) { schaden += mod_schaden;}
            nwaffe.system.at = at
            nwaffe.system.vt = vt
            nwaffe.system.schaden = `${nwaffe.system.tp}${schaden < 0 ? schaden : '+' + schaden}`
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                nwaffe.system.schaden = `${nwaffe.system.tp}${
                    mod_schaden < 0 ? mod_schaden : '+' + mod_schaden
                }`
            }
            nwaffe.system.manoever.vlof.offensiver_kampfstil = actor.vorteil.kampf.some(
                (x) => x.name == 'Offensiver Kampfstil',
            )
            nwaffe.system.manoever.kwut = actor.vorteil.kampf.some((x) => x.name == 'Kalte Wut')
        }

        for (let fwaffe of actor.fernkampfwaffen) {
            fwaffe.system.manoever =
                fwaffe.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_fernkampf)
            let kein_reiter = fwaffe.system.eigenschaften.kein_reiter
            let reittier =
                HAUPTWAFFE?.system.eigenschaften?.reittier ||
                NEBENWAFFE?.system.eigenschaften?.reittier
            let niederwerfen = fwaffe.system.eigenschaften.niederwerfen
            let niederwerfen_4 = fwaffe.system.eigenschaften.niederwerfen_4
            let niederwerfen_8 = fwaffe.system.eigenschaften.niederwerfen_8
            let schwer_4 = fwaffe.system.eigenschaften.schwer_4
            let schwer_8 = fwaffe.system.eigenschaften.schwer_8
            let stationaer = fwaffe.system.eigenschaften.stationaer
            let stumpf = fwaffe.system.eigenschaften.stumpf
            let umklammern_212 = fwaffe.system.eigenschaften.umklammern_212
            let umklammern_416 = fwaffe.system.eigenschaften.umklammern_416
            let umklammern_816 = fwaffe.system.eigenschaften.umklammern_816
            let zweihaendig = fwaffe.system.eigenschaften.zweihaendig
            let hauptwaffe = fwaffe.system.hauptwaffe
            let nebenwaffe = fwaffe.system.nebenwaffe
            let schaden = 0
            let fk = 0
            let fertigkeit = fwaffe.system.fertigkeit
            let talent = fwaffe.system.talent
            fk += Number(fwaffe.system.wm_fk)
            let pw = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pw
            let pwt = actor.profan.fertigkeiten.find((x) => x.name == fertigkeit)?.system.pwt
            let taltrue = actor.profan.fertigkeiten
                .find((x) => x.name == fertigkeit)
                ?.system.talente.find((x) => x.name == talent)
            if (typeof pw !== 'undefined') {
                if (typeof taltrue !== 'undefined') {
                    fk += pwt
                } else {
                    fk += pw
                }
            }
            if (schwer_4 && KK < 4) {
                fk -= 2
            } else if (schwer_8 && KK < 8) {
                fk -= 2
            }
            if (nebenwaffe && !zweihaendig && !hauptwaffe) {
                fk -= 4
            }
            fk -= be
            // fk += wundabzuege;
            const mod_fk = fwaffe.system.mod_fk
            const mod_schaden = fwaffe.system.mod_schaden
            if (!isNaN(mod_fk)) {
                fk += mod_fk
            }
            fwaffe.system.fk = fk
            if (zweihaendig && ((hauptwaffe && !nebenwaffe) || (!hauptwaffe && nebenwaffe))) {
                fwaffe.system.fk = '-'
            } else if (kein_reiter && (hauptwaffe || nebenwaffe)) {
                // let reittier = false;
                // let reittier = HAUPTWAFFE?.data.data.eigenschaften?.reittier || NEBENWAFFE?.data.data.eigenschaften?.reittier;
                if (reittier && kein_reiter) {
                    fwaffe.system.fk = '-'
                }
            }
            fwaffe.system.schaden = `${fwaffe.system.tp}`
            if (typeof mod_schaden !== 'undefined' && mod_schaden !== null && mod_schaden !== '') {
                fwaffe.system.schaden = `${fwaffe.system.tp}${
                    mod_schaden < 0 ? mod_schaden : '+' + mod_schaden
                }`
            }

            // if (data.data.vorteil.kampf.find(x => x.name.includes("Defensiver Kampfstil"))) item.data.data.manoever.vldf.possible = true;
            if (actor.vorteil.kampf.find((x) => x.name.includes('Schnellziehen')))
                fwaffe.system.manoever.fm_snls.possible = true
            if (actor.vorteil.kampf.find((x) => x.name.includes('Ruhige Hand')))
                fwaffe.system.manoever.fm_zlen.ruhige_hand = true
            if (actor.vorteil.kampf.find((x) => x.name.includes('Meisterschuss')))
                fwaffe.system.manoever.fm_msts.possible = true
            if (true) fwaffe.system.manoever.fm_rust.possible = true
            let rw = fwaffe.system.rw
            fwaffe.system.manoever.rw['0'] = `${rw} Schritt`
            fwaffe.system.manoever.rw['1'] = `${2 * rw} Schritt`
            fwaffe.system.manoever.rw['2'] = `${4 * rw} Schritt`
            if (actor.vorteil.kampf.find((x) => x.name.includes('Reflexschuss')))
                fwaffe.system.manoever.rflx = true
            if (hardcoded.getKampfstilStufe('rtk', actor) >= 2)
                fwaffe.system.manoever.brtn.rtk = true
            if (reittier) fwaffe.system.manoever.brtn.selected = true
            // get status effects
            // licht lcht
            // console.log("bevor get_status_effects");
            // console.log(data);
            let ss1 = this.__getStatuseffectById(actor, 'schlechtesicht1')
            let ss2 = this.__getStatuseffectById(actor, 'schlechtesicht2')
            let ss3 = this.__getStatuseffectById(actor, 'schlechtesicht3')
            let ss4 = this.__getStatuseffectById(actor, 'schlechtesicht4')
            if (ss4) {
                fwaffe.system.manoever.lcht.selected = 4
            } else if (ss3) {
                fwaffe.system.manoever.lcht.selected = 3
            } else if (ss2) {
                fwaffe.system.manoever.lcht.selected = 2
            } else if (ss1) {
                fwaffe.system.manoever.lcht.selected = 1
            } else {
                fwaffe.system.manoever.lcht.selected = 0
            }
            let lcht_angepasst = hardcoded.getAngepasst('Dunkelheit', actor)
            // console.log(`licht angepasst: ${lcht_angepasst}`);
            fwaffe.system.manoever.lcht.angepasst = lcht_angepasst
            fwaffe.system.manoever.kwut = actor.vorteil.kampf.some((x) => x.name == 'Kalte Wut')
        }

        // "ohne": "Kein Kampfstil",
        // "bhk": "Beidhändiger Kampf",
        // "kvk": "Kraftvoller Kampf",
        // "pwk": "Parierwaffenkampf",
        // "rtk": "Reiterkampf",
        // "shk": "Schildkampf",
        // "snk": "Schneller Kampf"
        if (
            selected_kampfstil.name.includes('Beidhändiger Kampf') &&
            weaponUtils.checkComatStyleConditions(
                selected_kampfstil.bedingungen,
                HAUPTWAFFE,
                NEBENWAFFE,
                this.system.misc.ist_beritten,
            )
        ) {
            let at_hw = selected_kampfstil.modifiers.at
            let at_nw = selected_kampfstil.modifiers.at
            if (selected_kampfstil.stufe >= 2) {
                weaponUtils.ignoreSideWeaponMalus(NEBENWAFFE)
            }
            HAUPTWAFFE.system.at += at_hw
            NEBENWAFFE.system.at += at_nw
        } else if (selected_kampfstil.name.includes('Kraftvoller Kampf')) {
            let waffe = weaponUtils.usesSingleWeapon(HAUPTWAFFE, NEBENWAFFE)
            if (waffe) {
                let schaden = selected_kampfstil.modifiers.damage
                schaden = '+'.concat(schaden)
                waffe.system.schaden = waffe.system.schaden.concat(schaden)
            }
        } else if (
            selected_kampfstil.name.includes('Parierwaffenkampf') &&
            weaponUtils.anyWeaponNeedsToMeetRequirement(HAUPTWAFFE, NEBENWAFFE, 'parierwaffe') &&
            !weaponUtils.anyWeaponNeedsToMeetRequirement(HAUPTWAFFE, NEBENWAFFE, 'reittier')
        ) {
            if (selected_kampfstil.stufe >= 2) {
                weaponUtils.ignoreSideWeaponMalus(NEBENWAFFE, 'parierwaffe')
            }
        } else if (
            selected_kampfstil.name.includes('Reiterkampf') &&
            weaponUtils.anyWeaponNeedsToMeetRequirement(HAUPTWAFFE, NEBENWAFFE, 'reittier')
        ) {
            let schaden = selected_kampfstil.modifiers.damage
            let at = selected_kampfstil.modifiers.at
            let vt = selected_kampfstil.modifiers.vt
            let beReduction = selected_kampfstil.modifiers.be
            schaden = '+'.concat(schaden)

            if (be > 0) {
                be -= beReduction
            }
            if (HAUPTWAFFE && HAUPTWAFFE.type == 'nahkampfwaffe') {
                HAUPTWAFFE.system.at += at
                HAUPTWAFFE.system.vt += vt
                HAUPTWAFFE.system.schaden = HAUPTWAFFE.system.schaden.concat(schaden)
            }

            if (HAUPTWAFFE.id != NEBENWAFFE.id) {
                if (NEBENWAFFE && NEBENWAFFE.type == 'nahkampfwaffe') {
                    NEBENWAFFE.system.at += at
                    NEBENWAFFE.system.vt += vt
                    NEBENWAFFE.system.schaden = NEBENWAFFE.system.schaden.concat(schaden)
                }
                if (selected_kampfstil.stufe >= 2) {
                    weaponUtils.ignoreSideWeaponMalus(NEBENWAFFE, 'reittier')
                }
            }
        } else if (
            selected_kampfstil.name.includes('Schildkampf') &&
            weaponUtils.anyWeaponNeedsToMeetRequirement(HAUPTWAFFE, NEBENWAFFE, 'schild')
        ) {
            let vt = selected_kampfstil.modifiers.vt
            if (HAUPTWAFFE && HAUPTWAFFE.type == 'nahkampfwaffe') {
                HAUPTWAFFE.system.vt += vt
            }
            if (HAUPTWAFFE && NEBENWAFFE && HAUPTWAFFE.id != NEBENWAFFE.id) {
                if (NEBENWAFFE && NEBENWAFFE.type == 'nahkampfwaffe') {
                    NEBENWAFFE.system.vt += vt
                }
                if (selected_kampfstil.stufe >= 2) {
                    weaponUtils.ignoreSideWeaponMalus(NEBENWAFFE, 'schild')
                }
            }
        } else if (selected_kampfstil.name.includes('Schneller Kampf')) {
            let waffe = weaponUtils.usesSingleWeapon(HAUPTWAFFE, NEBENWAFFE)
            if (waffe) {
                waffe.system.at += selected_kampfstil.modifiers.at
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
                console.log('Ich überschreibe Magie Manöver')
            }
            item.system.manoever =
                item.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_magie)
            console.log(item.system)
        }
        for (let item of actor.uebernatuerlich.liturgien) {
            if (item.system.manoever == undefined) {
                console.log('Ich überschreibe Karma Manöver')
            }
            item.system.manoever =
                item.system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_karma)
            console.log(item.system)
        }
    }
    _sortItems(actor) {
        console.log('_sortItems')
        // koennen  alle noetigen variablen nicht direkt ins objekt geschrieben werden
        let ruestungen = []
        let nahkampfwaffen = []
        let fernkampfwaffen = []
        let profan_fertigkeiten = []
        let profan_talente = []
        let profan_fertigkeit_list = []
        let profan_talente_unsorted = []
        let uebernatuerliche_fertigkeiten = []
        let magie_talente = []
        let karma_talente = []
        let anrufung_talente = []
        let freie_fertigkeiten = []
        let vorteil_allgemein = []
        let vorteil_profan = []
        let vorteil_kampf = []
        let vorteil_kampfstil = []
        let vorteil_magie = []
        let vorteil_zaubertraditionen = []
        let vorteil_karma = []
        let vorteil_geweihtetraditionen = []
        let eigenheiten = []
        let eigenschaften = [] // kreatur only
        let angriffe = [] // kreatur only
        let infos = [] // kreatur only
        let vorteile = [] // TODO: gleich machen fuer helden und kreaturen
        let freietalente = []
        let freie_uebernatuerliche_fertigkeiten = []
        let unsorted = []
        let speicherplatz_list = ['tragend', 'mitführend']
        let item_tragend = []
        let item_mitfuehrend = []
        let item_list = []
        let item_list_tmp = []
        for (let item of actor.items) {
            // let item = i.data;
            if (item.type == 'ruestung') {
                // console.log("Rüstung gefunden");
                // console.log(i);
                item.system.bewahrt_auf = []
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0
                    speicherplatz_list.push(item.name)
                    item_list.push(item)
                } else item_list_tmp.push(item)
                ruestungen.push(item)
            } else if (item.type == 'nahkampfwaffe') {
                // console.log("Nahkampfwaffe gefunden");
                item.system.bewahrt_auf = []
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0
                    speicherplatz_list.push(item.name)
                    item_list.push(item)
                } else item_list_tmp.push(item)
                // for migration from dice_anzahl and dice_plus to tp
                // Only migrate if tp is not set yet AND old fields exist
                if (!item.system.tp && (item.system.dice_plus || item.system.dice_anzahl)) {
                    item.system.tp = `${item.system.dice_anzahl}W6${
                        item.system.dice_plus < 0 ? '' : '+'
                    }${item.system.dice_plus}`
                    delete item.system.dice_anzahl
                    delete item.system.dice_plus
                }
                nahkampfwaffen.push(item)
            } else if (item.type == 'fernkampfwaffe') {
                // console.log("Fernkampfwaffe gefunden");
                console.log(item)
                item.system.bewahrt_auf = []
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0
                    speicherplatz_list.push(item.name)
                    item_list.push(item)
                } else item_list_tmp.push(item)
                // for migration from dice_anzahl and dice_plus to tp
                // Only migrate if tp is not set yet AND old fields exist
                if (!item.system.tp && (item.system.dice_plus || item.system.dice_anzahl)) {
                    item.system.tp = `${item.system.dice_anzahl}W6${
                        item.system.dice_plus < 0 ? '' : '+'
                    }${item.system.dice_plus}`
                    delete item.system.dice_anzahl
                    delete item.system.dice_plus
                }
                fernkampfwaffen.push(item)
            } else if (item.type == 'gegenstand') {
                item.system.bewahrt_auf = []
                if (item.system.gewicht < 0) {
                    item.system.gewicht_summe = 0
                    speicherplatz_list.push(item.name)
                    item_list.push(item)
                } else item_list_tmp.push(item)
            } else if (item.type == 'fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                item.system.talente = []
                profan_fertigkeiten.push(item)
                profan_fertigkeit_list.push(item.name)
                // profan_talente[i.name] = [];
            } else if (item.type == 'talent') {
                profan_talente.push(item)
            } else if (item.type == 'freie_fertigkeit') {
                freie_fertigkeiten.push(item)
            } else if (item.type == 'uebernatuerliche_fertigkeit') {
                // console.log("Magiefertigkeit gefunden");
                // console.log(i);
                uebernatuerliche_fertigkeiten.push(item)
            } else if (item.type == 'zauber') {
                magie_talente.push(item)
            } else if (item.type == 'liturgie') {
                karma_talente.push(item)
            } else if (item.type == 'anrufung') {
                anrufung_talente.push(item)
            } else if (item.type == 'vorteil') {
                if (item.system.gruppe == 0) vorteil_allgemein.push(item)
                else if (item.system.gruppe == 1) vorteil_profan.push(item)
                else if (item.system.gruppe == 2) vorteil_kampf.push(item)
                else if (item.system.gruppe == 3) vorteil_kampfstil.push(item)
                else if (item.system.gruppe == 4) vorteil_magie.push(item)
                else if (item.system.gruppe == 5) vorteil_zaubertraditionen.push(item)
                else if (item.system.gruppe == 6) vorteil_karma.push(item)
                else if (item.system.gruppe == 7) vorteil_geweihtetraditionen.push(item)
                // else vorteil_allgemein.push(i);
            } else if (item.type == 'eigenheit') {
                eigenheiten.push(item)
            } else if (item.type == 'eigenschaft') {
                // kreatur only
                console.log(item)
                eigenschaften.push(item)
            } else if (item.type == 'angriff') {
                // kreatur only
                angriffe.push(item)
            } else if (item.type == 'info') {
                // kreatur only
                infos.push(item)
            } else if (item.type == 'freiestalent') {
                if (item.system.profan == true) {
                    freietalente.push(item)
                    console.log('Freies Talent eingetragen')
                } else {
                    freie_uebernatuerliche_fertigkeiten.push(item)
                    console.log('Freies Uebernatuerliches Talent eingetragen')
                }
            } else unsorted.push(item)
        }
        ruestungen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        nahkampfwaffen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        fernkampfwaffen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        item_list.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        item_list_tmp.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        uebernatuerliche_fertigkeiten.sort((a, b) =>
            a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
        )
        uebernatuerliche_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        // magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        magie_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        magie_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        karma_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        karma_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        anrufung_talente.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        anrufung_talente.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        profan_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        profan_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        freie_fertigkeiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        freie_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )
        vorteil_allgemein.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_profan.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_kampf.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_kampfstil.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_magie.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_zaubertraditionen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_karma.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        vorteil_geweihtetraditionen.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        eigenheiten.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
        freie_uebernatuerliche_fertigkeiten.sort((a, b) =>
            a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0,
        )

        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'name' );
        // profan_fertigkeiten = _.sortBy( profan_fertigkeiten, 'data.gruppe' );

        for (let talent of profan_talente) {
            if (profan_fertigkeit_list.includes(talent.system.fertigkeit)) {
                profan_fertigkeiten
                    .find((x) => x.name == talent.system.fertigkeit)
                    .system.talente.push(talent)
            } else {
                profan_talente_unsorted.push(talent)
            }
        }

        actor.system.getragen = 0
        for (let i of item_list_tmp) {
            let aufbewahrung = i.system.aufbewahrungs_ort
            if (aufbewahrung == 'tragend') {
                item_tragend.push(i)
            } else if (aufbewahrung == 'mitführend') {
                item_mitfuehrend.push(i)
                actor.system.getragen += i.system.gewicht
            } else if (speicherplatz_list.includes(aufbewahrung)) {
                // item_list.find(x => x.name == aufbewahrung).system.bewahrt_auf.push(i);
                let idx = item_list.indexOf(item_list.find((x) => x.name == aufbewahrung))
                item_list[idx].system.bewahrt_auf.push(i)
                item_list[idx].system.gewicht_summe += i.system.gewicht
            } else {
                i.system.aufbewahrungs_ort == 'mitführend'
                item_mitfuehrend.push(i)
                actor.system.getragen += i.system.gewicht
            }
        }

        // data.magie = {};
        // data.karma = {};
        actor.profan = {}
        actor.uebernatuerlich = {}
        actor.vorteil = {}
        actor.inventar = {}
        actor.inventar.tragend = item_tragend
        actor.inventar.mitfuehrend = item_mitfuehrend
        actor.inventar.item_list = item_list
        actor.ruestungen = ruestungen
        actor.nahkampfwaffen = nahkampfwaffen
        actor.fernkampfwaffen = fernkampfwaffen
        actor.uebernatuerlich.fertigkeiten = uebernatuerliche_fertigkeiten
        actor.uebernatuerlich.zauber = magie_talente
        actor.uebernatuerlich.liturgien = karma_talente
        actor.uebernatuerlich.anrufungen = anrufung_talente
        actor.profan.fertigkeiten = profan_fertigkeiten
        actor.profan.talente_unsorted = profan_talente_unsorted
        actor.profan.freie = freie_fertigkeiten
        // vorteil singular? inkonsistent zu den anderen listen
        // fuer kreaturen waere es wesentlich einfacher alles in einer liste zu sammeln
        // und die kategorie als property zu behalten (kann ja auch nach gefiltert werden)
        // in data.vorteile leg ich erstmal alle ab als zwischenloesung ;)
        actor.vorteil.allgemein = vorteil_allgemein
        actor.vorteil.profan = vorteil_profan
        actor.vorteil.kampf = vorteil_kampf
        actor.vorteil.kampfstil = vorteil_kampfstil
        actor.vorteil.magie = vorteil_magie
        actor.vorteil.zaubertraditionen = vorteil_zaubertraditionen
        actor.vorteil.karma = vorteil_karma
        actor.vorteil.geweihtentradition = vorteil_geweihtetraditionen
        actor.eigenheiten = eigenheiten
        actor.unsorted = unsorted
        actor.misc = actor.misc || {}
        actor.misc.kampfstile_list = vorteil_kampfstil.map((kampfstil) => kampfstil.name)
        actor.misc.profan_fertigkeit_list = profan_fertigkeit_list
        actor.misc.uebernatuerlich_fertigkeit_list =
            this.__getAlleUebernatuerlichenFertigkeiten(actor)
        actor.misc.speicherplatz_list = speicherplatz_list
        if (actor.type == 'kreatur') {
            actor.eigenschaften = eigenschaften
            actor.angriffe = angriffe
            actor.infos = infos
            actor.freietalente = freietalente
            actor.uebernatuerlich.fertigkeiten = freie_uebernatuerliche_fertigkeiten
            actor.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options)
        }
    }
}
