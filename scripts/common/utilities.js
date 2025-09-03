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
