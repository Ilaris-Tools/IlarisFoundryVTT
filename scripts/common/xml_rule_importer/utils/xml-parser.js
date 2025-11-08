import * as fs from 'fs'
import * as xml2js from 'xml2js'

/**
 * XML Parser utility for loading and parsing XML files
 */
export class XMLParser {
    /**
     * Load and parse XML file
     * @param {string} xmlFilePath - Path to XML file
     * @returns {Promise<Object>} Parsed XML object
     */
    static async loadAndParseXML(xmlFilePath) {
        try {
            const xmlContent = fs.readFileSync(xmlFilePath, 'utf8')
            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true,
            })
            const parsedXML = await parser.parseStringPromise(xmlContent)
            console.log('XML file loaded and parsed successfully')
            return parsedXML
        } catch (error) {
            console.error('Error loading XML file:', error)
            throw error
        }
    }

    /**
     * Parse XML string
     * @param {string} xmlString - XML content as string
     * @returns {Promise<Object>} Parsed XML object
     */
    static async parseXMLString(xmlString) {
        try {
            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true,
            })
            return await parser.parseStringPromise(xmlString)
        } catch (error) {
            console.error('Error parsing XML string:', error)
            throw error
        }
    }
}
