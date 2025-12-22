import * as hardcoded from './hardcodedvorteile.js'
import * as weaponUtils from './weapon-utils.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'

/**
 * Global cache for abgeleitete werte definitions
 * @type {Map<string, object>}
 */
const abgeleiteteWerteCache = new Map()

/**
 * Sort comparator function for sorting items by name
 * @param {Object} a - First item to compare
 * @param {Object} b - Second item to compare
 * @returns {number} -1, 0, or 1 for sorting
 */
function sortByName(a, b) {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0
}

/**
 * Sort comparator function for sorting items by gruppe (system.gruppe)
 * @param {Object} a - First item to compare
 * @param {Object} b - Second item to compare
 * @returns {number} -1, 0, or 1 for sorting
 */
function sortByGruppe(a, b) {
    return a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0
}

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

        // Calculate all base derived values before effects are applied
        if (this.system.attribute && this.system.abgeleitete) {
            // Base Initiative
            if (this.system.attribute.IN?.wert !== undefined) {
                this.system.abgeleitete.ini = this.system.attribute.IN.wert
            }

            // Base Magic Resistance
            if (this.system.attribute.MU?.wert !== undefined) {
                this.system.abgeleitete.mr = 4 + Math.floor(this.system.attribute.MU.wert / 4)
            }

            // Base GS (Geschwindigkeit)
            if (this.system.attribute.GE?.wert !== undefined) {
                this.system.abgeleitete.gs = 4 + Math.floor(this.system.attribute.GE.wert / 4)
            }

            // Base Traglast and Traglast Intervall
            if (this.system.attribute.KK?.wert !== undefined) {
                let kk = this.system.attribute.KK.wert
                this.system.abgeleitete.traglast_intervall = kk >= 1 ? kk : 1
                this.system.abgeleitete.traglast = kk >= 1 ? 2 * kk : 1
            }

            // Base Durchhaltevermögen (will be modified by hardcoded later)
            if (this.system.attribute.KO?.wert !== undefined) {
                // Basic formula before hardcoded modifications
                this.system.abgeleitete.dh = this.system.attribute.KO.wert
                this.system.abgeleitete.ws = 4 + Math.floor(this.system.attribute.KO.wert / 4)
            }

            // Base ASP (will be modified by hardcoded and zugekauft/gasp later)
            this.system.abgeleitete.asp = 0

            // Base KAP (will be modified by hardcoded and zugekauft/gkap later)
            this.system.abgeleitete.kap = 0

            // Calculate base SchiPs
            this.system.schips.schips = 4
        }
    }

    /**
     * Override getRollData to provide data for inline rolls and formulas.
     * Makes fertigkeiten (skills) accessible via @fertigkeiten.Name.pw syntax.
     * @returns {object} Roll data object containing system data and formatted fertigkeiten
     */
    getRollData() {
        const data = super.getRollData()

        // Add fertigkeiten in a format that allows @fertigkeiten.Name.pw access
        if (this.profan?.fertigkeiten) {
            data.fertigkeiten = {}
            for (const fertigkeit of this.profan.fertigkeiten) {
                // Use the fertigkeit name as the key and include all system properties
                data.fertigkeiten[fertigkeit.name] = fertigkeit.system
            }
        }

        // Add uebernatuerlich fertigkeiten as well
        if (this.uebernatuerlich?.fertigkeiten) {
            if (!data.fertigkeiten) {
                data.fertigkeiten = {}
            }
            for (const fertigkeit of this.uebernatuerlich.fertigkeiten) {
                // Use the fertigkeit name as the key and include all system properties
                data.fertigkeiten[fertigkeit.name] = fertigkeit.system
            }
        }

        return data
    }

    _checkVorteilSource(requirement, vorteil, item) {
        // For Stile (gruppe 3, 5, or 7) on held-type actors, check with getSelectedStil
        if (this.type === 'held' && [3, 5, 7].includes(Number(vorteil.system.gruppe))) {
            if (
                item.system.hauptwaffe ||
                item.system.nebenwaffe ||
                item.type === 'zauber' ||
                item.type === 'liturgie'
            ) {
                const kampfStil = hardcoded.getSelectedStil(this, 'kampf')
                const ueberStil = hardcoded.getSelectedStil(this, 'uebernatuerlich')
                return (
                    (kampfStil.active &&
                        kampfStil?.sources.some((source) => source === requirement)) ||
                    ueberStil?.sources.some((source) => source === requirement)
                )
            } else {
                return false
            }
        }

        // For all other cases, just check if the requirement matches the vorteil name
        return vorteil.name === requirement
    }

    _hasVorteil(vorteilRequirement, item) {
        // use _stats.compendiumSource or flags.core.sourceId to check for requirement
        return (
            this.vorteil.allgemein.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.kampf.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.karma.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.magie.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.profan.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.kampfstil.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.zaubertraditionen.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.geweihtentradition.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
            }) ||
            this.vorteil.tiergeist.some((vorteil) => {
                return this._checkVorteilSource(vorteilRequirement, vorteil, item)
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
        // Check if LEP system is active
        // even with this an actor should get more wounds through damage just differently calculated
        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )
        console.log('Berechne Wunden')
        let einschraenkungen = Math.floor(
            systemData.gesundheit.wunden + systemData.gesundheit.erschoepfung,
        )
        let gesundheitzusatz = ``
        const max_hp = systemData.gesundheit.hp.max
        let new_hp = max_hp - einschraenkungen

        if (useLepSystem) {
            // LEP system: no penalties until 2/8 of max_hp, then -2 per 1/8 interval
            const threshold = max_hp * (2 / 8)
            if (einschraenkungen < threshold) {
                systemData.gesundheit.wundabzuege = 0
            } else {
                const intervalsAboveThreshold =
                    Math.floor((einschraenkungen - threshold) / (max_hp / 8)) + 1
                systemData.gesundheit.wundabzuege = -2 * intervalsAboveThreshold
            }
        } else {
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
        let ws = actor.system.abgeleitete.ws || 4 + Math.floor(actor.system.attribute.KO.wert / 4)
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

        // Get custom abgeleitete werte definitions from cache
        const customDefinitions = this._getAbgeleiteteWerteDefinitions()

        // Helper function to execute custom script or use default calculation
        const calculateValue = (valueName, defaultCalculation) => {
            const customDef = customDefinitions.get(valueName)
            if (customDef && customDef.script) {
                try {
                    // Create evaluation context with actor data and helper functions
                    const getAttribut = (attr) => actor.system.attribute[attr]?.wert || 0
                    const roundDown = Math.floor
                    const getWS = () => actor.system.abgeleitete.ws || 0
                    const getRS = () => {
                        let rs = 0
                        for (let ruestung of actor.ruestungen) {
                            if (ruestung.system.aktiv) rs += ruestung.system.rs
                        }
                        return rs
                    }

                    // Evaluate the script
                    const result = eval(customDef.script)
                    console.log(
                        `Using custom calculation for ${valueName}: ${customDef.script} = ${result}`,
                    )
                    return result
                } catch (error) {
                    console.error(
                        `Error evaluating custom script for ${valueName}: ${error.message}`,
                    )
                    console.error(`Script was: ${customDef.script}`)
                    return defaultCalculation()
                }
            }
            return defaultCalculation()
        }

        // Calculate INI
        let ini = calculateValue('INI', () => {
            let val = actor.system.attribute.IN.wert
            val = hardcoded.initiative(val, actor)
            return val
        })
        actor.system.abgeleitete.ini = ini
        actor.system.initiative = ini + 0.5

        // Calculate MR
        let mr = calculateValue('MR', () => {
            let val = 4 + Math.floor(actor.system.attribute.MU.wert / 4)
            val = hardcoded.magieresistenz(val, actor)
            return val
        })
        actor.system.abgeleitete.mr = mr

        // Calculate WS (Wundschwelle) and armor
        let ws = calculateValue('WS', () => {
            let val = 4 + Math.floor(actor.system.attribute.KO.wert / 4)
            val = hardcoded.wundschwelle(val, actor)
            return val
        })
        actor.system.abgeleitete.ws = ws

        // Calculate WS* (with armor) and body part armor
        // Check if LEP system is active
        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )

        if (useLepSystem) {
            actor.system.gesundheit.hp.max = ws
            actor.system.gesundheit.hp.value = ws
        } else {
            actor.system.gesundheit.hp.max = 9
            actor.system.gesundheit.hp.value = 9
        }

        // In LEP system, ws_stern starts at 0 instead of being based on ws
        let ws_stern = hardcoded.wundschwelleStern(useLepSystem ? 0 : ws, actor)
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
        actor.system.abgeleitete.ws_stern = ws_stern
        actor.system.abgeleitete.be = be
        actor.system.abgeleitete.ws_beine = ws_beine
        actor.system.abgeleitete.ws_larm = ws_larm
        actor.system.abgeleitete.ws_rarm = ws_rarm
        actor.system.abgeleitete.ws_bauch = ws_bauch
        actor.system.abgeleitete.ws_brust = ws_brust
        actor.system.abgeleitete.ws_kopf = ws_kopf

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

        // Calculate BE modification from carried weight
        let be_mod = hardcoded.beTraglast(actor.system)
        actor.system.abgeleitete.be += be_mod
        actor.system.abgeleitete.be_traglast = be_mod

        // Durchhaltevermögen: apply hardcoded modifications
        let dh = hardcoded.durchhalte(actor)
        actor.system.abgeleitete.dh = dh

        // Calculate GS
        let gs = calculateValue('GS', () => {
            let val = 4 + Math.floor(actor.system.attribute.GE.wert / 4)
            val = hardcoded.geschwindigkeit(val, actor)
            val -= actor.system.abgeleitete.be
            val = val >= 1 ? val : 1
            return val
        })
        actor.system.abgeleitete.gs = gs

        // Calculate SchiP (Schicksalspunkte)
        let schips = calculateValue('SchiP', () => {
            return hardcoded.schips(actor)
        })
        actor.system.schips.schips = schips

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

        // KAP: apply hardcoded modifications and add/subtract purchased/spent values
        let kap = actor.system.abgeleitete.kap || 0
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

    /**
     * Get custom abgeleitete werte definitions from cache
     * @returns {Map<string, object>} Map of value names to their definitions
     * @private
     */
    _getAbgeleiteteWerteDefinitions() {
        return abgeleiteteWerteCache
    }

    async _calculateKampf(actor) {
        console.log('Berechne Kampf')
        // data.data.abgeleitete.sb = sb;
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

        let HW =
            actor.nahkampfwaffen.find((x) => x.system.hauptwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.hauptwaffe == true)
        let NW =
            actor.nahkampfwaffen.find((x) => x.system.nebenwaffe == true) ||
            actor.fernkampfwaffen.find((x) => x.system.nebenwaffe == true)

        actor.misc.selected_kampfstil_conditions_not_met = ''

        if (
            weaponUtils.checkCombatStyleConditions(
                selected_kampfstil,
                HW,
                NW,
                this.system.misc.ist_beritten,
                actor,
            )
        ) {
            actor.misc.selected_kampfstil_conditions_not_met = ''
            selected_kampfstil.active = true
        } else {
            selected_kampfstil.active = false
        }

        // Prepare all weapons and wait for eigenschaften to load
        const weapons = actor.items.filter(
            (i) => i.type === 'fernkampfwaffe' || i.type === 'nahkampfwaffe',
        )
        await Promise.all(weapons.map((waffe) => waffe.prepareWeapon()))

        // Apply actor modifiers from equipped weapons
        this._applyWeaponActorModifiers(actor)

        if (selected_kampfstil.active) {
            // Refactored: execute kampfstil methods and apply modifiers
            weaponUtils._executeKampfstilMethodsAndApplyModifiers(selected_kampfstil, HW, NW, actor)
        }
    }

    /**
     * Apply actor modifiers from equipped weapons with eigenschaften
     * @param {Actor} actor - The actor
     * @private
     */
    _applyWeaponActorModifiers(actor) {
        // Collect all actor modifiers from equipped weapons
        const modifiersByProperty = {
            be: [],
            ini: [],
            gs: [],
            ws: [],
            ws_stern: [],
            mr: [],
        }

        // Get equipped weapons
        const hauptwaffe = actor.items.find(
            (i) =>
                (i.type === 'fernkampfwaffe' || i.type === 'nahkampfwaffe') && i.system.hauptwaffe,
        )
        const nebenwaffe = actor.items.find(
            (i) =>
                (i.type === 'fernkampfwaffe' || i.type === 'nahkampfwaffe') &&
                i.system.nebenwaffe &&
                i !== hauptwaffe,
        )

        // Collect modifiers from equipped weapons
        for (const weapon of [hauptwaffe, nebenwaffe].filter((w) => w)) {
            if (
                weapon.system.computed?.hasActorModifiers &&
                weapon.system.computed?.actorModifiers
            ) {
                for (const mod of weapon.system.computed.actorModifiers) {
                    if (modifiersByProperty[mod.property]) {
                        modifiersByProperty[mod.property].push({
                            mode: mod.mode,
                            value: mod.value,
                            weaponName: mod.weaponName,
                        })
                    }
                }
            } else {
                // Weapon exists but has no actor modifiers - add default augment 0 for all properties
                for (const property of Object.keys(modifiersByProperty)) {
                    modifiersByProperty[property].push({
                        mode: 'augment',
                        value: 0,
                        weaponName: weapon.name,
                    })
                }
            }
        }

        // Apply modifiers to actor's abgeleitete stats
        for (const [property, modifiers] of Object.entries(modifiersByProperty)) {
            if (modifiers.length === 0) continue

            // Apply 'set' modifiers first (highest wins)
            const setMods = modifiers.filter((m) => m.mode === 'set')
            if (setMods.length > 0) {
                const highest = Math.max(...setMods.map((m) => m.value))
                actor.system.abgeleitete[property] = highest
            }

            // Apply 'augment' modifiers (always take the lowest value)
            const augmentMods = modifiers.filter((m) => m.mode === 'augment')
            if (augmentMods.length > 0) {
                const lowest = Math.min(...augmentMods.map((m) => m.value))
                actor.system.abgeleitete[property] =
                    (actor.system.abgeleitete[property] || 0) + lowest
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
        let vorteil_tiergeist = []
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
                else if (item.system.gruppe == 8) vorteil_tiergeist.push(item)
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
        ruestungen.sort(sortByName)
        nahkampfwaffen.sort(sortByName)
        fernkampfwaffen.sort(sortByName)
        item_list.sort(sortByName)
        item_list_tmp.sort(sortByName)
        uebernatuerliche_fertigkeiten.sort(sortByName)
        uebernatuerliche_fertigkeiten.sort(sortByGruppe)
        // magie_fertigkeiten.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        // magie_fertigkeiten.sort((a, b) => (a.data.gruppe > b.data.gruppe) ? 1 : ((b.data.gruppe > a.data.gruppe) ? -1 : 0));
        magie_talente.sort(sortByName)
        magie_talente.sort(sortByGruppe)
        karma_talente.sort(sortByName)
        karma_talente.sort(sortByGruppe)
        anrufung_talente.sort(sortByName)
        anrufung_talente.sort(sortByGruppe)
        profan_fertigkeiten.sort(sortByName)
        profan_fertigkeiten.sort(sortByGruppe)
        freie_fertigkeiten.sort(sortByName)
        freie_fertigkeiten.sort(sortByGruppe)
        vorteil_allgemein.sort(sortByName)
        vorteil_profan.sort(sortByName)
        vorteil_kampf.sort(sortByName)
        vorteil_kampfstil.sort(sortByName)
        vorteil_magie.sort(sortByName)
        vorteil_zaubertraditionen.sort(sortByName)
        vorteil_karma.sort(sortByName)
        vorteil_geweihtetraditionen.sort(sortByName)
        vorteil_tiergeist.sort(sortByName)
        eigenheiten.sort(sortByName)
        freie_uebernatuerliche_fertigkeiten.sort(sortByGruppe)

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
        actor.vorteil.tiergeist = vorteil_tiergeist
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
        }
    }
}

/**
 * Preload custom abgeleitete werte definitions from compendiums into global cache
 * Should be called during system initialization (ready hook)
 * @returns {Promise<number>} Number of definitions loaded
 */
export async function preloadAbgeleiteteWerteDefinitions() {
    console.log('Ilaris | Preloading abgeleitete werte definitions...')

    abgeleiteteWerteCache.clear()

    try {
        // Get selected packs from settings
        const selectedPacks = JSON.parse(
            game.settings.get('Ilaris', 'abgeleiteteWertePacks') || '[]',
        )

        // If no packs selected, return empty cache (use default calculations)
        if (!selectedPacks || selectedPacks.length === 0) {
            console.log(
                'Ilaris | No abgeleitete werte packs configured, using default calculations',
            )
            return 0
        }

        // Load items from selected packs
        for (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (!pack) continue

            const items = await pack.getDocuments()
            for (const item of items) {
                if (item.type === 'abgeleiteter-wert') {
                    // Store by item name (e.g., "WS", "INI", "MR", "GS", "SchiP")
                    abgeleiteteWerteCache.set(item.name, {
                        name: item.name,
                        formel: item.system.formel,
                        script: item.system.script,
                        finalscript: item.system.finalscript,
                        text: item.system.text,
                    })
                }
            }
        }

        console.log(
            `Ilaris | Preloaded ${abgeleiteteWerteCache.size} abgeleitete werte definitions`,
        )
        return abgeleiteteWerteCache.size
    } catch (error) {
        console.error('Ilaris | Error loading abgeleitete werte definitions:', error)
        return 0
    }
}
