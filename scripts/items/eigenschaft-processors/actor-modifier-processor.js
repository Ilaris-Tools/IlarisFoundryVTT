import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'actor_modifier' kategorie eigenschaften
 * These eigenschaften modify actor stats, not weapon stats
 */
export class ActorModifierProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'actor_modifier'
    }

    process(eigenschaft, computed, actor, weapon) {
        // These are processed at actor level, not weapon level
        computed.hasActorModifiers = true
    }
}
