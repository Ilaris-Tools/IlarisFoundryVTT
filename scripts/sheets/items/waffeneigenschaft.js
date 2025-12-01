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

        // Attribute options
        data.attribute = [
            { value: 'KK', label: 'KK' },
            { value: 'KO', label: 'KO' },
            { value: 'GE', label: 'GE' },
            { value: 'IN', label: 'IN' },
            { value: 'CH', label: 'CH' },
            { value: 'MU', label: 'MU' },
            { value: 'KL', label: 'KL' },
            { value: 'FF', label: 'FF' },
        ]

        // Attribute options with empty option
        data.attributeMitLeer = [{ value: '', label: '-' }, ...data.attribute]

        // Operator options
        data.operatoren = [
            { value: '<', label: '<' },
            { value: '<=', label: '<=' },
            { value: '>', label: '>' },
            { value: '>=', label: '>=' },
            { value: '==', label: '==' },
            { value: '!=', label: '!=' },
        ]

        // Condition type options
        data.bedingungsTypen = [{ value: 'attribute_check', label: 'Attribut-Prüfung' }]

        // Target effect trigger options
        data.ausloeser = [
            { value: '', label: 'Kein' },
            { value: 'on_hit', label: 'Bei Treffer' },
            { value: 'on_crit', label: 'Bei Kritischem Treffer' },
        ]

        // Resist check type options
        data.widerstandsprobeTypen = [
            { value: 'none', label: 'Keine' },
            { value: 'attribute_vs_attribute', label: 'Attribut vs Attribut' },
        ]

        // Effect type options
        data.effektTypen = [
            { value: '', label: 'Kein' },
            { value: 'status', label: 'Status' },
            { value: 'condition', label: 'Zustand' },
            { value: 'grapple', label: 'Umklammerung' },
        ]

        return data
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Add any custom listeners here if needed
    }
}
