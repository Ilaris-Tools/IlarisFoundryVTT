import { IlarisItemSheet } from './item.js'
import {
    ConfigureGameSettingsCategories,
    IlarisGameSettingNames,
} from '../../settings/configure-game-settings.model.js'

export class AngriffSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'angriff'],
        actions: {
            addEigenschaft: AngriffSheet.#onAddEigenschaft,
            delEigenschaft: AngriffSheet.#onDelEigenschaft,
            addManeuver: AngriffSheet.#onAddManeuver,
            removeManeuver: AngriffSheet.#onRemoveManeuver,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/angriff.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.angrifftypen = CONFIG.ILARIS.angriff_typ

        // Get available maneuvers from selected packs
        context.availableManeuvers = await this._getAvailableManeuvers()

        return context
    }

    async _getAvailableManeuvers() {
        // Get selected maneuver packs from settings
        const selectedPacks = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.manoeverPacks,
            ),
        )

        // Get maneuvers from selected packs
        const packItems = []
        for await (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (pack) {
                packItems.push(...(await pack.getDocuments()))
            }
        }

        // Filter for maneuvers and create options
        const maneuvers = packItems
            .filter((item) => item.type === 'manoever')
            .map((item) => ({
                id: item.id,
                name: item.name,
                pack: item.pack,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))

        return maneuvers
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Handle change event for maneuver selector (not a click action)
        const maneuverSelector = this.element.querySelector('.maneuver-selector')
        if (maneuverSelector) {
            maneuverSelector.addEventListener('change', (ev) => this._onManeuverSelectorChange(ev))
        }
    }

    /**
     * Handle maneuver selector change event
     * @private
     */
    async _onManeuverSelectorChange(event) {
        const select = event.currentTarget
        const selectedId = select.value
        const selectedName = select.options[select.selectedIndex].dataset.name

        if (!selectedId) return

        // Get current maneuvers
        const currentManeuvers = [...(this.document.system.angriffmanover || [])]

        // Check if maneuver is already selected
        if (currentManeuvers.some((m) => m === selectedName)) {
            ui.notifications.warn('Dieses Manöver ist bereits ausgewählt.')
            select.value = '' // Reset dropdown
            return
        }

        // Add new maneuver
        currentManeuvers.push(selectedName)

        // Update the item
        await this._updateManeuvers(currentManeuvers)

        // Reset dropdown
        select.value = ''
    }

    /**
     * Handle add maneuver action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onAddManeuver(event, target) {
        // This is now handled by the change event in _onRender
        // Kept for backwards compatibility if needed
    }

    /**
     * Handle remove maneuver action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onRemoveManeuver(event, target) {
        const maneuverToRemove = target.dataset.maneuver

        // Get current maneuvers and filter out the one to remove
        const currentManeuvers = (this.document.system.angriffmanover || []).filter(
            (m) => m !== maneuverToRemove,
        )

        await this._updateManeuvers(currentManeuvers)
    }

    async _updateManeuvers(maneuvers) {
        const updateData = {
            'system.angriffmanover': maneuvers,
        }

        // Use this.document.update() - works for both embedded and standalone!
        await this.document.update(updateData)

        // Re-render the sheet to update the dropdown options
        this.render(false)
    }

    /**
     * Handle add eigenschaft action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onAddEigenschaft(event, target) {
        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften)
        this.document.system.eigenschaften.push({ name: 'Neue Eigenschaft', text: '' })

        await this.document.update({
            'system.eigenschaften': this.document.system.eigenschaften,
        })

        this.render(false)
    }

    /**
     * Handle delete eigenschaft action
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onDelEigenschaft(event, target) {
        const eigid = target.dataset.eigenschaftid
        if (eigid === undefined) return

        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften)
        this.document.system.eigenschaften.splice(parseInt(eigid), 1)

        // Use this.document.update() - works for both embedded and standalone!
        await this.document.update({
            'system.eigenschaften': this.document.system.eigenschaften,
        })
    }
}
