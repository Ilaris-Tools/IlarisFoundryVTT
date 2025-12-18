import { CombatItem } from './combat.js'
import { EigenschaftCache } from './utils/eigenschaft-cache.js'
import { ProcessorFactory } from './eigenschaft-processors/processor-factory.js'
import * as hardcoded from './../actors/hardcodedvorteile.js'

/**
 * Base class for weapon items (Nahkampfwaffe and Fernkampfwaffe)
 * Handles weapon stat calculations based on eigenschaften
 */
export class WaffeItem extends CombatItem {
    constructor(data, context) {
        super(data, context)
        this._eigenschaftCache = new EigenschaftCache()
        this._processorFactory = new ProcessorFactory()
    }

    getTp() {
        return this.system.schaden?.replace(/[Ww]/g, 'd') || ''
    }

    /**
     * Prepare derived data for the weapon
     * Calculates combat stats based on eigenschaften and actor context
     */
    async prepareWeapon() {
        console.log('WaffeItem.prepareDerivedData called for', this.name)

        // Only calculate if embedded in an actor
        if (!this.parent || this.parent.documentName !== 'Actor') return

        // Ensure eigenschaft items are loaded
        const eigenschaften = this.system.eigenschaften || []
        if (!this._eigenschaftCache.isLoaded(eigenschaften)) {
            // Wait for loading to complete
            console.log('Loading eigenschaften for weapon:', this.name)
            await this._eigenschaftCache.load(eigenschaften)
        }

        this._calculateWeaponStats()
    }

    /**
     * Queue eigenschaft loading
     * @private
     */
    _queueEigenschaftLoad() {
        if (this._eigenschaftCache.isLoading()) return

        this._eigenschaftCache.load(this.system.eigenschaften || []).then(() => {
            // Trigger recalculation
            if (this.parent) {
                this.parent.prepareData()
            }
        })
    }

    /**
     * Apply modifiers to the weapon's computed stats
     * @param {Object} actor - The owning actor
     * @private
     */
    _applyModifiers(actor) {
        const system = this.system

        system.schaden = `${this.system.tp}`
        system.computed.modifiers.dmg.push(`TP: ${this.system.tp}`)

        const pw = this.getPWFromActor(actor, this) || 0
        system.computed.at += pw
        system.computed.vt += pw
        system.computed.fk += pw

        system.computed.at += system.mod_at || 0
        system.computed.vt += system.mod_vt || 0
        system.computed.fk += system.mod_fk || 0
        if (pw > 0) {
            system.computed.modifiers.at.push(`PW: +${pw}`)
            system.computed.modifiers.vt.push(`PW: +${pw}`)
        }
        if (system.wm_at) {
            system.computed.modifiers.at.push(`WM: ${system.wm_at}`)
        }
        if (system.wm_fk) {
            system.computed.modifiers.at.push(`WM: ${system.wm_fk}`)
        }
        if (system.wm_vt) {
            system.computed.modifiers.vt.push(`WM: ${system.wm_vt}`)
        }
        if (system.mod_at) {
            system.computed.modifiers.at.push(`Mod: ${system.mod_at}`)
        }
        if (system.mod_vt) {
            system.computed.modifiers.vt.push(`Mod: ${system.mod_vt}`)
        }
        if (system.mod_fk) {
            system.computed.modifiers.fk.push(`Mod: ${system.mod_fk}`)
        }
    }

    /**
     * Apply actor-wide modifiers (BE, wounds, etc.) to the weapon's computed stats
     * @param {Object} actor - The owning actor
     * @private
     */
    _applyActorModifiers(actor) {
        const system = this.system
        const be = actor.system.abgeleitete?.be || 0
        const wundabzuege = actor.system.gesundheit?.wundabzuege || 0
        const wundenignorieren = actor.system.gesundheit?.wundenignorieren || 0

        system.computed.at -= be
        system.computed.vt -= be
        system.computed.fk -= be

        if (be > 0) {
            system.computed.modifiers.at.push(`BE: -${be}`)
            system.computed.modifiers.vt.push(`BE: -${be}`)
        }

        if (wundabzuege && !wundenignorieren) {
            system.computed.at -= wundabzuege
            system.computed.vt -= wundabzuege
            system.computed.fk -= wundabzuege
            system.computed.modifiers.at.push(`Wunden: -${wundabzuege}`)
            system.computed.modifiers.vt.push(`Wunden: -${wundabzuege}`)
        }
    }

