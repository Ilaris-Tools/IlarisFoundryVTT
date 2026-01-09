/**
 * Utility to consolidate duplicate waffeneigenschaft items
 * Merges eigenschaften with different parameters into a single base eigenschaft
 * with parameter slots
 *
 * Usage: node utils/consolidate-eigenschaften.mjs
 */

/**
 * Mapping of eigenschaft names that should be consolidated
 * Maps variant names to their base eigenschaft and whether to delete after consolidation
 */
const CONSOLIDATION_MAP = {
    // Schwer variants
    'Schwer (4)': { base: 'Schwer', deleteAfter: true },
    'Schwer (8)': { base: 'Schwer', deleteAfter: true },
    'Schwer (+4)': { base: 'Schwer', deleteAfter: true },
    'Schwer (+8)': { base: 'Schwer', deleteAfter: true },

    // Niederwerfen variants
    'Niederwerfen (+4)': { base: 'Niederwerfen', deleteAfter: true },
    'Niederwerfen (+8)': { base: 'Niederwerfen', deleteAfter: true },

    // Umklammern variants
    'Umklammern (-2; 12)': { base: 'Umklammern', deleteAfter: true },
    'Umklammern (-4; 16)': { base: 'Umklammern', deleteAfter: true },
    'Umklammern (-8; 16)': { base: 'Umklammern', deleteAfter: true },
    'Umklammern (±2/12)': { base: 'Umklammern', deleteAfter: true },
    'Umklammern (±4/16)': { base: 'Umklammern', deleteAfter: true },
    'Umklammern (±8/16)': { base: 'Umklammern', deleteAfter: true },
}

/**
 * Parameter slot definitions for base eigenschaften
 * These will be added to the base eigenschaften after consolidation
 */
const PARAMETER_SLOTS = {
    Schwer: [
        {
            name: 'kkThreshold',
            type: 'number',
            label: 'KK-Schwellenwert',
            usage: 'wieldingRequirements.condition.value',
            required: true,
            defaultValue: 4,
        },
    ],
    Niederwerfen: [
        {
            name: 'bonus',
            type: 'number',
            label: 'Bonus',
            usage: 'modifiers.at',
            required: false,
            defaultValue: 4,
        },
    ],
    Umklammern: [
        {
            name: 'malus',
            type: 'number',
            label: 'Malus AT/VT',
            usage: 'modifiers.at',
            required: true,
            defaultValue: -2,
        },
        {
            name: 'kkCheck',
            type: 'number',
            label: 'KK-Voraussetzung',
            usage: 'wieldingRequirements.condition.value',
            required: true,
            defaultValue: 12,
        },
    ],
}

console.log('Ilaris | Consolidate Waffeneigenschaften Utility')
console.log('This utility is designed to run in a Foundry VTT world context')
console.log(
    'It should be converted to run within Foundry or used as a reference for manual consolidation',
)
console.log('')
console.log('Consolidation map:', CONSOLIDATION_MAP)
console.log('Parameter slots:', PARAMETER_SLOTS)
console.log('')
console.log('Steps to manually consolidate:')
console.log('1. For each base eigenschaft (Schwer, Niederwerfen, Umklammern):')
console.log('   - Open the base waffeneigenschaft item')
console.log('   - Add the parameterSlots array to system data')
console.log('   - Save the item')
console.log('2. For each variant eigenschaft (e.g., "Schwer (4)"):')
console.log('   - Find all weapons using this eigenschaft')
console.log('   - Update them to use the base eigenschaft with parameters')
console.log('   - Delete the variant eigenschaft item')
console.log('3. Run the migration script to update all weapons')

export { CONSOLIDATION_MAP, PARAMETER_SLOTS }
