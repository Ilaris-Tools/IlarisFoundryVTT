import { IlarisItemSheet } from './item.js'

export class AktionSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'aktion'],
    }
    /** @override */
    static PARTS = {
        form: { template: 'systems/Ilaris/scripts/items/templates/aktion.hbs' },
    }
    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.aktionstyp_choices = [
            { value: 'einfach', label: 'Einfach' },
            { value: 'komplex', label: 'Komplex' },
        ]
        context.waffentyp_choices = [
            { value: '', label: 'Beliebig' },
            { value: 'nahkampfwaffe', label: 'Nahkampfwaffe' },
            { value: 'fernkampfwaffe', label: 'Fernkampfwaffe' },
        ]
        context.turnDialog_choices = [
            { value: '', label: 'Kein Dialog' },
            { value: 'melee', label: 'Nahkampf' },
            { value: 'ranged', label: 'Fernkampf' },
            { value: 'fertigkeit', label: 'Fertigkeit' },
            { value: 'supernatural', label: 'Übernatürlich' },
        ]
        return context
    }
}
