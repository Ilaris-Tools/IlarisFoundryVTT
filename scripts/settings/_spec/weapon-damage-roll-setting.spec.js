import { registerIlarisGameSettings } from '../configure-game-settings.js'
import {
    ConfigureGameSettingsCategories,
    IlarisGameSettingNames,
} from '../configure-game-settings.model.js'
import { IlarisSettingsDialog } from '../ilaris-settings.dialog.js'

describe('weapon damage roll expansion setting', () => {
    beforeEach(() => {
        global.foundry.data = {
            fields: {
                BooleanField: class BooleanField {},
            },
        }
        global.game = {
            user: { isGM: true },
            packs: new Map(),
            settings: {
                register: jest.fn(),
                registerMenu: jest.fn(),
                get: jest.fn().mockImplementation((_namespace, key) => {
                    if (key === IlarisGameSettingNames.expandWeaponDamageMultipliers) {
                        return true
                    }
                    if (
                        key === IlarisGameSettingNames.talentePacks ||
                        key === IlarisGameSettingNames.damageTypes
                    ) {
                        return '[]'
                    }
                    return false
                }),
                set: jest.fn(),
            },
        }
    })

    it('registers a disabled world setting for weapon damage formula expansion', () => {
        registerIlarisGameSettings()

        expect(game.settings.register).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.expandWeaponDamageMultipliers,
            expect.objectContaining({
                config: false,
                default: false,
                scope: 'world',
            }),
        )
    })

    it('exposes the setting to the GM settings dialog', async () => {
        const dialog = new IlarisSettingsDialog()

        const context = await dialog._prepareContext()

        expect(context.settings.expandWeaponDamageMultipliers).toBe(true)
    })

    it('persists the GM checkbox value when settings are saved', async () => {
        game.settings.get.mockImplementation((_namespace, key) => {
            if (
                key === IlarisGameSettingNames.talentePacks ||
                key === IlarisGameSettingNames.damageTypes
            ) {
                return '[]'
            }
            return false
        })
        game.settings.set.mockResolvedValue(undefined)
        global.SettingsConfig = { reloadConfirm: jest.fn() }
        const dialog = new IlarisSettingsDialog()
        dialog.element = {
            querySelectorAll: jest.fn().mockReturnValue([]),
            querySelector: jest.fn((selector) => {
                if (selector.includes('general.expandWeaponDamageMultipliers')) {
                    return { checked: true }
                }
                return null
            }),
        }
        dialog.close = jest.fn().mockResolvedValue(undefined)

        await IlarisSettingsDialog.DEFAULT_OPTIONS.actions.saveSettings.call(dialog)

        expect(game.settings.set).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.expandWeaponDamageMultipliers,
            true,
        )
    })

    it('resets the setting to disabled for the world', async () => {
        game.settings.set.mockResolvedValue(undefined)
        const dialog = new IlarisSettingsDialog()
        dialog.render = jest.fn()

        await IlarisSettingsDialog.DEFAULT_OPTIONS.actions.resetSettings.call(dialog)

        expect(game.settings.set).toHaveBeenCalledWith(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.expandWeaponDamageMultipliers,
            false,
        )
    })
})
