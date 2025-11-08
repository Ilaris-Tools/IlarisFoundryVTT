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
     * Processes Manöver with typ 0, 1, 2, 3, or 6
     * Special handling: splits Manöver with "AT ... oder VT ..." into two separate items
     * @returns {Array} Array of Foundry manoever items
     */
    extractManoever() {
        const manoeverElements = this.xmlDoc.querySelectorAll('Datenbank > Manöver')
        const manoever = []

        manoeverElements.forEach((element, index) => {
            try {
                // Check if typ is supported
                const typ = parseInt(element.getAttribute('typ') || '0') || 0
                if (!SUPPORTED_MANOEVER_TYPES.includes(typ)) {
                    return // Skip unsupported types
                }

                const probe = element.getAttribute('probe') || ''

                // Special case: If typ 0 and probe contains both AT and VT, create two separate Manöver
                if (
                    typ === 0 &&
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
