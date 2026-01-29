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
            { value: 'wielding', label: 'Führung' },
            { value: 'target_effect', label: 'Ziel-Effekt' },
            { value: 'actor_modifier', label: 'Akteur-Modifikator' },
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
            { value: 'actionNegAugment', label: 'Bei Aktion Negativ Modifizieren' },
            { value: 'actionAugment', label: 'Bei Aktion Positiv Modifizieren' },
        ]

        // Abgeleitete properties that can be modified
        data.abgeleiteteProperties = [
            { value: 'be', label: 'BE (Behinderung)' },
            { value: 'ini', label: 'INI (Initiative)' },
            { value: 'gs', label: 'GS (Geschwindigkeit)' },
        ]

        // Usage path options for parameter slots
        data.usagePfade = [
            { value: '', label: '-- Kein Usage --' },
            {
                value: 'wieldingRequirements.condition.value',
                label: 'Führung: Attribut-Schwellenwert',
            },
            { value: 'wieldingRequirements.hands', label: 'Führung: Anzahl Hände' },
            {
                value: 'wieldingRequirements.condition.onFailure.at',
                label: 'Führung: Fehlschlag AT-Malus',
            },
            {
                value: 'wieldingRequirements.condition.onFailure.vt',
                label: 'Führung: Fehlschlag VT-Malus',
            },
            {
                value: 'wieldingRequirements.condition.onFailure.schaden',
                label: 'Führung: Fehlschlag Schadens-Malus',
            },
            {
                value: 'targetEffect.resistCheck.attackerModifier',
                label: 'Ziel-Effekt: Angreifer-Modifikator',
            },
            {
                value: 'targetEffect.resistCheck.defenderModifier',
                label: 'Ziel-Effekt: Verteidiger-Modifikator',
            },
            { value: 'modifiers.at', label: 'Modifikator: AT' },
            { value: 'modifiers.vt', label: 'Modifikator: VT' },
            { value: 'modifiers.schaden', label: 'Modifikator: Schaden' },
            { value: 'modifiers.rw', label: 'Modifikator: Reichweite' },
            { value: 'modifiers.fumbleThreshold', label: 'Modifikator: Patzer-Schwelle' },
            { value: 'modifiers.critThreshold', label: 'Modifikator: Kritische Schwelle' },
            {
                value: 'actorModifiers.modifiers.{{index}}.value',
                label: 'Actor-Modifikator: Value',
            },
        ]

        return data
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        // Parameter slot management
        html.find('.add-parameter-slot').click(this._onAddParameterSlot.bind(this))
        html.find('.remove-parameter-slot').click(this._onRemoveParameterSlot.bind(this))

        // Conditional modifiers
        html.find('.add-conditional-modifier').click(this._onAddConditionalModifier.bind(this))
        html.find('.remove-conditional-modifier').click(
            this._onRemoveConditionalModifier.bind(this),
        )

        // Actor modifiers
        html.find('.add-actor-modifier').click(this._onAddActorModifier.bind(this))
        html.find('.remove-actor-modifier').click(this._onRemoveActorModifier.bind(this))
    }

    /**
     * Handle adding a parameter slot
     * @param {Event} event - The click event
     * @private
     */
    async _onAddParameterSlot(event) {
        event.preventDefault()
        const currentData = this.item.system.parameterSlots
        const slots = Array.isArray(currentData) ? currentData : Object.values(currentData) || []
        slots.push({
            name: '',
            type: 'number',
            label: '',
            usage: '',
            required: false,
            defaultValue: null,
        })
        await this.item.update({ 'system.parameterSlots': slots })
    }

    /**
     * Handle removing a parameter slot
     * @param {Event} event - The click event
     * @private
     */
    async _onRemoveParameterSlot(event) {
        event.preventDefault()
        const index = parseInt(event.currentTarget.dataset.index)
        const currentData = this.item.system.parameterSlots
        const slots = Array.isArray(currentData) ? currentData : Object.values(currentData) || []
        slots.splice(index, 1)
        await this.item.update({ 'system.parameterSlots': slots })
    }

    /**
     * Handle adding a conditional modifier
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
     * Handle adding an actor modifier
     * @param {Event} event
     * @private
     */
    async _onAddActorModifier(event) {
        event.preventDefault()
        const modifiers = foundry.utils.deepClone(this.item.system.actorModifiers?.modifiers || [])
        let modifiersArray = modifiers || []
        if (
            modifiersArray &&
            typeof modifiersArray === 'object' &&
            !Array.isArray(modifiersArray)
        ) {
            modifiersArray = Object.values(modifiersArray)
        }
        modifiersArray.push({
            property: 'be',
            mode: '',
            value: 0,
            formula: '',
        })
        await this.item.update({ 'system.actorModifiers.modifiers': modifiersArray })
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
        let modifiersArray = modifiers || []
        if (
            modifiersArray &&
            typeof modifiersArray === 'object' &&
            !Array.isArray(modifiersArray)
        ) {
            modifiersArray = Object.values(modifiersArray)
        }
        modifiersArray.splice(index, 1)
        await this.item.update({ 'system.actorModifiers.modifiers': modifiersArray })
    }
}
