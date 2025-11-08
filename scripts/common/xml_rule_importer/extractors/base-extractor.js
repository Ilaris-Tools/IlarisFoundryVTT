/**
 * Base extractor class for extracting XML elements and converting to Foundry items
 */
export class BaseExtractor {
    /**
     * @param {Object} parsedXML - Parsed XML data from xml2js
     * @param {Object} converter - Converter instance for this extractor
     */
    constructor(parsedXML, converter) {
        this.parsedXML = parsedXML
        this.converter = converter
    }

    /**
     * Generic method to extract elements from XML and convert to Foundry items
     * @param {string} xmlElementName - Name of XML element to extract (e.g., 'Fertigkeit', 'ÜbernatürlicheFertigkeit')
     * @param {Function} convertFn - Conversion function to apply to each element
     * @returns {Array} Array of converted Foundry items
     */
    extractElements(xmlElementName, convertFn) {
        if (!this.parsedXML) {
            throw new Error('XML not loaded.')
        }

        const extractedItems = []

        // Navigate through the XML structure to find elements
        if (this.parsedXML.Datenbank && this.parsedXML.Datenbank[xmlElementName]) {
            const elements = Array.isArray(this.parsedXML.Datenbank[xmlElementName])
                ? this.parsedXML.Datenbank[xmlElementName]
                : [this.parsedXML.Datenbank[xmlElementName]]

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
                        `Error converting ${xmlElementName} at index ${index}:`,
                        error.message,
                    )
                    console.error('Element data:', JSON.stringify(element, null, 2))
                }
            })
        }

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
