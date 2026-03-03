import { IlarisItemSheet } from './item.js'

export class EffectItemSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'effect-item'],
        position: {
            width: 520,
            height: 480,
        },
        actions: {
            effectControl: EffectItemSheet.#onEffectControl,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/effect-item.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add effects array to context (don't modify the read-only property)
        context.effects = Array.from(this.document.effects)

        return context
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
                const effect = this.document.effects.get(effectId)
                return effect?.sheet.render(true)
            case 'delete':
                return this._deleteEffect(effectId)
            case 'toggle':
                return this._toggleEffect(effectId)
        }
    }

    /**
     * Create a new Active Effect on this item
     * @private
     */
    async _createEffect() {
        const effectData = {
            name: game.i18n.localize('EFFECT.New'),
            icon: 'icons/svg/aura.svg',
            origin: this.document.uuid,
            disabled: false,
        }

        return this.document.createEmbeddedDocuments('ActiveEffect', [effectData])
    }

    /**
     * Delete an Active Effect from this item
     * @param {string} effectId - The effect ID to delete
     * @private
     */
    async _deleteEffect(effectId) {
        const effect = this.document.effects.get(effectId)
        if (!effect) return

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'Effekt löschen' },
            content: `<p>Möchten Sie den Effekt "<strong>${effect.name}</strong>" wirklich löschen?</p>`,
            rejectClose: false,
            modal: true,
        })

        if (confirmed) {
            return effect.delete()
        }
    }

    /**
     * Toggle an Active Effect between enabled/disabled
     * @param {string} effectId - The effect ID to toggle
     * @private
     */
    async _toggleEffect(effectId) {
        const effect = this.document.effects.get(effectId)
        if (!effect) return

        return effect.update({ disabled: !effect.disabled })
    }
}
