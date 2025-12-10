import { BaseExtractor } from './base-extractor.js'
import { WeaponConverter } from '../converters/index.js'

/**
 * Extractor for Waffe and Waffeneigenschaft
 */
export class WeaponExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new WeaponConverter())
    }

    /**
     * Extract Waffeneigenschaft objects from XML and convert to Foundry items
     * @returns {Array} Array of Foundry waffeneigenschaft items
     */
    extractWaffeneigenschaften() {
        return this.extractElements('Datenbank > Waffeneigenschaft', (element) =>
            this.converter.convertWaffeneigenschaft(element),
        )
    }

    /**
     * Extract Waffe objects from XML and convert to Foundry items
     * Automatically determines nahkampfwaffe vs fernkampfwaffe based on lz property
     * @returns {Array} Array of Foundry nahkampfwaffe and fernkampfwaffe items
     */
    extractWaffen() {
        return this.extractElements('Datenbank > Waffe', (element) =>
            this.converter.convertWaffe(element),
        )
    }

    /**
     * Extract all weapons
     * @returns {Object} Object with waffeneigenschaften and waffen arrays
     */
    extract() {
        return {
            waffeneigenschaften: this.extractWaffeneigenschaften(),
            waffen: this.extractWaffen(),
        }
    }
}
