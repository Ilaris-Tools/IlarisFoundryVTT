import { WaffeBaseSheet } from './waffe-base.js'

export class FernkampfwaffeSheet extends WaffeBaseSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'fernkampfwaffe'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/fernkampfwaffe.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        if (context.hasOwner) {
            context.speicherplatz_list = this.document.actor.misc.speicherplatz_list
        }

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
