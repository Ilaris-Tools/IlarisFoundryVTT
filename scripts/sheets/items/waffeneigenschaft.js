import { IlarisItemSheet } from './item.js'

export class WaffeneigenschaftSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'waffeneigenschaft'],
        position: {
            width: 600,
            height: 800,
        },
        window: {
            resizable: true,
        },
        actions: {
            addParameterSlot: WaffeneigenschaftSheet.#onAddParameterSlot,
            removeParameterSlot: WaffeneigenschaftSheet.#onRemoveParameterSlot,
            addConditionalModifier: WaffeneigenschaftSheet.#onAddConditionalModifier,
            removeConditionalModifier: WaffeneigenschaftSheet.#onRemoveConditionalModifier,
            addActorModifier: WaffeneigenschaftSheet.#onAddActorModifier,
            removeActorModifier: WaffeneigenschaftSheet.#onRemoveActorModifier,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/waffeneigenschaft.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Prepare kategorie options for select dropdown
        context.kategorien = [
            { value: 'modifier', label: 'Modifikator' },
            { value: 'wielding', label: 'Führung' },
            { value: 'target_effect', label: 'Ziel-Effekt' },
            { value: 'actor_modifier', label: 'Akteur-Modifikator' },
            { value: 'passive', label: 'Passiv' },
        ]

        // Attribute options
        context.attribute = [
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
        context.attributeMitLeer = [{ value: '', label: '-' }, ...context.attribute]

        // Operator options
        context.operatoren = [
            { value: '<', label: '<' },
            { value: '<=', label: '<=' },
            { value: '>', label: '>' },
            { value: '>=', label: '>=' },
            { value: '==', label: '==' },
            { value: '!=', label: '!=' },
        ]

        // Condition type options
        context.bedingungsTypen = [{ value: 'attribute_check', label: 'Attribut-Prüfung' }]

        // Target effect trigger options
        context.ausloeser = [
            { value: '', label: 'Kein' },
            { value: 'on_hit', label: 'Bei Treffer' },
            { value: 'on_crit', label: 'Bei Kritischem Treffer' },
        ]

        // Resist check type options
        context.widerstandsprobeTypen = [
            { value: 'none', label: 'Keine' },
            { value: 'attribute_vs_attribute', label: 'Attribut vs Attribut' },
        ]

        // Effect type options
        context.effektTypen = [
            { value: '', label: 'Kein' },
            { value: 'status', label: 'Status' },
            { value: 'condition', label: 'Zustand' },
            { value: 'grapple', label: 'Umklammerung' },
        ]

        // Conditional modifier condition options
        context.conditionalModifierConditions = [
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
        context.actorModifierModes = [
            { value: '', label: 'Keine' },
            { value: 'set', label: 'Setzen' },
            { value: 'augment', label: 'Modifizieren' },
            { value: 'actionNegAugment', label: 'Bei Aktion Negativ Modifizieren' },
            { value: 'actionAugment', label: 'Bei Aktion Positiv Modifizieren' },
        ]

        // Abgeleitete properties that can be modified
        context.abgeleiteteProperties = [
            { value: 'be', label: 'BE (Behinderung)' },
            { value: 'ini', label: 'INI (Initiative)' },
            { value: 'gs', label: 'GS (Geschwindigkeit)' },
        ]

        // Usage path options for parameter slots
        context.usagePfade = [
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

        return context
    }

    /**
     * Handle adding a parameter slot
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
    static async #onAddParameterSlot(event, target) {
        const currentData = this.document.system.parameterSlots
        const slots = Array.isArray(currentData) ? currentData : Object.values(currentData) || []
        slots.push({
            name: '',
            type: 'number',
            label: '',
            usage: '',
            required: false,
            defaultValue: null,
        })
        await this.document.update({ 'system.parameterSlots': slots })
    }

    /**
     * Handle removing a parameter slot
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
    static async #onRemoveParameterSlot(event, target) {
        const index = parseInt(target.dataset.index)
        const currentData = this.document.system.parameterSlots
        const slots = Array.isArray(currentData) ? currentData : Object.values(currentData) || []
        slots.splice(index, 1)
        await this.document.update({ 'system.parameterSlots': slots })
    }

    /**
     * Handle adding a conditional modifier
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     * @private
     */
    static async #onAddConditionalModifier(event, target) {
        const conditionalModifiers = foundry.utils.deepClone(
            this.document.system.modifiers?.conditionalModifiers || [],
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
        await this.document.update({
            'system.modifiers.conditionalModifiers': conditionalModifiers,
        })
    }

    /**
     * Handle removing a conditional modifier
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     * @private
     */
    static async #onRemoveConditionalModifier(event, target) {
        const index = Number(target.dataset.index)
        const conditionalModifiers = foundry.utils.deepClone(
            this.document.system.modifiers?.conditionalModifiers || [],
        )
        conditionalModifiers.splice(index, 1)
        await this.document.update({
            'system.modifiers.conditionalModifiers': conditionalModifiers,
        })
    }

    /**
     * Handle adding an actor modifier
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     * @private
     */
    static async #onAddActorModifier(event, target) {
        const modifiers = foundry.utils.deepClone(
            this.document.system.actorModifiers?.modifiers || [],
        )
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
        await this.document.update({ 'system.actorModifiers.modifiers': modifiersArray })
    }

    /**
     * Handle removing an actor modifier
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     * @private
     */
    static async #onRemoveActorModifier(event, target) {
        const index = Number(target.dataset.index)
        const modifiers = foundry.utils.deepClone(
            this.document.system.actorModifiers?.modifiers || [],
        )
        let modifiersArray = modifiers || []
        if (
            modifiersArray &&
            typeof modifiersArray === 'object' &&
            !Array.isArray(modifiersArray)
        ) {
            modifiersArray = Object.values(modifiersArray)
        }
        modifiersArray.splice(index, 1)
        await this.document.update({ 'system.actorModifiers.modifiers': modifiersArray })
    }
}
