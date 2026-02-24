import { IlarisItemSheet } from './item.js'

export class FreieFertigkeitSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'freie-fertigkeit'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/freie_fertigkeit.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Prepare configuration arrays for selectOptions helper
        context.stufen = CONFIG.ILARIS.stufen

        // Convert existing freie_fertigkeiten object to array format
        context.freieFertigkeitsgruppen = Object.entries(CONFIG.ILARIS.freie_fertigkeiten).map(
            ([value, label]) => ({
                value: value,
                label: label,
            }),
        )

        return context
    }
}
