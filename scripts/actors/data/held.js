import { IlarisActor } from './actor.js'
import * as hardcoded from './hardcodedvorteile.js'
import * as weaponUtils from './actor-weapon-utils.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'

export class HeldActor extends IlarisActor {
    async _preCreate(data, options, user) {
        // Prototype token defaults are set in IlarisActor.createDocuments()
        // which runs before document construction (PF2e pattern).
        await super._preCreate(data, options, user)
    }

    /** @override */
    async prepareData() {
        // sieht jetzt gleich aus, kann in actor.js?
        super.prepareData()
        await this._initializeActor() // TODO: warum wird data überall durchgegeben, ist doch sowieso instanziert??
    }

    async _initializeActor() {
        // NOTE: sieht aus als wäre _initialize eine methode von Actor,
        // die man nicht einfach überschreiben sollte
        // daher umbenannt in _initializeActor
        if (this.system.modifikatoren && !this.system.modifikatoren?.verteidigungmod) {
            this.system.modifikatoren.verteidigungmod = 0
        }
        this._sortItems(this) //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(this.system)

        // Initialize ws_stern and body-part armor from the current (AE-modified) ws.
        // This runs after super.prepareData() has applied Active Effects.
        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )
        let ws_stern = useLepSystem ? 0 : this.system.abgeleitete.ws
        this.system.abgeleitete.ws_stern = ws_stern
        this.system.abgeleitete.ws_beine = ws_stern
        this.system.abgeleitete.ws_larm = ws_stern
        this.system.abgeleitete.ws_rarm = ws_stern
        this.system.abgeleitete.ws_bauch = ws_stern
        this.system.abgeleitete.ws_brust = ws_stern
        this.system.abgeleitete.ws_kopf = ws_stern

        this._calculateAbgeleitete(this)
        this._calculateWounds(this.system)
        this._calculateFear(this.system)
        this._calculateModifikatoren(this.system)
        this._calculateProfanFertigkeiten(this)
        this._calculateUebernaturlichFertigkeiten(this)
        this._calculateUebernaturlichTalente(this) //Nach Uebernatürliche Fertigkeiten
        await this._calculateKampf(this)
        this._calculateUebernatuerlichProbendiag(this)
        // damit kommen Helden immer vor NPCs in der Init-Reihenfolge mit gleichen Ini-Werten
        this.system.initiative = this.system.abgeleitete.ini || 0
        this.system.initiative += 0.5
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

    _calculateAbgeleitete() {
        this.system.abgeleitete.zauberer =
            this.system.abgeleitete.asp > 0 ||
            this.system.abgeleitete.gasp ||
            this.system.abgeleitete.asp_zugekauft
        this.system.abgeleitete.geweihter =
            this.system.abgeleitete.kap > 0 ||
            this.system.abgeleitete.gkap ||
            this.system.abgeleitete.kap_zugekauft

        let be = this.system.abgeleitete.be
        for (let ruestung of this.ruestungen) {
            if (ruestung.system.aktiv == true) {
                this.system.abgeleitete.ws_stern += ruestung.system.rs
                be += ruestung.system.be
                this.system.abgeleitete.ws_beine += ruestung.system.rs_beine
                this.system.abgeleitete.ws_larm += ruestung.system.rs_larm
                this.system.abgeleitete.ws_rarm += ruestung.system.rs_rarm
                this.system.abgeleitete.ws_bauch += ruestung.system.rs_bauch
                this.system.abgeleitete.ws_brust += ruestung.system.rs_brust
                this.system.abgeleitete.ws_kopf += ruestung.system.rs_kopf
            }
        }
        // be = hardcoded.behinderung(be, this)
        if (be < 0) be = 0
        this.system.abgeleitete.be = be

        let traglast_intervall = this.system.attribute.KK.wert
        traglast_intervall = traglast_intervall >= 1 ? traglast_intervall : 1
        this.system.abgeleitete.traglast_intervall = traglast_intervall
        let traglast = 2 * this.system.attribute.KK.wert
        traglast = traglast >= 1 ? traglast : 1
        this.system.abgeleitete.traglast = traglast
        let summeGewicht = 0
        for (let i of this.inventar.mitfuehrend) {
            summeGewicht += i.system.gewicht * i.system.quantity
        }
        console.log('Summe Gewicht: ', summeGewicht, parseFloat(summeGewicht.toFixed(3)))
        this.system.getragen = parseFloat(summeGewicht.toFixed(3))

        // Calculate BE modification from carried weight
        let be_mod = hardcoded.beTraglast(this.system)
        this.system.abgeleitete.be += be_mod
        this.system.abgeleitete.be_traglast = be_mod
        let be_traglast = this.system.abgeleitete.be_traglast
        this.system.abgeleitete.dh =
            this.system.abgeleitete.dh - 2 * (this.system.abgeleitete.be - be_traglast)

        this.system.abgeleitete.gs = Math.max(
            1,
            this.system.abgeleitete.gs - (this.system.abgeleitete?.be ?? 0),
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

    async _calculateKampf(actor) {
        console.log('Berechne Kampf')
        let kampfstile = hardcoded.getKampfstile(actor)
        actor.misc.kampfstile_list = kampfstile
        let selected_kampfstil = hardcoded.getSelectedStil(actor, 'kampf')

        // Handle supernatural styles
        let uebernatuerliche_stile = hardcoded.getUebernatuerlicheStile(actor)
        actor.misc.uebernatuerliche_stile_list = uebernatuerliche_stile

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
}
