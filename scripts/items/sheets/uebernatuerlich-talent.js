import { IlarisItemSheet } from './item.js'
import { EffectsManager } from '../../effects/effects-manager.js'

export class UebernatuerlichTalentSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'uebernatuerlich-talent'],
        actions: {
            create: UebernatuerlichTalentSheet.#onEffectControl,
            edit: UebernatuerlichTalentSheet.#onEffectControl,
            delete: UebernatuerlichTalentSheet.#onEffectControl,
            toggle: UebernatuerlichTalentSheet.#onEffectControl,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/uebernatuerlich_talent.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        if (context.hasOwner) {
            context.fertigkeit_list = this.document.actor.misc.uebernatuerlich_fertigkeit_list
        }

        return EffectsManager.prepareEffectsData.call(this, context)
    }

    static async #onEffectControl(event, target) {
        const action = target.dataset.action
        const effectId = target.dataset.effectId

        switch (action) {
            case 'create':
                return this._createEffect()
            case 'edit':
                return this._editEffect(effectId)
            case 'delete':
                return this._deleteEffect(effectId)
            case 'toggle':
                return this._toggleEffect(effectId)
        }
    }
}

Object.assign(UebernatuerlichTalentSheet.prototype, EffectsManager)
