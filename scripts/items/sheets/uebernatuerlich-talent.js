import { IlarisItemSheet } from './item.js'
import { collectActorSystemPaths } from '../../effects/utils/field-path-collector.js'

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

        // Populate avoidTest skill options from configured compendium packs
        context.avoidTestSkillOptions = await this._buildAvoidTestSkillOptions()

        // Populate avoidTest attribute options from fixed config
        context.avoidTestAttributeOptions = CONFIG.ILARIS.attribute || []

        // Populate damage type options from world setting
        context.damageTypeOptions = this._getDamageTypeOptions()

        return context
    }

    _getDamageTypeOptions() {
        try {
            const raw = game.settings.get('Ilaris', 'damageTypes')
            return JSON.parse(raw || '[]')
        } catch (e) {
            console.warn('Ilaris | Failed to parse damageTypes setting:', e)
            return []
        }
    }

    /**
     * Build avoidTest skill options from configured compendium packs.
     * @returns {Promise<Array<{packName: string, skills: Array<{name: string, type: string}>>}>}
     */
    async _buildAvoidTestSkillOptions() {
        const groups = []
        try {
            const packsJson = game.settings.get('Ilaris', 'fertigkeitenPacks')
            const packIds = JSON.parse(packsJson || '[]')

            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack) continue

                await pack.getIndex()
                const skills = []
                for (const entry of pack.index) {
                    if (
                        entry.type === 'fertigkeit' ||
                        entry.type === 'uebernatuerlicheFertigkeit'
                    ) {
                        skills.push({ name: entry.name, type: entry.type })
                    }
                }

                if (skills.length > 0) {
                    groups.push({
                        packName: pack.metadata?.label || packId,
                        skills,
                    })
                }
            }
        } catch (e) {
            console.warn('Ilaris | Failed to build avoidTest skill options:', e)
        }

        return groups
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

        // Add datalist for pre-effect change key autocomplete
        this.#injectPreEffectKeySuggestions()
    }

    /**
     * Injects a <datalist> with valid Actor attribute keys into the pre-effects section,
     * providing autocomplete suggestions for the key input fields of pre-effect changes.
     */
    #injectPreEffectKeySuggestions() {
        const preEffectsSection = this.element.querySelector('.pre-effects-section')
        if (!preEffectsSection) return

        // Create datalist once, reuse on re-renders
        let datalist = this.element.querySelector('#ilaris-pre-effect-keys')
        if (!datalist) {
            datalist = document.createElement('datalist')
            datalist.id = 'ilaris-pre-effect-keys'

            const keys = collectActorSystemPaths()
            keys.forEach((key) => {
                const option = document.createElement('option')
                option.value = key
                datalist.appendChild(option)
            })

            preEffectsSection.appendChild(datalist)
        }

        // Always re-attach (new inputs may have appeared after add/delete change)
        const keyInputs = preEffectsSection.querySelectorAll('input[name$=".key"]')
        keyInputs.forEach((input) => input.setAttribute('list', 'ilaris-pre-effect-keys'))
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
