import { IlarisItemSheet } from './item.js'
import { SupernaturalPreEffectSheet } from '../../effects/supernatural-pre-effect-sheet.js'
import {
    createSupernaturalPreEffect,
    deleteSupernaturalPreEffect,
    getSupernaturalPreEffects,
    toggleSupernaturalPreEffect,
} from '../../effects/supernatural-pre-effect.js'

export class UebernatuerlichTalentSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'uebernatuerlich-talent'],
        actions: {
            createPreEffect: UebernatuerlichTalentSheet.#onPreEffectControl,
            editPreEffect: UebernatuerlichTalentSheet.#onPreEffectControl,
            deletePreEffect: UebernatuerlichTalentSheet.#onPreEffectControl,
            togglePreEffect: UebernatuerlichTalentSheet.#onPreEffectControl,
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

        context.preEffects = getSupernaturalPreEffects(this.document)
        return context
    }

    static async #onPreEffectControl(event, target) {
        const action = target.dataset.action
        const preEffectId = target.dataset.preEffectId

        switch (action) {
            case 'createPreEffect': {
                const preEffect = await createSupernaturalPreEffect(this.document)
                return new SupernaturalPreEffectSheet(this.document, preEffect.id).render(true)
            }
            case 'editPreEffect':
                return new SupernaturalPreEffectSheet(this.document, preEffectId).render(true)
            case 'deletePreEffect':
                return deleteSupernaturalPreEffect(this.document, preEffectId)
            case 'togglePreEffect':
                return toggleSupernaturalPreEffect(this.document, preEffectId)
        }
    }
}
