import { IlarisItemSheet } from './item.js'
import { collectActorSystemPaths } from '../../effects/utils/field-path-collector.js'
import {
    IlarisModifierPhase,
    IlarisModifierPhaseLabels,
    IlarisModifierStacking,
    IlarisModifierStackingLabels,
    IlarisModifierTarget,
    IlarisModifierTargetLabels,
} from '../../effects/utils/ilaris-modifier-constants.js'
import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'

function toArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
}

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
        context.avoidTestTalentOptions = await this._buildAvoidTestTalentOptions()
        context.summonItemOptions = {
            waffe: await this._buildSummonItemOptions('waffe'),
            gegenstand: await this._buildSummonItemOptions('gegenstand'),
        }

        // Populate avoidTest attribute options from fixed config
        context.avoidTestAttributeOptions = CONFIG.ILARIS.attribute || []

        // Populate damage type options from world setting
        context.damageTypeOptions = this._getDamageTypeOptions()
        context.ilarisModifierPhases = IlarisModifierPhaseLabels
        context.ilarisModifierTargets = IlarisModifierTargetLabels
        context.ilarisModifierStacking = IlarisModifierStackingLabels
        context.statusEffectOptions = Object.values(CONFIG.statusEffects || {}).map((effect) => ({
            id: effect.id,
            name: effect.name || effect.label || effect.id,
        }))

        // LLM generation availability (GM only, API configured)
        context.isGM = game.user.isGM
        context.hasLLMConfig =
            game.user.isGM &&
            !!game.settings.get('Ilaris', 'llmApiUrl') &&
            !!game.settings.get('Ilaris', 'llmApiKey')

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
                    if (entry.type === 'fertigkeit') {
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

    /**
     * Build avoidTest talent options from configured compendium packs.
     * @returns {Promise<Array<{packName: string, talents: Array<{name: string, fertigkeit: string}>}>>}
     */
    async _buildAvoidTestTalentOptions() {
        const groups = []
        try {
            const packsJson = game.settings.get('Ilaris', 'talentePacks')
            const packIds = JSON.parse(packsJson || '[]')

            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack) continue

                await pack.getIndex({ fields: ['system.fertigkeit'] })
                const talents = []
                for (const entry of pack.index) {
                    if (entry.type !== 'talent' || !entry.system?.fertigkeit) continue
                    talents.push({
                        name: entry.name,
                        fertigkeit: entry.system.fertigkeit,
                    })
                }

                if (talents.length > 0) {
                    groups.push({
                        packName: pack.metadata?.label || packId,
                        talents,
                    })
                }
            }
        } catch (e) {
            console.warn('Ilaris | Failed to build avoidTest talent options:', e)
        }

        return groups
    }

    /** Build source-Item options from the configured source-kind catalog. */
    async _buildSummonItemOptions(sourceKind = 'waffe') {
        const groups = []
        try {
            const settingName =
                sourceKind === 'gegenstand'
                    ? IlarisGameSettingNames.gegenstandPacks
                    : IlarisGameSettingNames.waffenPacks
            const packIds = JSON.parse(game.settings.get('Ilaris', settingName) || '[]')
            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack) continue

                await pack.getIndex({ fields: ['type'] })
                const items = Array.from(pack.index)
                    .filter(
                        (entry) =>
                            entry._id &&
                            entry.name &&
                            (sourceKind === 'gegenstand'
                                ? entry.type === 'gegenstand'
                                : entry.type === 'nahkampfwaffe' ||
                                  entry.type === 'fernkampfwaffe'),
                    )
                    .map((entry) => ({
                        name: entry.name,
                        type: entry.type || 'Item',
                        uuid: `Compendium.${pack.collection}.Item.${entry._id}`,
                    }))
                    .sort((left, right) => left.name.localeCompare(right.name, 'de'))
                if (items.length) {
                    groups.push({
                        packName: pack.metadata?.label || packId,
                        items,
                    })
                }
            }
        } catch (error) {
            console.warn('Ilaris | Failed to build summon Item options:', error)
        }
        return groups
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Add Pre-Effect button
        this.element.querySelector('.add-pre-effect')?.addEventListener('click', () => {
            const preEffects = toArray(this.document.system.preEffects)
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

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            if (!preEffects[index]) return
            preEffects[index].changes = toArray(preEffects[index].changes)
            preEffects[index].changes.push(this._defaultChange())
            this.document.update({ 'system.preEffects': preEffects })
        })

        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.add-ilaris-modifier')
            if (!btn) return

            const card = btn.closest('.pre-effect-card')
            const allCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const index = allCards.indexOf(card)
            if (index < 0) return

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            if (!preEffects[index]) return
            preEffects[index].ilarisModifiers = toArray(preEffects[index].ilarisModifiers)
            preEffects[index].ilarisModifiers.push(this._defaultIlarisModifier())
            this.document.update({ 'system.preEffects': preEffects })
        })

        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.add-summon-item-override')
            if (!btn) return

            const card = btn.closest('.pre-effect-card')
            const allCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const index = allCards.indexOf(card)
            if (index < 0) return

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            if (!preEffects[index]) return
            preEffects[index].summonItem ??= this._defaultSummonItem()
            preEffects[index].summonItem.overrides = toArray(preEffects[index].summonItem.overrides)
            preEffects[index].summonItem.overrides.push(this._defaultSummonItemOverride())
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

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            preEffects.splice(index, 1)
            this.document.update({ 'system.preEffects': preEffects })
        })

        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.delete-ilaris-modifier')
            if (!btn) return

            const modifierCard = btn.closest('.ilaris-modifier-card')
            const preEffectCard = btn.closest('.pre-effect-card')
            const allPreEffectCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const preEffectIndex = allPreEffectCards.indexOf(preEffectCard)
            const modifierCards = [...preEffectCard.querySelectorAll('.ilaris-modifier-card')]
            const modifierIndex = modifierCards.indexOf(modifierCard)
            if (preEffectIndex < 0 || modifierIndex < 0) return

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            if (!preEffects[preEffectIndex]) return
            preEffects[preEffectIndex].ilarisModifiers = toArray(
                preEffects[preEffectIndex].ilarisModifiers,
            )
            preEffects[preEffectIndex].ilarisModifiers.splice(modifierIndex, 1)
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

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            if (!preEffects[preEffectIndex]) return
            preEffects[preEffectIndex].changes = toArray(preEffects[preEffectIndex].changes)
            preEffects[preEffectIndex].changes.splice(changeIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
        })

        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            const btn = event.target.closest('.delete-summon-item-override')
            if (!btn) return

            const overrideCard = btn.closest('.summon-item-override-card')
            const preEffectCard = btn.closest('.pre-effect-card')
            const preEffectCards = [...this.element.querySelectorAll('.pre-effect-card')]
            const preEffectIndex = preEffectCards.indexOf(preEffectCard)
            const overrideCards = [...preEffectCard.querySelectorAll('.summon-item-override-card')]
            const overrideIndex = overrideCards.indexOf(overrideCard)
            if (preEffectIndex < 0 || overrideIndex < 0) return

            const preEffects = toArray(foundry.utils.deepClone(this.document.system.preEffects))
            const summonItem = preEffects[preEffectIndex]?.summonItem
            if (!summonItem) return
            summonItem.overrides = toArray(summonItem.overrides)
            summonItem.overrides.splice(overrideIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
        })

        // LLM Generate button
        this.element.querySelector('.generate-pre-effect')?.addEventListener('click', async () => {
            await this.#handleLLMGenerate()
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

    /**
     * Call the LLM API to generate pre-effects for this spell.
     */
    async #handleLLMGenerate() {
        const button = this.element.querySelector('.generate-pre-effect')
        if (!button) return

        const originalText = button.textContent
        button.textContent = '⏳ Wird generiert...'
        button.disabled = true

        try {
            const apiUrl = game.settings.get('Ilaris', 'llmApiUrl')
            const apiKey = game.settings.get('Ilaris', 'llmApiKey')
            const model = game.settings.get('Ilaris', 'llmModel')

            if (!apiUrl || !apiKey) {
                ui.notifications.warn('LLM API URL oder Key ist nicht konfiguriert.')
                return
            }

            // Collect context
            const { collectActorSystemPaths } =
                await import('../../effects/utils/field-path-collector.js')
            const { buildPreEffectPrompt } =
                await import('../../effects/utils/llm-prompt-builder.js')
            const damageTypes = this._getDamageTypeOptions()
            const systemKeys = collectActorSystemPaths()

            const spellData = this.document.system
            const requestBody = buildPreEffectPrompt(
                spellData,
                this.document.name,
                damageTypes,
                systemKeys,
                model,
            )

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: requestBody.model,
                    messages: requestBody.messages,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Fehler ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
                throw new Error('Keine Antwort vom LLM erhalten.')
            }

            // Parse the JSON response (strip markdown fences if present)
            const jsonStr = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
            const parsed = JSON.parse(jsonStr)

            if (!parsed.preEffects || !Array.isArray(parsed.preEffects)) {
                throw new Error('LLM-Antwort enthält kein preEffects-Array.')
            }

            // Apply preEffects
            await this.document.update({ 'system.preEffects': parsed.preEffects })
            ui.notifications.info('Pre-Effects erfolgreich generiert!')
        } catch (e) {
            console.error('Ilaris | LLM generate failed:', e)
            ui.notifications.error(`LLM-Generierung fehlgeschlagen: ${e.message}`)
        } finally {
            button.textContent = originalText
            button.disabled = false
        }
    }

    _defaultPreEffect() {
        return {
            baseDuration: 0,
            instant: false,
            changes: [],
            ilarisModifiers: [],
            condition: { enabled: false, statusId: '' },
            armedCombat: {
                enabled: false,
                trigger: 'nextSuccessfulAttack',
                scope: 'any',
                attackBonus: 0,
                damage: { input: '', perInput: 'W6' },
                inputs: [],
                charges: { base: 1, amplifiedByMaechtigeMagie: false, maechtigBonus: 0 },
            },
            summonItem: this._defaultSummonItem(),
            avoidTest: {
                enabled: false,
                fertigkeit: '',
                talent: '',
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

    _defaultSummonItem() {
        return { enabled: false, sourceKind: 'waffe', sourceUuid: '', overrides: [] }
    }

    _defaultSummonItemOverride() {
        return {
            path: '',
            value: '',
            amplifiedByMaechtigeMagie: false,
            maechtigBonus: '',
        }
    }

    _defaultIlarisModifier() {
        return {
            phase: IlarisModifierPhase.Roll,
            target: IlarisModifierTarget.AT,
            value: '',
            stacking: IlarisModifierStacking.StrongestSupernatural,
            comparisonValue: '',
            selector: { fertigkeit: [], talent: [], situation: [] },
            amplifiedByMaechtigeMagie: false,
            maechtigBonus: '',
            diminishedValue: '',
            diminishedMaechtigBonus: '',
            diminishedComparisonValue: '',
        }
    }
}
