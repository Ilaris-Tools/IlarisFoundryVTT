import { IlarisItemSheet } from './item.js'

export class WaffeneigenschaftSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/waffeneigenschaft.hbs',
            width: 600,
            height: 800,
            resizable: true,
        })
    }

    async getData() {
        const data = await super.getData()

        // Prepare kategorie options for select dropdown
        data.kategorien = [
            { value: 'modifier', label: 'Modifikator' },
            { value: 'conditional', label: 'Konditional' },
            { value: 'wielding', label: 'Führung' },
            { value: 'combat_mechanic', label: 'Kampfmechanik' },
            { value: 'target_effect', label: 'Ziel-Effekt' },
            { value: 'passive', label: 'Passiv' },
        ]

        return data
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Add any custom listeners here if needed
    }
}
