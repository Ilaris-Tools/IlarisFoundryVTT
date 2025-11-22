import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'passive' kategorie eigenschaften
 * These eigenschaften are just checked by name elsewhere, no processing needed
 */
export class PassiveProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'passive'
    }

    process(name, eigenschaft, computed, actor, weapon) {
        // Passive eigenschaften don't modify stats directly
        // They are checked by name in other parts of the code
    }
}
