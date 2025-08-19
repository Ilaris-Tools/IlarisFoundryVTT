import { AngriffDialog } from './angriff.js'

export class CombatDialog extends Dialog {
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

    getDiceFormula(html, xd20_choice) {
        let schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
        let text = ''
        let diceFormula = xd20_choice ?? '1d20'
        if (schipsOption == 0) {
            return diceFormula
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = text.concat(`Keine Schips\n`)
            this.text_vt = text.concat(`Keine Schips\n`)
            return diceFormula
        }

        this.actor.update({
            'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
        })
        if (schipsOption == 1) {
            this.text_at = text.concat(`Schips ohne Eigenheit\n`)
            this.text_vt = text.concat(`Schips ohne Eigenheit\n`)
            diceFormula = `${2}d20dl${1}`
        }

        if (schipsOption == 2) {
            this.text_at = text.concat(`Schips mit Eigenschaft\n`)
            this.text_vt = text.concat(`Schips mit Eigenschaft\n`)
            diceFormula = `${3}d20dl${2}`
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

                // Find main and secondary weapons
                const mainWeapon = targetActor.items.find(
                    (item) => item.type === 'nahkampfwaffe' && item.system.hauptwaffe === true,
                )

                const secondaryWeapon = targetActor.items.find(
                    (item) =>
                        item.type === 'nahkampfwaffe' &&
                        item.system.nebenwaffe === true &&
                        (!mainWeapon || item.id !== mainWeapon.id), // Don't include if it's the same as main weapon
                )

                // Create defense buttons HTML
                let buttonsHtml = ''
                if (mainWeapon) {
                    buttonsHtml += `
                        <button class="defend-button" data-actor-id="${targetActor.id}" data-weapon-id="${mainWeapon.id}" data-distance="${target.distance}" data-attacker-id="${this.actor.id}" style="margin: 0 5px 5px 0;">
                            <i class="fas fa-shield-alt"></i>
                            Verteidigen mit ${mainWeapon.name}
                        </button>`
                }
                if (secondaryWeapon) {
                    buttonsHtml += `
                        <button class="defend-button" data-actor-id="${targetActor.id}" data-weapon-id="${secondaryWeapon.id}" data-distance="${target.distance}" data-attacker-id="${this.actor.id}" style="margin: 0 5px 5px 0;">
                            <i class="fas fa-shield-alt"></i>
                            Verteidigen mit ${secondaryWeapon.name}
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

            // Add a click handler for the defend buttons
            Hooks.once('renderChatMessage', (message, html) => {
                html.find('.defend-button').click(async function () {
                    const actorId = this.dataset.actorId
                    const weaponId = this.dataset.weaponId
                    const distance = parseInt(this.dataset.distance)
                    const attackerId = this.dataset.attackerId
                    const actor = game.actors.get(actorId)
                    const attackingActor = game.actors.get(attackerId)
                    if (!actor) return

                    // Get the specific weapon that was clicked
                    const weapon = actor.items.get(weaponId)
                    if (!weapon) {
                        ui.notifications.warn('Die gewählte Waffe wurde nicht gefunden.')
                        return
                    }

                    // For ranged attacks, override the roll total to 28
                    if (attackType === 'ranged') {
                        rollResult.roll._total = 28
                    }

                    // Create and render defense dialog with defense mode options and attack roll
                    const d = new AngriffDialog(actor, weapon, {
                        isDefenseMode: true,
                        attackingActor: attackingActor,
                        attackRoll: rollResult, // Pass the attack roll to the defense dialog
                    })
                    d.render(true)
                })
            })
        }
    }
}
