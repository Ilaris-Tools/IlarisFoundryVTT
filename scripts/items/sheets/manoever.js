import { PreEffectItemSheet } from './pre-effect-item.js'

export class ManoeverSheet extends PreEffectItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...PreEffectItemSheet.DEFAULT_OPTIONS,
        classes: [...PreEffectItemSheet.DEFAULT_OPTIONS.classes, 'manoever'],
        actions: {
            ...PreEffectItemSheet.DEFAULT_OPTIONS.actions,
            addModification: ManoeverSheet.#onAddModification,
            deleteModification: ManoeverSheet.#onDeleteModification,
            addSelectorChoice: ManoeverSheet.#onAddSelectorChoice,
            deleteSelectorChoice: ManoeverSheet.#onDeleteSelectorChoice,
        },
    }

    /** @override */
    static PARTS = {
        ...PreEffectItemSheet.PARTS,
        form: {
            template: 'systems/Ilaris/scripts/items/templates/manoever.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.manoever = CONFIG.ILARIS.manoever
        context.isManeuverPreEffect = true
        return context
    }

    _defaultPreEffect() {
        return {
            ...super._defaultPreEffect(),
            activation: 'onConfirmedHit',
            operation: '',
            ilarisEnding: { type: '' },
        }
    }

    static async #onAddModification() {
        const modifications = Object.values(this.document.system.modifications)
        modifications.push({
            type: 'ATTACK',
            value: 0,
            operator: 'ADD',
            target: '',
            affectedByInput: true,
        })
        await this.document.update({ 'system.modifications': modifications })
    }

    static async #onDeleteModification(_event, target) {
        const modifications = Object.values(this.document.system.modifications)
        modifications.splice(parseInt(target.dataset.modificationid), 1)
        await this.document.update({ 'system.modifications': modifications })
    }

    static async #onAddSelectorChoice() {
        const choices = foundry.utils.deepClone(this.document.system.input?.choices || [])
        choices.push('')
        await this.document.update({ 'system.input.choices': choices })
    }

    static async #onDeleteSelectorChoice(_event, target) {
        const choices = foundry.utils.deepClone(this.document.system.input?.choices || [])
        choices.splice(Number(target.dataset.choiceIndex), 1)
        await this.document.update({ 'system.input.choices': choices })
    }
}
