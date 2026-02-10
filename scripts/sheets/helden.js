import { IlarisActorSheet } from './actor.js'
import * as settings from './../settings/index.js'

export class HeldenSheet extends IlarisActorSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'helden'],
        position: {
            width: 950,
            height: 750,
        },
        window: {
            title: 'meep',
        },
        actions: {
            schipsClick: HeldenSheet.schipsClick,
            triStateClick: HeldenSheet.triStateClick,
        },
    }

    /** @override */
    static PARTS = {
        header: {
            template: 'systems/Ilaris/templates/sheets/held/held-header.hbs',
        },
        sidebar: {
            template: 'systems/Ilaris/templates/sheets/held/held-sidebar.hbs',
        },
        tabs: {
            template: 'systems/Ilaris/templates/sheets/held/held-navigation.hbs',
        },
        attribute: {
            template: 'systems/Ilaris/templates/sheets/tabs/attribute.hbs',
            scrollable: [''],
        },
        fertigkeiten: {
            template: 'systems/Ilaris/templates/sheets/tabs/fertigkeiten.hbs',
            scrollable: [''],
        },
        uebernatuerlich: {
            template: 'systems/Ilaris/templates/sheets/tabs/uebernatuerlich.hbs',
            scrollable: [''],
        },
        kampf: {
            template: 'systems/Ilaris/templates/sheets/tabs/kampf.hbs',
            scrollable: [''],
        },
        inventar: {
            template: 'systems/Ilaris/templates/sheets/tabs/inventar.hbs',
            scrollable: [''],
        },
        notes: {
            template: 'systems/Ilaris/templates/sheets/tabs/notes.hbs',
            scrollable: [''],
        },
        effects: {
            template: 'systems/Ilaris/templates/sheets/tabs/effekte.hbs',
            scrollable: [''],
        },
    }

    /** @override */
    static TABS = {
        primary: {
            initial: 'fertigkeiten',
            tabs: [
                { id: 'attribute', label: 'Attribute' },
                { id: 'fertigkeiten', label: 'Fertigkeiten' },
                { id: 'uebernatuerlich', label: 'Übernatürlich' },
                { id: 'kampf', label: 'Kampf' },
                { id: 'inventar', label: 'Inventar' },
                { id: 'notes', label: 'Notizen' },
                { id: 'effects', label: 'Effekte' },
            ],
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add weapon space requirement setting
        context.isWeaponSpaceRequirementActive = game.settings.get(
            settings.ConfigureGameSettingsCategories.Ilaris,
            settings.IlarisGameSettingNames.weaponSpaceRequirement,
        )

        // Add applied effects
        context.effects = this.actor.appliedEffects

        // Add tab data for template
        context.tabs = this._prepareTabs('primary')

        return context
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'attribute':
            case 'fertigkeiten':
            case 'uebernatuerlich':
            case 'kampf':
            case 'inventar':
            case 'notes':
            case 'effects':
                context.tab = context.tabs[partId]
                break
            default:
        }

        return context
    }

    /**
     * Handle schicksalspunkt (fate point) button clicks
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The button element
     */
    static async schipsClick(event, target) {
        try {
            const isFilled = target.classList.contains('filled')
            const currentValue = this.actor.system.schips.schips_stern
            const newValue = isFilled ? currentValue - 1 : currentValue + 1

            await this.actor.update({
                'system.schips.schips_stern': newValue,
            })
            return this.render()
        } catch (err) {
            console.error('ILARIS | Error updating schips:', err)
            ui.notifications.error('Fehler beim Aktualisieren der Schicksalspunkte.')
        }
    }

    /**
     * Handle tri-state button clicks for health conditions (wounds/exhaustion)
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The button element
     */
    static async triStateClick(event, target) {
        try {
            let state = parseInt(target.dataset.state) || 0

            // Cycle through states: 0 -> 1 -> 2 -> 0
            state = (state + 1) % 3
            target.dataset.state = state

            // Find all tri-state buttons in the same container
            const parentContainer = target.closest('#lebensleiste')
            if (!parentContainer) return

            const buttons = Array.from(
                parentContainer.querySelectorAll('[data-action="triStateClick"]'),
            )
            const wunden = buttons.filter((btn) => parseInt(btn.dataset.state) === 1).length
            const erschoepfung = buttons.filter((btn) => parseInt(btn.dataset.state) === 2).length

            await this.actor.update({
                'system.gesundheit.wunden': wunden,
                'system.gesundheit.erschoepfung': erschoepfung,
            })

            // Update open combat dialogs with debouncing
            if (this._triStateUpdateTimeout) {
                clearTimeout(this._triStateUpdateTimeout)
            }

            this._triStateUpdateTimeout = setTimeout(() => {
                this._updateOpenCombatDialogs()
            }, 300)

            return this.render()
        } catch (err) {
            console.error('ILARIS | Error updating health state:', err)
            ui.notifications.error('Fehler beim Aktualisieren des Gesundheitszustands.')
        }
    }
}