    /**
     * Apply the Nebenwaffe malus to the weapon's computed stats if applicable
     * @private
     */
    _applyNebenwaffeMalus() {
        const system = this.system
        const isNebenOnly = !system.hauptwaffe && system.nebenwaffe

        // Only apply general nebenwaffe malus if not already set by another processor
        if (
            isNebenOnly &&
            !system.computed.ignoreNebenMalus &&
            !system.computed._nebenwaffeMalusApplied
        ) {
            system.computed.at -= 4
            system.computed.vt -= 4
            system.computed.fk -= 4

            system.computed.modifiers.at.push('Nebenwaffe: -4')
            system.computed.modifiers.vt.push('Nebenwaffe: -4')
            system.computed._nebenwaffeMalusApplied = true
        }
    }

    /**
     * Calculate weapon combat statistics (synchronous)
     * @private
     */
    _calculateWeaponStats() {
        const actor = this.parent
        const system = this.system
        const KK = actor.system.attribute.KK.wert
        let rw = system.rw
        system.rw_mod = rw

        // Initialize computed values
        system.computed = {
            at: Number(system.wm_at) || 0,
            vt: Number(system.wm_vt) || 0,
            fk: Number(system.wm_fk) || 0,
            schadenBonus: 0,
            rw: Number(system.rw) || 0,
            handsRequired: 1,
            ignoreNebenMalus: false,
            noRider: false,
            modifiers: {
                at: [],
                vt: [],
                dmg: [],
            },
            targetEffects: [],
            combatMechanics: {},
            conditionalModifiers: [],
            hasActorModifiers: false,
        }

        this._applyModifiers(actor)
        this._applyActorModifiers(actor)

        // Process each eigenschaft
        const eigenschaften = Array.isArray(this.system.eigenschaften)
            ? this.system.eigenschaften
            : []
        for (const eigenschaftName of eigenschaften) {
            this._processEigenschaft(eigenschaftName, this.system.computed, this.parent)
        }

        this._applyNebenwaffeMalus()

        let HW = undefined
        let NW = undefined

        if (this.system.hauptwaffe) {
            HW = this
        }
        if (this.system.nebenwaffe) {
            NW = this
        }

        if (this.type == 'nahkampfwaffe') {
            let sb = Math.floor(KK / 4) || 0
            system.computed.schadenBonus += sb
            system.computed.modifiers.dmg.push(`SB: +${sb}`)
            system.manoever =
                system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_nahkampf)

            system.manoever.vlof.offensiver_kampfstil = actor.vorteil.kampf.some(
                (x) => x.name == 'Offensiver Kampfstil',
            )
        }
        if (this.type == 'fernkampfwaffe') {
            system.manoever =
                system.manoever || foundry.utils.deepClone(CONFIG.ILARIS.manoever_fernkampf)
            let ist_beritten = actor.system.misc.ist_beritten

            if (ist_beritten) {
                system.computed.fk -= 4
                system.computed.modifiers.at.push('Beritten: -4 FK')
            }

            system.manoever.rw['0'] = `${rw} Schritt`
            system.manoever.rw['1'] = `${2 * rw} Schritt`
            system.manoever.rw['2'] = `${4 * rw} Schritt`

            let ss1 = actor.__getStatuseffectById(actor, 'schlechtesicht1')
            let ss2 = actor.__getStatuseffectById(actor, 'schlechtesicht2')
            let ss3 = actor.__getStatuseffectById(actor, 'schlechtesicht3')
            let ss4 = actor.__getStatuseffectById(actor, 'schlechtesicht4')
            if (ss4) {
                system.manoever.lcht.selected = 4
            } else if (ss3) {
                system.manoever.lcht.selected = 3
            } else if (ss2) {
                system.manoever.lcht.selected = 2
            } else if (ss1) {
                system.manoever.lcht.selected = 1
            } else {
                system.manoever.lcht.selected = 0
            }
            let lcht_angepasst = hardcoded.getAngepasst('Dunkelheit', actor)
            // console.log(`licht angepasst: ${lcht_angepasst}`);
            system.manoever.lcht.angepasst = lcht_angepasst
        }

