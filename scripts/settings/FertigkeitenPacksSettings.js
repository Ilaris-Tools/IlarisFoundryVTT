import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './configure-game-settings.model.js'

export class FertigkeitenPacksSettings extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'fertigkeiten-packs-settings',
            title: 'Fertigkeiten Kompendien Einstellungen',
            template: 'systems/Ilaris/scripts/settings/templates/fertigkeiten-packs.hbs',
            width: 500,
            height: 'auto',
            closeOnSubmit: true,
        })
    }

    getData(options) {
        const currentSelection = JSON.parse(
            game.settings.get(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.fertigkeitenPacks,
            ),
        )

        // Get all available packs that contain fertigkeiten
        const availablePacks = []
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item' && pack.index.size > 0) {
                // Check if any item in the pack has type 'fertigkeit'
                const hasFertigkeit = pack.index.contents.some(
                    (item) =>
                        item.type === 'fertigkeit' || item.type === 'uebernatuerliche_fertigkeit',
                )
                if (hasFertigkeit) {
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
            IlarisGameSettingNames.fertigkeitenPacks,
            JSON.stringify(selectedPacks),
        )
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button[name="reset"]').click(async (event) => {
            event.preventDefault()
            await game.settings.set(
                ConfigureGameSettingsCategories.Ilaris,
                IlarisGameSettingNames.fertigkeitenPacks,
                JSON.stringify([
                    'Ilaris.fertigkeiten-und-talente',
                    'Ilaris.fertigkeiten-und-talente-advanced',
                    'Ilaris.ubernaturliche-fertigkeiten',
                ]),
            )
            this.render(true)
        })
    }
}
