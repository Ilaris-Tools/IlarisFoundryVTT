import { BaseConverter } from './base-converter.js'

/**
 * Converter for Manöver
 */
export class ManoeverConverter extends BaseConverter {
    /**
     * Parse probe string to determine input type and modifications
     * @param {string} probe - Probe string like "VT -X", "AT +2", "VT -2-BE"
     * @returns {Object} Object with input and modifications
     */
    parseProbe(probe) {
        if (!probe) {
            return {
                input: { label: 'Checkbox', field: 'CHECKBOX' },
                modifications: [],
            }
        }

        const input = { label: 'Checkbox', field: 'CHECKBOX' }
        const modifications = []

        // Determine if we need NUMBER input (contains X or x)
        if (/[Xx]/.test(probe)) {
            input.label = 'Number'
            input.field = 'NUMBER'
        }

        // Extract the probe type (AT, VT, FK)
        let modificationType = null
        if (/VT/i.test(probe)) {
            modificationType = 'DEFENCE'
        } else if (/AT|FK/i.test(probe)) {
            modificationType = 'ATTACK'
        }

        // Parse the numeric value and operator
        // Pattern: matches +/-X or +/-number, optionally followed by -property
        const match = probe.match(/([+\-])(\d+|[Xx])(?:([+\-])([A-Za-z]+))?/)

        if (match && modificationType) {
            const operator = match[1] === '+' ? 'ADD' : 'SUBTRACT'
            const value = /[Xx]/i.test(match[2]) ? 1 : parseInt(match[2])
            const affectedByInput = /[Xx]/i.test(match[2])

            const modification = {
                type: modificationType,
                value: value,
                operator: operator,
                affectedByInput: affectedByInput,
                target: '',
            }

            // Check for additional property (like -BE)
            if (match[3] && match[4]) {
                // Property found (e.g., "BE")
                const propertyOperator = match[3] === '+' ? 'ADD' : 'SUBTRACT'
                const propertyName = match[4].toLowerCase()

                // Try to map to actor.system.abgeleitete path
                // Common properties: be, ini, gs, mr, etc.
                const actorPath = `actor.system.abgeleitete.${propertyName}`
                modification.target = actorPath
                modification.operator = propertyOperator
            }

            modifications.push(modification)
        }

        return { input, modifications }
    }

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

        // Parse probe to get input and modifications
        const { input, modifications } = this.parseProbe(probe)

        const systemData = {
            voraussetzungen,
            input,
            modifications,
            gruppe,
            probe,
            gegenprobe,
            text,
        }

        return this.createFoundryItem(name, 'manoever', systemData)
    }
}
