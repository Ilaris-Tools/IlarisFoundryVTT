/**
 * E2E-031 – Damage Type Settings
 *
 * @spec openspec/changes/healing-damage-types/specs/configurable-damage-types/spec.md
 * @scenario Edit button opens DialogV2 popup
 * @scenario DialogV2 saves edited type
 */

import { expect, test } from '@playwright/test'
import {
    foundryConfig,
    loginAndJoinWorld,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const damageTypesSetting = { namespace: 'Ilaris', key: 'damageTypes' }
const weaponDamageRollSetting = { namespace: 'Ilaris', key: 'expandWeaponDamageMultipliers' }

test.describe('E2E-031 · Damage Type Settings', () => {
    let originalSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let originalWeaponDamageRollSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        originalSetting = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, damageTypesSetting)
        originalWeaponDamageRollSetting = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, weaponDamageRollSetting)
    })

    test.afterEach(async ({ page }) => {
        await restoreFoundrySetting(page, originalSetting).catch(() => {})
        await restoreFoundrySetting(page, originalWeaponDamageRollSetting).catch(() => {})
    })

    test('supports edit, add, delete, behavior persistence, and reopening', async ({ page }) => {
        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })

        const settingsDialog = page.locator('.settings-dialog').last()
        await expect(settingsDialog).toBeVisible({ timeout: 15000 })
        await settingsDialog.locator('nav [data-tab="GENERAL"]').click()

        const damageTypeRow = settingsDialog.locator('.damage-type-row').first()
        await expect(damageTypeRow).toBeVisible({ timeout: 10000 })
        await expect(damageTypeRow.locator('.damage-type-behavior')).toContainText('Schaden')

        await damageTypeRow.locator('.edit-damage-type').click()
        const editDialog = page
            .locator('.application, .window-app')
            .filter({ hasText: 'Schadenstyp bearbeiten' })
            .last()
        await expect(editDialog).toBeVisible({ timeout: 10000 })
        await editDialog.locator('input[name="label"]').fill('Profan (bearbeitet)')
        await editDialog.locator('button:has-text("Übernehmen")').click()

        await expect(settingsDialog.locator('.damage-type-row').first()).toContainText(
            'Profan (bearbeitet)',
        )

        await settingsDialog.locator('.add-damage-type').click()
        const addDialog = page
            .locator('.application, .window-app')
            .filter({ hasText: 'Neuer Schadenstyp' })
            .last()
        await expect(addDialog).toBeVisible({ timeout: 10000 })
        await addDialog.locator('input[name="value"]').fill('TEST_HEALING')
        await addDialog.locator('input[name="label"]').fill('Testheilung')
        await addDialog.locator('input[name="healing"]').check()
        await addDialog.locator('input[name="targetsErschoepfung"]').check()
        await addDialog.locator('button:has-text("Übernehmen")').click()
        await expect(
            settingsDialog.locator('.damage-type-row').filter({ hasText: 'Testheilung' }),
        ).toHaveCount(1)

        await settingsDialog.locator('button[data-action="saveSettings"]').click()

        await page.waitForFunction(
            ({ namespace, key }) => {
                return JSON.parse(game.settings.get(namespace, key)).some(
                    (type: any) => type.label === 'Profan (bearbeitet)',
                )
            },
            damageTypesSetting,
            { timeout: 10000 },
        )

        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })
        const reopenedDialog = page.locator('.settings-dialog').last()
        await expect(reopenedDialog).toBeVisible({ timeout: 15000 })
        await reopenedDialog.locator('nav [data-tab="GENERAL"]').click()
        await expect(reopenedDialog.locator('.damage-type-row').first()).toContainText(
            'Profan (bearbeitet)',
        )
        const persistedCustom = await page.evaluate(() => {
            return JSON.parse(game.settings.get('Ilaris', 'damageTypes')).find(
                (type: any) => type.value === 'TEST_HEALING',
            )
        })
        expect(persistedCustom).toMatchObject({
            label: 'Testheilung',
            behavior: { healing: true, targetsErschoepfung: true },
        })

        const customRow = reopenedDialog
            .locator('.damage-type-row')
            .filter({ hasText: 'Testheilung' })
            .first()
        await customRow.locator('.delete-damage-type').click()
        await expect(
            reopenedDialog.locator('.damage-type-row').filter({ hasText: 'Testheilung' }),
        ).toHaveCount(0)
        await reopenedDialog.locator('button[data-action="saveSettings"]').click()
        await page.waitForFunction(
            () =>
                !JSON.parse(game.settings.get('Ilaris', 'damageTypes')).some(
                    (type: any) => type.value === 'TEST_HEALING',
                ),
            undefined,
            { timeout: 10000 },
        )
    })

    test('GM enables and persists weapon damage roll expansion', async ({ page }) => {
        await page.evaluate(() => {
            const menu = game.settings.menus.get('Ilaris.ilarisSettingsMenu')
            if (!menu?.type) throw new Error('Ilaris settings menu is not registered')
            new menu.type().render({ force: true })
        })

        const settingsDialog = page.locator('.settings-dialog').last()
        await expect(settingsDialog).toBeVisible({ timeout: 15000 })
        await settingsDialog.locator('nav [data-tab="GENERAL"]').click()

        const settingInput = settingsDialog.locator(
            'input[name="general.expandWeaponDamageMultipliers"]',
        )
        await expect(settingInput).toBeVisible({ timeout: 10000 })
        await settingInput.check()
        await settingsDialog.locator('button[data-action="saveSettings"]').click()

        await page.waitForFunction(
            ({ namespace, key }) => game.settings.get(namespace, key) === true,
            weaponDamageRollSetting,
            { timeout: 10000 },
        )
    })
})
