import { BaseConverter } from './base-converter.js'

/**
 * Converter for Manöver
 */
export class ManoeverConverter extends BaseConverter {
    /**
     * Convert Manöver XML element to Foundry item
     * @param {Object} element - XML element (parsed by xml2js)
     * @returns {Object} Foundry item
     */
    convert(element) {
        const name = this.getAttribute(element, 'name', 'Unnamed Manöver')
        const text = this.getTextContent(element)

        const typ = parseInt(this.getAttribute(element, 'typ', '0')) || 0
        const probe = this.getAttribute(element, 'probe')
        const gegenprobe = this.getAttribute(element, 'gegenprobe')
        const voraussetzungen = this.getAttribute(element, 'voraussetzungen')

        // Determine gruppe based on probe content for typ 0
        let gruppe = typ
        if (typ === 0) {
            // For typ 0: Check if probe contains "VT" to determine if it's gruppe 13 (defense) or 0 (attack)
            gruppe = probe.includes('VT') ? 13 : 0
        }

        const systemData = {
            voraussetzungen, // Keep as string, not array
            input: {
                label: 'Checkbox',
                field: 'CHECKBOX',
            },
            modifications: [],
            gruppe, // Determined based on probe content for typ 0
            probe,
            gegenprobe,
            text,
        }

        return this.createFoundryItem(name, 'manoever', systemData)
    }

    /**
     * Convenience method for converting Manöver
     * @param {Object} element - XML element
     * @returns {Object} Foundry item
     */
    convertManoever(element) {
        return this.convert(element)
    }
}
