import { ModifierProcessor } from './modifier-processor.js'
import { WieldingProcessor } from './wielding-processor.js'
import { TargetEffectProcessor } from './target-effect-processor.js'
import { PassiveProcessor } from './passive-processor.js'
import { ActorModifierProcessor } from './actor-modifier-processor.js'

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
    process(kategorie, name, eigenschaft, computed, actor, weapon) {
        console.log(`ProcessorFactory.process called for kategorie: ${kategorie}`)
        const processor = this.getProcessor(kategorie)

        if (processor) {
            console.log(
                `Using processor: ${processor.constructor.name} for kategorie: ${kategorie}`,
            )
            processor.process(name, eigenschaft, computed, actor, weapon)
        }
    }
}
