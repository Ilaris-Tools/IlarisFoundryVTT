import { BaseExtractor } from './base-extractor.js'
import { VorteilConverter } from '../converters/index.js'

/**
 * Extractor for Vorteil
 */
export class VorteilExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new VorteilConverter())
    }

    /**
     * Extract Vorteile from XML data
     * @returns {Array} Array of Foundry vorteil items
     */
    extract() {
        const vorteilElements = this.xmlDoc.querySelectorAll('Datenbank > Vorteil')
        const vorteile = []

        vorteilElements.forEach((element, index) => {
            try {
                const foundryItem = this.converter.convert(element)
                if (foundryItem) {
                    vorteile.push(foundryItem)
                }
            } catch (error) {
                console.error(`Error converting Vorteil at index ${index}:`, error.message)
                console.error('Element:', element)
            }
        })

        return vorteile
    }
}
