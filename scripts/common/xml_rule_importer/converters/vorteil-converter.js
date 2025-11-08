import { BaseConverter } from './base-converter.js'

/**
 * Converter for Vorteil
 */
export class VorteilConverter extends BaseConverter {
    /**
     * Parse text to detect side weapon malus pattern and generate foundryScript
     * Detects pattern: "[weapon type] ignoriert die übliche Erschwernis für Nebenwaffen"
     * @param {string} text - The vorteil text content
     * @param {number} kategorie - The vorteil kategorie
     * @returns {string} Generated foundryScript or empty string
     */
    parseFoundryScript(text, kategorie) {
        // Only process for kategorie 3
        if (kategorie !== 3 || !text) {
            return ''
        }

        // Pattern to detect side weapon malus ignore
        const pattern = /ignoriert die übliche(?:n)? erschwernis(?:se)? für nebenwaffen/i

        if (!pattern.test(text)) {
            return ''
        }

        // Try to extract weapon property from the sentence containing the pattern
        // Look for the pattern in the text and extract the sentence/line containing it
        // Pattern: "Dein(e)? [WeaponProperty] ignoriert..."
        const weaponMatch = text.match(
            /deine?\s+([^\s]+(?:\s+\w+)?)\s+ignoriert\s+die\s+übliche(?:n)?\s+erschwernis(?:se)?\s+für\s+nebenwaffen/i,
        )

        if (weaponMatch) {
            const weaponType = weaponMatch[1].trim()
            const weaponTypeLower = weaponType.toLowerCase()

            // Check if it's a generic term (must match exactly or start with "zweite")
            // Generic terms like "zweite Waffe", "zweite", or just "Waffe" should not have parameter
            const isGeneric =
                weaponTypeLower === 'waffe' ||
                weaponTypeLower === 'zweite' ||
                weaponTypeLower === 'zweite waffe' ||
                weaponTypeLower.startsWith('zweite ')

            if (isGeneric) {
                return 'ignoreSideWeaponMalus()'
            } else {
                // Capitalize first letter for weapon property
                const capitalizedWeapon = weaponType.charAt(0).toUpperCase() + weaponType.slice(1)
                return `ignoreSideWeaponMalus('${capitalizedWeapon}')`
            }
        }

        // Default: empty string if pattern found but weapon type couldn't be extracted
        return ''
    }

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

        // Generate foundryScript based on text patterns
        const foundryScript = this.parseFoundryScript(text, kategorie)

        const systemData = {
            voraussetzung, // XML uses 'voraussetzungen', template uses 'voraussetzung' (singular)
            gruppe: kategorie,
            text,
            sephrastoScript, // XML uses 'script', template uses 'sephrastoScript'
            stilBedingungen, // XML uses 'bedingungen', template uses 'stilBedingungen'
            foundryScript,
        }

        return this.createFoundryItem(name, 'vorteil', systemData)
    }
}
