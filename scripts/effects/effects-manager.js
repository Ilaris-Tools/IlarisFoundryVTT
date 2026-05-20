import { getNewEmbeddedEffectData } from './supernatural-pre-effect.js'

/**
 * Mixin for item sheets that provides Active Effects management functionality
 */
export const EffectsManager = {
    /**
     * Activate listeners for effect controls
     * @param {jQuery} html - The rendered HTML
     */
    activateEffectListeners(html) {
        html.find('.effect-control').click(this._onEffectControl.bind(this))
    },

    /**
     * Handle effect control actions
     * @param {Event} event - The click event
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
                return this._editEffect(effectId)
            case 'delete':
                return this._deleteEffect(effectId)
            case 'toggle':
                return this._toggleEffect(effectId)
        }
    },

    /**
     * Create a new effect on this item
     * @private
     */
    async _createEffect() {
        const effectData = getNewEmbeddedEffectData(this.item)

        await this.item.createEmbeddedDocuments('ActiveEffect', [effectData])
    },

    /**
     * Edit an existing effect
     * @param {string} effectId - The effect ID
     * @private
     */
    async _editEffect(effectId) {
        const effect = this.item.effects.get(effectId)
        if (effect) {
            effect.sheet.render(true)
        }
    },

    /**
     * Delete an effect
     * @param {string} effectId - The effect ID
     * @private
     */
    async _deleteEffect(effectId) {
        const confirmed = await Dialog.confirm({
            title: 'Effekt löschen',
            content: '<p>Sind Sie sicher, dass Sie diesen Effekt löschen möchten?</p>',
            yes: () => true,
            no: () => false,
            defaultYes: false,
        })

        if (confirmed) {
            await this.item.deleteEmbeddedDocuments('ActiveEffect', [effectId])
        }
    },

    /**
     * Toggle an effect's disabled state
     * @param {string} effectId - The effect ID
     * @private
     */
    async _toggleEffect(effectId) {
        const effect = this.item.effects.get(effectId)
        if (effect) {
            await effect.update({ disabled: !effect.disabled })
        }
    },

    /**
     * Prepare effects data for template rendering
     * @param {Object} data - The template data object
     * @returns {Object} - The data object with effects added
     */
    prepareEffectsData(data) {
        data.effects = Array.from(this.item.effects)
        return data
    },
}
