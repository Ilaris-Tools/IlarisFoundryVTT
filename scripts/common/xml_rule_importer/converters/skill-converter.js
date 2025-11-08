import { BaseConverter } from './base-converter.js'
import { DEFAULT_SKILL_VALUES } from '../constants.js'

/**
 * Converter for Fertigkeit and ÜbernatürlicheFertigkeit
 */
export class SkillConverter extends BaseConverter {
    /**
     * Convert skill-based XML elements (Fertigkeit and ÜbernatürlicheFertigkeit) to Foundry items
     * @param {Object} element - XML element (parsed by xml2js)
     * @param {string} itemType - 'fertigkeit' or 'uebernatuerliche_fertigkeit'
     * @returns {Object} Foundry item
     */
    convert(element, itemType) {
        const name = this.extractAttribute(element, 'name', `Unnamed ${itemType}`)
        const text = this.extractText(element)
        const voraussetzungen = this.extractAttribute(element, 'voraussetzungen')

        const kategorie = parseInt(this.extractAttribute(element, 'kategorie', '0')) || 0
        const attributeString = this.extractAttribute(
            element,
            'attribute',
            DEFAULT_SKILL_VALUES.attribute,
        )

        // Parse attributes into individual fields
        const [attribut_0, attribut_1, attribut_2] = this.parseAttributeString(attributeString)

        const systemData = {
            ...DEFAULT_SKILL_VALUES,
            attribut_0,
            attribut_1,
            attribut_2,
            gruppe: kategorie,
            text,
        }

        // Add ÜbernatürlicheFertigkeit specific field
        if (itemType === 'uebernatuerliche_fertigkeit') {
            systemData.voraussetzung = voraussetzungen
        }

        return this.createFoundryItem(name, itemType, systemData)
    }

    /**
     * Convert Fertigkeit XML element to Foundry item
     * @param {Object} element - XML element
     * @returns {Object} Foundry item
     */
    convertFertigkeit(element) {
        return this.convert(element, 'fertigkeit')
    }

    /**
     * Convert ÜbernatürlicheFertigkeit XML element to Foundry item
     * @param {Object} element - XML element
     * @returns {Object} Foundry item
     */
    convertUebernatuerlicheFertigkeit(element) {
        return this.convert(element, 'uebernatuerliche_fertigkeit')
    }
}
