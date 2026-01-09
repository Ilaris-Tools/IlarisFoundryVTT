import { IlarisItemSheet } from './item.js'

export class EffectItemSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/effect-item.hbs',
            width: 520,
            height: 480,
        })
    }

    async getData() {
        const data = await super.getData()

        // Add effects array to context (don't modify the read-only property)
        data.effects = Array.from(this.item.effects)

        return data
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Effect control buttons
        html.find('.effect-control').click(this._onEffectControl.bind(this))
    }

    /**
     * Handle effect control buttons (create, edit, delete, toggle)
     * @param {Event} event - The originating click event
     * @private
     */
    async _onEffectControl(event) {
        event.preventDefault()
        const button = event.currentTarget
        const action = button.dataset.action
        const effectId = button.dataset.effectId

        switch (action) {
            case 'create':
                return this._createEffect()
            case 'edit':
                const effect = this.item.effects.get(effectId)
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
            origin: this.item.uuid,
            disabled: false,
        }

        return this.item.createEmbeddedDocuments('ActiveEffect', [effectData])
    }

    /**
     * Delete an Active Effect from this item
     * @param {string} effectId - The effect ID to delete
     * @private
     */
    async _deleteEffect(effectId) {
        const effect = this.item.effects.get(effectId)
        if (!effect) return

        const confirmed = await Dialog.confirm({
            title: 'Effekt löschen',
            content: `<p>Möchten Sie den Effekt "<strong>${effect.name}</strong>" wirklich löschen?</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false,
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
        const effect = this.item.effects.get(effectId)
        if (!effect) return

        return effect.update({ disabled: !effect.disabled })
    }
}
