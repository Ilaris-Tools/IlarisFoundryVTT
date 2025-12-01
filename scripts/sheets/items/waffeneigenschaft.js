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

        // Conditional modifier condition options
        data.conditionalModifierConditions = [
            { value: 'target_has_shield', label: 'Ziel hat Schild' },
            { value: 'target_is_prone', label: 'Ziel liegt' },
            { value: 'target_is_mounted', label: 'Ziel ist beritten' },
            { value: 'attacker_is_mounted', label: 'Angreifer ist beritten' },
            { value: 'attacker_is_charging', label: 'Angreifer stürmt' },
            { value: 'target_is_flanked', label: 'Ziel ist flankiert' },
            { value: 'target_is_surprised', label: 'Ziel ist überrascht' },
            { value: 'is_ranged_attack', label: 'Fernkampfangriff' },
            { value: 'is_melee_attack', label: 'Nahkampfangriff' },
        ]

        // Actor modifier mode options
        data.actorModifierModes = [
            { value: '', label: 'Keine' },
            { value: 'set', label: 'Setzen' },
            { value: 'augment', label: 'Modifizieren' },
        ]

        // Abgeleitete properties that can be modified
        data.abgeleiteteProperties = [
            { value: 'be', label: 'BE (Behinderung)' },
            { value: 'ini', label: 'INI (Initiative)' },
            { value: 'gs', label: 'GS (Geschwindigkeit)' },
        ]

        return data
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Add conditional modifier
        html.find('.add-conditional-modifier').click(this._onAddConditionalModifier.bind(this))

        // Remove conditional modifier
        html.find('.remove-conditional-modifier').click(
            this._onRemoveConditionalModifier.bind(this),
        )

        // Add actor modifier
        html.find('.add-actor-modifier').click(this._onAddActorModifier.bind(this))

        // Remove actor modifier
        html.find('.remove-actor-modifier').click(this._onRemoveActorModifier.bind(this))
    }

    /**
     * Handle adding a new conditional modifier
     * @param {Event} event
     * @private
     */
    async _onAddConditionalModifier(event) {
        event.preventDefault()
        const conditionalModifiers = foundry.utils.deepClone(
            this.item.system.modifiers?.conditionalModifiers || [],
        )
        conditionalModifiers.push({
            condition: 'target_has_shield',
            modifiers: {
                at: 0,
                vt: 0,
                schaden: 0,
            },
            description: '',
        })
        await this.item.update({ 'system.modifiers.conditionalModifiers': conditionalModifiers })
    }

    /**
     * Handle removing a conditional modifier
     * @param {Event} event
     * @private
     */
    async _onRemoveConditionalModifier(event) {
        event.preventDefault()
        const index = Number(event.currentTarget.dataset.index)
        const conditionalModifiers = foundry.utils.deepClone(
            this.item.system.modifiers?.conditionalModifiers || [],
        )
        conditionalModifiers.splice(index, 1)
        await this.item.update({ 'system.modifiers.conditionalModifiers': conditionalModifiers })
    }

    /**
     * Handle adding a new actor modifier
     * @param {Event} event
     * @private
     */
    async _onAddActorModifier(event) {
        event.preventDefault()
        const modifiers = foundry.utils.deepClone(this.item.system.actorModifiers.modifiers || [])
        modifiers.push({
            property: 'be',
            mode: '',
            value: 0,
            formula: '',
        })
        await this.item.update({ 'system.actorModifiers.modifiers': modifiers })
    }

    /**
     * Handle removing an actor modifier
     * @param {Event} event
     * @private
     */
    async _onRemoveActorModifier(event) {
        event.preventDefault()
        const index = Number(event.currentTarget.dataset.index)
        const modifiers = foundry.utils.deepClone(this.item.system.actorModifiers?.modifiers || [])
        modifiers.splice(index, 1)
        await this.item.update({ 'system.actorModifiers.modifiers': modifiers })
    }
}
