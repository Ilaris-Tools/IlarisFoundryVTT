import { BaseExtractor } from './base-extractor.js'
import { SkillConverter } from '../converters/index.js'

/**
 * Extractor for Fertigkeit and ÜbernatürlicheFertigkeit
 */
export class SkillExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new SkillConverter())
    }

    /**
     * Extract Fertigkeit objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry fertigkeit items
     */
    extractFertigkeiten() {
        return this.extractElements('Datenbank > Fertigkeit', (element) =>
            this.converter.convertFertigkeit(element),
        )
    }

    /**
     * Extract ÜbernatürlicheFertigkeit objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry uebernatuerliche_fertigkeit items
     */
    extractUebernatuerlicheFertigkeiten() {
        return this.extractElements('Datenbank > ÜbernatürlicheFertigkeit', (element) =>
            this.converter.convertUebernatuerlicheFertigkeit(element),
        )
    }

    /**
     * Extract all skills (both Fertigkeit and ÜbernatürlicheFertigkeit)
     * @returns {Object} Object with fertigkeiten and uebernatuerlicheFertigkeiten arrays
     */
    extract() {
        return {
            fertigkeiten: this.extractFertigkeiten(),
            uebernatuerlicheFertigkeiten: this.extractUebernatuerlicheFertigkeiten(),
        }
    }
}
