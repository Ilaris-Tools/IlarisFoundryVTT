import { BaseExtractor } from './base-extractor.js'
import { ManoeverConverter } from '../converters/index.js'
import { SUPPORTED_MANOEVER_TYPES } from '../constants.js'

/**
 * Extractor for Manöver
 */
export class ManoeverExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new ManoeverConverter())
    }

    /**
     * Extract Manöver from XML data
     * Processes Regel with kategorie 0, 1, 2, 3, or 6
     * Special handling: splits Manöver with "AT ... oder VT ..." into two separate items
     * @returns {Array} Array of Foundry manoever items
     */
    extractManoever() {
        const regelElements = this.xmlDoc.querySelectorAll('Datenbank > Regel')
        const manoever = []

        regelElements.forEach((element, index) => {
            try {
                // Check if kategorie is supported
                const kategorie = parseInt(element.getAttribute('kategorie') || '0') || 0
                if (!SUPPORTED_MANOEVER_TYPES.includes(kategorie)) {
                    return // Skip unsupported categories
                }

                const probe = element.getAttribute('probe') || ''

                // Special case: If kategorie 0 and probe contains both AT and VT, create two separate Manöver
                if (
                    kategorie === 0 &&
                    probe.includes('AT') &&
                    probe.includes('VT') &&
                    (probe.toLowerCase().includes('oder') || probe.includes(';'))
                ) {
                    // Split probe by "oder" (case insensitive) or semicolon
                    const probeParts = probe.split(/\s+oder\s+|;\s*/i)

                    for (const probePart of probeParts) {
                        // Clone the element and modify the probe attribute
                        const modifiedElement = element.cloneNode(true)
                        modifiedElement.setAttribute('probe', probePart.trim())

                        const foundryItem = this.converter.convert(modifiedElement)
                        if (foundryItem) {
                            manoever.push(foundryItem)
                        }
                    }
                } else {
                    // Standard conversion
                    const foundryItem = this.converter.convert(element)
                    if (foundryItem) {
                        manoever.push(foundryItem)
                    }
                }
            } catch (error) {
                console.error(`Error converting Manöver at index ${index}:`, error.message)
                console.error('Element:', element)
            }
        })

        return manoever
    }

    /**
     * Extract all manöver
     * @returns {Array} Array of Foundry manoever items
     */
    extract() {
        return this.extractManoever()
    }
}
