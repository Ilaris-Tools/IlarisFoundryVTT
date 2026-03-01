/**
 * Base class for eigenschaft processors
 * Each processor handles a specific kategorie of waffeneigenschaft
 */
export class BaseEigenschaftProcessor {
    /**
     * Process an eigenschaft and modify the computed stats
     * @param {string} name - The eigenschaft name/key
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Array<string|number>} parameters - Parameter values from the weapon
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @param {Object} weapon - The weapon item
     * @abstract
     */
    process(name, eigenschaft, parameters, computed, actor, weapon) {
        throw new Error('process() must be implemented by subclass')
    }

    /**
     * Get the kategorie this processor handles
     * @returns {string}
     * @abstract
     */
    static getKategorie() {
        throw new Error('getKategorie() must be implemented by subclass')
    }
}
