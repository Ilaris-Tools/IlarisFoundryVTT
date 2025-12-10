import { BaseExtractor } from './base-extractor.js'
import { TalentConverter } from '../converters/index.js'

/**
 * Extractor for Talent and übernatürliche Talente (Zauber, Liturgie, Anrufung)
 */
export class TalentExtractor extends BaseExtractor {
    constructor(xmlDoc) {
        super(xmlDoc, new TalentConverter())
    }

    /**
     * Extract Talent elements from parsed XML and convert to Foundry talent items
     * Only processes Talents with kategorie=0
     * @returns {Array} Array of Foundry talent items
     */
    extractTalente() {
        const talentElements = this.xmlDoc.querySelectorAll('Datenbank > Talent')
        const talente = []

        // Filter for basic talents (kategorie=0)
        talentElements.forEach((element, index) => {
            try {
                const kategorie = parseInt(element.getAttribute('kategorie') || '0') || 0
                if (kategorie === 0) {
                    const talent = this.converter.convertBasicTalent(element)
                    if (talent) {
                        talente.push(talent)
                    }
                }
            } catch (error) {
                console.error(`Error converting Talent at index ${index}:`, error.message)
                console.error('Element:', element)
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
        const talentElements = this.xmlDoc.querySelectorAll('Datenbank > Talent')
        const uebernatuerlicheTalente = []

        // Filter for übernatürliche talents (kategorie != 0)
        talentElements.forEach((element, index) => {
            try {
                const kategorie = parseInt(element.getAttribute('kategorie') || '0') || 0
                if (kategorie !== 0) {
                    const talent = this.converter.convert(element)
                    if (talent) {
                        uebernatuerlicheTalente.push(talent)
                    }
                }
            } catch (error) {
                console.error(
                    `Error converting übernatürliches Talent at index ${index}:`,
                    error.message,
                )
                console.error('Element:', element)
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
