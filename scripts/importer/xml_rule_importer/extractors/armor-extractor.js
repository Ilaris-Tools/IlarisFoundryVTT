import { BaseExtractor } from './base-extractor.js'
import { ArmorConverter } from '../converters/index.js'

/**
 * Extractor for Rüstung (armor)
 */
export class ArmorExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new ArmorConverter())
    }

    /**
     * Extract Rüstung elements from parsed XML and convert to Foundry ruestung items
     * @returns {Array} Array of Foundry ruestung items
     */
    extractRuestungen() {
        return this.extractElements('Datenbank > Rüstung', (element) =>
            this.converter.convertRuestung(element),
        )
    }

    /**
     * Extract all armor
     * @returns {Array} Array of Foundry ruestung items
     */
    extract() {
        return this.extractRuestungen()
    }
}
