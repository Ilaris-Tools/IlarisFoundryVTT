/**
 * Utility functions for processing waffeneigenschaften
 * These are pure functions that don't depend on instance state
 */

/**
 * Check if a condition is met
 * @param {Object} condition - The condition to check
 * @param {Actor} actor - The owning actor
 * @returns {boolean} True if condition is met
 */
export function checkCondition(condition, actor) {
    switch (condition.type) {
        case 'attribute_check':
            const attrPath = `system.attribute.${condition.attribute}.wert`
            const attrValue = foundry.utils.getProperty(actor, attrPath) || 0
            return compareValues(attrValue, condition.operator, condition.value)

        default:
            return true
    }
}

/**
 * Compare two values with an operator
 * @param {number} a - First value
 * @param {string} operator - Comparison operator
 * @param {number} b - Second value
 * @returns {boolean} Result of comparison
 */
export function compareValues(a, operator, b) {
    switch (operator) {
        case '<':
            return a < b
        case '<=':
            return a <= b
        case '>':
            return a > b
        case '>=':
            return a >= b
        case '==':
            return a == b
        case '!=':
            return a != b
        default:
            return true
    }
}

/**
 * Evaluate a formula string with actor context
 * @param {string} formula - Formula with @actor references
 * @param {Actor} actor - The owning actor
 * @returns {number} Evaluated result
 */
export function evaluateFormula(formula, actor) {
    // Replace @actor references with actual values
    const replaced = formula.replace(/@actor\.([^\s]+)/g, (match, path) => {
        return foundry.utils.getProperty(actor, path) || 0
    })

    try {
        // eslint-disable-next-line no-eval
        return eval(replaced) || 0
    } catch (e) {
        console.error('Error evaluating formula:', formula, e)
        return 0
    }
}
