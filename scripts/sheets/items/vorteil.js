import { IlarisItemSheet } from './item.js'
import { EffectsManager } from '../common/effects-manager.js'

export class VorteilSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'vorteil'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/vorteil.hbs',
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

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Use the effects manager for effect controls
        EffectsManager.activateEffectListeners.call(this, this.element)
    }
}

// Apply the EffectsManager mixin to the VorteilSheet
Object.assign(VorteilSheet.prototype, EffectsManager)
