import { BaseExtractor } from './base-extractor.js'
import { TalentConverter } from '../converters/index.js'

/**
 * Extractor for Talent and übernatürliche Talente (Zauber, Liturgie, Anrufung)
 */
export class TalentExtractor extends BaseExtractor {
    constructor(parsedXML) {
        super(parsedXML, new TalentConverter())
    }

    /**
     * Extract Talent elements from parsed XML and convert to Foundry talent items
     * Only processes Talents with kategorie=0
     * @returns {Array} Array of Foundry talent items
     */
    extractTalente() {
        if (!this.parsedXML || !this.parsedXML.Datenbank || !this.parsedXML.Datenbank.Talent) {
            return []
        }

        const talentElements = Array.isArray(this.parsedXML.Datenbank.Talent)
            ? this.parsedXML.Datenbank.Talent
            : [this.parsedXML.Datenbank.Talent]

        const talente = []

        // Filter for basic talents (kategorie=0)
        const basicTalentElements = talentElements.filter((element) => {
            const kategorie =
                parseInt(this.converter.extractAttribute(element, 'kategorie', '0')) || 0
            return kategorie === 0
        })

        basicTalentElements.forEach((element, index) => {
            try {
                const talent = this.converter.convertBasicTalent(element)
                if (talent) {
                    talente.push(talent)
                }
            } catch (error) {
                console.error(`Error converting Talent at index ${index}:`, error.message)
                console.error('Element data:', JSON.stringify(element, null, 2))
            }
        })

        return talente
    }

    /**
     * Extract übernatürliche Talente (zauber, liturgie, anrufung) from XML data
     * Filters Talent elements by kategorie != 0
     * @returns {Array} Array of Foundry uebernatuerlich_talent items
     */
    extractUebernatuerlicheTalente() {
        if (!this.parsedXML || !this.parsedXML.Datenbank || !this.parsedXML.Datenbank.Talent) {
            return []
        }

        const talentElements = Array.isArray(this.parsedXML.Datenbank.Talent)
            ? this.parsedXML.Datenbank.Talent
            : [this.parsedXML.Datenbank.Talent]

        const uebernatuerlicheTalente = []

        // Filter for übernatürliche talents (kategorie != 0)
        const uebernatuerlicheTalentElements = talentElements.filter((element) => {
            const kategorie =
                parseInt(this.converter.extractAttribute(element, 'kategorie', '0')) || 0
            return kategorie !== 0
        })

        uebernatuerlicheTalentElements.forEach((element, index) => {
            try {
                const talent = this.converter.convert(element)
                if (talent) {
                    uebernatuerlicheTalente.push(talent)
                }
            } catch (error) {
                console.error(
                    `Error converting übernatürliches Talent at index ${index}:`,
                    error.message,
                )
                console.error('Element data:', JSON.stringify(element, null, 2))
            }
        })

        return uebernatuerlicheTalente
    }

    /**
     * Extract all talents
     * @returns {Object} Object with talente and uebernatuerlicheTalente arrays
     */
    extract() {
        return {
            talente: this.extractTalente(),
            uebernatuerlicheTalente: this.extractUebernatuerlicheTalente(),
        }
    }
}
