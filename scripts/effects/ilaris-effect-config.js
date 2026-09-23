import { collectActorSystemPaths } from './utils/field-path-collector.js'
import {
    IlarisModifierPhase,
    IlarisModifierPhaseLabels,
    IlarisModifierSource,
    IlarisModifierSourceLabels,
    IlarisModifierStacking,
    IlarisModifierStackingLabels,
    IlarisModifierTarget,
    IlarisModifierTargetLabels,
    isMainAttributeTarget,
    targetFromMainAttributePath,
} from './utils/ilaris-modifier-constants.js'

function toArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
}

function formatIlarisDuration(phases) {
    if (!Number.isFinite(phases) || phases <= 100) return ''

    const isDay = phases >= 23040
    const divisor = isDay ? 23040 : 960
    const roundedValue = Math.round((phases / divisor) * 100) / 100
    const renderedValue = String(roundedValue).replace('.', ',')
    const unit = isDay
        ? roundedValue === 1
            ? 'Tag'
            : 'Tage'
        : roundedValue === 1
          ? 'Stunde'
          : 'Stunden'

    return `${renderedValue} ${unit}`
}

export class IlarisActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    static DEFAULT_OPTIONS = {
        ...foundry.applications.sheets.ActiveEffectConfig.DEFAULT_OPTIONS,
        form: {
            ...(foundry.applications.sheets.ActiveEffectConfig.DEFAULT_OPTIONS?.form ?? {}),
            handler: IlarisActiveEffectConfig.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: false,
        },
    }

    /**
     * Add the Ilaris Dauer part alongside core parts.
     * Core parts: header, tabs, details, duration, changes, footer
     * @override
     */
    static PARTS = {
        ...foundry.applications.sheets.ActiveEffectConfig.PARTS,
        duration: {
            template: 'systems/Ilaris/scripts/effects/templates/ilaris-duration-tab.hbs',
        },
        ilarisModifiers: {
            template: 'systems/Ilaris/scripts/effects/templates/ilaris-modifiers-tab.hbs',
        },
    }

    /**
     * Add Ilaris Dauer tab to the existing sheet tab group.
     * Core tabs: details, duration, changes
     * @override
     */
    static TABS = {
        sheet: {
            ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet,
            tabs: [
                ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet.tabs,
                { id: 'duration', icon: 'fa-solid fa-clock', label: 'Ilaris Dauer' },
                {
                    id: 'ilarisModifiers',
                    icon: 'fa-solid fa-wand-magic-sparkles',
                    label: 'Ilaris-Modifikatoren',
                },
            ],
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.ilarisTiming = this._getIlarisTimingData()
        context.ilarisDurationTypes = {
            ownerTurns: 'Eigener Zug',
            infinite: 'Unbegrenzt',
            '': 'Keine (Standard)',
        }
        context.ilarisExpiresOnOptions = {
            turnEnd: 'Rundenende',
            turnStart: 'Rundenbeginn',
        }
        this.#prepareIlarisModifierContext(context)
        context.tabs = this._prepareTabs('sheet')
        return context
    }

    /** @override */
    async _preparePartContext(partId, context) {
        if (partId === 'duration') {
            context.ilarisTiming = this._getIlarisTimingData()
            context.ilarisDurationTypes = {
                '': 'Keine (Standard)',
                ownerTurns: 'Eigener Zug',
                infinite: 'Unbegrenzt',
            }
            context.ilarisExpiresOnOptions = {
                turnEnd: 'Rundenende',
                turnStart: 'Rundenbeginn',
            }
            context.tab = context.tabs[partId]
        }
        if (partId === 'ilarisModifiers') {
            this.#prepareIlarisModifierContext(context)
            context.tab = context.tabs[partId]
        }
        return super._preparePartContext(partId, context)
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Sync remaining when originalValue changes
        const origInput = this.element.querySelector(
            'input[name="system.ilarisTiming.originalValue"]',
        )
        const remInput = this.element.querySelector('input[name="system.ilarisTiming.remaining"]')
        if (origInput && remInput) {
            origInput.addEventListener('input', () => {
                remInput.value = origInput.value
            })
        }

        // Add datalist for attribute key autocomplete on the changes tab
        this.#injectKeySuggestions()

        this.element.querySelector('.add-ilaris-modifier')?.addEventListener('click', async () => {
            const modifiers = foundry.utils.deepClone(
                toArray(this.document.system?.ilarisModifiers),
            )
            modifiers.push(this.#defaultIlarisModifier())
            await this.document.update({ 'system.ilarisModifiers': modifiers })
        })
        this.element.querySelectorAll('.delete-ilaris-modifier').forEach((button) => {
            button.addEventListener('click', async () => {
                const index = Number(button.dataset.index)
                const modifiers = foundry.utils.deepClone(
                    toArray(this.document.system?.ilarisModifiers),
                )
                modifiers.splice(index, 1)
                await this.document.update({ 'system.ilarisModifiers': modifiers })
            })
        })
    }

    /**
     * Injects a <datalist> with valid Actor attribute keys into the changes tab,
     * providing autocomplete suggestions for the key input fields.
     */
    #injectKeySuggestions() {
        const changesTab = this.element.querySelector("section[data-tab='changes']")
        if (!changesTab) return

        const datalist = document.createElement('datalist')
        datalist.id = 'ilaris-effect-keys'

        // Collect all leaf field paths from registered Actor data models
        const keys = collectActorSystemPaths()

        keys.forEach((key) => {
            const option = document.createElement('option')
            option.value = key
            datalist.appendChild(option)
        })

        changesTab.appendChild(datalist)

        // Attach datalist to all key input fields
        const keyInputs = changesTab.querySelectorAll('.key input')
        keyInputs.forEach((input) => input.setAttribute('list', datalist.id))
    }

    /**
     * Build timing data from the current effect document.
     * @returns {object}
     */
    _getIlarisTimingData() {
        const timing = this.document.system?.ilarisTiming || {}
        const remaining = timing.remaining ?? 0
        const originalValue = timing.originalValue ?? 0
        const durationType = timing.durationType || 'ownerTurns'
        return {
            durationType,
            remaining,
            originalValue,
            expiresOn: timing.expiresOn || 'turnEnd',
            humanReadableOriginal:
                durationType === 'ownerTurns' ? formatIlarisDuration(originalValue) : '',
            humanReadableRemaining:
                durationType === 'ownerTurns' ? formatIlarisDuration(remaining) : '',
        }
    }

    #prepareIlarisModifierContext(context) {
        const isVorteilSource = this.document.parent?.type === 'vorteil'
        context.ilarisModifiers = toArray(this.document.system?.ilarisModifiers).map(
            (modifier) => ({
                phase: modifier.phase || IlarisModifierPhase.Roll,
                target: modifier.target || IlarisModifierTarget.AT,
                value: modifier.value ?? '',
                stacking: isVorteilSource
                    ? IlarisModifierStacking.Add
                    : modifier.stacking || IlarisModifierStacking.Add,
                comparisonValue: modifier.comparisonValue ?? '',
                selector: {
                    fertigkeit: toArray(modifier.selector?.fertigkeit).join(', '),
                    talent: toArray(modifier.selector?.talent).join(', '),
                    situation: toArray(modifier.selector?.situation).join(', '),
                },
            }),
        )
        context.ilarisSource = isVorteilSource
            ? IlarisModifierSource.Ordinary
            : this.document.system?.ilarisSource || IlarisModifierSource.Ordinary
        context.isVorteilSource = isVorteilSource
        context.ilarisModifierPhases = IlarisModifierPhaseLabels
        context.ilarisModifierTargets = IlarisModifierTargetLabels
        context.ilarisModifierSources = IlarisModifierSourceLabels
        context.ilarisModifierStacking = IlarisModifierStackingLabels
    }

    #defaultIlarisModifier() {
        return {
            phase: IlarisModifierPhase.Roll,
            target: IlarisModifierTarget.AT,
            value: '',
            stacking: IlarisModifierStacking.Add,
            comparisonValue: '',
            selector: { fertigkeit: [], talent: [], situation: [] },
        }
    }

    static async #onSubmitForm(event, form, formData) {
        const updateData = foundry.utils.expandObject(formData.object)
        const sheet = this
        const isVorteilSource = sheet.document.parent?.type === 'vorteil'
        const modifiers = toArray(updateData.system?.ilarisModifiers).map((modifier) => ({
            ...modifier,
            selector: {
                fertigkeit: String(modifier.selector?.fertigkeit || '')
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                talent: String(modifier.selector?.talent || '')
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                situation: String(modifier.selector?.situation || '')
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
            },
            stacking: isVorteilSource
                ? IlarisModifierStacking.Add
                : modifier.stacking || IlarisModifierStacking.Add,
        }))

        if (
            modifiers.some(
                (modifier) =>
                    isMainAttributeTarget(modifier.target) &&
                    modifier.phase !== IlarisModifierPhase.Roll,
            )
        ) {
            ui.notifications.error(
                'Ilaris-Hauptattribute wirken ausschließlich auf passende Proben, nicht bei der Vorbereitung.',
            )
            return
        }

        const nativeChanges = []
        for (const change of toArray(updateData.changes)) {
            const target = targetFromMainAttributePath(change.key)
            if (!target) {
                nativeChanges.push(change)
                continue
            }
            if (Number(change.mode) !== 2) {
                ui.notifications.error(
                    'Direkte Attributsänderungen müssen additiv sein und werden als Ilaris-Modifikator angelegt.',
                )
                return
            }
            modifiers.push({
                ...sheet.#defaultIlarisModifier(),
                target,
                value: change.value || '0',
            })
        }

        updateData.changes = nativeChanges
        updateData.system = updateData.system || {}
        updateData.system.ilarisModifiers = modifiers
        updateData.system.ilarisSource = isVorteilSource
            ? IlarisModifierSource.Ordinary
            : updateData.system.ilarisSource || IlarisModifierSource.Ordinary
        await sheet.document.update(updateData)
    }
}
