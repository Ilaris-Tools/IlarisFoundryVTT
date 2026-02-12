import {
    IlarisAutomatisierungSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Base class for all combat dialogs in Ilaris.
 * Migrated from legacy Dialog to ApplicationV2 + HandlebarsApplicationMixin.
 *
 * @extends HandlebarsApplicationMixin(ApplicationV2)
 */
export class CombatDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
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

        // Initialize selected actors from Foundry targets after actor/item are set
        this._initializeSelectedActorsFromTargets()

        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.rollmode = game.settings.get('core', 'rollMode')
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
                    actorId: token.actor?.id,
                    name: token.actor?.name || token.name,
                    distance: distance,
                })
            }

            console.log(
                `Auto-populated ${this.selectedActors.length} targets from Foundry selection`,
            )
        }
    }

    /**
     * Prepare context data for template rendering.
     * Replaces the legacy getData() method.
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

        // Set rollmode after manoevers are loaded (for weapons where it wasn't set in constructor)
        if (this.item.system.manoever?.rllm && !this.item.system.manoever.rllm.selected) {
            this.item.system.manoever.rllm.selected = this.rollmode
        }

        // damit wird das template gefüttert
        return {
            ...context,
            config: CONFIG.ILARIS,
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            trefferzonen: CONFIG.ILARIS.trefferzonen,
            item: this.item,
            actor: this.actor,
            mod_at: this.mod_at,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            dialogId: (this.dialogId = `dialog-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}`),
            selectedActors: this.selectedActors || [],
            useTargetSelection: game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisAutomatisierungSettingNames.useTargetSelection,
            ),
        }
    }

    /**
     * Actions performed after any render of the Application.
     * Replaces the legacy activateListeners() method.
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        // Add expand/collapse functionality for maneuver headers
        this.element.querySelectorAll('.maneuver-header').forEach((header) => {
            header.addEventListener('click', (ev) => {
                const grid = header.nextElementSibling
                const isCollapsed = header.classList.contains('collapsed')
                const text = header.querySelector('h4')

                header.classList.toggle('collapsed')
                grid.classList.toggle('collapsed')

                // Update text based on state
                text.textContent = isCollapsed ? 'Einklappen' : 'Ausklappen'
            })
        })

        // Update has-value class when inputs change
        this.element
            .querySelectorAll('.maneuver-item input, .maneuver-item select')
            .forEach((input) => {
                input.addEventListener('change', (ev) => {
                    const item = ev.currentTarget.closest('.maneuver-item')
                    const hasValue = Array.from(item.querySelectorAll('input, select')).some(
                        (inp) => {
                            if (inp.type === 'checkbox') return inp.checked
                            return inp.value && inp.value !== '0'
                        },
                    )
                    item.classList.toggle('has-value', hasValue)
                })
            })

        // Add specific listener for maneuver to handle ZERO_DAMAGE conflicts
        this.element
            .querySelectorAll('.maneuver-item input, .maneuver-item select')
            .forEach((input) => {
                input.addEventListener('change', () => {
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

    /* -------------------------------------------- */
    /*  Modifier Display                            */
    /* -------------------------------------------- */

    /**
     * Generic updateModifierDisplay method that works for all combat dialogs.
     * Subclasses should implement getBaseValues() and getAllModifierSummaries().
     * Uses native DOM API instead of jQuery.
     */
    async updateModifierDisplay() {
        try {
            const modifierEl = this.element.querySelector('#modifier-summary')
            if (!modifierEl) {
                console.warn('MODIFIER DISPLAY: Element-Referenz nicht verfügbar')
                return
            }

            // Show loading state
            modifierEl.innerHTML =
                '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Wird berechnet...</div></div>'

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

            // Create all summaries (subclass specific)
            const summaries = this.getAllModifierSummaries(
                baseValues,
                statusMods,
                nahkampfMods,
                diceFormula,
            )

            // Update the display element
            modifierEl.innerHTML = summaries

            // Re-attach click listeners after innerHTML update
            this.addSummaryClickListeners()
        } catch (error) {
            console.error('MODIFIER DISPLAY: Fehler beim Update:', error)
            const modifierEl = this.element?.querySelector('#modifier-summary')
            if (modifierEl) {
                modifierEl.innerHTML =
                    '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Fehler beim Berechnen...</div></div>'
            }
        }
    }

    /**
     * Subclasses should override this to return their specific base values
     */
    getBaseValues() {
        throw new Error('getBaseValues() must be implemented by subclass')
    }

    /**
     * Subclasses should override this to return their specific modifier summaries
     */
    getAllModifierSummaries(baseValues, statusMods, nahkampfMods, diceFormula) {
        throw new Error('getAllModifierSummaries() must be implemented by subclass')
    }

    /**
     * Generic method to add summary click listeners.
     * Subclasses can override getSummaryClickActions() to specify their own actions.
     * Uses native DOM API.
     */
    addSummaryClickListeners() {
        const actions = this.getSummaryClickActions()
        const modSummaryEl = this.element.querySelector('#modifier-summary')
        if (!modSummaryEl) return

        actions.forEach((action) => {
            modSummaryEl.querySelectorAll(action.selector).forEach((el) => {
                el.addEventListener('click', (ev) => {
                    ev.preventDefault()
                    action.handler()
                })
            })
        })
    }

    /**
     * Subclasses should override this to return their specific click actions
     */
    getSummaryClickActions() {
        return []
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

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever
        let vorteile = this.actor.vorteil.kampf.map((v) => v.name)
    }

    /**
     * Parse maneuver selections from the dialog form.
     * Uses native DOM API instead of jQuery.
     * Note: Uses getElementById instead of querySelector to support IDs starting with digits.
     */
    async manoeverAuswaehlen() {
        this.rollmode = this.item.system.manoever.rllm.selected

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
        const { TargetSelectionDialog } = await import('./target_selection.js')
        const dialog = new TargetSelectionDialog(this.actor, (selectedActors) => {
            this.selectedActors = selectedActors
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
     * Uses native DOM API instead of jQuery.
     */
    getDiceFormula(xd20_choice = 1) {
        let schipsOption =
            Number(
                this.element.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value,
            ) || 0
        let text = ''
        let diceFormula = `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        if (schipsOption == 0) {
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = text.concat(`Keine Schips\n`)
            this.text_vt = text.concat(`Keine Schips\n`)
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }

        if (schipsOption == 1) {
            this.text_at = text.concat(`Schips ohne Eigenheit\n`)
            this.text_vt = text.concat(`Schips ohne Eigenheit\n`)
            diceFormula = `${xd20_choice + 1}d20${xd20_choice == 1 ? '' : 'dh1'}${
                xd20_choice == 1 ? 'dl1' : 'dl2'
            }`
        }

        if (schipsOption == 2) {
            this.text_at = text.concat(`Schips mit Eigenschaft\n`)
            this.text_vt = text.concat(`Schips mit Eigenschaft\n`)
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
     * Uses native DOM API instead of jQuery.
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

    async handleTargetSelection(rollResult, attackType) {
        // Check if target selection feature is enabled
        const useTargetSelection = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisAutomatisierungSettingNames.useTargetSelection,
        )

        if (!useTargetSelection) {
            // If target selection is disabled, just send the chat message without defense prompts
            const html_roll = await renderTemplate(rollResult.templatePath, rollResult.templateData)
            await rollResult.roll.toMessage(
                {
                    speaker: this.speaker,
                    flavor: html_roll,
                },
                {
                    rollMode: this.rollmode,
                },
            )
            return
        }

        // Determine if we should hide the roll result
        const hideRoll =
            attackType !== 'ranged' && this.selectedActors && this.selectedActors.length > 0

        console.log(rollResult)
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

        // Send the chat message
        const html_roll = await renderTemplate(rollResult.templatePath, templateData)
        await rollResult.roll.toMessage(
            {
                speaker: this.speaker,
                flavor: html_roll,
                blind: hideRoll,
                whisper: hideRoll ? [game.user.id] : [],
            },
            {
                rollMode: hideRoll ? 'gmroll' : this.rollmode,
            },
        )

        // Store the roll result for later use with defense rolls
        if (hideRoll) {
            this.lastAttackRoll = {
                roll: rollResult.roll,
                success: rollResult.success,
                is16OrHigher: rollResult.is16OrHigher,
                templateData: rollResult.templateData,
            }
        }

        // If we have selected targets and the attack was successful, send them defense prompts
        if (
            this.selectedActors &&
            this.selectedActors.length > 0 &&
            ((rollResult.success && attackType === 'ranged') || attackType === 'melee')
        ) {
            for (const target of this.selectedActors) {
                const targetActor = game.actors.get(target.actorId)
                if (!targetActor) continue

                let weapons = []

                if (
                    targetActor.type === 'kreatur' &&
                    targetActor.angriffe &&
                    Array.isArray(targetActor.angriffe)
                ) {
                    weapons = targetActor.angriffe
                    if (attackType === 'ranged') {
                        weapons = weapons.filter((weapon) =>
                            weapon.system?.eigenschaften?.find((eig) => {
                                return eig.name === 'Schild'
                            }),
                        )
                    }
                } else {
                    const mainWeapon = targetActor.items.find(
                        (item) => item.type === 'nahkampfwaffe' && item.system.hauptwaffe === true,
                    )

                    const secondaryWeapon = targetActor.items.find(
                        (item) =>
                            item.type === 'nahkampfwaffe' &&
                            item.system.nebenwaffe === true &&
                            (!mainWeapon || item.id !== mainWeapon.id),
                    )

                    if (mainWeapon) weapons.push(mainWeapon)
                    if (secondaryWeapon) weapons.push(secondaryWeapon)

                    if (attackType === 'ranged') {
                        weapons = weapons.filter(
                            (weapon) => weapon.system?.eigenschaften?.schild === true,
                        )
                    }
                }

                // Create defense buttons HTML
                let buttonsHtml = ''
                for (const weapon of weapons) {
                    buttonsHtml += `
                        <button class="defend-button" data-actor-id="${
                            targetActor.id
                        }" data-weapon-id="${weapon.id}" data-distance="${
                            target.distance
                        }" data-attacker-id="${
                            this.actor.id
                        }" data-attack-type="${attackType}" data-roll-result='${encodeURIComponent(
                            JSON.stringify(rollResult, (key, value) =>
                                typeof value === 'function' ? undefined : value,
                            ),
                        )}'>
                            <i class="fas fa-shield-alt"></i>
                            Verteidigen mit ${weapon.name}
                        </button>`
                }

                // Add Akrobatik defense button for ranged attacks
                if (attackType === 'ranged') {
                    buttonsHtml += `
                        <button class="defend-button defend-akrobatik" data-actor-id="${
                            targetActor.id
                        }" data-weapon-id="akrobatik" data-distance="${
                            target.distance
                        }" data-attacker-id="${
                            this.actor.id
                        }" data-attack-type="${attackType}" data-roll-result='${encodeURIComponent(
                            JSON.stringify(rollResult, (key, value) =>
                                typeof value === 'function' ? undefined : value,
                            ),
                        )}'>
                            <i class="fas fa-running"></i>
                            Verteidigen mit Akrobatik
                        </button>`
                }

                if (!buttonsHtml) {
                    buttonsHtml =
                        '<p style="color: #aa0000;">Keine Haupt- oder Nebenwaffe gefunden.</p>'
                }

                const content = `
                    <div class="defense-prompt" style="padding: 10px;">
                        <p>${this.actor.name} greift dich mit ${this.item.name} an!</p>
                        <p>Entfernung: ${target.distance} Distanz</p>
                        <div class="defense-buttons" style="display: flex; flex-wrap: wrap;">
                            ${buttonsHtml}
                        </div>
                    </div>
                `

                const chatData = {
                    speaker: { alias: 'Combat System' },
                    content: content,
                    whisper:
                        [game.users.find((u) => u.character?.id === targetActor.id)?.id].filter(
                            (id) => id,
                        ).length > 0
                            ? [
                                  game.users.find((u) => u.character?.id === targetActor.id)?.id,
                              ].filter((id) => id)
                            : ChatMessage.getWhisperRecipients('GM'),
                    flags: {
                        Ilaris: {
                            defensePrompt: true,
                            targetActorId: targetActor.id,
                        },
                    },
                }
                await ChatMessage.create(chatData)
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
     * Uses native DOM API instead of jQuery.
     */
    setupModifierDisplay() {
        const modifierEl = this.element.querySelector('#modifier-summary')

        // Store a reference to prevent multiple updates
        this._updateTimeout = null

        if (!modifierEl) {
            console.warn('MODIFIER DISPLAY: Element nicht im Template gefunden')
            return
        }

        // Add listeners for real-time modifier updates with debouncing
        this.element.querySelectorAll('input, select').forEach((input) => {
            input.addEventListener('change', () => {
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout)
                }
                this._updateTimeout = setTimeout(() => {
                    this.updateModifierDisplay()
                }, 300)
            })
            input.addEventListener('input', () => {
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout)
                }
                this._updateTimeout = setTimeout(() => {
                    this.updateModifierDisplay()
                }, 300)
            })
        })

        // Initial display update (listeners will be added after innerHTML update)
        setTimeout(() => this.updateModifierDisplay(), 500)
    }
}
