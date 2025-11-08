import { BaseConverter } from './base-converter.js'
import {
    DEFAULT_TALENT_VALUES,
    TALENT_KATEGORIE_TO_TYPE,
    UEBERNATUERLICH_TALENT_FIELD_MAPPINGS,
    MAECHTIG_FIELD_NAMES,
} from '../constants.js'

/**
 * Converter for Talent and übernatürliche Talente (Zauber, Liturgie, Anrufung)
 */
export class TalentConverter extends BaseConverter {
    /**
     * Parse structured text content for übernatürliche Talente (zauber, liturgie, anrufung)
     * Extracts fields like schwierigkeit, modifikationen, vorbereitung, etc. from HTML-formatted text
     * @param {string} text - The text content containing HTML-formatted structured data
     * @returns {Object} Object containing parsed fields
     */
    parseUebernatuerlicheTalentText(text) {
        const result = {
            text: '',
            maechtig: '',
            schwierigkeit: '',
            modifikationen: '',
            vorbereitung: '',
            ziel: '',
            reichweite: '',
            wirkungsdauer: '',
            kosten: '',
            erlernen: '',
        }

        if (!text) return result

        // Decode HTML entities
        const decodedText = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

        // Split by <b> tags to find structured fields
        const parts = decodedText.split(/<b>([^<]+):<\/b>\s*/)

        // First part (index 0) is the main description text
        if (parts.length > 0) {
            result.text = parts[0].trim()
        }

        // Process remaining parts in pairs (field name, field value)
        for (let i = 1; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
                const fieldName = parts[i].trim()
                const fieldValue = parts[i + 1].trim()

                // Use field mappings from constants
                const mappedField = UEBERNATUERLICH_TALENT_FIELD_MAPPINGS[fieldName]
                if (mappedField) {
                    result[mappedField] = fieldValue
                } else if (MAECHTIG_FIELD_NAMES.includes(fieldName)) {
                    result.maechtig = fieldValue
                } else {
                    // Add field to main text if not recognized
                    result.text += `\n${fieldName}: ${fieldValue}`
                }
            }
        }

        return result
    }

    /**
     * Convert basic Talent XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convertBasicTalent(element) {
        const name = this.extractAttribute(element, 'name', 'Unnamed Talent')
        const text = this.extractText(element)

        const systemData = {
            ...DEFAULT_TALENT_VALUES,
            text,
            fertigkeit: this.extractAttribute(element, 'fertigkeiten'), // XML uses 'fertigkeiten', Foundry uses 'fertigkeit'
        }

        return this.createFoundryItem(name, 'talent', systemData)
    }

    /**
     * Convert übernatürliche Talent XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'zauber', 'liturgie', or 'anrufung'
     * @returns {Object} Foundry item
     */
    convertUebernatuerlicheTalent(element, itemType) {
        const name = this.extractAttribute(element, 'name', `Unnamed ${itemType}`)
        const text = this.extractText(element)

        const parsedText = this.parseUebernatuerlicheTalentText(text)

        const systemData = {
            typ: itemType, // Set the type field
            fertigkeiten: this.extractAttribute(element, 'fertigkeiten'),
            fertigkeit_ausgewaehlt: 'auto',
            text: parsedText.text,
            maechtig: parsedText.maechtig,
            schwierigkeit: parsedText.schwierigkeit,
            modifikationen: parsedText.modifikationen,
            vorbereitung: parsedText.vorbereitung,
            ziel: parsedText.ziel,
            reichweite: parsedText.reichweite,
            wirkungsdauer: parsedText.wirkungsdauer,
            kosten: parsedText.kosten,
            erlernen: parsedText.erlernen,
            pw: 0,
            gruppe: 0, // Set to 0 as requested
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Convert Talent XML element to Foundry item based on kategorie attribute
     * @param {Object} element - XML element
     * @returns {Object} Foundry item (talent, zauber, liturgie, or anrufung)
     */
    convert(element) {
        const kategorie = parseInt(this.extractAttribute(element, 'kategorie', '0')) || 0

        // Determine item type based on kategorie
        const itemType = TALENT_KATEGORIE_TO_TYPE[kategorie] || 'talent'

        if (itemType === 'talent') {
            return this.convertBasicTalent(element)
        } else {
            return this.convertUebernatuerlicheTalent(element, itemType)
        }
    }
}
