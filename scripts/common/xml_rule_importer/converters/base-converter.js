import { DEFAULT_FOUNDRY_ITEM_PROPS } from '../constants.js'

/**
 * Base converter class for XML to Foundry item conversion
 * Provides common functionality for all specialized converters
 * Works with DOM Elements directly (consistent with xml_character_importer.js)
 */
export class BaseConverter {
    /**
     * Generate a unique Foundry ID
     * @returns {string} Random 16-character ID
     */
    generateFoundryId() {
        return Math.random().toString(36).substr(2, 16)
    }

    /**
     * Create a Foundry item with standard structure
     * @param {string} name - Item name
     * @param {string} itemType - Foundry item type
     * @param {Object} systemData - System-specific data for the item
     * @param {string} [img] - Optional image path (defaults to profan-skill.svg)
     * @returns {Object} Complete Foundry item object
     */
    createFoundryItem(
        name,
        itemType,
        systemData,
        img = 'systems/Ilaris/assets/images/skills/profan-skill.svg',
    ) {
        const foundryId = this.generateFoundryId()
        return {
            name: name,
            type: itemType,
            img: img,
            system: systemData,
            effects: [],
            folder: null,
            sort: 0,
            flags: {},
            _id: foundryId,
            ...DEFAULT_FOUNDRY_ITEM_PROPS,
            _key: `!items!${foundryId}`,
        }
    }

    /**
     * Safely extract an attribute from a DOM Element
     * @param {Element} element - DOM Element
     * @param {string} attrName - Attribute name to extract
     * @param {*} defaultValue - Default value if attribute not found
     * @returns {*} Attribute value or default
     */
    getAttribute(element, attrName, defaultValue = '') {
        const value = element.getAttribute(attrName)
        return value !== null ? value : defaultValue
    }

    /**
     * Safely extract text content from a DOM Element
     * @param {Element} element - DOM Element
     * @returns {string} Text content or empty string
     */
    getTextContent(element) {
        return element.textContent ? element.textContent.trim() : ''
    }

    /**
     * Parse attribute string (e.g., "KO|GE|ST") into array
     * @param {string} attributeString - Pipe-separated attributes
     * @param {string} defaultAttr - Default attribute if empty
     * @returns {Array<string>} Array of 3 attributes
     */
    parseAttributeString(attributeString, defaultAttr = 'KO') {
        if (!attributeString) {
            return [defaultAttr, defaultAttr, defaultAttr]
        }
        const attributeArray = attributeString.split('|')
        return [
            attributeArray[0] || defaultAttr,
            attributeArray[1] || defaultAttr,
            attributeArray[2] || defaultAttr,
        ]
    }

    /**
     * Convert XML element to Foundry item
     * Must be implemented by subclasses
     * @param {Element} element - DOM Element
     * @returns {Object} Foundry item
     * @throws {Error} If not implemented by subclass
     */
    convert(element) {
        throw new Error('convert() must be implemented by subclass')
    }
}
