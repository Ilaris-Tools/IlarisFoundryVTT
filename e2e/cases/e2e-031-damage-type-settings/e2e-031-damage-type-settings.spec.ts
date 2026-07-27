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

test.describe('E2E-031 · Damage Type Settings', () => {
    let originalSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        originalSetting = await page.evaluate(({ namespace, key }) => {
            return { namespace, key, value: game.settings.get(namespace, key) }
        }, damageTypesSetting)
    })

    test.afterEach(async ({ page }) => {
        await restoreFoundrySetting(page, originalSetting).catch(() => {})
    })

    test('renders behavior summaries and persists an edited damage type', async ({ page }) => {
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
    })
})
