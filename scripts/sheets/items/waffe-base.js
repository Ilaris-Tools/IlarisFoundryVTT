import { IlarisItemSheet } from './item.js'

/**
 * Base class for weapon sheets (Nahkampfwaffe and Fernkampfwaffe)
 * Provides shared functionality for weapon items
 */
export class WaffeBaseSheet extends IlarisItemSheet {
    /**
     * Get all available waffeneigenschaft items from compendiums
     * @returns {Promise<Array>} Array of eigenschaft objects with name and id
     * @protected
     */
    async _getAvailableEigenschaften() {
        const eigenschaften = []

        // Search through all compendiums
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item') {
                const items = await pack.getDocuments()
                for (const item of items) {
                    if (item.type === 'waffeneigenschaft') {
                        eigenschaften.push({
                            name: item.name,
                            id: item.id,
                        })
                    }
                }
            }
        }

        // Also include eigenschaften from world items
        for (const item of game.items) {
            if (item.type === 'waffeneigenschaft') {
                eigenschaften.push({
                    name: item.name,
                    id: item.id,
                })
            }
        }

        // Sort by name for better UX
        eigenschaften.sort((a, b) => a.name.localeCompare(b.name))

        return eigenschaften
    }

    /**
     * Migrate legacy damage format (dice_anzahl and dice_plus) to tp format
     * @param {Object} data - The item data
     * @protected
     */
    _migrateLegacyDamageFormat(data) {
        // for migration from dice_anzahl and dice_plus to tp
        // Only migrate if tp is not set yet AND old fields exist
        if (!this.item.system.tp && (this.item.system.dice_plus || this.item.system.dice_anzahl)) {
            this.item.system.tp = `${this.item.system.dice_anzahl}W6${
                this.item.system.dice_plus < 0 ? '' : '+'
            }${this.item.system.dice_plus}`
            delete this.item.system.dice_anzahl
            delete this.item.system.dice_plus
        }
    }
}
