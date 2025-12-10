/**
 * Base extractor class for extracting XML elements and converting to Foundry items
 * Works with DOM Document (consistent with xml_character_importer.js)
 */
export class BaseExtractor {
    /**
     * @param {Document} xmlDoc - Parsed XML DOM Document
     * @param {Object} converter - Converter instance for this extractor
     */
    constructor(xmlDoc, converter) {
        this.xmlDoc = xmlDoc
        this.converter = converter
    }

    /**
     * Generic method to extract elements from XML using CSS selector and convert to Foundry items
     * @param {string} selector - CSS selector for elements (e.g., 'Datenbank > Fertigkeit')
     * @param {Function} convertFn - Conversion function to apply to each element
     * @returns {Array} Array of converted Foundry items
     */
    extractElements(selector, convertFn) {
        if (!this.xmlDoc) {
            throw new Error('XML not loaded.')
        }

        const extractedItems = []
        const elements = this.xmlDoc.querySelectorAll(selector)

        elements.forEach((element, index) => {
            try {
                const foundryItem = convertFn(element)
                if (foundryItem) {
                    // Handle both single item and array of items
                    const items = Array.isArray(foundryItem) ? foundryItem : [foundryItem]
                    extractedItems.push(...items)
                }
            } catch (error) {
                console.error(
                    `Error converting element at index ${index} (selector: ${selector}):`,
                    error.message,
                )
                console.error('Element:', element)
            }
        })

        return extractedItems
    }

    /**
     * Extract elements - must be implemented by subclasses
     * @returns {Array} Array of Foundry items
     * @throws {Error} If not implemented by subclass
     */
    extract() {
        throw new Error('extract() must be implemented by subclass')
    }
}
