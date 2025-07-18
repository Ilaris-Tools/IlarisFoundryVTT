import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './configure-game-settings.model.js'

export class VorteilePacksSettings extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'vorteile-packs-settings',
            title: 'Vorteile Kompendien Einstellungen',
            template: 'systems/Ilaris/templates/settings/vorteile-packs.html',
            width: 500,
            height: 'auto',
            closeOnSubmit: true,
        })
    }

    getData(options) {
        const currentSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.vorteilePacks,
            ),
        )
        const manoeverSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.manoeverPacks,
            ),
        )

        // Get all available packs that contain vorteile
        const availablePacks = []
        for (const pack of game.packs) {
            if (
                pack.metadata.type === 'Item' &&
                pack.index.size > 0 &&
                (pack.metadata.packageType === 'world' || pack.metadata.id === 'Ilaris.vorteile')
            ) {
                // Check if any item in the pack has type 'vorteil'
                if (pack.metadata.id === 'Ilaris.vorteile') {
                    availablePacks.push({
                        id: pack.collection,
                        name: pack.metadata.label,
                        selected: currentSelection.includes(pack.collection),
                    })
                } else {
                    const hasVorteil = pack.index.contents.some((item) => item.type === 'vorteil')
                    if (hasVorteil) {
                        availablePacks.push({
                            id: pack.collection,
                            name: pack.metadata.label,
                            selected: currentSelection.includes(pack.collection),
                            disabled: manoeverSelection.includes(pack.collection),
                            disabledReason: manoeverSelection.includes(pack.collection)
                                ? 'Dieses Kompendium wird bereits als Manöver-Kompendium verwendet'
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

        await game.settings.set(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.vorteilePacks,
            JSON.stringify(selectedPacks),
        )
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button[name="reset"]').click(async (event) => {
            event.preventDefault()
            await game.settings.set(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.vorteilePacks,
                JSON.stringify(['Ilaris.vorteile']),
            )
            this.render(true)
        })
    }
}
