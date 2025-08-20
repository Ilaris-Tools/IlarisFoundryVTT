import { AngriffDialog } from './angriff.js'

export class CombatDialog extends Dialog {
    constructor(dialogData, options) {
        super(dialogData, options)
    }

    /**
     * Initialize selectedActors from Foundry's game.user.targets
     * This should be called after actor and item are set
     */
    _initializeSelectedActorsFromTargets() {
        if (!this.selectedActors && game.user.targets && game.user.targets.size > 0) {
            this.selectedActors = []

            for (const token of game.user.targets) {
                // Calculate distance from the acting token to the target token
                let distance = 'Unbekannt'

                // Try to get distance from token document
                const actorTokens = this.actor?.getActiveTokens()
                if (actorTokens && actorTokens.length > 0 && token) {
                    const actorToken = actorTokens[0]
                    try {
                        const dx = Math.abs(actorToken.x - token.x)
                        const dy = Math.abs(actorToken.y - token.y)
                        const gridDistance = Math.max(dx, dy) / canvas.grid.size
                        distance = `${Math.round(gridDistance)}`
                    } catch (error) {
                        console.warn('Could not calculate distance to target:', error)
                        distance = 'Unbekannt'
                    }
                } else if (this.actor?.token && token) {
                    // Fallback to actor.token if available
                    try {
                        const dx = Math.abs(this.actor.token.x - token.x)
                        const dy = Math.abs(this.actor.token.y - token.y)
                        const gridDistance = Math.max(dx, dy) / canvas.grid.size
                        distance = `${Math.round(gridDistance)}`
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
        await this.item.setManoevers()
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

        manoever.kwut = vorteile.includes('Kalte Wut')
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
        this.at_abzuege_mod = 0

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_at = this.text_at.concat(`(Kalte Wut)\n`)
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege
        } else {
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.globalermod
        }
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
        const parentDialog = $(html[0]).closest('.app.window-app').parent().find('.angriff-dialog')

        // Find the selected actors display
        let selectedActorsDiv = parentDialog.find('.selected-actors-display')

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
                if (targetActor.type === 'kreatur' && targetActor.angriffe) {
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
                    )}' style="margin: 0 5px 5px 0;">
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

                // Send the message to chat
                const chatData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                    content: content,
                    whisper: [
                        game.users.find((u) => u.character?.id === targetActor.id)?.id,
                    ].filter((id) => id),
                }
                await ChatMessage.create(chatData)
            }
        }
    }
}

// Register the renderChatMessage hook ONCE at the top level (not inside the class or method)
if (!window._ilarisDefendButtonHookRegistered) {
    window._ilarisDefendButtonHookRegistered = true
    Hooks.on('renderChatMessage', (message, html) => {
        html.find('.defend-button').click(async function () {
            const actorId = this.dataset.actorId
            const weaponId = this.dataset.weaponId
            const distance = parseInt(this.dataset.distance)
            const attackerId = this.dataset.attackerId
            const attackType = this.dataset.attackType
            let rollResult
            try {
                rollResult = JSON.parse(decodeURIComponent(this.dataset.rollResult))
            } catch (e) {
                ui.notifications.error('Fehler beim Parsen des Angriffs-Wurfs.')
                return
            }
            const actor = game.actors.get(actorId)
            const attackingActor = game.actors.get(attackerId)
            if (!actor) return

            // Get the specific weapon that was clicked
            let weapon
            if (actor.type === 'kreatur' && actor.angriffe) {
                // For creatures, find the weapon in angriffe array
                weapon = actor.angriffe.find((angriff) => angriff.id === weaponId)
            } else {
                // For regular actors, find the weapon in items
                weapon = actor.items.get(weaponId)
            }

            if (!weapon) {
                ui.notifications.warn('Die gewählte Waffe wurde nicht gefunden.')
                return
            }
            if (attackType === 'ranged') {
                if (rollResult.roll && typeof rollResult.roll === 'object') {
                    rollResult.roll._total = 28
                }
            }
            const d = new AngriffDialog(actor, weapon, {
                isDefenseMode: true,
                attackingActor: attackingActor,
                attackRoll: rollResult,
            })
            d.render(true)
        })
    })
}
