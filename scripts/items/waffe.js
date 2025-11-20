import { CombatItem } from './combat.js'
import { EigenschaftCache } from './utils/eigenschaft-cache.js'
import { ProcessorFactory } from './eigenschaft-processors/processor-factory.js'

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
    prepareDerivedData() {
        console.log('WaffeItem.prepareDerivedData called for', this.name)
        super.prepareDerivedData()

        // Only calculate if embedded in an actor
        if (!this.parent || this.parent.documentName !== 'Actor') return

        // Only calculate if weapon is selected (hauptwaffe or nebenwaffe)
        if (!this.system.hauptwaffe && !this.system.nebenwaffe) {
            return
        }

        // Ensure eigenschaft items are loaded
        if (!this._eigenschaftCache.isLoaded()) {
            // Queue loading for next tick
            this._queueEigenschaftLoad()
            return
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
     * Calculate weapon combat statistics (synchronous)
     * @private
     */
    _calculateWeaponStats() {
        const actor = this.parent
        const system = this.system

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
            penalties: [],
            targetEffects: [],
            combatMechanics: {},
            conditionalModifiers: [],
            hasActorModifiers: false,
        }

        // Process each eigenschaft
        const eigenschaften = system.eigenschaften || []

        for (const eigenschaftName of eigenschaften) {
            this._processEigenschaft(eigenschaftName, system.computed, actor)
        }

        // Apply actor-wide modifiers (BE, wounds, etc.)
        const be = actor.system.abgeleitete?.be || 0
        system.computed.at -= be
        system.computed.vt -= be
        system.computed.fk -= be

        if (be > 0) {
            system.computed.penalties.push(`BE: -${be}`)
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
            console.warn(`Waffeneigenschaft "${name}" not found`)
            return
        }

        const eigenschaft = eigenschaftItem.system

        // Process using the appropriate processor based on kategorie
        this._processorFactory.process(eigenschaft.kategorie, eigenschaft, computed, actor, this)
    }

    /**
     * Clear eigenschaft cache when item updates
     * @param {Object} changed - Changed data
     * @param {Object} options - Update options
     * @param {string} userId - User ID performing update
     * @private
     */
    async _preUpdate(changed, options, userId) {
        await super._preUpdate(changed, options, userId)

        // Clear cache if eigenschaften changed
        if (changed.system?.eigenschaften) {
            this._eigenschaftCache.clear()
        }
    }
}
