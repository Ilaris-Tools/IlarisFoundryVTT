/**
 * XML Parser utility for loading and parsing XML files
 * Uses browser's native DOMParser - returns DOM Document for direct querying
 */
export class XMLParser {
    /**
     * Load and parse XML file from browser File object
     * Note: This is for browser usage, not Node.js file system access
     * @param {File} xmlFile - Browser File object from file input
     * @returns {Promise<Document>} Parsed XML DOM Document
     */
    static async loadAndParseXML(xmlFile) {
        try {
            const xmlContent = await xmlFile.text()
            return await this.parseXMLString(xmlContent)
        } catch (error) {
            console.error('Error loading XML file:', error)
            throw error
        }
    }

    /**
     * Parse XML string using browser's DOMParser
     * @param {string} xmlString - XML content as string
     * @returns {Promise<Document>} Parsed XML DOM Document
     */
    static async parseXMLString(xmlString) {
        try {
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror')
            if (parserError) {
                throw new Error('XML parsing error: ' + parserError.textContent)
            }

            console.log('XML file loaded and parsed successfully')
            return xmlDoc
        } catch (error) {
            console.error('Error parsing XML string:', error)
            throw error
        }
    }
}
