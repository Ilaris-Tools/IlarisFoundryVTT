import { ModifierProcessor } from './modifier-processor.js'
import { WieldingProcessor } from './wielding-processor.js'
import { TargetEffectProcessor } from './target-effect-processor.js'
import { CombatMechanicProcessor } from './combat-mechanic-processor.js'
import { PassiveProcessor } from './passive-processor.js'
import { ActorModifierProcessor } from './actor-modifier-processor.js'
import { executeCustomScript } from '../utils/eigenschaft-utils.js'

/**
 * Factory for creating eigenschaft processors
 * Maps kategorie to the appropriate processor class
 */
export class ProcessorFactory {
    constructor() {
        this.processors = new Map()
        this._registerProcessors()
    }

    /**
     * Register all processor classes
     * @private
     */
    _registerProcessors() {
        const processorClasses = [
            ModifierProcessor,
            WieldingProcessor,
            TargetEffectProcessor,
            CombatMechanicProcessor,
            PassiveProcessor,
            ActorModifierProcessor,
        ]

        for (const ProcessorClass of processorClasses) {
            const kategorie = ProcessorClass.getKategorie()
            this.processors.set(kategorie, new ProcessorClass())
        }
    }

    /**
     * Get processor for a specific kategorie
     * @param {string} kategorie - The eigenschaft kategorie
     * @returns {BaseEigenschaftProcessor|null}
     */
    getProcessor(kategorie) {
        return this.processors.get(kategorie) || null
    }

    /**
     * Process an eigenschaft using the appropriate processor
     * Falls back to custom script if no processor found
     * @param {string} kategorie - The eigenschaft kategorie
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @param {Object} weapon - The weapon item
     */
    process(kategorie, eigenschaft, computed, actor, weapon) {
        const processor = this.getProcessor(kategorie)

        if (processor) {
            processor.process(eigenschaft, computed, actor, weapon)
        } else {
            // Fallback: Try custom script if present
            if (eigenschaft.customScript) {
                executeCustomScript(eigenschaft.customScript, computed, actor, weapon)
            } else {
                console.warn(`No processor found for kategorie: ${kategorie}`)
            }
        }
    }
}
