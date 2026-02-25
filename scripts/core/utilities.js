/**
 * Extracts and sanitizes an energy cost value from a string or number input
 * @param {string|number} cost - The cost value to sanitize
 * @returns {number} - The sanitized cost as a number, defaults to 0 if invalid
 */
export function sanitizeEnergyCost(cost) {
    if (typeof cost === 'number') return cost
    return parseInt(cost?.match(/\d+/)?.[0] || '0', 10)
}

/**
 * Checks if an energy cost can be parsed as a numeric value
 * @param {string|number} cost - The cost value to check
 * @returns {boolean} - True if the cost is numeric or contains numbers, false otherwise
 */
export function isNumericCost(cost) {
    if (typeof cost === 'number') return true
    if (typeof cost !== 'string') return false

    // Check if the string contains at least one digit
    const hasNumbers = /\d/.test(cost)
    return hasNumbers
}

/**
 * Formats Foundry dice notation into user-friendly German display
 * @param {string} diceFormula - The Foundry dice formula (e.g., "3d20dl1dh1", "2d20dl1", "1d20")
 * @returns {string} User-friendly German display (e.g., "3W20 (Median)", "2W20 (Schip)", "1W20")
 *
 * Conversion rules:
 * - 3d20dl1dh1 → 3W20 (Median) - drop lowest and highest = median
 * - 2d20dl1 → 2W20 (Schip) - drop lowest with 2 dice = schip
 * - 3d20dl2 → 3W20 (Schip) - drop 2 lowest with 3 dice = schip
 * - 4d20dl2dh1 → 4W20 (Median, Schip) - median + schip combined
 * - 1d20 → 1W20 - simple single die
 */
export function formatDiceFormula(diceFormula) {
    if (!diceFormula || typeof diceFormula !== 'string') {
        return diceFormula
    }

    // Extract the dice count and modifiers using regex
    const match = diceFormula.match(/^(\d+)d(\d+)(dl(\d+))?(dh(\d+))?/)
    if (!match) {
        return diceFormula // Return original if pattern doesn't match
    }

    const diceCount = parseInt(match[1])
    const diceSides = match[2]
    const dropLowest = match[4] ? parseInt(match[4]) : 0
    const dropHighest = match[6] ? parseInt(match[6]) : 0

    // Build the base display (convert 'd' to 'W' for German)
    let display = `${diceCount}W${diceSides}`

    // Determine modifiers
    const modifiers = []

    // Check for median (drop both lowest and highest)
    if (dropLowest > 0 && dropHighest > 0) {
        modifiers.push('Median')
    }

    // Check for schip (drop lowest but not highest, or specific patterns)
    if (dropLowest > 0 && dropHighest === 0) {
        modifiers.push('Schip')
    } else if (dropLowest > 1 && dropHighest > 0) {
        // Pattern like 4d20dl2dh1 has both median and schip
        modifiers.push('Schip')
    }

    // Add modifiers to display if any exist
    if (modifiers.length > 0) {
        display += ` (${modifiers.join(', ')})`
    }

    return display
}
