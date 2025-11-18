export class CombatDialog extends Dialog {
    constructor(actor, item, dialogData, options) {
        super(dialogData, options)

        // Common initialization for all combat dialogs
        this.text_at = ''
        this.text_dm = ''
        this.item = item
        this.actor = actor

        // Initialize selected actors from Foundry targets after actor/item are set
        this._initializeSelectedActorsFromTargets()

        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.rollmode = game.settings.get('core', 'rollMode')
        this.item.system.manoever.rllm.selected = game.settings.get('core', 'rollMode')
        this.fumble_val = 1

        if (this.item.system.eigenschaften.unberechenbar) {
            this.fumble_val = 2
        }
    }

    /**
     * Initialize selectedActors from Foundry's game.user.targets
     * This should be called after actor and item are set
     */
    _initializeSelectedActorsFromTargets() {
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

    async getData() {
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
        return {
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
        }
    }

    /**
     * Generic updateModifierDisplay method that works for all combat dialogs
     * Subclasses should implement getBaseValues() and getAllModifierSummaries()
     */
    async updateModifierDisplay(html) {
        try {
            // Use the stored reference instead of searching for the element
            if (!this._modifierElement || this._modifierElement.length === 0) {
                console.warn('MODIFIER DISPLAY: Element-Referenz nicht verfügbar')
                return
            }

            // Show loading state
            this._modifierElement.html(
                '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Wird berechnet...</div></div>',
            )

            // Temporarily parse values to calculate modifiers
            await this.manoeverAuswaehlen(html)
            await this.updateManoeverMods()
            await this.updateStatusMods()

            // Get base values (subclass specific)
            const baseValues = this.getBaseValues()
            const statusMods = this.actor.system.abgeleitete.globalermod || 0
            const nahkampfMods = this.actor.system.modifikatoren.nahkampfmod || 0

            // Get dice formula
            const diceFormula = this.getDiceFormula(html)

            // Create all summaries (subclass specific)
            const summaries = this.getAllModifierSummaries(
                baseValues,
                statusMods,
                nahkampfMods,
                diceFormula,
            )

            // Update the display element
            this._modifierElement.html(summaries)
        } catch (error) {
            console.error('MODIFIER DISPLAY: Fehler beim Update:', error)
            // Show error state
            if (this._modifierElement && this._modifierElement.length > 0) {
                this._modifierElement.html(
                    '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Fehler beim Berechnen...</div></div>',
                )
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
     * Generic method to add summary click listeners
     * Subclasses can override getSummaryClickActions() to specify their own actions
     */
    addSummaryClickListeners(html) {
        const actions = this.getSummaryClickActions(html)

        actions.forEach((action) => {
            html.find('#modifier-summary').on('click', action.selector, (ev) => {
                ev.preventDefault()
                action.handler(html)
            })
        })
    }

    /**
     * Subclasses should override this to return their specific click actions
     */
    getSummaryClickActions(html) {
        return []
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find('.angreifen').click((ev) => this._angreifenKlick(html))
        // Add expand/collapse functionality
        html.find('.maneuver-header').click((ev) => {
            const header = ev.currentTarget
            const grid = header.nextElementSibling
            const isCollapsed = header.classList.contains('collapsed')
            const text = header.querySelector('h4')

            header.classList.toggle('collapsed')
            grid.classList.toggle('collapsed')

            // Update text based on state
            text.textContent = isCollapsed ? 'Einklappen' : 'Ausklappen'
        })

        // Update has-value class when inputs change
        html.find('.maneuver-item input, .maneuver-item select').change((ev) => {
            const item = ev.currentTarget.closest('.maneuver-item')
            const hasValue = Array.from(item.querySelectorAll('input, select')).some((input) => {
                if (input.type === 'checkbox') return input.checked
                return input.value && input.value !== '0'
            })
            item.classList.toggle('has-value', hasValue)
        })
        html.find('.show-nearby').click((ev) => this._showNearbyActors(html))

        // Add specific listener for maneuver to handle ZERO_DAMAGE conflicts
        html.find('.maneuver-item input, .maneuver-item select').on('change', () => {
            this.handleZeroDamageConflicts(html)
        })

        // Initial conflict check on dialog load
        // The 500ms timeout provides a safety buffer to ensure that:
        // - All maneuver checkboxes have been created and are queryable
        // - The dialog's HTML structure is completely built
        // - Any initial values or states have been properly set
        setTimeout(() => {
            this.handleZeroDamageConflicts(html)
        }, 500)

        // Colorize numbers in maneuver labels
        this.colorizeManeuverNumbers(html)
    }

    colorizeManeuverNumbers(html) {
        // Apply to both maneuver labels and other labels in the dialog
        html.find('.maneuver-item label, .flexrow label').each((index, label) => {
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

    async manoeverAuswaehlen(html) {
        /* TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        this.rollmode = this.item.system.manoever.rllm.selected

        this.item.manoever.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            if (manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.checked || false
            } else {
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.value || false
            }
        })
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */
        // TODO: das ignorieren von Wunden ist nicht so gut gelöst,
        // da der Modifier wie hoch der Wundabzug ist einfach auf 0 gesetzt wird
        // deshalb wird hier der Modifier noch neu berechnet damit man den Vorteil von Kalter Wut zeigen kann
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

    async _showNearbyActors(html) {
        const { TargetSelectionDialog } = await import('./target_selection.js')
        const dialog = new TargetSelectionDialog(this.actor, (selectedActors) => {
            this.selectedActors = selectedActors
            this.updateSelectedActorsDisplay(html)
        })
        dialog.render(true)
    }

    updateSelectedActorsDisplay(html) {
        // Get the parent dialog element that contains the original angriff.hbs content

        // Re-render the dialog to update the template
        this.render(true)
    }

    _updateSchipsStern(html) {
        const schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
        if (schipsOption !== 0 && this.actor.system.schips.schips_stern > 0) {
            this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        }
    }

    getDiceFormula(html, xd20_choice = 1) {
        let schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
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
     * Handles ZERO_DAMAGE maneuver conflicts by disabling other ZERO_DAMAGE maneuvers when one is selected
     */
    handleZeroDamageConflicts(html) {
        // Find all ZERO_DAMAGE maneuvers
        const zeroDamageManeuvers = this.item.manoever.filter((manoever) =>
            this.hasZeroDamageModification(manoever),
        )

        if (zeroDamageManeuvers.length <= 1) return // No conflicts possible

        // Find the currently selected ZERO_DAMAGE maneuver (if any)
        const selectedZeroDamage = zeroDamageManeuvers.find((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]
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
            const element = html.find(`#${elementId}`)[0]

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
                    // Add tooltip or title to explain why it's disabled
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
        // Determine if we should hide the roll result
        // Only hide roll for melee attacks with targets
        const hideRoll =
            attackType !== 'ranged' && this.selectedActors && this.selectedActors.length > 0

        console.log(rollResult)
        // Modify template data to hide results if needed
        const templateData = hideRoll
            ? {
                  ...rollResult.templateData,
                  // Hide specific results but keep flavor text
                  success: false,
                  fumble: false,
                  crit: false,
                  is16OrHigher: false,
                  noSuccess: false,
                  // Add a message indicating hidden roll
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
                blind: hideRoll, // Make the roll blind if we have targets
                whisper: hideRoll ? [game.user.id] : [], // Only whisper to GM if hidden
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

                // Check if this is a creature (has angriffe) or a regular actor (has nahkampfwaffen)
                if (
                    targetActor.type === 'kreatur' &&
                    targetActor.angriffe &&
                    Array.isArray(targetActor.angriffe)
                ) {
                    // For creatures, use all their angriffe as weapons
                    weapons = targetActor.angriffe
                } else {
                    // For regular actors, find main and secondary weapons
                    const mainWeapon = targetActor.items.find(
                        (item) => item.type === 'nahkampfwaffe' && item.system.hauptwaffe === true,
                    )

                    const secondaryWeapon = targetActor.items.find(
                        (item) =>
                            item.type === 'nahkampfwaffe' &&
                            item.system.nebenwaffe === true &&
                            (!mainWeapon || item.id !== mainWeapon.id), // Don't include if it's the same as main weapon
                    )

                    if (mainWeapon) weapons.push(mainWeapon)
                    if (secondaryWeapon) weapons.push(secondaryWeapon)
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

                // If no weapons found, add a warning
                if (!buttonsHtml) {
                    buttonsHtml =
                        '<p style="color: #aa0000;">Keine Haupt- oder Nebenwaffe gefunden.</p>'
                }

                // Create defense prompt message content
                const content = `
                    <div class="defense-prompt" style="padding: 10px;">
                        <p>${this.actor.name} greift dich mit ${this.item.name} an!</p>
                        <p>Entfernung: ${target.distance} Distanz</p>
                        <div class="defense-buttons" style="display: flex; flex-wrap: wrap;">
                            ${buttonsHtml}
                        </div>
                    </div>
                `

                // Send the message to chat using a system speaker
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
     * This helper consolidates logic shared between melee and ranged combat.
     *
     * @param {Object} params - Configuration object
     * @param {Object} params.nodmg - Zero damage configuration {name: string, value: boolean}
     * @param {number} params.mod_dm - Current damage modifier
     * @param {string} params.schaden - Current damage value/formula
     * @param {string} params.text_dm - Current damage text
     * @param {number} params.trefferzone - Current trefferzone value
     * @param {number} params.mod_at - Attack modifier
     * @param {number} params.mod_vt - Defense modifier (optional)
     * @param {string} params.text_at - Attack text
     * @param {string} params.text_vt - Defense text (optional)
     * @param {string} params.damageType - Damage type (optional, e.g., 'NORMAL', 'TRUE')
     * @param {boolean} params.trueDamage - Whether damage bypasses armor (optional)
     * @returns {Object} Updated values {mod_dm, schaden, text_dm, trefferzone, mod_at, mod_vt, text_at, text_vt, damageType, trueDamage}
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
     * Used by both melee and ranged combat dialogs.
     */
    eigenschaftenText() {
        // if (this.item.system.eigenschaften.length === 0) {
        //     return
        // }
        // this.text_at += '\nEigenschaften: '
        // this.text_at += this.item.system.eigenschaften.map((e) => e.name).join(', ')
    }

    /**
     * Checks if the "Gezielter Schlag" (Aimed Strike) maneuver is active.
     * Used to determine if trefferzone (hit zone) should be rolled.
     * @returns {boolean} True if Gezielter Schlag is selected
     */
    isGezieltSchlagActive() {
        return (
            this.item.system.manoever.km_gzsl && this.item.system.manoever.km_gzsl.selected !== '0'
        )
    }

    /**
     * Sets up the modifier display element and listeners for real-time updates.
     * This common setup is used by all combat dialog subclasses.
     * @param {jQuery} html - The rendered HTML of the dialog
     */
    setupModifierDisplay(html) {
        // Store modifier element reference for performance
        this._modifierElement = html.find('#modifier-summary')

        // Store a reference to prevent multiple updates
        this._updateTimeout = null

        if (this._modifierElement.length === 0) {
            console.warn('MODIFIER DISPLAY: Element nicht im Template gefunden')
            return
        }

        // Add listeners for real-time modifier updates with debouncing
        html.find('input, select').on('change input', () => {
            // Clear previous timeout
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout)
            }

            // Set new timeout to debounce rapid changes
            this._updateTimeout = setTimeout(() => {
                this.updateModifierDisplay(html)
            }, 300)
        })

        // Add summary click listeners
        this.addSummaryClickListeners(html)

        // Initial display update
        setTimeout(() => this.updateModifierDisplay(html), 500)
    }
}
