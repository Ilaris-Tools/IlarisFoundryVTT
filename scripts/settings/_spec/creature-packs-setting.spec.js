import { registerIlarisGameSettings } from '../configure-game-settings.js'
import {
    ConfigureGameSettingsCategories,
    IlarisGameSettingNames,
} from '../configure-game-settings.model.js'
import { IlarisSettingsDialog } from '../ilaris-settings.dialog.js'

describe('creature packs setting', () => {
    beforeEach(() => {
        global.foundry.data = { fields: { BooleanField: class BooleanField {} } }
        global.game = {
            user: { isGM: true },
            packs: [
                {
                    collection: 'Ilaris.kreaturen',
                    metadata: { type: 'Actor', id: 'Ilaris.kreaturen', label: 'Kreaturen' },
                    index: { size: 1, contents: [{ type: 'kreatur' }] },
                },
                {
                    collection: 'Ilaris.beispiel-helden',
                    metadata: { type: 'Actor', id: 'Ilaris.beispiel-helden', label: 'Helden' },
                    index: { size: 1, contents: [{ type: 'held' }] },
                },
            ],
            settings: {
                register: jest.fn(),
                registerMenu: jest.fn(),
                get: jest
                    .fn()
                    .mockImplementation((_namespace, key) =>
                        key === IlarisGameSettingNames.kreaturenPacks
                            ? '["Ilaris.kreaturen"]'
                            : '[]',
                    ),
                set: jest.fn(),
            },
        }
    })

    it('registers a GM-managed creature-pack setting with the system pack default', () => {
        registerIlarisGameSettings()

        expect(game.settings.register).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.kreaturenPacks,
            expect.objectContaining({
                config: false,
                default: '["Ilaris.kreaturen"]',
                scope: 'world',
                type: String,
            }),
        )
    })

    it('lists only Actor packs containing creature entries', () => {
        const dialog = new IlarisSettingsDialog()

        expect(dialog._generateAllPacksContext().kreaturen).toEqual([
            expect.objectContaining({ id: 'Ilaris.kreaturen', selected: true }),
        ])
    })

    it('saves and resets the creature-pack selection with the other compendium settings', async () => {
        global.SettingsConfig = { reloadConfirm: jest.fn() }
        game.settings.get.mockImplementation(() => '[]')
        const checkbox = {
            checked: true,
            name: 'compendien.kreaturen.Ilaris.kreaturen',
        }
        const form = {
            querySelectorAll: jest.fn((selector) =>
                selector === 'input[name^="compendien.kreaturen."]' ? [checkbox] : [],
            ),
            querySelector: jest.fn(() => null),
        }
        const dialog = new IlarisSettingsDialog()
        dialog.element = form
        dialog.close = jest.fn()
        dialog.render = jest.fn()

        await IlarisSettingsDialog.DEFAULT_OPTIONS.actions.saveSettings.call(dialog)
        expect(game.settings.set).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.kreaturenPacks,
            '["Ilaris.kreaturen"]',
        )

        game.settings.set.mockClear()
        await IlarisSettingsDialog.DEFAULT_OPTIONS.actions.resetSettings.call(dialog)
        expect(game.settings.set).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.kreaturenPacks,
            '["Ilaris.kreaturen"]',
        )
    })
})
