import { IlarisItemSheet } from './item.js'
import { EffectsManager } from '../../effects/effects-manager.js'

export class VorteilSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'vorteil'],
        actions: {
            create: VorteilSheet.#onEffectControl,
            edit: VorteilSheet.#onEffectControl,
            delete: VorteilSheet.#onEffectControl,
            toggle: VorteilSheet.#onEffectControl,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/vorteil.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Prepare configuration arrays for selectOptions helper
        context.vorteilsgruppen = CONFIG.ILARIS.vorteilsgruppen

        // Add effects data using the mixin
        return EffectsManager.prepareEffectsData.call(this, context)
    }

    /**
     * Handle effect control buttons (create, edit, delete, toggle)
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
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

// Apply the EffectsManager mixin to the VorteilSheet
Object.assign(VorteilSheet.prototype, EffectsManager)
