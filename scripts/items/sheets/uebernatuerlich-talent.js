import { IlarisItemSheet } from './item.js'

export class UebernatuerlichTalentSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'uebernatuerlich-talent'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/uebernatuerlich_talent.hbs',
        },
        preEffects: {
            template: 'systems/Ilaris/scripts/items/templates/pre-effects.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        if (context.hasOwner) {
            context.fertigkeit_list = this.document.actor.misc.uebernatuerlich_fertigkeit_list
        }

        return context
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Add Pre-Effect button
        this.element.querySelector('.add-pre-effect')?.addEventListener('click', () => {
            const preEffects = this.document.system.preEffects || []
            preEffects.push(this._defaultPreEffect())
            this.document.update({ 'system.preEffects': preEffects })
        })

        // Add Change button (delegated)
        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.add-change')
            if (!btn) return

            const card = btn.closest('.pre-effect-card')
            const allCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const index = allCards.indexOf(card)
            if (index < 0) return

            const preEffects = foundry.utils.deepClone(this.document.system.preEffects || [])
            if (!preEffects[index]) return
            preEffects[index].changes = preEffects[index].changes || []
            preEffects[index].changes.push(this._defaultChange())
            this.document.update({ 'system.preEffects': preEffects })
        })

        // Delete Pre-Effect button (delegated)
        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.delete-pre-effect')
            if (!btn) return

            const card = btn.closest('.pre-effect-card')
            const allCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const index = allCards.indexOf(card)
            if (index < 0) return

            const preEffects = foundry.utils.deepClone(this.document.system.preEffects || [])
            preEffects.splice(index, 1)
            this.document.update({ 'system.preEffects': preEffects })
        })

        // Delete Change button (delegated)
        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.delete-change')
            if (!btn) return

            const changeCard = btn.closest('.change-card')
            const preEffectCard = btn.closest('.pre-effect-card')
            const allPreEffectCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const preEffectIndex = allPreEffectCards.indexOf(preEffectCard)
            const allChangeCards = [...preEffectCard.querySelectorAll('.change-card')]
            const changeIndex = allChangeCards.indexOf(changeCard)
            if (preEffectIndex < 0 || changeIndex < 0) return

            const preEffects = foundry.utils.deepClone(this.document.system.preEffects || [])
            if (!preEffects[preEffectIndex]?.changes) return
            preEffects[preEffectIndex].changes.splice(changeIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
        })
    }

    _defaultPreEffect() {
        return {
            baseDuration: 0,
            instant: false,
            changes: [],
            avoidTest: {
                enabled: false,
                fertigkeit: '',
                attribut: '',
                diminishedOnly: false,
                resistDifficulty: 12,
            },
        }
    }

    _defaultChange() {
        return {
            key: '',
            type: 'add',
            value: '',
            amplifiedByMaechtigeMagie: false,
            maechtigBonus: '',
            damageType: 'PROFAN',
            diminishedValue: '',
            diminishedMaechtigBonus: '',
            priority: null,
        }
    }
}