        if (system.computed.schadenBonus !== 0) {
            system.schaden += ` ${system.computed.schadenBonus < 0 ? '-' : '+'} ${Math.abs(
                system.computed.schadenBonus,
            )}`
        }
        if (this.type == 'nahkampfwaffe') {
            system.at = system.computed.at
            system.vt = system.computed.vt
        }
        if (this.type == 'fernkampfwaffe') {
            let ist_beritten = actor.system.misc.ist_beritten
            let zweihaendig = system.computed?.handsRequired === 2
            let kein_reiter = system.computed?.noRider

            system.fk = system.computed.fk

            if (zweihaendig && ((HW && !NW) || (!HW && NW))) {
                system.fk = '-'
                system.computed.modifiers.at = ['Waffe zweihändig, aber einhändig geführt']
            }
            if (kein_reiter && ist_beritten) {
                system.fk = '-'
                system.computed.modifiers.at = ['Waffe nicht reitend, aber beritten']
            }
        }
    }

    /**
     * Process a single waffeneigenschaft using the appropriate processor
     * @param {string} name - Name of the eigenschaft
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @private
     */
    _processEigenschaft(name, computed, actor) {
        // Get the eigenschaft item from cache
        const eigenschaftItem = this._eigenschaftCache.get(name)

        if (!eigenschaftItem) {
            console.warn(`Waffeneigenschaft "${name}" not found - skipping`)
            return
        }

        const eigenschaft = eigenschaftItem.system

        // Validate eigenschaft has required properties
        if (!eigenschaft) {
            console.warn(`Waffeneigenschaft "${name}" has no system data - skipping`)
            return
        }

        console.log(
            `Processing eigenschaft "${name}" of category "${
                eigenschaft.kategorie || 'undefined'
            }"`,
        )

        // Wrap in try-catch to prevent one bad eigenschaft from breaking all calculations
        try {
            // Process using the appropriate processor based on kategorie
            this._processorFactory.process(
                eigenschaft.kategorie,
                name,
                eigenschaft,
                computed,
                actor,
                this,
            )
        } catch (error) {
            console.error(`Error processing eigenschaft "${name}":`, error)
        }
    }

    /**
     * Handle pre-update lifecycle
     * @param {Object} changed - Changed data
     * @param {Object} options - Update options
     * @param {string} userId - User ID performing update
     * @private
     */
    async _preUpdate(changed, options, userId) {
        await super._preUpdate(changed, options, userId)
    }

    /**
     * Trigger recalculation after update
     * @param {Object} changed - Changed data
     * @param {Object} options - Update options
     * @param {string} userId - User ID performing update
     * @private
     */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId)

        // If eigenschaften changed and we're embedded in an actor, reload and recalculate
        if (changed.system?.eigenschaften && this.parent?.documentName === 'Actor') {
            console.log(`Eigenschaften changed for ${this.name}, reloading...`)
            this._eigenschaftCache.load(this.system.eigenschaften || []).then(() => {
                console.log(`Eigenschaften loaded for ${this.name}, triggering actor refresh`)
                this.parent.prepareData()
                // Also refresh the actor sheet if it's open
                if (this.parent.sheet?.rendered) {
                    this.parent.sheet.render(false)
                }
            })
        }
    }

    getPWFromActor(actor, weapon) {
        // Add skill values
        console.log('getPWFromActor called')
        let fertigkeit = weapon.system.fertigkeit
        let talent = weapon.system.talent
        let actorFertigkeit = actor.items.find(
            (x) => x.name == fertigkeit && x.type == 'fertigkeit',
        )
        let actorTalent = actor.items.find((x) => x.name == talent && x.type == 'talent')
        let pw = actorFertigkeit?.system.pw || 0
        let pwt = actorFertigkeit?.system.pwt || 0
        console.log('PW:', pw, 'PWT:', pwt)
        console.log('PW:', pw, 'PWT:', pwt, 'Talent gefunden:', actorTalent)
        if (typeof pw !== 'undefined') {
            if (actorTalent) {
                return pwt
            } else {
                return pw
            }
        }

        return 0
    }
}
