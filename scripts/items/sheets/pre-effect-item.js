import { IlarisItemSheet } from './item.js'
import { collectActorSystemPaths } from '../../effects/utils/field-path-collector.js'
import {
    getPreEffectCapabilities,
    PRE_EFFECT_FEATURES,
} from '../capabilities/pre-effect-capabilities.js'
import { summarizePreEffect } from './summaries.js'
import {
    IlarisModifierPhase,
    IlarisModifierPhaseLabels,
    IlarisModifierStacking,
    IlarisModifierStackingLabels,
    IlarisModifierTarget,
    IlarisModifierTargetLabels,
} from '../../effects/utils/ilaris-modifier-constants.js'
import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'

/** Normalize Foundry ObjectField data before mutating an indexed form array. */
export function toPreEffectArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
}

/** Normalize one Pre-Effect's nested array fields back to arrays. */
export function normalizePreEffect(preEffect) {
    if (!preEffect || typeof preEffect !== 'object') return preEffect

    const normalizeOutcome = (outcome) => ({
        ...outcome,
        changes: toPreEffectArray(outcome.changes),
        ilarisModifiers: toPreEffectArray(outcome.ilarisModifiers),
    })

    return {
        ...preEffect,
        changes: toPreEffectArray(preEffect.changes),
        ilarisModifiers: toPreEffectArray(preEffect.ilarisModifiers),
        summonItem: preEffect.summonItem && {
            ...preEffect.summonItem,
            overrides: toPreEffectArray(preEffect.summonItem.overrides),
        },
        summonCreature: preEffect.summonCreature && {
            ...preEffect.summonCreature,
            overrides: toPreEffectArray(preEffect.summonCreature.overrides),
            dominationChecks: preEffect.summonCreature.dominationChecks && {
                ...preEffect.summonCreature.dominationChecks,
                entries: toPreEffectArray(preEffect.summonCreature.dominationChecks.entries),
            },
        },
        resistanceOutcomes:
            preEffect.resistanceOutcomes &&
            Object.fromEntries(
                Object.entries(preEffect.resistanceOutcomes).map(([outcome, value]) => [
                    outcome,
                    normalizeOutcome(value),
                ]),
            ),
    }
}

/** Normalize indexed form data back to the array shapes used by Pre-Effect authoring. */
export function normalizePreEffectFormData(updateData) {
    if (!updateData.system?.preEffects) return updateData

    return {
        ...updateData,
        system: {
            ...updateData.system,
            preEffects: toPreEffectArray(updateData.system.preEffects).map(normalizePreEffect),
        },
    }
}

/**
 * Retain nested editor data which AppV2 omits from a partial form submission.
 * Array entries are edited and removed through dedicated document updates, so an
 * empty submitted array must not erase the persisted entries during another
 * field's regular form update.
 */
function mergePartialPreEffectValue(persisted, submitted) {
    if (!submitted || typeof submitted !== 'object') return submitted

    if (Array.isArray(persisted) || Array.isArray(submitted)) {
        const persistedEntries = toPreEffectArray(persisted)
        const submittedEntries = toPreEffectArray(submitted)
        if (!submittedEntries.length) return persistedEntries
        return submittedEntries.map((entry, index) =>
            mergePartialPreEffectValue(persistedEntries[index], entry),
        )
    }

    const merged = { ...(persisted || {}), ...submitted }
    for (const [key, value] of Object.entries(submitted)) {
        const existing = persisted?.[key]
        if (value && typeof value === 'object') {
            merged[key] = mergePartialPreEffectValue(existing, value)
        }
    }
    return merged
}

/** Merge partial Pre-Effect form values into the persisted array by index. */
export function mergePreEffectFormData(persistedPreEffects, submittedPreEffects) {
    const persisted = toPreEffectArray(persistedPreEffects)
    return toPreEffectArray(submittedPreEffects).map((preEffect, index) =>
        mergePartialPreEffectValue(persisted[index], preEffect),
    )
}

/** Normalize indexed structured spell-modification form data back to arrays. */
export function normalizeSpellModificationFormData(updateData) {
    if (!updateData.system) return updateData
    const system = { ...updateData.system }

    if (system.spellModifications != null) {
        system.spellModifications = toPreEffectArray(system.spellModifications).map(
            (modification) => ({
                ...modification,
                preEffects: toPreEffectArray(modification.preEffects).map(normalizePreEffect),
            }),
        )
    }
    if (system.spellModificationGroups != null) {
        system.spellModificationGroups = toPreEffectArray(system.spellModificationGroups)
    }

    return { ...updateData, system }
}

