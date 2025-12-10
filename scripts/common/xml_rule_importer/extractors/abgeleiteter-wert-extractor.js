import { BaseExtractor } from './base-extractor.js'
import { AbgeleiteterWertConverter } from '../converters/index.js'

/**
 * Extractor for AbgeleiteterWert (Derived Values)
 */
export class AbgeleiteterWertExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new AbgeleiteterWertConverter())
    }

    /**
     * Extract AbgeleiteterWert items from XML data
     * @returns {Array} Array of Foundry abgeleiteter-wert items
     */
    extract() {
        const elements = this.xmlDoc.querySelectorAll('Datenbank > AbgeleiteterWert')
        const abgeleiteteWerte = []

        elements.forEach((element, index) => {
            try {
                const foundryItem = this.converter.convert(element)
                if (foundryItem) {
                    abgeleiteteWerte.push(foundryItem)
                }
            } catch (error) {
                console.error(`Error converting AbgeleiteterWert at index ${index}:`, error.message)
                console.error('Element:', element)
            }
        })

        return abgeleiteteWerte
    }
}
