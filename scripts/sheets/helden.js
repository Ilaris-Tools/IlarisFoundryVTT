import { IlarisActorSheet } from './actor.js'
import * as settings from './../settings/index.js'

export class HeldenSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/helden.hbs',
            // width: 720,
            // height: 800,
            // resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'fertigkeiten',
                },
            ],
        })
    }

    async getData() {
        return {
            ...(await super.getData()),
            isWeaponSpaceRequirementActive: game.settings.get(
                settings.ConfigureGameSettingsCategories.Ilaris,
                settings.IlarisGameSettingNames.weaponSpaceRequirement,
            ),
            effects: this.actor.appliedEffects,
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.schips-button').click((ev) => this._schipsClick(ev))
        html.find('.triStateBtn').click((ev) => this._triStateClick(ev))
    }

    async _schipsClick(ev) {
        console.log(ev)
        if (ev.currentTarget.className.includes('filled')) {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        } else {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern + 1,
            })
        }
        this.render()
    }

    async _triStateClick(ev) {
        console.log('tristate click')
        const button = ev.currentTarget
        let state = parseInt(button.dataset.state)

        // Cycle through states: 0 -> 1 -> 2 -> 0
        state = (state + 1) % 3
        button.dataset.state = state

        // Update the actor's data
        const buttons = Array.from(ev.currentTarget.parentElement.querySelectorAll('.triStateBtn'))
        const wunden = buttons.filter((btn) => btn.dataset.state == 1).length
        const erschoepfung = buttons.filter((btn) => btn.dataset.state == 2).length

        await this.actor.update({
            'system.gesundheit.wunden': wunden,
            'system.gesundheit.erschoepfung': erschoepfung,
        })

        console.log(`Updated states: Wunden = ${wunden}, Erschöpfung = ${erschoepfung}`)

        // Update open combat dialogs when wounds or exhaustion change (with debouncing)
        if (this._triStateUpdateTimeout) {
            clearTimeout(this._triStateUpdateTimeout)
        }

        this._triStateUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)

        this.render()
    }
}