/** Shared ItemSheetV2 lifecycle for the standard system.preEffects editor. */
export class PreEffectItemSheet extends IlarisItemSheet {
    static DEFAULT_OPTIONS = {
        ...IlarisItemSheet.DEFAULT_OPTIONS,
        form: {
            ...IlarisItemSheet.DEFAULT_OPTIONS.form,
            handler: PreEffectItemSheet.#onSubmitForm,
        },
    }

    static PARTS = {
        preEffects: {
            template: 'systems/Ilaris/scripts/items/templates/pre-effects.hbs',
        },
    }

    /** Preserve Pre-Effect array fields after AppV2 expands dotted form paths. */
    static async #onSubmitForm(event, form, formData) {
        const expanded = foundry.utils.expandObject(formData.object)
        const updateData = normalizePreEffectFormData(normalizeSpellModificationFormData(expanded))
        if (updateData.system?.preEffects) {
            updateData.system.preEffects = mergePreEffectFormData(
                this.document.system?.preEffects,
                updateData.system.preEffects,
            )
        }
        await this.document.update(updateData)
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        context.avoidTestSkillOptions = await this._buildAvoidTestSkillOptions()
        context.avoidTestTalentOptions = await this._buildAvoidTestTalentOptions()
        context.summonItemOptions = {
            waffe: await this._buildSummonItemOptions('waffe'),
            gegenstand: await this._buildSummonItemOptions('gegenstand'),
        }
        context.summonCreatureOptions = await this._buildSummonCreatureOptions()
        context.avoidTestAttributeOptions = CONFIG.ILARIS.attribute || []
        context.damageTypeOptions = this._getDamageTypeOptions()
        context.ilarisModifierPhases = IlarisModifierPhaseLabels
        context.ilarisModifierTargets = IlarisModifierTargetLabels
        context.ilarisModifierStacking = IlarisModifierStackingLabels
        context.preEffects = this._getEditorPreEffects(this.item.system?.preEffects)
        context.statusEffectOptions = Object.values(CONFIG.statusEffects || {}).map((effect) => ({
            id: effect.id,
            name: effect.name || effect.label || effect.id,
        }))

        const capabilities = getPreEffectCapabilities(this.document.type, 'base')
        context.preEffectCapabilities = capabilities
        context.availablePreEffectFeatures = PRE_EFFECT_FEATURES.filter(
            (feature) => capabilities[feature.flag],
        )
        context.canAuthorSpellModifications = false

