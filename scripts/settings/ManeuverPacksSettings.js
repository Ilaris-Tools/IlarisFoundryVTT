export class ManeuverPacksSettings extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'maneuver-packs-settings',
            title: 'Manöver Kompendien Einstellungen',
            template: 'systems/Ilaris/templates/settings/maneuver-packs.html',
            width: 500,
            height: 'auto',
            closeOnSubmit: true,
        })
    }

    getData(options) {
        const currentSelection = JSON.parse(game.settings.get('Ilaris', 'manoeverPacks'))
        const vorteileSelection = JSON.parse(game.settings.get('Ilaris', 'vorteilePacks'))

        // Get all available packs that contain maneuvers
        const availablePacks = []
        for (const pack of game.packs) {
            console.log(pack)
            if (
                pack.metadata.type === 'Item' &&
                pack.index.size > 0 &&
                (pack.metadata.packageType === 'world' || pack.metadata.id === 'Ilaris.manover')
            ) {
                // Check if any item in the pack has type 'manoever'
                if (pack.metadata.id === 'Ilaris.manover') {
                    availablePacks.push({
                        id: pack.collection,
                        name: pack.metadata.label,
                        selected: currentSelection.includes(pack.collection),
                    })
                } else {
                    const hasManoever = pack.index.contents.some((item) => item.type === 'manoever')
                    if (hasManoever) {
                        availablePacks.push({
                            id: pack.collection,
                            name: pack.metadata.label,
                            selected: currentSelection.includes(pack.collection),
                            disabled: vorteileSelection.includes(pack.collection),
                            disabledReason: vorteileSelection.includes(pack.collection)
                                ? 'Dieses Kompendium wird bereits als Vorteile-Kompendium verwendet'
                                : '',
                        })
                    }
                }
            }
        }

        return {
            packs: availablePacks,
        }
    }

    async _updateObject(event, formData) {
        const selectedPacks = Object.entries(formData)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)

        await game.settings.set('Ilaris', 'manoeverPacks', JSON.stringify(selectedPacks))
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button[name="reset"]').click(async (event) => {
            event.preventDefault()
            await game.settings.set('Ilaris', 'manoeverPacks', JSON.stringify(['Ilaris.manover']))
            this.render(true)
        })
    }
}
