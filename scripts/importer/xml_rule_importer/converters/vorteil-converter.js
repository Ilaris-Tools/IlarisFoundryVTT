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
     * 3. "Du kannst [gegen X] –N Erschwernis aus Manövern ignorieren"
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
                    // Capitalize weapon property:
                    // - For single word: capitalize first letter, preserve rest
                    // - For multiple words: capitalize first letter of first word (preserve rest),
                    //   then apply title case to remaining words
                    const words = weaponType.split(' ')
                    const capitalizedWeapon =
                        words.length === 1
                            ? weaponType.charAt(0).toUpperCase() + weaponType.slice(1)
                            : words[0].charAt(0).toUpperCase() +
                              words[0].slice(1) +
                              ' ' +
                              words
                                  .slice(1)
                                  .map(
                                      (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1).toLowerCase(),
                                  )
                                  .join(' ')
                    scripts.push(`ignoreSideWeaponMalus('${capitalizedWeapon}')`)
                }
            }
        }

        // Pattern 2: Mounted range penalty ignore
        const mountedRangePattern =
            /(?:du\s+)?ignorierst\s+(?:du\s+)?im\s+fernkampf\s+(?:du\s+)?den\s+malus\s+für\s+berittene\s+schützen/i

        if (mountedRangePattern.test(text)) {
            scripts.push('ignoreMountedRangePenalty()')
        }

        // Pattern 3: Manöver penalty reduction
        // Pattern: "Du kannst [gegen X] –N Erschwernis aus Manövern ignorieren"
        const manoeverPattern =
            /du\s+kannst\s+(?:gegen\s+([^–\-]+?)\s+)?[–\-](\d+)\s+erschwernis(?:se)?\s+aus\s+manövern\s+ignorieren/i

        const manoeverMatch = text.match(manoeverPattern)
        if (manoeverMatch) {
            const condition = manoeverMatch[1] // Optional condition like "humanoide Gegner"
            const penaltyValue = manoeverMatch[2] // The numeric value (e.g., "1")

            if (condition && condition.trim()) {
                // Has condition: manoverAusgleich(N)
                scripts.push(`manoverAusgleich(${penaltyValue})`)
            } else {
                // No condition: manoverAusgleich(N,false)
                scripts.push(`manoverAusgleich(${penaltyValue},false)`)
            }
        }

        // Join all scripts with semicolon
        return scripts.join(';')
    }

    /**
     * Generate a human-readable description from effect changes
     * @param {Array} changes - Array of effect change objects
     * @returns {string} Human-readable description
     */
    generateEffectDescription(changes) {
        const statNames = {
            ws: 'WS',
            mr: 'MR',
            gs: 'GS',
            ini: 'INI',
            dh: 'DH',
            asp: 'AsP',
            kap: 'KaP',
        }

        const descriptions = changes.map((change) => {
            // Extract stat name from key (e.g., "system.abgeleitete.ws" -> "ws")
            const statMatch = change.key.match(/\.(\w+)$/)
            if (!statMatch) return null

            const stat = statMatch[1]
            // Only process valid stat names
            if (!statNames[stat]) return null

            const statName = statNames[stat]

            // Format the value for display
            let displayValue = change.value

            // Convert Foundry formula back to readable format
            if (typeof displayValue === 'string' && displayValue.includes('@attribute')) {
                displayValue = displayValue
                    .replace(/@attribute\.(\w+)\.wert/g, '$1')
                    .replace(/\s+/g, '')
            }

            // Add + sign for positive numeric values
            if (!isNaN(parseFloat(displayValue)) && !displayValue.startsWith('-')) {
                displayValue = '+' + displayValue
            } else if (
                typeof displayValue === 'string' &&
                !displayValue.startsWith('+') &&
                !displayValue.startsWith('-')
            ) {
                displayValue = '+' + displayValue
            }

            return `${statName} ${displayValue}`
        })

        return descriptions.filter((d) => d).join(', ')
    }

    /**
     * Parse Sephrasto script and create Active Effect changes
     * Handles scripts like: modifyWS(getAttribute(KO)*5), modifyMR(1), modifyGS(1), modifyAsP(5), modifyKaP(3)
     * @param {string} script - The Sephrasto script string
     * @param {number} kategorie - The vorteil kategorie (ignore script for 3, 5, 7)
     * @returns {Array} Array of effect change objects
     */
    parseScriptToEffects(script, kategorie) {
        // Ignore script for kampfstil categories (3, 5, 7)
        if (!script || [3, 5, 7].includes(kategorie)) {
            return []
        }

        const changes = []

        // Pattern: modifyXX(value) where XX is WS, MR, GS, INI, DH, AsP, KaP, AsPBasis, KaPBasis
        // Use greedy match (.+) to capture full expression including nested parentheses
        const modifyPattern = /modify(WS|MR|GS|INI|DH|AsP|KaP|AsPBasis|KaPBasis)\s*\(\s*(.+)\s*\)/gi

        let match
        while ((match = modifyPattern.exec(script)) !== null) {
            const stat = match[1] // WS, MR, GS, INI, DH, AsP, KaP, AsPBasis, KaPBasis
            const valueExpression = match[2].trim()

            // Map stat to the correct key
            let key
            if (stat === 'AsPBasis') {
                key = 'system.abgeleitete.asp'
            } else if (stat === 'KaPBasis') {
                key = 'system.abgeleitete.kap'
            } else if (stat === 'AsP') {
                key = 'system.abgeleitete.asp'
            } else if (stat === 'KaP') {
                key = 'system.abgeleitete.kap'
            } else {
                // WS, MR, GS, INI, DH
                key = `system.abgeleitete.${stat.toLowerCase()}`
            }

            // Convert the value expression to Foundry format
            // Always use ADD mode (mode 2) - it can handle both numbers and formulas
            let foundryValue = valueExpression

            // Check if it contains getAttribute() and convert to @attribute format
            if (/getAttribute/i.test(valueExpression)) {
                foundryValue = valueExpression
                    .replace(/getAttribute\s*\(\s*(\w+)\s*\)/gi, (match, attrName) => {
                        return `@attribute.${attrName.toUpperCase()}.wert`
                    })
                    .replace(/\*/g, ' * ')
                    .replace(/\+/g, ' + ')
                    .replace(/\-/g, ' - ')
                    .replace(/\//g, ' / ')
            } else {
                // Simple numeric value - ensure it's a valid number
                const numericValue = parseFloat(valueExpression)
                if (isNaN(numericValue)) {
                    continue // Skip invalid values
                }
                foundryValue = numericValue.toString()
            }

            changes.push({
                key,
                mode: 2, // ADD mode - works for both numbers and formulas
                value: foundryValue,
                priority: 20,
            })
        }

        return changes
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

        // Parse script to create effects
        const effectChanges = this.parseScriptToEffects(sephrastoScript, kategorie)

        // Create the base item
        const item = this.createFoundryItem(name, 'vorteil', systemData)

        // Add effects if any were parsed from the script
        if (effectChanges.length > 0) {
            const effectDescription = this.generateEffectDescription(effectChanges)
            item.effects = [
                {
                    name: `${name} Effekt`,
                    icon: 'icons/svg/upgrade.svg',
                    disabled: false,
                    duration: {},
                    changes: effectChanges,
                    desscription: effectDescription,
                    transfer: true, // Transfer to actor when item is added
                    flags: {
                        ilaris: {
                            sourceType: 'vorteil',
                        },
                    },
                },
            ]
        }

        return item
    }
}