        return context
    }

    /** Supply non-persistent defaults so legacy entries expose the new editor controls. */
    _getEditorPreEffects(preEffects) {
        return toPreEffectArray(preEffects).map((preEffect, index) =>
            this._prepareEditorPreEffect(preEffect, `system.preEffects.${index}`),
        )
    }

    /** Attach editor-only view state (pathPrefix, summary, normalized arrays) to a pre-effect. */
    _prepareEditorPreEffect(preEffect, pathPrefix, labels = this._summaryLabels()) {
        const outcomes = preEffect.resistanceOutcomes || {}
        const withDefaults = (outcome) => {
            const defaults = this._defaultResistanceOutcome()
            const configured = outcomes[outcome] || {}
            return {
                ...defaults,
                ...configured,
                marker: { ...defaults.marker, ...(configured.marker || {}) },
                condition: { ...defaults.condition, ...(configured.condition || {}) },
                tableManagedDisplacement: {
                    ...defaults.tableManagedDisplacement,
                    ...(configured.tableManagedDisplacement || {}),
                },
                changes: toPreEffectArray(configured.changes),
                ilarisModifiers: toPreEffectArray(configured.ilarisModifiers),
            }
        }
        const prepared = {
            ...preEffect,
            changes: toPreEffectArray(preEffect.changes),
            ilarisModifiers: toPreEffectArray(preEffect.ilarisModifiers),
            resistanceOutcomes: {
                failure: withDefaults('failure'),
                success: withDefaults('success'),
            },
        }
        return {
            ...prepared,
            pathPrefix,
            summary: summarizePreEffect(prepared, labels),
        }
    }

    _summaryLabels() {
        const damageTypeLabels = Object.fromEntries(
            this._getDamageTypeOptions().map((option) => [option.value, option.label]),
        )
        const statusEffects = (typeof CONFIG !== 'undefined' && CONFIG.statusEffects) || {}
        const statusLabels = Object.fromEntries(
            Object.values(statusEffects).map((effect) => [
                effect.id,
                effect.name || effect.label || effect.id,
            ]),
        )
        return { damageTypes: damageTypeLabels, statusLabels }
    }

    _getDamageTypeOptions() {
        try {
            return JSON.parse(game.settings.get('Ilaris', 'damageTypes') || '[]')
        } catch (error) {
            console.warn('Ilaris | Failed to parse damageTypes setting:', error)
            return []
        }
    }

    async _buildAvoidTestSkillOptions() {
        const groups = []
        try {
            const packIds = JSON.parse(game.settings.get('Ilaris', 'fertigkeitenPacks') || '[]')
            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack) continue
                await pack.getIndex()
                const skills = Array.from(pack.index)
                    .filter((entry) => entry.type === 'fertigkeit')
                    .map((entry) => ({ name: entry.name, type: entry.type }))
                if (skills.length) groups.push({ packName: pack.metadata?.label || packId, skills })
            }
        } catch (error) {
            console.warn('Ilaris | Failed to build avoidTest skill options:', error)
        }
        return groups
    }

    async _buildAvoidTestTalentOptions() {
        const groups = []
        try {
            const packIds = JSON.parse(game.settings.get('Ilaris', 'talentePacks') || '[]')
            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack) continue
                await pack.getIndex({ fields: ['system.fertigkeit'] })
                const talents = Array.from(pack.index)
                    .filter((entry) => entry.type === 'talent' && entry.system?.fertigkeit)
                    .map((entry) => ({
                        name: entry.name,
                        fertigkeit: entry.system.fertigkeit,
                    }))
                if (talents.length)
                    groups.push({ packName: pack.metadata?.label || packId, talents })
            }
        } catch (error) {
            console.warn('Ilaris | Failed to build avoidTest talent options:', error)
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
                if (items.length) groups.push({ packName: pack.metadata?.label || packId, items })
            }
        } catch (error) {
            console.warn('Ilaris | Failed to build summon Item options:', error)
        }
        return groups
    }

    /** Build selectable creature Actor sources from the configured creature compendia. */
    async _buildSummonCreatureOptions() {
        const groups = []
        try {
            const packIds = JSON.parse(
                game.settings.get('Ilaris', IlarisGameSettingNames.kreaturenPacks) || '[]',
            )
            for (const packId of packIds) {
                const pack = game.packs.get(packId)
                if (!pack || pack.metadata?.type !== 'Actor') continue
                await pack.getIndex({ fields: ['type'] })
                const actors = Array.from(pack.index)
                    .filter((entry) => entry._id && entry.name && entry.type === 'kreatur')
                    .map((entry) => ({
                        name: entry.name,
                        uuid: `Compendium.${pack.collection}.Actor.${entry._id}`,
                    }))
                    .sort((left, right) => left.name.localeCompare(right.name, 'de'))
                if (actors.length) groups.push({ packName: pack.metadata?.label || packId, actors })
            }
        } catch (error) {
            console.warn('Ilaris | Failed to build summon creature options:', error)
        }
        return groups
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)
        this.element.querySelector('.add-pre-effect')?.addEventListener('click', () => {
            const preEffects = toPreEffectArray(this.document.system.preEffects)
            preEffects.push(this._defaultPreEffect())
            this.document.update({ 'system.preEffects': preEffects })
        })
        this.element.querySelector('.pre-effects-list')?.addEventListener('click', (event) => {
            this._handlePreEffectEditorClick(event)
        })
        this.element
            .querySelector('.pre-effects-section')
            ?.addEventListener('click', (event) => this._handleAutomationAreaClick(event))
        this._injectPreEffectKeySuggestions()
    }

    _handleAutomationAreaClick(event) {
        const button = event.target.closest('button')
        if (!button) return
        if (button.closest('.add-automation-feature')) {
            this._addAutomationFeature(button.dataset.feature)
            return
        }
        if (button.closest('.add-zone-profile')) {
            this.document.update({ 'system.zone': this._defaultZone() })
            return
        }
        if (button.closest('.clear-zone-profile')) {
            this.document.update({ 'system.zone': null })
            return
        }
    }

    _addAutomationFeature(featureId) {
        if (!featureId) return
        const preEffects = this._clonePreEffects()
        preEffects.push(this._featurePreEffect(featureId))
        this.document.update({ 'system.preEffects': preEffects })
    }

    /** Build a fresh pre-effect pre-configured for the chosen automation feature. */
    _featurePreEffect(featureId) {
        const base = this._defaultPreEffect()
        switch (featureId) {
            case 'damage':
                return {
                    ...base,
                    changes: [
                        {
                            ...this._defaultChange(),
                            key: 'system.gesundheit.wunden',
                            damageType: 'PROFAN',
                        },
                    ],
                }
            case 'status':
                return { ...base, condition: { enabled: true, statusId: '' } }
            case 'resistance':
                return { ...base, avoidTest: { ...base.avoidTest, enabled: true } }
            case 'summonItem':
                return { ...base, summonItem: { ...this._defaultSummonItem(), enabled: true } }
            case 'summonCreature':
                return {
                    ...base,
                    summonCreature: { ...this._defaultSummonCreature(), enabled: true },
                }
            case 'armedCombat':
                return { ...base, armedCombat: { ...base.armedCombat, enabled: true } }
            default:
                return base
        }
    }

    _defaultZone() {
        return {
            shape: 'circle',
            distance: 1,
            angle: null,
            width: null,
            placement: { anchor: 'caster', range: 0 },
            lifecycle: 'instant',
            duration: { source: 'fixed', remaining: 1, attribute: '' },
            trigger: { triggerOnCreate: false, onEnter: false, onRoundStart: false },
            movementResistance: { enabled: false, attribut: '', resistDifficulty: 12 },
        }
    }

    _handlePreEffectEditorClick(event) {
        const button = event.target.closest('button') || event.target
        if (!button) return
        const preEffectCard = button.closest('.pre-effect-card')
        const preEffectIndex = this._getPreEffectCardIndex(preEffectCard)
        const outcomeContainer = button.closest('.outcome-payload')
        const outcome = outcomeContainer?.dataset.outcome || ''
        const payloadFor = (preEffect) => this._getEditablePayload(preEffect, outcome)

        if (button.closest('.add-change')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            if (!preEffects[preEffectIndex]) return
            const payload = payloadFor(preEffects[preEffectIndex])
            payload.changes = toPreEffectArray(payload.changes)
            payload.changes.push(this._defaultChange())
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.add-ilaris-modifier')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            if (!preEffects[preEffectIndex]) return
            const payload = payloadFor(preEffects[preEffectIndex])
            payload.ilarisModifiers = toPreEffectArray(payload.ilarisModifiers)
            payload.ilarisModifiers.push(this._defaultIlarisModifier())
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.add-summon-item-override')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            if (!preEffects[preEffectIndex]) return
            preEffects[preEffectIndex].summonItem ??= this._defaultSummonItem()
            preEffects[preEffectIndex].summonItem.overrides = toPreEffectArray(
                preEffects[preEffectIndex].summonItem.overrides,
            )
            preEffects[preEffectIndex].summonItem.overrides.push(this._defaultSummonItemOverride())
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.add-summon-creature-override')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            const summonCreature = preEffects[preEffectIndex]?.summonCreature
            if (!summonCreature) return
            summonCreature.overrides = toPreEffectArray(summonCreature.overrides)
            summonCreature.overrides.push(this._defaultSummonCreatureOverride())
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.add-domination-check')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            const summonCreature = preEffects[preEffectIndex]?.summonCreature
            if (!summonCreature) return
            summonCreature.dominationChecks ??= { enabled: false, entries: [] }
            summonCreature.dominationChecks.entries = toPreEffectArray(
                summonCreature.dominationChecks.entries,
            )
            summonCreature.dominationChecks.entries.push(this._defaultDominationCheck())
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.delete-pre-effect')) {
            if (preEffectIndex < 0) return
            const preEffects = this._clonePreEffects()
            preEffects.splice(preEffectIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.delete-ilaris-modifier')) {
            const modifierCard = button.closest('.ilaris-modifier-card')
            const modifierIndex = [
                ...(outcomeContainer || preEffectCard).querySelectorAll('.ilaris-modifier-card'),
            ].indexOf(modifierCard)
            if (preEffectIndex < 0 || modifierIndex < 0) return
            const preEffects = this._clonePreEffects()
            if (!preEffects[preEffectIndex]) return
            const payload = payloadFor(preEffects[preEffectIndex])
            payload.ilarisModifiers = toPreEffectArray(payload.ilarisModifiers)
            payload.ilarisModifiers.splice(modifierIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.delete-change')) {
            const changeCard = button.closest('.change-card')
            const changeIndex = [
                ...(outcomeContainer || preEffectCard).querySelectorAll('.change-card'),
            ].indexOf(changeCard)
            if (preEffectIndex < 0 || changeIndex < 0) return
            const preEffects = this._clonePreEffects()
            if (!preEffects[preEffectIndex]) return
            const payload = payloadFor(preEffects[preEffectIndex])
            payload.changes = toPreEffectArray(payload.changes)
            payload.changes.splice(changeIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        if (button.closest('.delete-domination-check')) {
            const dominationCard = button.closest('.domination-check-card')
            const dominationIndex = [
                ...preEffectCard.querySelectorAll('.domination-check-card'),
            ].indexOf(dominationCard)
            if (preEffectIndex < 0 || dominationIndex < 0) return
            const preEffects = this._clonePreEffects()
            const dominationChecks = preEffects[preEffectIndex]?.summonCreature?.dominationChecks
            if (!dominationChecks) return
            dominationChecks.entries = toPreEffectArray(dominationChecks.entries)
            dominationChecks.entries.splice(dominationIndex, 1)
            this.document.update({ 'system.preEffects': preEffects })
            return
        }

        const isItemOverride = button.closest('.delete-summon-item-override')
        const isCreatureOverride = button.closest('.delete-summon-creature-override')
        if (!isItemOverride && !isCreatureOverride) return
        const overrideCard = button.closest(
            isItemOverride ? '.summon-item-override-card' : '.summon-creature-override-card',
        )
        const overrideIndex = [
            ...preEffectCard.querySelectorAll(
                isItemOverride ? '.summon-item-override-card' : '.summon-creature-override-card',
            ),
        ].indexOf(overrideCard)
        if (preEffectIndex < 0 || overrideIndex < 0) return
        const preEffects = this._clonePreEffects()
        const summon = isItemOverride
            ? preEffects[preEffectIndex]?.summonItem
            : preEffects[preEffectIndex]?.summonCreature
        if (!summon) return
        summon.overrides = toPreEffectArray(summon.overrides)
        summon.overrides.splice(overrideIndex, 1)
        this.document.update({ 'system.preEffects': preEffects })
    }

    _getPreEffectCardIndex(preEffectCard) {
        const list = this.element.querySelector?.('.pre-effects-list')
        const scoped = list?.querySelectorAll?.('.pre-effect-card')
        const cards = [...(scoped || [])]
        if (cards.length) return cards.indexOf(preEffectCard)
        const fallback = this.element.querySelectorAll?.('.pre-effect-card')
        return [...(fallback || [])].indexOf(preEffectCard)
    }

    _clonePreEffects() {
        return toPreEffectArray(foundry.utils.deepClone(this.document.system.preEffects))
    }

    _getEditablePayload(preEffect, outcome = '') {
        if (!outcome) return preEffect
        preEffect.resistanceOutcomes ??= {}
        preEffect.resistanceOutcomes[outcome] ??= this._defaultResistanceOutcome()
        return preEffect.resistanceOutcomes[outcome]
    }

    _injectPreEffectKeySuggestions() {
        const section = this.element.querySelector('.pre-effects-section')
        if (!section) return
        let datalist = this.element.querySelector('#ilaris-pre-effect-keys')
        if (!datalist) {
            datalist = document.createElement('datalist')
            datalist.id = 'ilaris-pre-effect-keys'
            collectActorSystemPaths().forEach((key) => {
                const option = document.createElement('option')
                option.value = key
                datalist.appendChild(option)
            })
            section.appendChild(datalist)
        }
        section.querySelectorAll('input[name$=".key"]').forEach((input) => {
            input.setAttribute('list', 'ilaris-pre-effect-keys')
        })
    }

    _defaultPreEffect() {
        return {
            baseDuration: 0,
            instant: false,
            changes: [],
            ilarisModifiers: [],
            marker: { enabled: false, id: '', label: '' },
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
            summonCreature: this._defaultSummonCreature(),
            avoidTest: {
                enabled: false,
                fertigkeit: '',
                talent: '',
                attribut: '',
                diminishedOnly: false,
                resistDifficulty: 12,
                resistDifficultySource: 'fixed',
            },
            resistanceOutcomes: {
                failure: this._defaultResistanceOutcome(),
                success: this._defaultResistanceOutcome(),
            },
        }
    }

    _defaultResistanceOutcome() {
        return {
            enabled: false,
            changes: [],
            ilarisModifiers: [],
            marker: { enabled: false, id: '', label: '' },
            condition: { enabled: false, statusId: '' },
            tableManagedDisplacement: { enabled: false },
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

    _defaultSummonCreature() {
        return {
            enabled: false,
            kreaturentypen: [],
            sourceUuid: '',
            lifetime: 'permanent',
            overrides: [],
            boundResourceCost: { enabled: false, resource: 'gasp', amount: 0 },
            dominationChecks: { enabled: false, entries: [] },
        }
    }

    _defaultDominationCheck() {
        return {
            kreaturentyp: '',
            difficulty: 12,
            probeType: 'attribut',
            attribut: '',
            fertigkeit: '',
            talent: '',
        }
    }

    _defaultSummonItemOverride() {
        return {
            path: '',
            value: '',
            amplifiedByMaechtigeMagie: false,
            maechtigBonus: '',
        }
    }

    _defaultSummonCreatureOverride() {
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
