import { WaffeBaseSheet } from './waffe-base.js'

export class NahkampfwaffeSheet extends WaffeBaseSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'nahkampfwaffe'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/nahkampfwaffe.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Fetch available waffeneigenschaften from all compendiums
        context.availableEigenschaften = await this._getAvailableEigenschaften()

        // Ensure eigenschaften is an array
        if (!Array.isArray(this.document.system.eigenschaften)) {
            this.document.system.eigenschaften = []
        }

        // Migrate legacy damage format
        this._migrateLegacyDamageFormat(context)

        return context
    }
}
