import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'target_effect' kategorie eigenschaften
 * Registers effects that can be applied to combat targets
 */
export class TargetEffectProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'target_effect'
    }

    process(name, eigenschaft, parameters, computed, actor, weapon) {
        if (!eigenschaft.targetEffect) return

        // Store target effects that can be triggered during combat
        computed.targetEffects.push({
            name: eigenschaft.targetEffect.name,
            trigger: eigenschaft.targetEffect.trigger,
            resistCheck: eigenschaft.targetEffect.resistCheck,
            effect: eigenschaft.targetEffect.effect,
        })
    }
}
