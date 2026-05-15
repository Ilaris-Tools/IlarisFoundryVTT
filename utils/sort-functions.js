/**
 * Sort comparator function for sorting items by name
 * @param {Object} a - First item to compare
 * @param {Object} b - Second item to compare
 * @returns {number} -1, 0, or 1 for sorting
 */
export function sortByName(a, b) {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0
}

/**
 * Sort comparator function for sorting items by gruppe (system.gruppe)
 * @param {Object} a - First item to compare
 * @param {Object} b - Second item to compare
 * @returns {number} -1, 0, or 1 for sorting
 */
export function sortByGruppe(a, b) {
    return a.system.gruppe > b.system.gruppe ? 1 : b.system.gruppe > a.system.gruppe ? -1 : 0
}
