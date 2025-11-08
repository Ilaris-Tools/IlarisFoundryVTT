import { BaseConverter } from './base-converter.js'

/**
 * Converter for Vorteil
 */
export class VorteilConverter extends BaseConverter {
    /**
     * Parse text to detect patterns and generate foundryScript
     * Detects multiple patterns:
     * 1. "[weapon type] ignoriert die übliche Erschwernis für Nebenwaffen"
     * 2. "ignorierst du im Fernkampf du den Malus für berittene Schützen"
     * @param {string} text - The vorteil text content
     * @param {number} kategorie - The vorteil kategorie
     * @returns {string} Generated foundryScript (multiple scripts separated by semicolon) or empty string
     */
    parseFoundryScript(text, kategorie) {
        // Only process for kategorie 3
        if (kategorie !== 3 || !text) {
            return ''
        }

        const scripts = []

        // Pattern 1: Side weapon malus ignore
        const sideWeaponPattern = /ignoriert die übliche(?:n)? erschwernis(?:se)? für nebenwaffen/i

        if (sideWeaponPattern.test(text)) {
            // Try to extract weapon property from the sentence containing the pattern
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
                    scripts.push('ignoreSideWeaponMalus()')
                } else {
                    // Capitalize first letter for weapon property
                    const capitalizedWeapon =
                        weaponType.charAt(0).toUpperCase() + weaponType.slice(1)
                    scripts.push(`ignoreSideWeaponMalus('${capitalizedWeapon}')`)
                }
            }
        }

        // Pattern 2: Mounted range penalty ignore
        const mountedRangePattern =
            /ignorierst\s+du\s+im\s+fernkampf\s+(?:du\s+)?den\s+malus\s+für\s+berittene\s+schützen/i

        if (mountedRangePattern.test(text)) {
            scripts.push('ignoreMountedRangePenalty()')
        }

        // Join all scripts with semicolon
        return scripts.join(';')
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
