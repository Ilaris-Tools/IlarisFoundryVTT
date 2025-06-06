/**
 * Extracts and sanitizes an energy cost value from a string or number input
 * @param {string|number} cost - The cost value to sanitize
 * @returns {number} - The sanitized cost as a number, defaults to 0 if invalid
 */
export function sanitizeEnergyCost(cost) {
    if (typeof cost === 'number') return cost;
    return parseInt(cost?.match(/\d+/)?.[0] || '0', 10);
} 