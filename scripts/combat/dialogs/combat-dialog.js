import {
    IlarisAutomatisierungSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'
import { postRollToChat } from '../../dice/wuerfel_misc.js'
import {
    callIlarisHookAllWithGlobalMirror,
    callIlarisHookWithGlobalMirror,
} from '../hooks/global_combat_hooks.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Base class for all combat dialogs in Ilaris.
 *
 * @extends HandlebarsApplicationMixin(ApplicationV2)
 */
export class CombatDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['ilaris', 'combat-dialog'],
        position: {
            width: 900,
            height: 'auto',
        },
        window: {
            resizable: true,
            title: 'Kampf Dialog',
        },
        actions: {
            angreifen: CombatDialog.#onAngreifen,
            showNearby: CombatDialog.#onShowNearby,
            toggleManeuvers: CombatDialog.#onToggleManeuvers,
        },
    }

    /** @override - Subclasses must define their own PARTS with the correct template */
    static PARTS = {}

    /**
     * @param {Actor} actor - The actor performing the combat action
     * @param {Item} item - The weapon or ability being used
     * @param {object} [options={}] - ApplicationV2 configuration options
     */
    constructor(actor, item, options = {}) {
        super(options)

        // Common initialization for all combat dialogs
        this.text_at = ''
        this.text_dm = ''
        this.item = item
        this.actor = actor
        this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        this.summary = this.getDefaultSummaryContext()

        // Initialize selected actors from Foundry targets after actor/item are set
        this._initializeSelectedActorsFromTargets()

        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.rollmode = game.settings.get('core', 'messageMode')
        this.fumble_val = 1
    }

    /**
     * Initialize selectedActors from Foundry's game.user.targets
     * This should be called after actor and item are set
     */
    _initializeSelectedActorsFromTargets() {
        // Check if target selection feature is enabled
        const useTargetSelection = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisAutomatisierungSettingNames.useTargetSelection,
        )

        if (!useTargetSelection) {
            return
        }

        if (!this.selectedActors && game.user.targets && game.user.targets.size > 0) {
            const candidates = Array.from(game.user.targets)
            if (
                callIlarisHookWithGlobalMirror('Ilaris.preTargetSelection', this, candidates) ===
                false
            )
                return

            this.selectedActors = []

            for (const token of game.user.targets) {
                // Calculate distance from the acting token to the target token using Foundry's measurePath API
                let distance = 'Unbekannt'

                // Try to get distance from token document
                const actorTokens = this.actor?.getActiveTokens()
                if (actorTokens && actorTokens.length > 0 && token) {
                    const actorToken = actorTokens[0]
                    try {
                        const waypoints = [
                            { x: actorToken.center.x, y: actorToken.center.y },
                            { x: token.center.x, y: token.center.y },
                        ]
                        distance = Math.round(
                            canvas.grid.measurePath(waypoints, { gridSpaces: true }).distance,
                        )
                    } catch (error) {
                        console.warn('Could not calculate distance to target:', error)
                        distance = 'Unbekannt'
                    }
                } else if (this.actor?.token && this.actor.token.center && token && token.center) {
                    // Fallback to actor.token if available
                    try {
                        const waypoints = [
                            { x: this.actor.token.center.x, y: this.actor.token.center.y },
                            { x: token.center.x, y: token.center.y },
                        ]
                        distance = Math.round(
                            canvas.grid.measurePath(waypoints, { gridSpaces: true }).distance,
                        )
                    } catch (error) {
                        console.warn('Could not calculate distance to target:', error)
                        distance = 'Unbekannt'
                    }
                }

                this.selectedActors.push({
                    tokenId: token.id,
                    actorId: token.actor?.id,
                    actorLink: token.document?.actorLink ?? true,
                    name: token.actor?.name || token.name,
                    distance: distance,
                })
            }

            callIlarisHookAllWithGlobalMirror(
                'Ilaris.targetSelectionComplete',
                this,
                this.selectedActors,
            )
        }
    }

    /**
     * Prepare context data for template rendering.
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Context data for the template
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Prevent race condition: if maneuvers are being set, wait for that to complete
        if (this._manoeversPromise) {
            await this._manoeversPromise
        } else if (!this._manoeversSet) {
            // Store the promise so concurrent calls can await it
            this._manoeversPromise = this.item.setManoevers()
            await this._manoeversPromise
            this._manoeversSet = true
            this._manoeversPromise = null
        }

        // damit wird das template gefüttert
        const maneuvers = this.item.manoever || []
        return {
            ...context,
            config: CONFIG.ILARIS,
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.ChatMessage.modes,
            rollmode: this.rollmode,
            trefferzonen: CONFIG.ILARIS.trefferzonen,
            item: this.item,
            actor: this.actor,
            mod_at: this.mod_at,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            dialogId: this.dialogId,
            maneuvers,
            selectedActors: this.selectedActors || [],
            useTargetSelection: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisAutomatisierungSettingNames.useTargetSelection,
            ),
            summary: this.summary,
        }
    }

    async _preparePartContext(partId, context, options) {
        let partContext = context
        if (typeof super._preparePartContext === 'function') {
            partContext = await super._preparePartContext(partId, context, options)
        }

        if (partId === 'summaries') {
            partContext.summary = this.summary || this.getDefaultSummaryContext()
        }

        return partContext
    }

    /**
     * Actions performed after any render of the Application.
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        this.element
            .querySelectorAll('.maneuver-item input, .maneuver-item select')
            .forEach((input) => {
                input.addEventListener('change', (ev) => {
                    const item = ev.currentTarget.closest('.maneuver-item')
                    const hasValue = Array.from(item.querySelectorAll('input, select')).some(
                        (entry) => {
                            if (entry.type === 'checkbox') return entry.checked
                            return entry.value && entry.value !== '0'
                        },
                    )
                    item.classList.toggle('has-value', hasValue)
                    this.handleZeroDamageConflicts()
                })
            })

        // Initial conflict check on dialog load
        // The 500ms timeout provides a safety buffer to ensure that:
        // - All maneuver checkboxes have been created and are queryable
        // - The dialog's HTML structure is completely built
        // - Any initial values or states have been properly set
        setTimeout(() => {
            this.handleZeroDamageConflicts()
        }, 500)

        // Colorize numbers in maneuver labels
        this.colorizeManeuverNumbers()

        callIlarisHookAllWithGlobalMirror('Ilaris.combatDialogRendered', this)
    }

    /* -------------------------------------------- */
    /*  Action Handlers (ApplicationV2 actions)     */
    /* -------------------------------------------- */

    /**
     * Handle the "angreifen" action button click.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - The element with data-action="angreifen"
     */
    static async #onAngreifen(event, target) {
        await this._angreifenKlick()
    }

    /**
     * Handle the "showNearby" action button click.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - The element with data-action="showNearby"
     */
    static async #onShowNearby(event, target) {
        await this._showNearbyActors()
    }

    /**
     * Handle the maneuver accordion toggle action.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - The element with data-action="toggleManeuvers"
     */
    static async #onToggleManeuvers(event, target) {
        this.toggleManeuvers(target)
    }

    toggleManeuvers(target) {
        const header = target.closest('.maneuver-header') || target
        const grid = header?.nextElementSibling
        if (!header || !grid) {
            return
        }

        const isCollapsed = header.classList.contains('collapsed')
        const toggleText = header.querySelector('.toggle-display h4')

        header.classList.toggle('collapsed')
        grid.classList.toggle('collapsed')

        if (toggleText) {
            toggleText.textContent = isCollapsed ? 'Einklappen' : 'Ausklappen'
        }
    }

    /* -------------------------------------------- */
    /*  Modifier Display                            */
    /* -------------------------------------------- */

    /**
     * Generic summary update for combat dialogs.
     * Combat dialogs render summaries through the dedicated AppV2 summaries part.
     */
    async updateModifierDisplay() {
        try {
            // Temporarily parse values to calculate modifiers
            await this.manoeverAuswaehlen()
            await this.updateManoeverMods()
            await this.updateStatusMods()

            // Get base values (subclass specific)
            const baseValues = this.getBaseValues()
            const statusMods = this.actor.system.abgeleitete.globalermod || 0
            const nahkampfMods = this.actor.system.modifikatoren.nahkampfmod || 0

            // Get dice formula
            const diceFormula = this.getDiceFormula()

            if (
                typeof this.getSummaryContext !== 'function' ||
                !this.constructor.PARTS?.summaries
            ) {
                throw new Error(
                    'Combat dialogs must implement getSummaryContext() and define PARTS.summaries',
                )
            }

            this.summary = this.getSummaryContext(baseValues, statusMods, nahkampfMods, diceFormula)
            await this.render({ parts: ['summaries'] })
        } catch (error) {
            console.error('MODIFIER DISPLAY: Fehler beim Update:', error)
            this.summary = this.getErrorSummaryContext()
            await this.render({ parts: ['summaries'] })
        }
    }

    /**
     * Subclasses should override this to return their specific base values
     */
    getBaseValues() {
        throw new Error('getBaseValues() must be implemented by subclass')
    }

    getDefaultSummaryContext() {
        return {
            title: 'Würfelaktionen:',
            sections: [],
            isEmpty: true,
            isError: false,
            message: 'Wird berechnet...',
        }
    }

    getErrorSummaryContext() {
        return {
            title: 'Würfelaktionen:',
            sections: [],
            isEmpty: false,
            isError: true,
            message: 'Fehler beim Berechnen...',
        }
    }

    _buildSignedModifierData(mod, label, extraClass = '') {
        if (mod === 0) {
            return null
        }

        const color = mod > 0 ? 'positive' : 'negative'
        const sign = mod > 0 ? '+' : ''
        const className = extraClass ? ` ${extraClass}` : ''

        return {
            label,
            value: `${sign}${mod}`,
            cssClass: `modifier-item ${color}${className}`,
        }
    }

    _buildModifierSectionData(textField, options = {}) {
        if (!textField || !textField.trim()) {
            return null
        }

        const {
            sectionTitle = '',
            filterLine = () => true,
            transformLine = (line) => line,
            getLineClass = (line) => {
                if (line.includes('+')) return 'positive'
                if (line.includes('-')) return 'negative'
                return 'neutral'
            },
        } = options

        const items = textField
            .trim()
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && filterLine(line))
            .map((line) => {
                const displayLine = transformLine(line)?.trim()
                if (!displayLine) {
                    return null
                }

                const color = getLineClass(line, displayLine)
                return {
                    text: displayLine,
                    cssClass: `modifier-item maneuver ${color}`,
                }
            })
            .filter((item) => item)

        if (!items.length) {
            return null
        }

        return {
            title: sectionTitle,
            items,
        }
    }

    _buildTotalModifierData(totalMod) {
        if (totalMod === 0) {
            return null
        }

        const color = totalMod > 0 ? 'positive' : 'negative'
        const sign = totalMod > 0 ? '+' : ''
        return {
            text: `Addierte Modifikatoren: ${sign}${totalMod}`,
            cssClass: `modifier-item total ${color}`,
        }
    }

    colorizeManeuverNumbers() {
        // Apply to both maneuver labels and other labels in the dialog
        this.element.querySelectorAll('.maneuver-item label, .flexrow label').forEach((label) => {
            let text = label.textContent

            // Find all parentheses content
            text = text.replace(/(\([^)]+\))/g, (parenthesesContent) => {
                // Count positive and negative numbers/variables in this parentheses
                const positiveMatches = (parenthesesContent.match(/\+\s*(\d+|[A-Z]+)/g) || [])
                    .length
                const negativeMatches = (parenthesesContent.match(/\-\s*(\d+|[A-Z]+)/g) || [])
                    .length

                // Determine dominant color
                let dominantClass = ''
                if (negativeMatches > positiveMatches) {
                    dominantClass = 'maneuver-negative'
                } else if (positiveMatches > negativeMatches) {
                    dominantClass = 'maneuver-positive'
                }

                // Make the entire parentheses bold and colored
                if (dominantClass) {
                    return `<strong class="${dominantClass}">${parenthesesContent}</strong>`
                } else {
                    return `<strong>${parenthesesContent}</strong>`
                }
            })

            // Handle numbers/variables outside of parentheses
            text = text.replace(/([\+\-]\s*(\d+|[A-Z]+))(?![^<]*<\/strong>)/g, (match) => {
                const isPositive = match.includes('+')
                const cssClass = isPositive ? 'maneuver-positive' : 'maneuver-negative'
                return `<span class="${cssClass}">${match}</span>`
            })

            if (text !== label.textContent) {
                label.innerHTML = text
            }
        })
    }

    /**
     * Parse maneuver selections from the dialog form.
     * Note: Uses getElementById instead of querySelector to support IDs starting with digits.
     */
    async manoeverAuswaehlen() {
        this.rollmode =
            this.element.querySelector(`#rollMode-${this.dialogId}`)?.value ||
            game.settings.get('core', 'messageMode')

        this.item.manoever.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = document.getElementById(elementId)
            if (manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = element?.checked || false
            } else {
                manoever.inputValue.value = element?.value || false
            }
        })
    }

    updateStatusMods() {
        this.at_abzuege_mod = 0

        if (
            this.actor.system.gesundheit.wundenignorieren &&
            this.actor.system.gesundheit.wunden > 2
        ) {
            const wundabzuege = (this.actor.system.gesundheit.wunden - 2) * 2
            this.text_at = this.text_at.concat(
                `Bonus durch Kalte Wut oder ähnliches: +${wundabzuege} (im Globalenmod verrechnet)\n`,
            )
        }
        this.at_abzuege_mod = this.actor.system.abgeleitete.globalermod
    }

    async _showNearbyActors() {
        const { TargetSelectionDialog } = await import('./target-selection.js')
        if (callIlarisHookWithGlobalMirror('Ilaris.preTargetSelection', this, null) === false)
            return
        const dialog = new TargetSelectionDialog(this.actor, (selectedActors) => {
            this.selectedActors = selectedActors
            callIlarisHookAllWithGlobalMirror(
                'Ilaris.targetSelectionComplete',
                this,
                this.selectedActors,
            )
            this.updateSelectedActorsDisplay()
        })
        dialog.render(true)
    }

    updateSelectedActorsDisplay() {
        // Re-render the dialog to update the template
        this.render(true)
    }

    _updateSchipsStern() {
        const schipsOption =
            Number(
                this.element.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value,
            ) || 0
        if (schipsOption !== 0 && this.actor.system.schips.schips_stern > 0) {
            this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        }
    }

    /**
     * Get dice formula based on schips selection.
     */
    getDiceFormula(xd20_choice = 1) {
        let schipsOption =
            Number(
                this.element.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value,
            ) || 0
        let diceFormula = `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        if (schipsOption == 0) {
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = `${this.text_at || ''}Keine Schips\n`
            this.text_vt = `${this.text_vt || ''}Keine Schips\n`
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }

        if (schipsOption == 1) {
            this.text_at = `${this.text_at || ''}Schips ohne Eigenheit\n`
            this.text_vt = `${this.text_vt || ''}Schips ohne Eigenheit\n`
            diceFormula = `${xd20_choice + 1}d20${xd20_choice == 1 ? '' : 'dh1'}${
                xd20_choice == 1 ? 'dl1' : 'dl2'
            }`
        }

        if (schipsOption == 2) {
            this.text_at = `${this.text_at || ''}Schips mit Eigenschaft\n`
            this.text_vt = `${this.text_vt || ''}Schips mit Eigenschaft\n`
            diceFormula = `${xd20_choice + 2}d20${xd20_choice == 1 ? '' : 'dh1'}${
                xd20_choice == 1 ? 'dl2' : 'dl3'
            }`
        }
        return diceFormula
    }

    /**
     * Checks if a maneuver has ZERO_DAMAGE modification
     */
    hasZeroDamageModification(manoever) {
        if (!manoever.system?.modifications) return false
        return Object.values(manoever.system.modifications).some(
            (mod) => mod.type === 'ZERO_DAMAGE',
        )
    }

    /**
     * Handles ZERO_DAMAGE maneuver conflicts.
     */
    handleZeroDamageConflicts() {
        // Find all ZERO_DAMAGE maneuvers
        const zeroDamageManeuvers = this.item.manoever.filter((manoever) =>
            this.hasZeroDamageModification(manoever),
        )

        if (zeroDamageManeuvers.length <= 1) return // No conflicts possible

        // Find the currently selected ZERO_DAMAGE maneuver (if any)
        const selectedZeroDamage = zeroDamageManeuvers.find((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = document.getElementById(elementId)
            if (manoever.inputValue.field === 'CHECKBOX') {
                return element?.checked
            } else if (manoever.inputValue.field === 'NUMBER') {
                return element?.value && element.value !== '0'
            } else if (manoever.inputValue.field === 'SELECTOR') {
                return element?.value && element.value !== '0' && element.value !== ''
            }
            return false
        })

        // Update the state of all ZERO_DAMAGE maneuvers
        zeroDamageManeuvers.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = document.getElementById(elementId)

            if (!element) return

            if (selectedZeroDamage && selectedZeroDamage.id !== manoever.id) {
                // Disable other ZERO_DAMAGE maneuvers and reset them
                element.disabled = true
                if (manoever.inputValue.field === 'CHECKBOX') {
                    element.checked = false
                    manoever.inputValue.value = false
                } else if (manoever.inputValue.field === 'NUMBER') {
                    element.value = '0'
                    manoever.inputValue.value = '0'
                } else if (manoever.inputValue.field === 'SELECTOR') {
                    element.value = '0'
                    manoever.inputValue.value = '0'
                }

                // Add visual indication
                const maneuverItem = element.closest('.maneuver-item')
                if (maneuverItem) {
                    maneuverItem.classList.add('disabled-conflict')
                    element.title =
                        'Kann nicht mit anderen Manövern kombiniert werden, die den Schaden auf 0 setzen'
                }
            } else {
                // Enable this maneuver
                element.disabled = false
                element.title = ''

                // Remove visual indication
                const maneuverItem = element.closest('.maneuver-item')
                if (maneuverItem) {
                    maneuverItem.classList.remove('disabled-conflict')
                }
            }
        })
    }

    /**
     * Posts the attack roll to chat, hiding it when melee targets are selected
     * (the result is revealed once all defense rolls are resolved).
     *
     * Defense prompt dispatch is handled separately by the `Ilaris.postAngriff`
     * hook handler in `scripts/combat/hooks/combat_dialog_handlers.js`.
     *
     * @param {object} rollResult - The evaluated attack roll result.
     * @param {'melee'|'ranged'} attackType - The type of attack.
     */
    async handleTargetSelection(rollResult, attackType) {
        // Check if target selection feature is enabled
        const useTargetSelection = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisAutomatisierungSettingNames.useTargetSelection,
        )

        if (!useTargetSelection) {
            // If target selection is disabled, just send the chat message without defense prompts
            await postRollToChat(rollResult, this.speaker, this.rollmode)
            return
        }

        // Determine if we should hide the roll result
        const hideRoll =
            attackType !== 'ranged' && this.selectedActors && this.selectedActors.length > 0

        const templateData = hideRoll
            ? {
                  ...rollResult.templateData,
                  success: false,
                  fumble: false,
                  crit: false,
                  is16OrHigher: false,
                  noSuccess: false,
                  text:
                      rollResult.templateData.text +
                      '\nErgebnis verborgen bis alle Verteidigungen abgeschlossen sind.',
              }
            : rollResult.templateData

        if (hideRoll) {
            const html_roll = await foundry.applications.handlebars.renderTemplate(
                rollResult.templatePath,
                templateData,
            )
            await rollResult.roll.toMessage({
                speaker: this.speaker,
                flavor: html_roll,
                blind: true,
                whisper: [game.user.id],
            })
        } else {
            await postRollToChat(rollResult, this.speaker, this.rollmode)
        }

        // Store the roll result for later use with defense rolls
        if (hideRoll) {
            this.lastAttackRoll = {
                roll: rollResult.roll,
                success: rollResult.success,
                is16OrHigher: rollResult.is16OrHigher,
                templateData: rollResult.templateData,
            }
        }
    }

    /**
     * Applies common damage roll logic including zero damage handling,
     * trefferzone rolling, and modifikator application.
     *
     * @param {Object} params - Configuration object
     * @returns {Object} Updated values
     */
    async applyCommonDamageLogic({
        nodmg,
        mod_dm,
        schaden,
        text_dm,
        trefferzone,
        mod_at,
        mod_vt,
        text_at,
        text_vt,
        damageType,
        trueDamage,
    }) {
        const manoever = this.item.system.manoever

        // Handle ZERO_DAMAGE
        if (nodmg.value) {
            mod_dm = 0
            schaden = '0'
            if (!text_dm.includes('Kein Schaden')) {
                text_dm = text_dm.concat(`${nodmg.name}: Kein Schaden\n`)
            }
        }

        // Roll trefferzone if needed
        if (trefferzone == 0 && this.isGezieltSchlagActive()) {
            let zonenroll = new Roll('1d6')
            await zonenroll.evaluate()
            text_dm = text_dm.concat(
                `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
            )
        }

        // Apply Modifikator
        let modifikator = Number(manoever.mod.selected)
        if (modifikator != 0) {
            mod_at += modifikator
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`)

            if (mod_vt !== undefined) {
                mod_vt += modifikator
                text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`)
            }
        }

        return {
            mod_dm,
            schaden,
            text_dm,
            trefferzone,
            mod_at,
            mod_vt,
            text_at,
            text_vt,
            damageType,
            trueDamage,
        }
    }

    /**
     * Adds weapon properties text to attack description.
     */
    eigenschaftenText() {
        if (!this.item.system.eigenschaften || this.item.system.eigenschaften.length === 0) {
            return
        }
        this.text_at += '\nEigenschaften: '
        // Handle array format
        if (Array.isArray(this.item.system.eigenschaften)) {
            this.text_at += this.item.system.eigenschaften
                .map((e) => {
                    if (!e || !e.key) return ''
                    if (e.parameters && Array.isArray(e.parameters) && e.parameters.length > 0) {
                        return `${e.key}(${e.parameters.join(';')})`
                    }
                    return e.key
                })
                .filter((s) => s)
                .join(', ')
        }

        // Handle object format
        if (typeof this.item.system.eigenschaften === 'object') {
            const trueProperties = Object.keys(this.item.system.eigenschaften).filter(
                (key) => this.item.system.eigenschaften[key] === true,
            )
            this.text_at += trueProperties.join(', ')
        }
    }

    /**
     * Checks if the "Gezielter Schlag" (Aimed Strike) maneuver is active.
     * @returns {boolean} True if Gezielter Schlag is selected
     */
    isGezieltSchlagActive() {
        return (
            this.item.system.manoever.km_gzsl && this.item.system.manoever.km_gzsl.selected !== '0'
        )
    }

    /**
     * Sets up the modifier display element and listeners for real-time updates.
     */
    setupModifierDisplay() {
        if (!this.element) {
            return
        }

        if (this._modifierDisplayBoundElement !== this.element) {
            this._modifierDisplayListenersBound = false
            this._modifierDisplayBoundElement = this.element
        }

        if (this._modifierDisplayListenersBound) {
            return
        }

        this._modifierDisplayListenersBound = true

        const triggerSummaryUpdate = () => {
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout)
            }

            this._updateTimeout = setTimeout(() => {
                this.updateModifierDisplay()
            }, 150)
        }

        this.element.querySelectorAll('input, select').forEach((input) => {
            input.addEventListener('change', triggerSummaryUpdate)
            input.addEventListener('input', triggerSummaryUpdate)
        })

        void this.updateModifierDisplay()
    }
}
