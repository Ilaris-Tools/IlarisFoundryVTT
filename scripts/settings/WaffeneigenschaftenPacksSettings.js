import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './configure-game-settings.model.js'

export class WaffeneigenschaftenPacksSettings extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'waffeneigenschaften-packs-settings',
            title: 'Waffeneigenschaften Kompendien Einstellungen',
            template: 'systems/Ilaris/templates/settings/waffeneigenschaften-packs.hbs',
            width: 500,
            height: 'auto',
            closeOnSubmit: true,
        })
    }

    getData(options) {
        const currentSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.waffeneigenschaftenPacks,
            ),
        )

        // Get all available packs that contain waffeneigenschaften
        const availablePacks = []
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item' && pack.index.size > 0) {
                // Check if any item in the pack has type 'waffeneigenschaft'
                if (pack.metadata.id === 'Ilaris.waffeneigenschaften') {
                    availablePacks.push({
                        id: pack.collection,
                        name: pack.metadata.label,
                        selected: currentSelection.includes(pack.collection),
                    })
                } else {
                    const hasWaffeneigenschaft = pack.index.contents.some(
                        (item) => item.type === 'waffeneigenschaft',
                    )
                    if (hasWaffeneigenschaft) {
                        availablePacks.push({
                            id: pack.collection,
                            name: pack.metadata.label,
                            selected: currentSelection.includes(pack.collection),
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
            IlarisGameSettingNames.waffeneigenschaftenPacks,
            JSON.stringify(selectedPacks),
        )
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button[name="reset"]').click(async (event) => {
            event.preventDefault()
            await game.settings.set(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.waffeneigenschaftenPacks,
                JSON.stringify(['Ilaris.waffeneigenschaften']),
            )
            this.render(true)
        })
    }
}
