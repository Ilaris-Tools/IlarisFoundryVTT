/**
 * Parsing utilities for waffeneigenschaft strings
 * Converts between string representations (e.g., "Schwer (4)") and
 * structured objects (e.g., {key: "Schwer", parameters: [4]})
 */

/**
 * Parse a single eigenschaft string into a structured object
 * Supports various formats:
 * - Simple: "Zweihändig" → {key: "Zweihändig", parameters: []}
 * - Single parameter: "Schwer (4)" → {key: "Schwer", parameters: [4]}
 * - Multiple parameters: "Umklammern (-2; 12)" → {key: "Umklammern", parameters: [-2, 12]}
 * - Nested parentheses: "Fernkampfoption (Dolch (Kurze Wurfwaffen))" → {key: "Fernkampfoption", parameters: ["Dolch (Kurze Wurfwaffen)"]}
 *
 * @param {string} eigenschaftString - The eigenschaft string to parse
 * @returns {{key: string, parameters: Array<string|number>}|null} Parsed eigenschaft or null if invalid
 */
export function parseEigenschaftString(eigenschaftString) {
    if (!eigenschaftString || typeof eigenschaftString !== 'string') {
        console.warn('Ilaris | parseEigenschaftString: Invalid input - expected non-empty string')
        return null
    }

    const trimmed = eigenschaftString.trim()
    if (trimmed.length === 0) {
        console.warn('Ilaris | parseEigenschaftString: Empty string provided')
        return null
    }

    // Regex to match name and optional parameters
    // Supports nested parentheses by using a more sophisticated pattern
    // Format: "Name" or "Name (params)" or "Name(params)"
    const match = trimmed.match(/^([^(]+?)(?:\s*\((.+)\))?$/)

    if (!match) {
        console.warn(`Ilaris | parseEigenschaftString: Could not parse "${eigenschaftString}"`)
        return null
    }

    const key = match[1].trim()
    const paramsString = match[2]

    if (!key) {
        console.warn(`Ilaris | parseEigenschaftString: Empty key in "${eigenschaftString}"`)
        return null
    }

    // If no parameters, return with empty array
    if (!paramsString) {
        return {
            key,
            parameters: [],
        }
    }

    // Parse parameters - split by semicolon, handling nested parentheses
    const parameters = parseParameterString(paramsString)

    return {
        key,
        parameters,
    }
}

/**
 * Parse parameter string into array of values
 * Splits by semicolon but respects nested parentheses
 * Converts numeric strings to numbers
 *
 * @param {string} paramsString - The parameter string (without outer parentheses)
 * @returns {Array<string|number>} Array of parameter values
 */
function parseParameterString(paramsString) {
    const params = []
    let current = ''
    let depth = 0

    for (const char of paramsString) {
        if (char === '(') {
            depth++
            current += char
        } else if (char === ')') {
            depth--
            current += char
        } else if (char === ';' && depth === 0) {
            // Split point - not inside nested parentheses
            const value = parseParameterValue(current.trim())
            if (value !== null) {
                params.push(value)
            }
            current = ''
        } else {
            current += char
        }
    }

    // Add the last parameter
    if (current.trim()) {
        const value = parseParameterValue(current.trim())
        if (value !== null) {
            params.push(value)
        }
    }

    return params
}

/**
 * Parse a single parameter value
 * Converts numeric strings to numbers, handles special formats like "±2" or "+4"
 *
 * @param {string} value - The parameter value string
 * @returns {string|number|null} Converted value or null if empty
 */
function parseParameterValue(value) {
    if (!value || value.length === 0) {
        return null
    }

    // Handle special plus/minus formats
    // "±2" → 2 (we use the positive value, context determines sign)
    // "+4" → 4
    // "-2" → -2
    const cleanedValue = value.replace(/^[±]/, '').trim()

    // Try to parse as number
    const num = Number(cleanedValue)
    if (!isNaN(num) && cleanedValue !== '') {
        // Handle original sign for negative numbers
        if (value.startsWith('-') || value.startsWith('−')) {
            return -Math.abs(num)
        }
        return num
    }

    // Return as string if not a number
    return value
}

/**
 * Parse an array of eigenschaft strings into structured objects
 * Filters out null results from invalid strings
 *
 * @param {string[]} eigenschaften - Array of eigenschaft strings
 * @returns {Array<{key: string, parameters: Array<string|number>}>} Array of parsed eigenschaften
 */
export function parseEigenschaftenArray(eigenschaften) {
    if (!Array.isArray(eigenschaften)) {
        console.warn('Ilaris | parseEigenschaftenArray: Invalid input - expected array')
        return []
    }

    return eigenschaften
        .map((eigenschaftString) => parseEigenschaftString(eigenschaftString))
        .filter((result) => result !== null)
}

/**
 * Format a structured eigenschaft object back to display string
 * Used for UI display
 *
 * @param {{key: string, parameters: Array<string|number>}} eigenschaft - Structured eigenschaft
 * @returns {string} Display string (e.g., "Schwer (4)" or "Umklammern (-2; 12)")
 */
export function formatEigenschaftDisplay(eigenschaft) {
    if (!eigenschaft || !eigenschaft.key) {
        return ''
    }

    const { key, parameters } = eigenschaft

    if (!parameters || parameters.length === 0) {
        return key
    }

    // Format parameters - join with semicolon and space
    const paramsString = parameters.map((p) => String(p)).join('; ')
    return `${key} (${paramsString})`
}

/**
 * Check if an eigenschaft object is in the new structured format
 *
 * @param {any} eigenschaft - Value to check
 * @returns {boolean} True if it's a structured eigenschaft object
 */
export function isStructuredEigenschaft(eigenschaft) {
    return (
        eigenschaft !== null &&
        typeof eigenschaft === 'object' &&
        typeof eigenschaft.key === 'string' &&
        Array.isArray(eigenschaft.parameters)
    )
}

/**
 * Normalize eigenschaften to the new object array format
 * Handles both old string array format and new object array format
 *
 * @param {Array<string|{key: string, parameters: Array}>} eigenschaften - Eigenschaften in any format
 * @returns {Array<{key: string, parameters: Array<string|number>}>} Normalized array
 */
export function normalizeEigenschaften(eigenschaften) {
    if (!Array.isArray(eigenschaften)) {
        return []
    }

    return eigenschaften
        .map((eig) => {
            // Already in new format
            if (isStructuredEigenschaft(eig)) {
                return eig
            }

            // String format - parse it
            if (typeof eig === 'string') {
                const parsed = parseEigenschaftString(eig)
                return parsed || { key: eig, parameters: [] }
            }

            // Unknown format - try to extract key
            console.warn('Ilaris | normalizeEigenschaften: Unknown eigenschaft format', eig)
            return null
        })
        .filter((result) => result !== null)
}

/**
 * Extract just the key (base name) from an eigenschaft
 * Works with both string and object formats
 *
 * @param {string|{key: string, parameters: Array}} eigenschaft - Eigenschaft in any format
 * @returns {string|null} The eigenschaft key/name
 */
export function extractEigenschaftKey(eigenschaft) {
    if (typeof eigenschaft === 'string') {
        const parsed = parseEigenschaftString(eigenschaft)
        return parsed ? parsed.key : eigenschaft.trim()
    }

    if (isStructuredEigenschaft(eigenschaft)) {
        return eigenschaft.key
    }

    return null
}
