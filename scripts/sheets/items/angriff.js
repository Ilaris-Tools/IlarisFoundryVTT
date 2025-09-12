import { IlarisItemSheet } from './item.js'
import {
    ConfigureGameSettingsCategories,
    IlarisGameSettingNames,
} from '../../settings/configure-game-settings.model.js'

export class AngriffSheet extends IlarisItemSheet {
    async getData() {
        const data = await super.getData()
        data.angrifftypen = CONFIG.ILARIS.angriff_typ

        // Get available maneuvers from selected packs
        data.availableManeuvers = await this._getAvailableManeuvers()

        return data
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

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/angriff.hbs',
        })
    }

    activateListeners(html) {
        super.activateListeners(html)
        console.log('Angriff listeners')
        html.find('.add-eigenschaft').click((ev) => this._onAddEigenschaft(ev))
        html.find('.del-eigenschaft').click((ev) => this._onDelEigenschaft(ev))
        html.find('.maneuver-selector').change((ev) => this._onAddManeuver(ev))
        html.find('.remove-maneuver').click((ev) => this._onRemoveManeuver(ev))
    }

    async _onAddManeuver(event) {
        const select = event.currentTarget
        const selectedId = select.value
        const selectedName = select.options[select.selectedIndex].dataset.name

        if (!selectedId) return

        // Get current maneuvers
        const currentManeuvers = [...(this.document.system.angriffmanover || [])]

        // Check if maneuver is already selected
        if (currentManeuvers.some((m) => m.id === selectedId)) {
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

    async _onRemoveManeuver(event) {
        event.preventDefault()
        const maneuverToRemove = event.currentTarget.dataset.maneuver

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

        if (this.document.isEmbedded) {
            await this.document.actor.updateEmbeddedDocuments('Item', [
                {
                    _id: this.document.id,
                    ...updateData,
                },
            ])
        } else {
            await this.document.update(updateData)
        }

        // Re-render the sheet to update the dropdown options
        this.render(false)
    }

    _onAddEigenschaft(event) {
        //let item = this.document.data;
        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften)
        this.document.system.eigenschaften.push({ name: 'Neue Eigenschaft', text: '' })
        console.log(this.document)
        this.document.render()
    }

    async _onDelEigenschaft(event) {
        let eigid = $(event.currentTarget).data('eigenschaftid')
        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften)
        this.document.system.eigenschaften.splice(eigid, 1)

        // Update the embedded item through the parent actor
        if (this.document.isEmbedded) {
            await this.document.actor.updateEmbeddedDocuments('Item', [
                {
                    _id: this.document.id,
                    'system.eigenschaften': this.document.system.eigenschaften,
                },
            ])
        } else {
            await this.document.update({
                'system.eigenschaften': this.document.system.eigenschaften,
            })
        }
    }
}
