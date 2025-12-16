import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './configure-game-settings.model.js'

export class WaffenPacksSettings extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'waffen-packs-settings',
            title: 'Waffen Kompendien Einstellungen',
            template: 'systems/Ilaris/templates/settings/waffen-packs.hbs',
            width: 500,
            height: 'auto',
            closeOnSubmit: true,
        })
    }

    getData(options) {
        const currentSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.waffenPacks,
            ),
        )

        // Get all available packs that contain waffen
        const availablePacks = []
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item' && pack.index.size > 0) {
                // Check if any item in the pack has type 'waffe'
                const hasWaffe = pack.index.contents.some(
                    (item) => item.type === 'fernkampfwaffe' || item.type === 'nahkampfwaffe',
                )
                if (hasWaffe) {
                    availablePacks.push({
                        id: pack.collection,
                        name: pack.metadata.label,
                        selected: currentSelection.includes(pack.collection),
                    })
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
            IlarisGameSettingNames.waffenPacks,
            JSON.stringify(selectedPacks),
        )
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button[name="reset"]').click(async (event) => {
            event.preventDefault()
            await game.settings.set(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.waffenPacks,
                JSON.stringify(['Ilaris.waffen']),
            )
            this.render(true)
        })
    }
}
