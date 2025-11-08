import { BaseConverter } from './base-converter.js'

/**
 * Converter for Manöver
 */
export class ManoeverConverter extends BaseConverter {
    /**
     * Convert Manöver (Regel) XML element to Foundry item
     * @param {Element} element - XML DOM element
     * @returns {Object} Foundry item
     */
    convert(element) {
        const name = this.getAttribute(element, 'name', 'Unnamed Manöver')
        const text = this.getTextContent(element)

        const kategorie = parseInt(this.getAttribute(element, 'kategorie', '0')) || 0
        const probe = this.getAttribute(element, 'probe')
        const gegenprobe = this.getAttribute(element, 'gegenprobe')
        const voraussetzungen = this.getAttribute(element, 'voraussetzungen')

        // Determine gruppe based on probe content for kategorie 0
        let gruppe = kategorie
        if (kategorie === 0) {
            // For kategorie 0: Check if probe contains "VT" to determine if it's gruppe 13 (defense) or 0 (attack)
            gruppe = probe && probe.includes('VT') ? 13 : 0
        }

        const systemData = {
            voraussetzungen, // Keep as string, not array
            input: {
                label: 'Checkbox',
                field: 'CHECKBOX',
            },
            modifications: [],
            gruppe, // Determined based on probe content for kategorie 0
            probe,
            gegenprobe,
            text,
        }

        return this.createFoundryItem(name, 'manoever', systemData)
    }
}
