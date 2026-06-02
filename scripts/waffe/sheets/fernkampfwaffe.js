import { WaffeBaseSheet } from './waffe.js'

export class FernkampfwaffeSheet extends WaffeBaseSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'fernkampfwaffe'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/waffe/templates/fernkampfwaffe.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Fetch available waffeneigenschaften from all compendiums
        context.availableEigenschaften = await this._getAvailableEigenschaften()

        // Ensure eigenschaften is an array for rendering only.
        context.document.system.eigenschaften = Array.isArray(context.document.system.eigenschaften)
            ? context.document.system.eigenschaften
            : []

        // Migrate legacy damage format
        this._migrateLegacyDamageFormat(context)

        return context
    }
}
