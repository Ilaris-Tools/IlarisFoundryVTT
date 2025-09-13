export class CombatDialog extends Dialog {
    async getData() {
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

        // Add specific listener for maneuver checkboxes to handle ZERO_DAMAGE conflicts
        html.find('.maneuver-item input[type="checkbox"]').on('change', () => {
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
                console.log(manoever.inputValue.name, html.find(`#${elementId}`)[0]?.value)
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
            const elementId = `${manoever.id}CHECKBOX-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]
            return element?.checked
        })

        // Update the state of all ZERO_DAMAGE maneuvers
        zeroDamageManeuvers.forEach((manoever) => {
            const elementId = `${manoever.id}CHECKBOX-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]

            if (!element) return

            if (selectedZeroDamage && selectedZeroDamage.id !== manoever.id) {
                // Disable other ZERO_DAMAGE maneuvers and uncheck them
                element.disabled = true
                element.checked = false
                manoever.inputValue.value = false

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
}
