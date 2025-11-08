import { BaseConverter } from './base-converter.js'

/**
 * Converter for Vorteil
 */
export class VorteilConverter extends BaseConverter {
    /**
     * Convert Vorteil XML element to Foundry item
     * @param {Element} element - XML DOM element
     * @returns {Object} Foundry item
     */
    convert(element) {
        const name = this.getAttribute(element, 'name', 'Unnamed Vorteil')
        const text = this.getTextContent(element)

        const voraussetzung = this.getAttribute(element, 'voraussetzungen') || ''
        const kategorie = parseInt(this.getAttribute(element, 'kategorie', '0')) || 0
        const sephrastoScript = this.getAttribute(element, 'script') || ''
        const stilBedingungen = this.getAttribute(element, 'bedingungen') || ''

        const systemData = {
            voraussetzung, // XML uses 'voraussetzungen', template uses 'voraussetzung' (singular)
            gruppe: kategorie,
            text,
            sephrastoScript, // XML uses 'script', template uses 'sephrastoScript'
            stilBedingungen, // XML uses 'bedingungen', template uses 'stilBedingungen'
            foundryScript: '',
        }

        return this.createFoundryItem(name, 'vorteil', systemData)
    }
}
